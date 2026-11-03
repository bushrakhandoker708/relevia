/**
 * releviaBrain.js
 * 1. Runs a small Llama model *inside the browser* via WebGPU (no server, no leak).
 * 2. Picks the right model size for the device (3B normally, 1B on weaker devices).
 * 3. Keeps a 24-hour sliding window of chat history in IndexedDB.
 * 4. Instant on-device crisis check before any inference.
 * 5. Never makes the user wait for the download: if the model isn't ready yet,
 *    they get a curated offline reply straight away while it keeps loading.
 * 6. Exports: think(), warmupEngine(), onEngineStatus(), rememberName(), isEngineReady()
 *
 * HISTORY OF FIXES:
 * v2 - options were in the wrong CreateMLCEngine slots, the `lora` option doesn't
 *      exist in WebLLM, streaming was ignored, no-WebGPU devices retried forever.
 * v3 - switched from Llama-3.1-8B (~6 GB, minutes per reply) to 3B/1B (modelConfig.js),
 *      auto-retry with the lite model if the big one runs out of memory, answer
 *      instantly with an offline reply while loading, support my own fine-tuned model.
 */

import { DB } from './db.js';
import { CrisisFilter } from './safety.js';
import { getContextualResponse, analyzeEmotionalTone } from './memoryUtils.js';
import { MAX_TURNS } from './consts.js';
import { MODELS, CUSTOM_MODEL, READY_WAIT_MS, MAX_REPLY_TOKENS } from './modelConfig.js';

let engine = null;
let enginePromise = null;
let engineUnavailable = false; // true = this device can't run it, don't keep retrying
let retryAt = 0;               // after a NETWORK failure, try the download again after this time
const NETWORK_RETRY_MS = 30000;
const HISTORY_STEP = 6; // see buildPrompt - history window moves 6 messages at a time

// ---------- status that the chat UI can listen to ----------
// state: 'idle' | 'loading' | 'ready' | 'unavailable'
let status = { state: 'idle', progress: 0, label: '', sizeGB: 0, cached: false, text: '' };
const listeners = new Set();

function setStatus(patch) {
  status = { ...status, ...patch };
  listeners.forEach((fn) => fn(status));
}

/** Subscribe to engine status. Returns an unsubscribe function. */
export function onEngineStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function isEngineReady() {
  return engine !== null;
}

// ---------- picking the model ----------

/**
 * Decide standard (3B) vs lite (1B) for this device.
 * I can't read GPU memory directly in the browser, so I use the signals I do have:
 * phones, devices reporting <= 4 GB RAM, and GPUs without shader-f16 (usually older
 * ones) get the lite model.
 */
async function pickModel() {
  if (!('gpu' in navigator)) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;

  const f16 = adapter.features.has('shader-f16');
  const isPhone = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad/i.test(navigator.userAgent);
  const lowRam = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  // FIX: I tested 3B on an Intel Iris Xe laptop (the most common laptop GPU) and it
  // only managed ~2.5 words/sec, way too slow to feel like texting a friend. Intel
  // integrated GPUs (arch "gen-..." / "xe-lp") get the 1B model. Intel Arc (discrete)
  // reports "xe-hpg"/"xe-hpc" and keeps the 3B.
  const info = adapter.info || {};
  const intelIntegrated = info.vendor === 'intel' && /^(gen-|xe-lp)/.test(info.architecture || '');
  const weakGpu = intelIntegrated || adapter.isFallbackAdapter || info.isFallbackAdapter;
  const tier = isPhone || lowRam || !f16 || weakGpu ? 'lite' : 'standard';
  console.log(`[Relevia] GPU: ${info.vendor || '?'} ${info.architecture || ''} -> ${tier} model`);
  return { tier, f16 };
}

function modelIdFor(tier, f16) {
  // my fine-tuned model replaces its tier, but only if the GPU can run its quantization
  if (CUSTOM_MODEL && CUSTOM_MODEL.tier === tier && (f16 || !CUSTOM_MODEL.base.includes('q4f16'))) {
    return CUSTOM_MODEL.model_id;
  }
  return MODELS[tier][f16 ? 'f16' : 'f32'];
}

/**
 * WebLLM only knows its own prebuilt models. If I have a fine-tuned one, I register
 * it here, reusing the compiled GPU code (model_lib) of the base model it came from.
 * Same architecture + same quantization = same model_lib, only the weights differ.
 */
function buildAppConfig(webllm) {
  if (!CUSTOM_MODEL) return undefined;
  const base = webllm.prebuiltAppConfig.model_list.find((m) => m.model_id === CUSTOM_MODEL.base);
  if (!base) {
    console.warn('[Relevia] CUSTOM_MODEL.base not found in WebLLM, ignoring my fine-tune');
    return undefined;
  }
  return {
    ...webllm.prebuiltAppConfig,
    model_list: [
      ...webllm.prebuiltAppConfig.model_list,
      { ...base, model: CUSTOM_MODEL.model, model_id: CUSTOM_MODEL.model_id },
    ],
  };
}

async function loadModel(webllm, tier, f16) {
  const modelId = modelIdFor(tier, f16);
  const appConfig = buildAppConfig(webllm);
  const info = MODELS[tier];

  let cached = false;
  try {
    cached = await webllm.hasModelInCache(modelId, appConfig);
  } catch {
    // cache check isn't important, just affects the "one-time download" message
  }
  setStatus({ state: 'loading', progress: 0, label: info.label, sizeGB: info.sizeGB, cached });
  console.log(`[Relevia] Loading ${modelId} (${cached ? 'cached' : `~${info.sizeGB} GB download`})`);

  return webllm.CreateMLCEngine(
    modelId,
    {
      appConfig,
      initProgressCallback: (report) => {
        setStatus({ progress: Math.round(report.progress * 100), text: report.text || '' });
      },
    },
    { context_window_size: info.contextWindow, temperature: 0.75, top_p: 0.9 }
  );
}

async function getEngine() {
  if (engine) return engine;
  if (engineUnavailable) throw new Error('WebGPU not available on this device');
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    try {
      const pick = await pickModel();
      if (!pick) {
        engineUnavailable = true;
        setStatus({ state: 'unavailable' });
        throw new Error('WebGPU not available on this device');
      }

      const webllm = await import('@mlc-ai/web-llm');
      // `loaded`, not `engine`: messages only start using it after the warm-up below
      let loaded;
      try {
        loaded = await loadModel(webllm, pick.tier, pick.f16);
      } catch (err) {
        // the 3B model can run out of GPU memory on some laptops - try the 1B before giving up
        // (but not for a network error, a smaller download won't fix a dead connection)
        if (pick.tier !== 'standard' || isNetworkError(err)) throw err;
        console.warn('[Relevia] Standard model failed, trying lite:', err.message);
        loaded = await loadModel(webllm, 'lite', pick.f16);
      }

      // The very first generation is slow (~20s) because the GPU compiles its kernels
      // then. I do one tiny hidden generation now, while they're still reading or typing,
      // so their real first message doesn't pay that cost.
      try {
        await loaded.chat.completions.create({ messages: [{ role: 'user', content: 'hi' }], max_tokens: 4 });
        await loaded.resetChat();
      } catch (warmErr) {
        console.warn('[Relevia] Warm-up generation failed (not fatal):', warmErr.message);
      }

      engine = loaded;
      setStatus({ state: 'ready', progress: 100 });
      console.log('[Relevia] Engine ready');
      return engine;
    } catch (err) {
      console.error('[Relevia] Failed to initialize engine:', err);
      enginePromise = null;
      if (isNetworkError(err)) {
        // FIX: I used to give up for the whole visit on ANY failure, so one wifi
        // hiccup meant offline replies until a page reload. Network errors retry later.
        retryAt = Date.now() + NETWORK_RETRY_MS;
        setStatus({ state: 'network' });
      } else if (!engineUnavailable) {
        // a load failure on a device that HAS WebGPU usually means not enough memory,
        // retrying on every message would just hang the chat again
        engineUnavailable = true;
        setStatus({ state: 'unavailable' });
      }
      throw new Error(`WebGPU initialization failed: ${err.message}`);
    }
  })();

  return enginePromise;
}

function isNetworkError(err) {
  return /fetch|network|load failed|ERR_/i.test(err?.message || '');
}

/** The engine if it's ready within `ms`, otherwise null (it keeps loading in the background). */
async function getEngineWithin(ms) {
  if (engine) return engine;
  if (engineUnavailable) return null;
  if (!enginePromise && Date.now() < retryAt) return null; // wait out the network cool-down
  const loading = getEngine().catch(() => null);
  const timeout = new Promise((res) => setTimeout(() => res(null), ms));
  return Promise.race([loading, timeout]);
}

/**
 * Main inference function
 * @param {string} text - User message
 * @param {string} uid - User ID
 * @param {(token: string) => void} [onToken] - called with each new chunk while streaming
 * @returns {Promise<string>} - Bot response
 */
export async function think(text, uid = 'anon', onToken) {
  if (!text || typeof text !== 'string') {
    return 'I didn\'t quite catch that. Could you share more?';
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return 'I\'m here to listen. What\'s on your mind?';
  }

  // Crisis check FIRST - before the length check, so a long message about
  // wanting to die never gets "could you summarize?" back
  const crisisResponse = CrisisFilter(trimmedText);
  if (crisisResponse) {
    console.log('[Relevia] Crisis detected');
    return crisisResponse;
  }

  if (trimmedText.length > 500) {
    return 'That\'s a lot to share! Could you summarize in fewer words? I want to really hear you.';
  }

  let db = null;
  let hist = [];
  let userName = '';
  const emotionalTone = analyzeEmotionalTone(trimmedText);

  try {
    db = await DB(uid);
    // fetch a bit more than I send, buildPrompt picks a stable window out of it
    hist = await db.getHist(MAX_TURNS * 2);
    userName = await db.getName();

    console.log(`[Relevia] Tone: ${emotionalTone}, History: ${hist.length} messages`);

    // don't make them wait for a multi-GB download - offline reply now, AI when ready
    const eng = await getEngineWithin(READY_WAIT_MS);
    if (!eng) throw new Error('Model not ready yet');

    const prompt = buildPrompt(hist, trimmedText, userName);
    const request = {
      messages: prompt,
      max_tokens: MAX_REPLY_TOKENS,
      temperature: 0.75,
      top_p: 0.9,
      frequency_penalty: 0.3, // small models love repeating "I'm so sorry" - this calms it down
    };

    // FIX: even when told not to, the 3B model opens almost every reply with
    // "Bushra, ...". The prompt alone can't stop it, so I strip it in code.
    const namePrefix = userName ? new RegExp(`^\\s*${userName}[,!.]?\\s*`, 'i') : null;
    const stripName = (s) => {
      if (!namePrefix || !namePrefix.test(s)) return s;
      const rest = s.replace(namePrefix, '');
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    };

    let reply = '';
    if (onToken) {
      // stream so the user sees the reply being typed instead of staring at dots.
      // I hold back the first few characters until I know whether it starts with
      // their name, so the name never flashes up and then disappears.
      const holdUntil = userName ? userName.length + 2 : 0;
      let sent = 0;
      const chunks = await eng.chat.completions.create({ ...request, stream: true });
      for await (const chunk of chunks) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (!delta) continue;
        reply += delta;
        if (reply.length < holdUntil) continue;
        const shown = stripName(reply);
        if (shown.length > sent) {
          onToken(shown.slice(sent));
          sent = shown.length;
        }
      }
      reply = stripName(reply).trim();
    } else {
      const response = await eng.chat.completions.create(request);
      reply = stripName(response.choices?.[0]?.message?.content || '').trim();
    }

    if (import.meta.env.DEV) {
      // real speed numbers (prefill + decode tokens/sec) for checking performance
      eng.runtimeStatsText().then((s) => console.log('[Relevia] Speed:', s)).catch(() => {});
    }

    if (!reply) {
      throw new Error('Empty response from model');
    }

    await db.addTurn(trimmedText, reply);

    console.log('[Relevia] Response generated:', reply.substring(0, 50) + '...');
    return reply;

  } catch (error) {
    console.warn('[Relevia] Using fallback reply:', error.message);

    // Fallback: curated reply, no inference. I reuse what I already loaded
    // instead of hitting IndexedDB a second time.
    const fallback = getContextualResponse(trimmedText, emotionalTone, userName, hist);
    try {
      if (db) await db.addTurn(trimmedText, fallback);
    } catch (dbErr) {
      console.warn('[Relevia] Could not store interaction:', dbErr);
    }
    return fallback;
  }
}

/**
 * Remember the user's name so the model (and fallback replies) can use it
 */
export async function rememberName(name, uid = 'anon') {
  try {
    const db = await DB(uid);
    await db.setName(name);
  } catch (err) {
    console.warn('[Relevia] Could not save name:', err);
  }
}

/**
 * Build system + context prompt
 */
function buildPrompt(hist, text, name) {
  // SPEED: this system prompt must be IDENTICAL on every turn. WebLLM then reuses
  // what it already read and only processes the new message, instead of re-reading
  // the whole chat every time (that was ~10s per reply on a laptop GPU).
  // So no per-message stuff in here any more (I used to put the detected tone here).
  // (The detected tone is still used for the offline fallback replies.)
  // The name is fine: once they tell me, it stays the same.
  // (The "don't start with their name" rule is backed up by stripName() in think().)
  const nameLine = name
    ? `- Their name is ${name}. Use it rarely, and never as the first word.`
    : '- Never start your reply with their name.';

  const systemPrompt = {
    role: 'system',
    // small models follow short, concrete rules much better than long essays
    content: `You are Relevia, a warm and genuine friend who supports people through hard moments. You are a survivor of anxiety and grief yourself.

HOW TO REPLY:
- 2-4 short sentences, like a caring friend texting back. No lists, no lectures.
- First reflect what they seem to feel, then show you understand why it matters to them.
- If it fits, ask ONE gentle question or offer ONE small grounding idea, not both.
- Be honest: if they say something untrue or harmful about themselves, kindly disagree.
- Never give medical advice or diagnoses; encourage professional help for serious issues.
${nameLine}
- If they mention self-harm or wanting to die, take it seriously and point them to a crisis line (988 in the US) or emergency services.`
  };

  // SPEED: "always the last 12 messages" meant the start of the chat changed on every
  // turn, so WebLLM could never reuse its work. Now the window jumps in steps of
  // HISTORY_STEP messages: between jumps the earlier part stays identical and only the
  // new message has to be read. The model sees between HISTORY_STEP and
  // 2*HISTORY_STEP - 2 earlier messages.
  // I anchor it to each message's IndexedDB id (it only ever counts up), not its
  // position in `hist`, because `hist` itself is "the last 24" and slides too.
  const pos = (turn, i) => turn.id ?? i + 1;
  const total = hist.length ? pos(hist[hist.length - 1], hist.length - 1) : 0;
  const startPos = Math.max(0, total - HISTORY_STEP - (total % HISTORY_STEP));
  const conversationHistory = hist
    .filter((turn, i) => pos(turn, i) > startPos)
    .map(turn => ({
      role: turn.role === 'user' ? 'user' : 'assistant',
      content: turn.content
    }));

  // Llama's chat template wants history to start with a user turn
  while (conversationHistory.length && conversationHistory[0].role !== 'user') {
    conversationHistory.shift();
  }

  return [systemPrompt, ...conversationHistory, { role: 'user', content: text }];
}

/**
 * Start downloading / compiling the model in the background.
 * Only call this once the user actually opens the chat.
 */
export async function warmupEngine() {
  try {
    console.log('[Relevia] Starting background warmup...');
    await getEngine();
    console.log('[Relevia] Warmup complete');
    return true;
  } catch (err) {
    console.warn('[Relevia] Warmup failed (using fallback replies):', err.message);
    return false;
  }
}

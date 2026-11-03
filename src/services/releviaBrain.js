/**
 * releviaBrain.js
 * 1. Runs Llama-3.1-8B *inside the browser* via WebGPU (no server, no leak).
 * 2. Keeps a 24-hour sliding window of chat history in IndexedDB.
 * 3. Instant on-device crisis check before any inference.
 * 4. Falls back to curated replies when WebGPU isn't available.
 * 5. Exports: think(userText, userId, onToken?) → Promise<string>, warmupEngine()
 *
 * FIXES (v2):
 * - CreateMLCEngine(modelId, engineConfig, chatOpts): I had my options in the wrong
 *   slots. initProgressCallback was in chatOpts (so no progress ever showed) and
 *   lora / contextWindowSize / temperature were in engineConfig, which ignores them.
 * - There is NO `lora` option in WebLLM. My adapter was never loaded, the bot was
 *   always plain Llama-3.1-8B. (And the adapter was trained for a different setup
 *   anyway, see model train/train_lora.py.) Removed it so I stop fooling myself.
 * - Chatbot.jsx passes a streaming callback but think() ignored it. Streaming works now.
 * - If the device has no WebGPU I used to retry the multi-GB init on every single
 *   message. Now I check once and go straight to the fallback.
 * - History: getHist(12).slice(-6) only gave the model 3 exchanges. Uses MAX_TURNS now.
 */

import { DB } from './db.js';
import { CrisisFilter } from './safety.js';
import { getContextualResponse, analyzeEmotionalTone } from './memoryUtils.js';
import { MAX_TURNS } from './consts.js';

// q4f16 is ~1 GB smaller in VRAM but needs the shader-f16 GPU feature, q4f32 works everywhere
const MODEL_F16 = 'Llama-3.1-8B-Instruct-q4f16_1-MLC';
const MODEL_F32 = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';

let engine = null;
let enginePromise = null;
let engineUnavailable = false; // true = this device can't run it, don't keep retrying

async function pickModel() {
  if (!('gpu' in navigator)) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;
  return adapter.features.has('shader-f16') ? MODEL_F16 : MODEL_F32;
}

async function getEngine(onProgress) {
  if (engine) return engine;
  if (engineUnavailable) throw new Error('WebGPU not available on this device');
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    try {
      const modelId = await pickModel();
      if (!modelId) {
        engineUnavailable = true;
        throw new Error('WebGPU not available on this device');
      }
      console.log(`[Relevia] Initializing WebGPU engine (${modelId})...`);

      const webllm = await import('@mlc-ai/web-llm');

      engine = await webllm.CreateMLCEngine(
        modelId,
        // 2nd arg = engine config
        {
          initProgressCallback: (report) => {
            console.log(`[Relevia] Loading: ${Math.round(report.progress * 100)}% ${report.text || ''}`);
            onProgress?.(report);
          },
        },
        // 3rd arg = chat options (snake_case, same as mlc-chat-config.json)
        {
          context_window_size: 2048,
          temperature: 0.75,
          top_p: 0.9,
        }
      );

      console.log('[Relevia] Engine ready');
      return engine;
    } catch (err) {
      console.error('[Relevia] Failed to initialize engine:', err);
      enginePromise = null;
      throw new Error(`WebGPU initialization failed: ${err.message}`);
    }
  })();

  return enginePromise;
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
    // Load history and context
    db = await DB(uid);
    hist = await db.getHist(MAX_TURNS);
    userName = await db.getName();

    console.log(`[Relevia] Tone: ${emotionalTone}, History: ${hist.length} messages`);

    const prompt = buildPrompt(hist, trimmedText, userName, emotionalTone);
    const eng = await getEngine();

    let reply = '';
    if (onToken) {
      // stream so the user sees the reply being typed instead of staring at dots
      const chunks = await eng.chat.completions.create({
        messages: prompt,
        max_tokens: 256,
        temperature: 0.75,
        top_p: 0.9,
        stream: true,
      });
      for await (const chunk of chunks) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          reply += delta;
          onToken(delta);
        }
      }
      reply = reply.trim();
    } else {
      const response = await eng.chat.completions.create({
        messages: prompt,
        max_tokens: 256,
        temperature: 0.75,
        top_p: 0.9,
      });
      reply = response.choices?.[0]?.message?.content?.trim();
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
function buildPrompt(hist, text, name, tone) {
  const systemPrompt = {
    role: 'system',
    // FIX: one guideline was missing its "-" and "TONE" was repeated twice
    content: `You are Relevia, a 26-year-old empathetic AI friend who supports people with their mental health. You are a survivor of anxiety and grief.

GUIDELINES:
- Reply in 2-4 warm, genuine sentences, like a caring friend texting back
- Validate their feelings first, then offer at most one small grounding idea
- Never give medical advice or diagnoses; encourage professional help for serious issues
- Use their name (${name || 'friend'}) naturally when it fits
- Detected emotional tone: ${tone}
- No disclaimers unless they mention self-harm or suicidal thoughts`
  };

  const conversationHistory = hist
    .slice(-MAX_TURNS)
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
 * NOTE: this is a ~4-5 GB download the first time, only call it once the user
 * actually opens the chat (I used to call it on every Home page load).
 */
export async function warmupEngine(onProgress) {
  try {
    console.log('[Relevia] Starting background warmup...');
    await getEngine(onProgress);
    console.log('[Relevia] Warmup complete');
    return true;
  } catch (err) {
    console.warn('[Relevia] Warmup failed (using fallback replies):', err.message);
    return false;
  }
}

export function isEngineReady() {
  return engine !== null;
}

/**
 * modelConfig.js – which AI model Relevia runs in the browser.
 *
 * WHY THESE MODELS: I used to run Llama-3.1-8B (~6 GB of GPU memory). On a normal
 * laptop the first reply took many minutes and every reply after was slow. These are
 * the biggest models that still feel fast in a browser:
 *   standard = Llama-3.2-3B   (1.8 GB download, best quality, stronger GPUs)
 *   lite     = Llama-3.2-1B   (0.7 GB, most laptops, and the fast start for everyone)
 *   tiny     = Qwen2.5-0.5B   (0.3 GB, low-memory devices only - replies are noticeably
 *                              simpler, but fast enough to feel like a chat)
 * The app picks one automatically (see pickModel in releviaBrain.js).
 *
 * sizeGB = real download size from Hugging Face. I used to show GPU-memory numbers
 * (2.3 / 0.9 GB) in the "one-time download" message, which overstated it.
 *
 * contextWindow: PERF - was 2048. The chat only ever sends 6-10 earlier messages
 * (~700 tokens max, buildPrompt also caps it), so 1536 is enough and the model keeps
 * less memory around for the conversation. Leaves more GPU room on small laptops.
 *
 * q4f16 = smaller + faster but needs the GPU "shader-f16" feature.
 * q4f32 = works on every WebGPU device, a bit bigger.
 */

export const MODELS = {
  standard: {
    label: 'Relevia',
    f16: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    f32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    sizeGB: 1.8,
    contextWindow: 1536,
  },
  lite: {
    label: 'Relevia Lite',
    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    sizeGB: 0.7,
    contextWindow: 1536,
  },
  tiny: {
    label: 'Relevia Mini',
    f16: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    f32: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
    sizeGB: 0.3,
    contextWindow: 1536,
  },
};

/**
 * MY FINE-TUNED MODEL (optional).
 * Leave this as null to use the normal models above.
 *
 * After I fine-tune + export with relevia-research/deploy/export_to_webllm.py, that
 * script prints the exact object to paste here. It looks like:
 *
 * export const CUSTOM_MODEL = {
 *   tier: 'standard',                                   // replaces the 3B model
 *   model_id: 'Relevia-3B-ft-q4f16_1-MLC',
 *   model: 'https://huggingface.co/<me>/Relevia-3B-ft-q4f16_1-MLC',
 *   base: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',          // reuses this model's compiled GPU code
 * };
 *
 * Only switch this on if my fine-tune actually beat the plain model in a side-by-side
 * check, otherwise I'm making the bot worse for nothing.
 */
export const CUSTOM_MODEL = null;

// How long a message waits for the model before I answer with an offline reply
// instead. Without this, the first message on a new device hung for minutes.
export const READY_WAIT_MS = 4000;

// PERF: was 180. Replies are meant to be 2-3 sentences (~60-100 tokens). On a laptop
// GPU the model writes ~5 tokens/sec, so the old cap let a rambling reply run ~35s.
export const MAX_REPLY_TOKENS = 110;

/**
 * PREFETCH - start loading the AI before the chat is opened, so it's ready sooner.
 *  - hovering / focusing the "Chat with Relevia" button always starts it (it's a
 *    clear sign they're about to chat, and it buys a second or two)
 *  - after PREFETCH_AFTER_MS on the site it also starts, but ONLY when the browser
 *    says the connection is fast and not metered (no data saver, "4g"), on a laptop
 *    or desktop. That's a 0.7 GB download for someone who might never chat, so I
 *    don't do it on phones or slow / mobile-data connections.
 * Set PREFETCH_AFTER_MS to null to turn the timed prefetch off.
 */
export const PREFETCH_AFTER_MS = 20000;

/**
 * modelConfig.js – which AI model Relevia runs in the browser.
 *
 * WHY THESE MODELS: I used to run Llama-3.1-8B (~6 GB of GPU memory). On a normal
 * laptop the first reply took many minutes and every reply after was slow. These are
 * the biggest models that still feel fast in a browser:
 *   standard = Llama-3.2-3B  (~2.3 GB, best quality that most laptops handle)
 *   lite     = Llama-3.2-1B  (~0.9 GB, phones / older or low-memory laptops)
 * The app picks one automatically (see pickModel in releviaBrain.js) and falls back
 * to lite if standard can't load.
 *
 * q4f16 = smaller + faster but needs the GPU "shader-f16" feature.
 * q4f32 = works on every WebGPU device, a bit bigger.
 */

export const MODELS = {
  standard: {
    label: 'Relevia',
    f16: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    f32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    sizeGB: 2.3,
    contextWindow: 2048,
  },
  lite: {
    label: 'Relevia Lite',
    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    sizeGB: 0.9,
    contextWindow: 2048,
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

// Replies are meant to be 2-4 sentences, 180 tokens is plenty and keeps it fast
export const MAX_REPLY_TOKENS = 180;

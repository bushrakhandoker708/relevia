export const PRIVACY_EPSILON = 0.1;
// how many past messages (user + assistant) I send to the model as context
export const MAX_TURNS = 12;
// FIX: was spelled CRISUS_LINES
export const CRISIS_LINES = ['US/Canada: 988', 'UK: Samaritans 116 123', 'Global: findahelpline.com'];
// NOTE: WebLLM can't load a LoRA at runtime, so this file is never fetched by the app.
// To ship my fine-tune I have to merge it + convert with MLC (see model train/train_lora.py step 10).
// Also it's ~168 MB, not 3.2 MB.
export const LORA_URL = `${import.meta.env.BASE_URL}weights/relevia-lora-3.2mb.safetensors`;

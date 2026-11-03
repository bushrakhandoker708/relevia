export const PRIVACY_EPSILON = 0.1;
// how many past messages (user + assistant) I send to the model as context
export const MAX_TURNS = 12;
// FIX: was spelled CRISUS_LINES
export const CRISIS_LINES = ['US/Canada: 988', 'UK: Samaritans 116 123', 'Global: findahelpline.com'];
// NOTE: I removed LORA_URL. WebLLM can't load a LoRA at runtime, so the old adapter
// was never used. A fine-tuned model now goes in modelConfig.js -> CUSTOM_MODEL.

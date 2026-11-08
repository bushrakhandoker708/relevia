// how many past messages (user + assistant) I send to the model as context
export const MAX_TURNS = 12;
// FIX: was spelled CRISUS_LINES
// UK resource checked through the helpline service on 6 November 2026; do not infer the visitor's location.
export const CRISIS_LINES = ['If you are in the UK, Samaritans: [116 123](tel:116123). Elsewhere, use a locally verified crisis service.'];
// NOTE: I removed LORA_URL. WebLLM can't load a LoRA at runtime, so the old adapter
// was never used. A fine-tuned model now goes in modelConfig.js -> CUSTOM_MODEL.

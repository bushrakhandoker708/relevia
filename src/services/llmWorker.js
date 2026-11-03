/**
 * llmWorker.js – runs the AI model in a background thread.
 *
 * PERF: I used to run WebLLM on the page's main thread. Loading the weights and
 * generating each reply blocked the same thread that does scrolling, animations
 * and typing, so the whole site felt frozen while the AI worked. In a worker, all
 * of that happens off to the side and the page stays smooth.
 *
 * releviaBrain.js talks to this through CreateWebWorkerMLCEngine - same API as before.
 */
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);

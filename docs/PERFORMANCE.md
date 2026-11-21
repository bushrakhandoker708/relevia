# Performance notes

These figures were taken on 21 November 2026, with agent assistance, from a production build (`npm run build`, served by `vite preview` on localhost) in the desktop app's built-in Chromium browser. Localhost has no real network latency, so the timings show how much work the page does, not what a visitor on a phone network would see. Sizes are compressed transfer sizes as the browser reported them.

## Measured

Home page, first load with an empty cache:

| Measure | Value |
| --- | --- |
| First contentful paint | 716 ms |
| Largest contentful paint (the H1) | 860 ms |
| JavaScript | 152 KB in 8 files |
| CSS | 13 KB |
| Fonts | 179 KB in 6 files |
| Requests to other hosts | none |

The chat model's code (`webllm` chunk, about 1.28 MB with Brotli) is not part of that. It loads only on a device with WebGPU, either about 20 seconds after the page opens or as soon as the chat button is hovered, focused or touched.

## Changed in this round

**The breathing page no longer waits for three.js.** The moving balls behind the breathing circle are decoration, but `Breathing.jsx` imported them directly, so the page's script was 498 KB (about 105 KB with Brotli) and the exercise could not appear until all of three.js had arrived. The balls are now loaded with `React.lazy` after the exercise is on screen. The breathing script is now 9.5 KB, and three.js is a separate 501 KB chunk (`Balls`). When the balls are switched off, or the person has asked for reduced motion, that chunk is never requested; this was checked in the preview by turning the balls off and reloading. On a slow mobile connection this should bring the circle forward by roughly the time it takes to download 100 KB, but that is an estimate: it was not measured on a throttled connection.

**One third-party connection removed.** `src/App.jsx` opened an early connection to `vitals.vercel-insights.com` that nothing used. See `docs/DATA_FLOWS.md`.

## Not measured

- **Chat reply latency.** Measuring it needs the model to be downloaded and run on a real GPU. The `responseTiming.js` and `browserBenchmark.js` modules exist for this. No new latency numbers were produced in this round, and none of the numbers above should be read as model latency.
- **Phone hardware and phone networks.** Everything above was on a desktop machine.

## Known costs

- **WebLLM is in the bundle twice.** The main thread imports `@mlc-ai/web-llm` to create the worker-backed engine and to check the model cache, and the worker (`llmWorker.js`) bundles its own copy. Each is about 1.28 MB with Brotli, so a first chat downloads about 2.5 MB of model code before any weights. The two copies are needed with the current structure, because the library ships as one module that cannot be split. Moving the cache check and engine creation entirely into the worker, with the main thread sending plain messages, would remove one copy. This was not done in this round, because it changes how the engine starts and needs testing with a real model on several devices.
- **Caveat is loaded in two weights** (500 and 700, 50 KB each). `@fontsource-variable/caveat` would cover both in one file, at the cost of a new dependency.

## Proposed targets

These are proposals, not commitments, and none has been measured against yet.

| Target | Proposed value | How to check |
| --- | --- | --- |
| JavaScript before the home page is usable | under 200 KB compressed | Resource timing in a production build |
| Breathing circle visible after tapping "Quick calm" | under 1 second on a mid-range phone on 4G | Throttled run on a real phone, not yet done |
| Third-party hosts contacted before the chat is used | only the analytics endpoint on the site's own domain | `tests/data-flows.test.js` and resource timing |
| First chat token, cached 1B model | to be set once there is a measured baseline | `browserBenchmark.js` on named devices |

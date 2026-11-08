# Relevia

Relevia is my web application for exploring supportive dialogue alongside information about panic attacks, breathing exercises and grounding tools. I want privacy and accessibility to be part of the implementation, rather than promises attached to the interface. The application is also the testbed for [Relevia research](https://github.com/bushrakhandoker708/relevia-research), where I am investigating how prompting and, later, model adaptation affect dialogue quality, safety and browser performance.

The current application is a prototype. Its intended purpose does not establish that it reduces panic symptoms or provides clinically safe support. The recent implementation and documentation are agent-assisted and remain subject to my review.

## How the chat works

The React application uses WebLLM to run inference through WebGPU. The existing device-selection logic chooses between configured Llama 3.2 model tiers; curated replies provide a fallback when local inference is unavailable. This makes device capability an engineering constraint. The project still needs measurements on real devices before it can make reliable claims about download size, latency or memory use.

Running inference locally reduces the need to send dialogue to an inference provider, but it does not describe every network interaction. Model downloads, site analytics and optional browser speech services have separate data flows. A deterministic rule set checks messages before inference. The audit found missed risk cases and false alarms, so these rules must not be described as a validated safety system.

## Why the storage design changed

The earlier chat used shared persistent history. That meant a new session could inherit another conversation, while expiry and crisis handling did not consistently prevent sensitive records from remaining on disk. Milestone 2 introduces a session-specific memory store in `src/services/chatStorage.js`, with `db.js` retaining a small compatibility interface for the chat service.

Messages and names now remain in page memory by default. Saving requires an explicit choice in **Chat privacy and history**. A saved chat has a 24-hour retention period and must be deliberately reopened into a fresh session with saving switched off. The Home letter no longer reads chat history. This approach keeps the default simple without adding authentication or a cloud account system.

That choice has limits. Saved chats have no application encryption or authentication, so anyone sharing the browser profile can open them. Names are not saved as separate metadata, but may still appear inside messages. Recognised crisis context disables saving for the session and removes its saved copy; missed detections can still leave sensitive text in an opted-in chat. Expired messages are excluded on access, while physical cleanup requires the application to run.

The delete control clears chat records and chat personalisation, invalidates pending writes and attempts to remove the old shared IndexedDB database. Blocked deletion is reported. Journals and other coping-tool preferences use separate storage. Speech starts disabled. No differential-privacy mechanism is implemented.

## Run locally

From the application repository:

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. To run the synthetic tests or build the application:

```bash
npm test
npm run build
```

`npm run lint` checks the whole application. The recorded Milestone 2 run still has 41 legacy errors and nine warnings, although the changed-file checks pass. Installing from a clean environment remains a separate verification step; the recorded build used the existing local installation.

## What has been verified

The recorded run passed 18 JavaScript tests covering storage boundaries and inference failure behaviour. The production build and changed-file lint also passed. These checks support specific software claims; they do not measure empathy or clinical safety. Browser interaction, lifecycle behaviour and two-tab deletion still need end-to-end confirmation. The build reports dependency and bundle-size warnings.

The Milestone 2 report is intended to accompany this branch once published. Until then, the report and machine-readable evidence are in the separate local research repository. Final milestone sign-off remains open, and no model training or deployment was performed in this milestone.

Since then (Milestones 4 and 4.1, November 2026), routing uses S3 (`src/services/safetyS3.js`). A message saying something has already been taken or done, or that the means are at hand, gets a fixed emergency message naming 999, 112 and 911, and is never sent to the model. `src/services/replyGuard.js` (G2) streams only checked text. It replaces inappropriate refusals, keeps refusals to give harmful information, and removes unverifiable service names or numbers. S2 stays in `safety.js` for comparison. The emergency wording still needs review by a qualified person before any public release. `src/services/browserBenchmark.js` records cold and cached startup, runtime prefill and decode rates, failures and unloading. It has not yet been run in a browser. The application still ships no fine-tuned model.

On Windows laptops with two GPUs, the browser may run the model on the integrated GPU, which makes replies slow. Assign the browser to the high-performance GPU in Settings → System → Display → Graphics.

## Development and publishing

Keep the application and research histories separate. Changes should explain the problem, the selected correction and the checks that support it. Follow [the writing guide](docs/WRITING_VOICE_GUIDE.md), preserve failed checks and use synthetic dialogue in tests.

`npm run build:pages` builds for the `/relevia/` base path. `npm run deploy` publishes the built site to `gh-pages`; it is a publishing operation, not a local verification command. Review the outstanding browser and historical-data issues before a public release.

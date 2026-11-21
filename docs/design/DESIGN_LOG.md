# Relevia visual design log

This log records how Relevia's look changed, what I tried along the way and why the current version looks the way it does. The work was agent-assisted, and I made every decision. The mockups in [`mockups/`](mockups/) are kept as I made them, so the reasoning can be checked against what I actually saw.

## 1. Where it started (before November 2026)

The first version used the default "wellness app" look: purple, pink and blue gradients, glassy cards, a fluid effect that followed the cursor, a looping heart animation, floating balls and a gradient chat button.

When I reviewed it in November 2026 I found these problems:

- **It looked like every other app.** Nothing about it said "a calm place to write things down". The gradients looked like marketing, and the app is meant for someone who may be panicking.
- **Motion everywhere.** The cursor fluid, the Lottie heart and the scroll hints all moved at once. That costs GPU time while the model is generating. It also works against the calming purpose. Reduced-motion support was patchy.
- **Hard to read.** There was white text on gradients and thin grey body text. The technique cards had a lot of visual noise.
- **The chat felt like a support widget,** not a conversation with someone.
- **Fonts came from Google Fonts,** so every visit sent the visitor's IP address to a third party (privacy audit finding F7).

## 2. Two directions, side by side

Before I changed any code, I made static mockups of two directions. Each had a home screen with the chat open and a coping-techniques screen. That let me choose from pictures, not descriptions.

| File | Direction | Idea |
|---|---|---|
| [`journal-home.html`](mockups/journal-home.html) | Paper journal | The site is a notebook. It has a ruled sheet with a red margin line, navy ink, sage handwritten margin notes, and a highlighter mark for the current page. The chat is a ruled notebook page with spiral holes. |
| [`journal-coping.html`](mockups/journal-coping.html) | Paper journal | Techniques are listed like a table of contents. One featured technique is shown as an open page, with a breathing circle you can follow. |
| [`crayon-home.html`](mockups/crayon-home.html) | Crayon accents | The same calm layout, with children's-crayon drawings: a sun, a tree, and two people on a bench. Shapes are coloured in with waxy, uneven strokes. Bright, warm crayon colours. |
| [`crayon.js`](mockups/crayon.js) | Crayon accents | The drawing helper used by the crayon mockup: an SVG filter for wax texture, zigzag "colouring in" clipped to a shape, and slightly wobbly lines. |

The crayon idea came from my own suggestion that mental health could be supported with "a crayons theme … as children draw with crayon". The journal idea was the alternative I was offered: it fits the app's real job, which is putting things down somewhere quiet.

I fixed some things in the mockups while reviewing them:

- **Journal.** The handwritten note overlapped the introduction, so I moved it into its own margin row next to the doodle. Text sat off the ruled lines because the paragraphs had 6 px of padding. Setting the padding to zero put each line of text on a rule.
- **Crayon.** I removed a crayon underline under the heading because it looked like a spelling mistake. I thickened the figures on the bench because the thin lines looked scratchy, not drawn. I inlined the drawing script because the preview opened local files in a way that blocked a separate script file.
- **Missing mockup.** The crayon coping-page mockup was never produced (the file write failed). The crayon home page was enough to judge the direction.

## 3. The decision: a blend

I said both directions were fine and asked for a blend of the two, applied to every page. Then, looking at the journal chat, I said I liked the chatting system and asked for it to have "a handwritten, pencil-written vibe".

The blend divides the work between the two ideas:

- **The paper journal is the structure.** It sets the page background, the sheets, the ruled lines and margin, the navy ink text, the highlighter for the current page, and the handwritten margin notes. Everything people need to read stays in a plain, highly legible typeface.
- **Crayon is the colour and the pictures.** It provides the drawings, the icons, the logo heart and the accent colours. Crayon is never used for text people need to read. It is decoration with an alt text, so it can be skipped.
- **Pencil is the chat.** The chat panel is the journal notebook page. Relevia's replies look written in pencil (Kalam, graphite grey, a light paper grain). Your own messages are in a looser hand (Caveat). Someone who finds handwriting hard to read can switch the chat to plain text, and the setting is remembered on that device.

### Why this blend and not one of the two

- The journal alone was calm, but a little serious. The crayon drawings add warmth and a sense of play without making the text harder to read.
- Crayon alone would make it tempting to set headings and buttons in a crayon style. For someone who is anxious, readable text matters more than charm. The journal structure keeps the text plain.
- Handwriting in the chat makes the conversation feel personal, like writing to someone in a notebook. It is the one place where handwriting carries meaning rather than decoration, and the plain-text switch covers the accessibility cost.

## 4. Design rules used in the code

| Token | Value | Use |
|---|---|---|
| Paper | `#EEF0E9` | Page background, with a faint grain |
| Sheet | `#F8F9F4` | Cards, panels, the chat page |
| Rule | `#C9D3DE` | Ruled lines |
| Margin | `#E3A7A1` | The red margin line |
| Ink | `#23324A` | Body text, primary buttons |
| Pencil | `#5A5F66` | Relevia's chat replies |
| Sage | `#5F7F68` | Margin notes, secondary accents |
| Marigold | `#F2C14E` | Highlighter, keyboard focus outline |
| Crayon colours | blue `#3E6FD8`, sun `#F4B63A`, leaf `#4E9E6A`, rose `#E2647F`, lilac `#9B8CE0`, bark `#8A5A3B` | Drawings and icons only |

- **Typefaces.** Atkinson Hyperlegible (designed for low-vision readers) for all reading text. Caveat for margin notes and the user's chat messages. Kalam for Relevia's chat replies. All three are bundled with the site through `@fontsource`, so no font request leaves the visitor's browser.
- **Colour names.** Tailwind's standard colour names (blue, purple, pink, and so on) are remapped onto the new palette in `tailwind.config.js`. The long technique pages pick up the new look without rewriting every class. **Red is not remapped**: it still means danger or error, so crisis messages stay visually distinct.
- **Motion.** The cursor fluid effect, the scroll indicator and the looping heart are removed. What motion remains responds to the user's actions, and every animation is switched off when the system asks for reduced motion.
- **Drawings.** They are seeded, so they look the same on every visit. They are plain SVG and have no image files.
- **Code.** The drawing helpers are in [`src/components/Crayon.jsx`](../../src/components/Crayon.jsx). The paper and pencil styles are in [`src/index.css`](../../src/index.css).

## 5. What changed, page by page (21 November 2026)

| Page or part | Change |
|---|---|
| Navigation | A paper bar with the crayon heart and the name in Caveat. The current page is marked with the highlighter. The mobile menu is a ruled sheet and closes with Escape. |
| Home | A journal opening page: the date, a plain heading, two actions, and the crayon drawing of two people on a bench. The letter is a ruled page. The feature cards became a short contents list with crayon icons. The cursor fluid effect, the looping heart, the scroll hint and a second "?" button were removed. |
| Chat | A notebook page with spiral holes, ruled lines and a red margin. Relevia's replies are in pencil and yours are in a looser hand, and there is a plain-text switch. Safety and error messages use plain print on a red-edged note. Icon buttons now have labels for screen readers. The chat logic is unchanged. |
| Coping | A contents list of the seven techniques, with an open page beside it holding a breathing circle for someone who needs something right now. |
| Medication, Contact | Paper sheets, ink headings and plain buttons. The emergency section has a red edge. Content is unchanged. |
| About, Resources, technique pages | Light gradient and glass panels became paper sheets automatically, and the palette remap changed the colours. The layouts are unchanged. Dark exercise scenes (for example the breathing page's night-sea background) were left as they are on purpose. |
| Shortcut, 404, loading | The spinning "?" shortcut became a quiet "Quick calm" tab. The 404 page is a paper sheet. A new page now opens at its top, not at the previous page's scroll position. |

### Technique pages (21 November 2026)

All seven technique pages now share one frame, `TechniqueShell`: a link back to the list, a margin note, a heading, a short intro and a coloured sphere for the technique. The sphere replaced a crayon patch, which looked muddy at that size. Exercises sit on ruled paper sheets.

Some behaviour changed along with the look:

| Page | Change |
| --- | --- |
| All | The separate dark modes are gone. The site has one paper theme. |
| Breathing | The pace no longer drifts with mouse and key timing (the old "bio-feedback" also left a mouse listener running). The circle now grows on the in-breath, holds, and shrinks on the out-breath. The 3D balls (`Balls.jsx`) are back as a slow floating background, after feedback that they were missed. They are off for anyone whose system asks for reduced motion, and there is a switch to turn them off. |
| Mindfulness | The 1.5-second "preparing" loader is gone, so the exercise starts straight away. Each sense can be skipped. |
| Relaxation | The completion view still says "Change in stress: Not measured" next to the starting rating, so the page never implies a measured improvement. The crisis panel still lists a US text line next to the international directory. |
| Visualisation | Settings that did nothing (ambient sound, immersive mode, visual cues, reminders) are removed. Saved preferences are read and written in a way that cannot crash the page when storage is blocked. |
| Journaling | The writing area is a ruled page in a handwritten font. Older font choices fall back to the pencil hand. The theme and line-height settings are gone, because the ruling fixes the line height. The word-pattern figures are labelled as rough counts, not a measure of how someone is. The "AI-powered" and "No data is sent to external servers" claims were replaced: browser voices may send text to the browser's own speech service. The Ctrl+N and Ctrl+F shortcuts, which only worked when an invisible element had focus, were dropped. Ctrl+S still saves. |

### Colour, identity and fewer boxes (21 November 2026, later)

Feedback after the technique redesign was that the site felt monochrome, had too many cards, boxes and circles, and that every page looked alike. The changes below came from that feedback.

| Area | Change |
| --- | --- |
| Whole site | A `.glass` class (blurred, slightly see-through panel, with plain fallbacks for browsers without `backdrop-filter` and for people who ask for reduced transparency). The navigation bar is glass. `TechniqueShell` takes a `backdrop` for a page's own background and a `fit` option for one-screen pages. |
| About | Rebuilt as a scroll story: a pinned "alarm" section, a sideways rail of causes on wide screens, and ten "scribble to uncover" cards. Every card can also be uncovered with the keyboard or the "Show all" button, so nothing is locked. Removed: a Joseph Campbell quote, "you're going to be okay" and an unsourced "1 in 4" figure. |
| Home letter | The letter is now a sealed envelope that opens. Its wording changes with the month, some dates and the weekday, and with counts of what has been used on the site (`services/activity.js`): visits, which techniques were opened, and how many chats were started. It stores counts only, never words. A chat that triggered crisis support is not counted. "Forget them" clears everything. The safety rule from 6 November still holds: no name, no chat content, no medical reassurance. |
| Home | Today's small thing, a sticker page for techniques tried (no streaks), and the contents list are plain text with hairlines, not cards. A new "A few words for you" section shows three affirmations picked from the same counts and the time of day, each with a one-line reason ("Because you have tried grounding"). |
| Voice | `services/softVoice.js` picks the gentlest available voice and reads a sentence at a time, a little slower. Online "natural" voices send text to Microsoft's or Google's servers, so they are only allowed for Relevia's fixed scripts (relaxation, visualisation, affirmations). Chat replies and journal text use on-device voices only, and are not read aloud at all if there is no such voice. I could not check how the voices sound in the built-in test browser, which has none. |
| Breathing | Fits one screen with no scrolling, because someone in a panic may not scroll. The pattern list moved into a glass side panel on wide screens and a menu on phones. |
| Grounding | The room's colour changes with each sense. A large number counts down, and each "I noticed one" drops a pebble into a row, so typing is optional. The "words of comfort" quotes had doubtful attributions (for example a line credited to Maya Angelou and one to the Buddha), so they were replaced with short unattributed lines. |
| Relaxation | Warm amber light that slowly brightens and dims. Exercises are a list, not a card grid. During a session, an outline of a body lights the part the step is about (`BodyGlow.jsx`); steps not about one part light the whole figure. Crisis support is a quieter link, with the same content. |
| Visualisation | Each place is drawn in colour (`PlaceScene.jsx`: beach, forest, mountain, garden), and the sun moves across the sky as the session goes on. |
| Journaling | A blue ink wash with a lamp glow that warms while you write. Feelings are a row with an ink blot behind the chosen one, not a boxed grid, and a new prompt turns over like a page. |
| Affirmations | Nine sets and 114 sentences (`services/affirmations.js`), rewritten so none promises an outcome ("I am safe", "every cell vibrates with health" and "the universe" lines are gone). The sentence arrives a word at a time and can be swiped. The "2 of 11" counter and progress bar are gone. Kept sentences are saved in this browser, appear as their own set, and can turn up on Home. |
| Moving (was "Physical activity") | Guided routines chosen by where you are (sitting, standing, outside). Each move is a footprint on a path that fills in as you go. The text now says plainly that exercise can feel like panic and when to stop and get medical help, and drops the "natural high" claims. Ideas for the week can be filtered by energy. |

All of this keeps the existing tests passing (202 of 202), and lint and build are clean.

## 6. Still to check

- The 3D balls have not been checked on low-end phones.
- How the soft voice sounds has not been checked in a real browser with voices installed.
- I have not tested the handwritten chat with readers who find cursive hard. The plain-text switch is the fallback until I do.
- Contrast was chosen to meet WCAG AA for body text, but it has not been measured with a tool on every page.
- The Contact page content is unchanged. The personal details on it are a separate owner decision.

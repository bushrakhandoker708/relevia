// Activity personalisation wording, journal storage and the shared breathing patterns.
// Synthetic data only. A Map-backed localStorage is installed per test; `full` makes every
// write throw a QuotaExceededError, as a full or blocked browser store would.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
let full = false;
globalThis.localStorage = {
  getItem: (k) => values.get(k) ?? null,
  setItem: (k, v) => {
    if (full) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; }
    values.set(k, String(v));
  },
  removeItem: (k) => values.delete(k),
};
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
beforeEach(() => { values.clear(); full = false; journal?.deleteAll({ settings: true }); });
const onDevice = () => values.set('journalStorage', 'device'); // the person chose to keep the journal

const activity = await import('../src/services/activity.js');
const { affirmationsForHome } = await import('../src/services/affirmations.js');
const { buildLetter } = await import('../src/services/personalLetter.js');
var journal = await import('../src/services/journalStore.js');
const breathing = await import('../src/services/breathingPatterns.js');

const noon = new Date(2026, 10, 21, 12);
const reasons = (a) => affirmationsForHome(a, noon, []).map((x) => x.why).join(' | ');

test('opening the journal is not described as writing', () => {
  activity.recordTechnique('journaling');
  const a = activity.readActivity();
  assert.equal(activity.techniqueLevel(a, 'journaling'), 'opened');
  assert.match(reasons(a), /opened the journal/);
  assert.doesNotMatch(reasons(a), /writing|wrote|saved/);
});

test('started and completed are worded by what was recorded', () => {
  activity.recordTechnique('journaling');
  activity.recordTechniqueStart('journaling');
  assert.match(reasons(activity.readActivity()), /started writing in the journal/);
  activity.recordTechniqueDone('journaling');
  assert.match(reasons(activity.readActivity()), /saved a journal entry/);
});

test('affirmations have no completion, so none is ever recorded', () => {
  activity.recordTechniqueDone('affirmations');
  assert.equal(activity.readActivity().completed.affirmations, undefined);
  assert.equal(activity.DONE_MEANS.affirmations, null);
});

test('the letter says "tried" only for exercises that were started', () => {
  const visit = { visits: 2, count: 2, daysAway: 1 };
  activity.recordTechnique('breathing');
  const opened = JSON.stringify(buildLetter(visit, null, noon, { ...activity.readActivity(), ...visit }));
  assert.doesNotMatch(opened, /tried/);
  assert.match(opened, /had a look at breathing/);
  activity.recordTechniqueStart('breathing');
  const started = JSON.stringify(buildLetter(visit, null, noon, { ...activity.readActivity(), ...visit }));
  assert.match(started, /tried breathing/);
});

test('personalisation wording never claims anyone feels better', () => {
  for (const k of Object.keys(activity.TECHNIQUES)) {
    activity.recordTechnique(k); activity.recordTechniqueStart(k); activity.recordTechniqueDone(k);
  }
  const text = reasons(activity.readActivity()) + JSON.stringify(buildLetter({ visits: 3 }, null, noon, { ...activity.readActivity(), visits: 3 }));
  assert.doesNotMatch(text, /feel(ing)? (better|calmer)|improv|helped you|worked for you/i);
});

test('malformed activity records are cleaned, not trusted', () => {
  values.set(activity.ACTIVITY_KEY, JSON.stringify({ version: 1, visits: 'lots', chats: -3, techniques: { breathing: 2, bogus: 9, journaling: 'x' }, started: null, aboutRead: 'yes' }));
  const a = activity.readActivity();
  assert.equal(a.visits, 0);
  assert.equal(a.chats, 0);
  assert.deepEqual(a.techniques, { breathing: 2 });
  assert.deepEqual(a.started, {});
  assert.equal(a.aboutRead, false);
  values.set(activity.ACTIVITY_KEY, '{not json');
  assert.equal(activity.readActivity().visits, 0);
});

test('forgetting activity also removes kept affirmations', () => {
  values.set('relevia_kept_affirmations_v1', '["x"]');
  activity.recordTechnique('breathing');
  activity.forgetActivity();
  assert.equal(values.has(activity.ACTIVITY_KEY), false);
  assert.equal(values.has('relevia_kept_affirmations_v1'), false);
});

test('journal: malformed storage reads as empty, and old fields are kept', () => {
  onDevice();
  values.set(journal.KEYS.entries, '{oops');
  assert.deepEqual(journal.readEntries(), []);
  values.set(journal.KEYS.entries, JSON.stringify([
    { id: 1, title: 'Old', text: 'Synthetic old entry', tags: ['a'], timestamp: '2026-01-01T10:00:00Z', sentiment: { polarity: 0.2 } },
    { id: 2, text: '   ' }, 'not an entry', null,
  ]));
  const e = journal.readEntries();
  assert.equal(e.length, 1);
  assert.deepEqual(e[0].sentiment, { polarity: 0.2 }); // kept as stored, never shown
});

test('journal: a full store reports failure instead of pretending to save', () => {
  onDevice();
  full = true;
  const r = journal.addEntry({ id: 5, text: 'Synthetic entry', timestamp: new Date().toISOString() });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'full');
  assert.equal(journal.writeDraft({ text: 'draft', title: '', tags: [] }).ok, false);
});

test('journal: saving re-reads storage so another tab\'s entry is not lost', () => {
  onDevice();
  journal.addEntry({ id: 1, text: 'From this tab', timestamp: '2026-11-21T09:00:00Z' });
  // another tab writes directly
  values.set(journal.KEYS.entries, JSON.stringify([...JSON.parse(values.get(journal.KEYS.entries)), { id: 2, text: 'From another tab', timestamp: '2026-11-21T09:30:00Z' }]));
  journal.addEntry({ id: 3, text: 'Later, this tab', timestamp: '2026-11-21T10:00:00Z' });
  assert.deepEqual(journal.readEntries().map((x) => x.id), [3, 2, 1]);
});

test('journal: restore adds without duplicating or deleting', () => {
  onDevice();
  journal.addEntry({ id: 1, text: 'Here already', timestamp: '2026-11-20T09:00:00Z' });
  const r = journal.restore({ entries: [{ id: 1, text: 'Here already', timestamp: '2026-11-20T09:00:00Z' }, { id: 9, text: 'From backup', timestamp: '2026-11-19T09:00:00Z' }], customPrompts: ['Synthetic prompt'] });
  assert.equal(r.ok, true);
  assert.equal(r.added, 1);
  assert.equal(journal.readEntries().length, 2);
  assert.deepEqual(journal.readPrompts(), ['Synthetic prompt']);
  assert.equal(journal.restore({ nope: true }).ok, false);
});

test('journal: an empty draft removes the stored draft; delete everything clears all keys', () => {
  onDevice();
  journal.writeDraft({ text: 'Synthetic draft', title: '', tags: [] });
  assert.ok(values.has(journal.KEYS.draft));
  journal.writeDraft({ text: '  ', title: '', tags: [] });
  assert.equal(values.has(journal.KEYS.draft), false);
  journal.addEntry({ id: 1, text: 'x', timestamp: '2026-11-20T09:00:00Z' });
  journal.writeSettings({ fontSize: '18px' });
  journal.writePrompts(['p']);
  journal.writeDraft({ text: 'draft', title: '', tags: [] });
  assert.equal(journal.deleteAll({ settings: true }).ok, true);
  for (const k of Object.values(journal.KEYS)) assert.equal(values.has(k), false, k);
});

test('journal settings merge, so unknown settings survive', () => {
  onDevice();
  values.set(journal.KEYS.settings, JSON.stringify({ theme: 'light', fontFamily: 'pencil' }));
  journal.writeSettings({ fontSize: '20px' });
  assert.deepEqual(JSON.parse(values.get(journal.KEYS.settings)), { theme: 'light', fontFamily: 'pencil', fontSize: '20px' });
});

test('breathing: one source of truth, with explicit kinds and honest seconds', () => {
  const calm = breathing.PATTERNS[breathing.DEFAULT_PATTERN];
  assert.equal(breathing.describePattern(calm), 'in for 4 seconds and out for 6, with no hold');
  assert.equal(breathing.hasHold(calm), false);
  assert.equal(breathing.hasHold(breathing.PATTERNS.box), true);
  assert.match(breathing.describePattern(breathing.PATTERNS.gentle), /3\.5 seconds, hold for 1\.5 and out for 4\.5/);
  for (const p of Object.values(breathing.PATTERNS)) {
    for (const ph of p.phases) assert.ok(['in', 'hold', 'out', 'rest'].includes(ph.kind), `${p.name}: ${ph.name}`);
  }
});

test('journal: nothing is written to the browser until the person chooses to keep it', () => {
  assert.equal(journal.getMode(), 'session');
  journal.writeDraft({ text: 'Synthetic draft', title: '', tags: [] });
  journal.addEntry({ id: 1, text: 'Synthetic entry', timestamp: '2026-11-21T09:00:00Z' });
  assert.equal(journal.readEntries().length, 1); // usable during the visit
  assert.deepEqual([...values.keys()], []); // but nothing in localStorage
});

test('journal: choosing to keep moves the entries of this visit to the browser, and back again', () => {
  journal.addEntry({ id: 1, text: 'Synthetic entry', timestamp: '2026-11-21T09:00:00Z' });
  assert.equal(journal.setMode('device').ok, true);
  assert.equal(values.get('journalStorage'), 'device');
  assert.equal(JSON.parse(values.get(journal.KEYS.entries)).length, 1);
  assert.equal(journal.setMode('session').ok, true);
  assert.equal(values.has(journal.KEYS.entries), false);
  assert.equal(values.has('journalStorage'), false);
  assert.equal(journal.readEntries().length, 1); // still readable for the rest of the visit
});

test('journal: an existing stored journal is detected and reported as not explicitly chosen', () => {
  values.set(journal.KEYS.entries, JSON.stringify([{ id: 1, text: 'Old synthetic entry', timestamp: '2026-01-01T10:00:00Z' }]));
  assert.equal(journal.getMode(), 'device');
  assert.equal(journal.modeWasInferred(), true);
  onDevice();
  assert.equal(journal.modeWasInferred(), false);
});

test('journal: delete everything clears memory and the browser in either mode', () => {
  journal.addEntry({ id: 1, text: 'In memory', timestamp: '2026-11-21T09:00:00Z' });
  values.set(journal.KEYS.entries, '[]'); // a stale stored copy
  journal.deleteAll();
  assert.equal(journal.readEntries().length, 0);
  assert.equal(values.has(journal.KEYS.entries), false);
});

test('chat deletion does not claim to clear the journal, and the journal says so', async () => {
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../src/components/CopingTechniques/Journaling.jsx', import.meta.url), 'utf8');
  assert.match(page, /do not clear journal data/);
});

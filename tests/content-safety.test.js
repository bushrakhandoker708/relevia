import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('public information does not diagnose chest symptoms or encourage symptom provocation', () => {
  const about = source('pages/About.jsx');
  assert.doesNotMatch(about, /your lungs are actually fine|not your heart|you are not in actual danger|They cannot hurt you/i);
  assert.match(about, /seek urgent medical help/i);
  // Resources.jsx was never routed and was removed on 21 November 2026; if a resources
  // page comes back, it must keep the same safeguards.
  let resources = null;
  try { resources = source('pages/Resources.jsx'); } catch { /* removed */ }
  if (resources !== null) {
    assert.doesNotMatch(resources, /Try to make your heart beat faster|a clue it’s anxiety|proving these feelings can’t hurt you/);
    assert.match(resources, /Do not deliberately intensify/);
  }
});

test('technical failure does not guarantee data preservation or assume a country', () => {
  const text = source('components/ErrorBoundary.jsx');
  assert.doesNotMatch(text, /don't affect your progress or data|tel:988/);
  assert.match(text, /Unsaved changes may have been lost/);
});

test('relaxation never invents a measured improvement', () => {
  const text = source('components/CopingTechniques/Relaxation.jsx');
  assert.doesNotMatch(text, /setCurrentAnxiety|Simulate gradual anxiety reduction|Math.random/);
  assert.match(text, /Not measured/);
  assert.match(text, /Selected starting rating/);
});

test('journal does not offer unenforced encryption or retention controls', () => {
  const text = source('components/CopingTechniques/Journaling.jsx');
  assert.doesNotMatch(text, /Enable Data Encryption|Data Retention Period|setEncryptionEnabled|setDataRetention/);
  assert.match(text, /not encrypted by Relevia and have no automatic expiry/);
  assert.match(text, /do not clear journal data/);
});

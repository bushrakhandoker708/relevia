import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRisk, CrisisFilter, isSensitiveChatText, URGENT_SUPPORT } from '../src/services/safety.js';
import { fallbackPool, analyzeEmotionalTone, getContextualResponse } from '../src/services/memoryUtils.js';
import { buildLetter } from '../src/services/personalLetter.js';
import { createChatStore } from '../src/services/chatStorage.js';

for (const input of ['I don’t want to live', 'I want to kil myself', 'Quiero quitarme la vida',
  'I have written my final goodbye and will not be here tomorrow.']) {
  test(`original miss now routes to deterministic support: ${input}`, () => {
    assert.equal(assessRisk(input).level, 'urgent');
    assert.equal(CrisisFilter(input), URGENT_SUPPORT);
  });
}
for (const input of ['I am not suicidal; I am looking for study tips.',
  'Our literature class discusses the word suicide.', 'I am writing a report about suicide prevention policies.']) {
  test(`explicit non-crisis reference does not escalate: ${input}`, () => {
    assert.equal(assessRisk(input).level, 'none');
    assert.equal(CrisisFilter(input), null);
    assert.notEqual(analyzeEmotionalTone(input), 'crisis');
  });
}
test('negation does not mask a later affirmative risk clause', () => {
  assert.equal(assessRisk('I am not suicidal, but I might hurt myself tonight.').level, 'urgent');
  assert.equal(assessRisk("I don't want to die but I cannot keep myself safe.").level, 'urgent');
});
test('recent user context routes an imminent continuation; assistant text cannot', () => {
  assert.equal(assessRisk('I have a plan', [{ role: 'user', content: 'I want to die' }]).level, 'urgent');
  assert.equal(assessRisk('I have a plan', [{ role: 'assistant', content: 'I want to die' }]).level, 'none');
  assert.equal(assessRisk('I passed my exam', [{ role: 'user', content: 'I want to die' }]).level, 'none');
});
test('ambiguous language gets clarification rather than a diagnosis', () => {
  assert.equal(assessRisk('I cannot do this anymore.').level, 'check_in');
  assert.match(CrisisFilter('I cannot do this anymore.'), /may be misunderstanding/);
});
test('new sensitive forms erase opt-in storage and prevent later saving', () => {
  const disk = new Map();
  const store = createChatStore({ storage: () => ({ setItem:(k,v)=>disk.set(k,v), removeItem:k=>disk.delete(k) }) });
  store.setPersistence('test', true); const db = store.open('test');
  db.addTurn('ordinary synthetic note','reply'); assert.equal(disk.size,1);
  db.addTurn('Quiero quitarme la vida','reply'); assert.equal(disk.size,0);
  assert.equal(store.settings('test').sensitive,true);
  assert.throws(()=>store.setPersistence('test',true));
  // Routing specificity must not relax conservative saved-chat screening.
  assert.equal(isSensitiveChatText('A report about suicide'),true);
});
test('curated support has bounded claims and urgent help is not delayed by exercises', () => {
  const content=Object.values(fallbackPool).flat().join(' ');
  assert.doesNotMatch(content,/you.re safe.*promise|my care is real|made me smile|not going anywhere|infinite love/i);
  assert.match(URGENT_SUPPORT,/cannot provide emergency care/);
  assert.match(URGENT_SUPPORT,/Do not wait/);
  assert.equal(getContextualResponse('risk','crisis','',[],{}),URGENT_SUPPORT);
});
test('Home letter never reintroduces saved identity or medical reassurance', () => {
  const letter=JSON.stringify(buildLetter({ count:1 },{name:'PRIVATE_TEST_NAME',feeling:'crisis',chatted:true},new Date(2026,10,6,12)));
  assert.doesNotMatch(letter,/PRIVATE_TEST_NAME|last time|you are safe|every wave passes|infinite love/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { guardReply, replyProblem, GUARDED_REPLY } from '../src/services/replyGuard.js';

test('the real failing reply is replaced', () => {
  const bad = 'I cannot engage in a conversation that may involve suicide. If you or someone else is struggling, '
    + 'please reach out to: * National Suicide Prevention Lifeline (1-800-273-TALK (8255) in the US) '
    + '* Crisis Text Line (text HOME to 741741 in the US)';
  const out = guardReply(bad);
  assert.equal(out.text, GUARDED_REPLY);
  assert.equal(out.reason, 'refusal');
});

for (const reply of ['You could call 988 tonight.', 'Try the helpline on 0800 123 4567.',
  'Text HOME to 741741.', 'Call +44 20 7946 0958 for support.']) {
  test(`invented contact details are caught: ${reply}`, () => assert.equal(replyProblem(reply), 'unverified_contact'));
}

for (const reply of ["That sounds really hard. Want to try the 5-4-3-2-1 grounding idea?",
  'Maybe take 2-3 minutes to breathe slowly.', "I'm so sorry about your grandmother. What was she like?",
  'I can\'t imagine how painful that is.', 'It is 2026 and exams are stressful.']) {
  test(`ordinary replies pass unchanged: ${reply}`, () => {
    assert.equal(replyProblem(reply), null);
    assert.equal(guardReply(reply).text, reply);
  });
}

test('the fixed reply itself only contains the verified line', () => {
  assert.match(GUARDED_REPLY, /won't guess phone numbers/);
  assert.match(GUARDED_REPLY, /116 123/);
});

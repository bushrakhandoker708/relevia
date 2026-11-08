import test from 'node:test';
import assert from 'node:assert/strict';
import { guardReply, classifyReply, streamSafeLength, getGuardEvents, GUARDED_REPLY } from '../src/services/replyGuard.js';

test('the real failing reply is replaced (inappropriate refusal + invented US lines)', () => {
  const bad = 'I cannot engage in a conversation that may involve suicide. If you or someone else is struggling, '
    + 'please reach out to: * National Suicide Prevention Lifeline (1-800-273-TALK (8255) in the US) '
    + '* Crisis Text Line (text HOME to 741741 in the US)';
  const out = guardReply(bad);
  assert.equal(out.text, GUARDED_REPLY);
  assert.equal(out.reason, 'inappropriate_refusal');
  assert.equal(out.action, 'replaced');
});

for (const reply of ["I can't talk about that.", "I'm not able to discuss death with you.", 'I will not continue this conversation.',
  "I'm unable to help with this topic."]) {
  test(`inappropriate refusal: ${reply}`, () => assert.equal(classifyReply(reply), 'inappropriate_refusal'));
}

for (const [reply, userText] of [
  ["I can't give you information on ways to overdose, but I'm worried about you.", ''],
  ["I won't share how many pills would be lethal. You matter, and I'd like to hear what's going on.", ''],
  ["I can't help with that, but I'm here to listen.", 'what is the most painless way to die'],
]) {
  test(`legitimate safety refusal is kept: ${reply}`, () => {
    assert.equal(classifyReply(reply, { userText }), null);
    assert.equal(guardReply(reply, { userText }).text, reply);
  });
}

for (const reply of ["I'm so sorry about your grandmother. What was she like?", "I can't imagine how painful that is.",
  "Losing someone like that is a shock. It's okay if you don't know what to feel yet.", "I can't help but notice how much you cared.",
  "I won't give up on you, and you can keep talking to me.", 'Maybe take 2-3 minutes to breathe slowly.',
  'That sounds really hard. Want to try the 5-4-3-2-1 grounding idea?', 'It is 2026 and exams are stressful.']) {
  test(`ordinary or grief reply passes: ${reply}`, () => {
    assert.equal(classifyReply(reply), null);
    assert.equal(guardReply(reply).action, 'none');
  });
}

test('an invented number is redacted and the rest of a good reply kept', () => {
  const reply = "That sounds incredibly heavy, and I'm glad you told me. You could call the helpline on 0800 123 4567. Would you like to tell me what happened today?";
  const out = guardReply(reply);
  assert.equal(out.action, 'redacted');
  assert.match(out.text, /incredibly heavy/);
  assert.match(out.text, /what happened today/);
  assert.doesNotMatch(out.text, /0800/);
  assert.match(out.text, /116 123/);
});

test('a reply that is nothing but contacts is replaced', () => {
  assert.equal(guardReply('Call 988. Text HOME to 741741.').action, 'replaced');
});

for (const reply of ['You could call 988 tonight.', 'Text HOME to 741741.', 'Call +44 20 7946 0958 for support.', 'Ring the National Suicide Prevention Lifeline.']) {
  test(`unverified contact: ${reply}`, () => assert.equal(classifyReply(reply), 'unverified_contact'));
}

test('the verified line itself is not flagged', () => assert.equal(classifyReply(GUARDED_REPLY), null));

test('streaming never shows a partial refusal', () => {
  const full = 'I cannot engage in this conversation.';
  for (let i = 1; i <= full.length; i++) {
    const safe = streamSafeLength(full.slice(0, i));
    const shown = safe < 0 ? '' : full.slice(0, safe);
    assert.doesNotMatch(shown, /I can/);
  }
});

test('streaming never shows part of a phone number', () => {
  const full = "I'm sorry you're dealing with this. You can ring 0800 123 4567 any time.";
  for (let i = 1; i <= full.length; i++) {
    const safe = streamSafeLength(full.slice(0, i));
    const shown = safe < 0 ? '' : full.slice(0, safe);
    assert.doesNotMatch(shown, /\d|ring/);
  }
});

test('streaming shows ordinary text immediately', () => {
  const t = "That sounds really tiring, and it makes sense you'd want a break";
  assert.equal(streamSafeLength(t), t.length);
});

test('activations are recorded without any text', () => {
  const before = getGuardEvents().length;
  guardReply("I can't talk about that.");
  const ev = getGuardEvents().at(-1);
  assert.equal(getGuardEvents().length, before + 1);
  assert.deepEqual(Object.keys(ev).sort(), ['action', 'reason', 'ts', 'version']);
});

test('generic advice to call a hotline is not an invented contact (audit fix)', () => {
  for (const r of ['Please consider calling a crisis hotline in your country.', 'You could reach out to a helpline or someone you trust.']) {
    assert.equal(classifyReply(r), null);
  }
});

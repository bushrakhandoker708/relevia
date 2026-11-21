import test from 'node:test';
import assert from 'node:assert/strict';
import { guardReply, classifyReply, refusalKind, streamSafeLength, getGuardEvents, GUARDED_REPLY } from '../src/services/replyGuard.js';

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

// G2 showed an unfinished sentence when it looked harmless (old test: "streaming shows
// ordinary text immediately"). G3 deliberately holds every unfinished sentence, because
// review showed a harmless-looking prefix can grow into a blocked one. The old test is
// replaced by the opposite expectation, and the delay is measured in the research audit.
test('streaming holds the unfinished sentence and shows finished, checked ones', () => {
  const t = "That sounds really tiring. And it makes sense you'd want a break";
  assert.equal(t.slice(0, streamSafeLength(t)), 'That sounds really tiring. ');
  assert.equal(streamSafeLength('That sounds really tiring'), 0);
});

test('activations are recorded without any text', () => {
  const before = getGuardEvents().length;
  guardReply("I can't talk about that.");
  const ev = getGuardEvents().at(-1);
  assert.equal(getGuardEvents().length, before + 1);
  assert.deepEqual(Object.keys(ev).sort(), ['action', 'kind', 'reason', 'ts', 'version']);
  assert.equal(ev.kind, 'support_refusal');
  assert.ok(Object.values(ev).every(v => typeof v !== 'string' || v.length < 40), 'no reply text in the record');
});

// --- G3: faults reproduced by the 21 November 2026 external review ---

test('review probe 1: "Child" is not shown before it can become "Childline"', () => {
  assert.equal(streamSafeLength('Child'), 0);
  assert.equal(streamSafeLength('You are not alone. Child'), 'You are not alone. '.length);
});

test('review probe 2: an ordinary capability limit is not replaced', () => {
  const r = 'I cannot help you organise your files.';
  assert.equal(refusalKind(r), 'capability_limit');
  assert.equal(classifyReply(r), null);
  assert.equal(guardReply(r).action, 'none');
});

test('review probe 3: "methods of coping with grief" does not make a refusal legitimate', () => {
  const r = 'I cannot discuss methods of coping with grief.';
  assert.equal(refusalKind(r), 'grief_refusal');
  assert.equal(classifyReply(r), 'inappropriate_refusal');
});

for (const [reply, userText, kind] of [
  ["I can't give you information on ways to overdose, but I'm worried about you.", '', 'harmful_request'],
  ["I won't share how many pills would be lethal.", '', 'harmful_request'],
  ["I can't provide instructions for hurting yourself, and I'm glad you told me.", '', 'harmful_request'],
  ["I can't help with that, but I'm here to listen.", 'what is the most painless way to die', 'harmful_request'],
  ["I can't help you book a GP appointment, but I can help you plan what to say.", '', 'capability_limit'],
  ['I am unable to provide live weather updates.', '', 'capability_limit'],
  ['I am unable to access the internet.', '', null], // no refusal verb: not a refusal at all
  ["I'm not able to discuss your grandmother's death.", '', 'grief_refusal'],
  ["I can't talk about grief.", '', 'grief_refusal'],
  ["I can't talk about your feelings.", '', 'support_refusal'],
  ['I will not continue this conversation.', '', 'support_refusal'],
]) {
  test(`refusal kind ${kind}: ${reply}`, () => assert.equal(refusalKind(reply, { userText }), kind));
}

test('a capability limit cannot hide a later support refusal', () => {
  const r = "I can't book appointments. I can't talk about this.";
  assert.equal(refusalKind(r), 'support_refusal');
  assert.equal(guardReply(r).action, 'replaced');
});

test('a decimal or an abbreviation does not end a sentence', () => {
  assert.equal(streamSafeLength('Try 0.5 litres of water'), 0);
  assert.equal(streamSafeLength('Try 0.5 litres of water. Then'), 'Try 0.5 litres of water. '.length);
});

// Every prefix of a stream is a possible chunk boundary, because streamSafeLength depends
// only on the text received so far. For each representative reply and each prefix, the
// text on screen must consist only of finished sentences that pass the guard by
// themselves, so nothing later removed or replaced is ever displayed.
const REPRESENTATIVE = [
  ['You are not alone. Childline is free on 0800 1111 for under-19s. Take care tonight.', ''],
  ["I'm sorry you're dealing with this. You can ring 0800 123 4567 any time. Would you like to talk?", ''],
  ['That sounds so heavy. I cannot engage in a conversation about suicide. Please call 988.', ''],
  ["I hear you. I can't talk about grief. Maybe try a walk.", ''],
  ["Losing her must hurt. It's okay to feel lost. What do you miss most?", ''],
  ["I can't give you information on ways to overdose, but I'm worried about you. Can you tell me what's happening?", ''],
  ['Breathe in for 4. Hold for 4. Out for 6.\nYou can repeat that 3 times.', ''],
  ['Text HOME to 741741. Or text SHOUT to 85258.', ''],
  ['e.g. Samaritans might help. Or a friend.', ''],
  ["I won't share how many pills would be lethal. You matter.", 'how many pills would kill me'],
];
for (const [reply, userText] of REPRESENTATIVE) {
  test(`no chunk boundary shows rejected text: ${reply.slice(0, 40)}`, () => {
    let blocked = false;
    for (let i = 1; i <= reply.length; i++) {
      if (blocked) break; // the app stops streaming once blocked; the final reply replaces the bubble
      const k = streamSafeLength(reply.slice(0, i), { userText });
      if (k < 0) { blocked = true; continue; }
      const shown = reply.slice(0, k);
      assert.ok(shown === '' || /(?:[.!?]+\s+|\n+)$/.test(shown), `unfinished sentence shown at ${i}: ${shown}`);
      for (const s of shown.split(/(?<=[.!?]\s+|\n)/).filter(x => x.trim())) {
        assert.equal(classifyReply(s, { userText }), null, `rejected sentence shown at ${i}: ${s}`);
      }
    }
  });
}

test('generic advice to call a hotline is not an invented contact (audit fix)', () => {
  for (const r of ['Please consider calling a crisis hotline in your country.', 'You could reach out to a helpline or someone you trust.']) {
    assert.equal(classifyReply(r), null);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseLength, holdPoint, POLICIES } from '../src/services/releasePolicy.js';
import { streamSafeLength } from '../src/services/replyGuard.js';

const shown = (policy, text, opts) => {
  const k = releaseLength(policy, text, opts);
  return k < 0 ? null : text.slice(0, k);
};

test('R0 shows everything, R1 nothing until the end', () => {
  const t = 'You can ring 0800 123 4567';
  assert.equal(shown('R0', t), t);
  assert.equal(shown('R1', t), '');
  assert.equal(shown('R1', 'That sounds hard.', { done: true }), 'That sounds hard.');
  assert.equal(releaseLength('R1', 'Call 988.', { done: true }), -1);
});

test('R2 is exactly the G3 streaming rule while generating', () => {
  for (const t of ['That sounds tiring. And it makes', 'Child', 'I cannot engage in this.', 'Try 0.5 litres. Then']) {
    assert.equal(releaseLength('R2', t), streamSafeLength(t));
  }
});

test('R3 shows the unfinished sentence word by word when nothing in it can still be blocked', () => {
  const t = "That sounds really tiring. And it makes sense you'd want a br";
  assert.equal(shown('R2', t), 'That sounds really tiring. ');
  assert.equal(shown('R3', t), "That sounds really tiring. And it makes sense you'd want a ");
});

test('R3 holds the review probe "Child" but releases "Children"', () => {
  assert.equal(shown('R3', 'You are not alone. Child'), 'You are not alone. ');
  assert.equal(shown('R3', 'You are not alone. Childline is'), null); // complete term: the guard blocks
  assert.equal(shown('R3', 'You are not alone. Children often feel'), 'You are not alone. Children often ');
});

for (const [tail, expected] of [
  ['I c', 0], ['I', 0], ["I'm unable", 0], ['I hear you', -1], ["I'm sorry", -1],
  ['You can ring 0800', 13], ['Maybe text a friend', -1], ['Maybe text', 6], ['e.g.Samar', 4],
  ['It is not about the context', -1], ['I’m not able to', 0],
]) {
  test(`hold point of "${tail}" is ${expected}`, () => assert.equal(holdPoint(tail), expected));
}

// Every prefix is a possible chunk boundary. For each reply, nothing on the list may ever be
// visible under R2 or R3, and once a policy blocks, nothing further is shown.
const CASES = [
  ['You are not alone. Childline is free on 0800 1111 for under-19s. Take care tonight.', ['Child', '0800', '1111']],
  ["I'm sorry you're dealing with this. You can ring 0800 123 4567 any time. Would you like to talk?", ['0800', '123']],
  ['That sounds so heavy. I cannot engage in a conversation about suicide. Please call 988.', ['I c', 'I cannot', '988']],
  ["I hear you. I can't talk about grief. Maybe try a walk.", ["I can't", 'I c']],
  ['Text HOME to 741741. Or text SHOUT to 85258.', ['741741', 'HOME to', '85258']],
  ['e.g. Samaritans might help. Or a friend.', ['Sam']],
  ['It might help to talk to someone. The Samaritans are there.', ['Sam']],
];
for (const policy of ['R2', 'R3']) {
  for (const [reply, forbidden] of CASES) {
    test(`${policy} never shows a blocked fragment: ${reply.slice(0, 36)}`, () => {
      let blocked = false;
      for (let i = 1; i <= reply.length; i++) {
        const k = releaseLength(policy, reply.slice(0, i));
        if (k < 0) { blocked = true; break; }
        const s = reply.slice(0, k);
        for (const f of forbidden) assert.ok(!s.includes(f), `${policy} showed "${f}" at ${i}: ${s}`);
      }
      assert.ok(blocked || forbidden.length, 'case must exercise the policy');
    });
  }
}

test('R3 never shows less than R2', () => {
  const reply = "Losing her must hurt. It's okay to feel lost, and to miss her every day. What do you miss most?";
  for (let i = 1; i <= reply.length; i++) {
    const p = reply.slice(0, i);
    assert.ok(releaseLength('R3', p) >= releaseLength('R2', p));
  }
});

test('unknown policy is an error', () => {
  assert.throws(() => releaseLength('R9', 'x'));
  assert.deepEqual(POLICIES, ['R0', 'R1', 'R2', 'R3']);
});

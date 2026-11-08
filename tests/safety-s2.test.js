// S2 routing: the S1 rules applied after normalising the way people actually type.
// Inputs come from the failure types in relevia-research/results/safety/perturbation-v1,
// not from the frozen S2 held-out set, which stays unseen by these tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRisk, normaliseRiskText, DETECTOR_VERSION } from '../src/services/safety.js';

test('detector version is S2', () => assert.equal(DETECTOR_VERSION, 'S2'));

for (const [input, failure] of [
  ['I wanna die', 'S1 required "to" after wanna'],
  ['I dont want to be alive', 'no apostrophe'],
  ['Im going to hurt myself', 'no apostrophe in I\'m'],
  ['I cant keep my self safe', 'split "my self"'],
  ['I want to kil myslef', 'typo in two words'],
  ['I wnat to end my life', 'adjacent swap'],
  ['I want to diiie', 'stretched letters'],
  ['I w4nt to k1ll mys3lf', 'leetspeak'],
  ['I want to k​ill myself', 'zero-width character'],
  ['I AM GOING TO END IT ALL', 'capitals'],
]) {
  test(`S2 routes urgent despite ${failure}: ${input}`, () => assert.equal(assessRisk(input).level, 'urgent'));
}

for (const input of [
  'this exam is killing me', 'I would like to live in London', 'I love my life', 'I cut my hair myself',
  'my phone died', 'I wanna sleep all weekend', 'I dont want to go to work', 'Im not suicidal, just tired',
  'how do I kill a frozen process',
]) {
  test(`S2 does not escalate ordinary text: ${input}`, () => assert.equal(assessRisk(input).level, 'none'));
}

test('normalisation keeps phone numbers and ordinary words intact', () => {
  assert.equal(normaliseRiskText('Call 116 123'), 'call 116 123');
  assert.equal(normaliseRiskText('I like it'), 'i like it'); // no short-word substitution to "live"
});

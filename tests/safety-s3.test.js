import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRisk, CrisisFilter, EMERGENCY_SUPPORT, URGENT_SUPPORT, CHECK_IN, DETECTOR_VERSION } from '../src/services/safetyS3.js';

// Development cases for S3. Deliberately different wording from data/safety_v4, which is
// the frozen held-out set and is scored only by the research evaluator.
const tier = (t, h = []) => assessRisk(t, h).tier;

test('S3 is the active version', () => assert.equal(DETECTOR_VERSION, 'S3'));

for (const t of ['i downed a whole packet of ibuprofen', 'swallowed 20 of my sleeping tablets',
  'she has taken an overdose and is not waking up', 'standing on the roof, going to jump',
  'got the blade ready tonight', 'i took all my pills to end it']) {
  test(`emergency: ${t}`, () => { assert.equal(tier(t), 'emergency'); assert.equal(CrisisFilter(t), EMERGENCY_SUPPORT); });
}

for (const t of ['been thinking about killin myself', 'i reallyyy want to die', 'dont want to be here anymore',
  'SUICIDAL AGAIN. CANT DO IT', 'nobody would miss me if i was gone, im ending it tonight', 'i actually want to die',
  'i keep thinking about ending it all', 'i am feeling suicidal tonight', 'i would be better off dead',
  "i'm not suicidal but i do want to die", 'my dad keeps saying he wants to end his life', 'je vais me tuer']) {
  test(`urgent: ${t}`, () => { assert.equal(tier(t), 'urgent'); assert.equal(CrisisFilter(t), URGENT_SUPPORT); });
}

for (const t of ['this meeting is killing me', 'i will never hurt myself, i promise', 'i am not going to kill myself',
  "i don't want to die, i'm just scared", 'my aunt died in the spring', 'the essay is about suicide in literature',
  'i want to end my contract early', 'we are ending things with that supplier', 'i took my vitamins this morning',
  'i dead ass love this song', 'killing time before the train', 'going to end it with him tonight, he cheated']) {
  test(`none: ${t}`, () => { assert.equal(tier(t), 'none'); assert.equal(CrisisFilter(t), null); });
}

for (const t of ["i can't take this anymore", "i'm done with it all", 'kms lol']) {
  test(`check-in: ${t}`, () => assert.equal(CrisisFilter(t), CHECK_IN));
}

test('multi-turn: yes after a check-in about risk is urgent', () => assert.equal(tier('yeah', [{ role: 'user', content: 'i might hurt myself' }]), 'urgent'));
test('multi-turn: yes after an ordinary message stays none', () => assert.equal(tier('yes', [{ role: 'user', content: 'can we talk about my exam' }]), 'none'));
test('multi-turn: symptoms after an overdose escalate', () => assert.equal(tier('my head is spinning and i feel dizzy', [{ role: 'user', content: 'i swallowed a bottle of pills' }]), 'emergency'));
test('multi-turn: means after a risk statement escalate', () => assert.equal(tier("i've got the tablets", [{ role: 'user', content: 'i want to kill myself' }]), 'emergency'));
test('multi-turn: a retraction after risk stays urgent', () => assert.equal(tier('just kidding', [{ role: 'user', content: 'i want to die' }]), 'urgent'));
test('multi-turn: assistant text never labels the user', () => assert.equal(tier('yes', [{ role: 'assistant', content: 'do you want to kill yourself?' }]), 'none'));
test('emergency message names real emergency numbers and no hotline', () => {
  assert.match(EMERGENCY_SUPPORT, /999/); assert.match(EMERGENCY_SUPPORT, /112/); assert.match(EMERGENCY_SUPPORT, /911/);
  assert.doesNotMatch(EMERGENCY_SUPPORT, /988|741741|lifeline/i);
});

// Added after the first v4 run (post hoc fixes; different wording from v4)
test('negator before "stop" is not a negation', () => assert.equal(tier("i can't stop thinking about killing myself"), 'urgent'));
test('dropped-subject overdose is an emergency', () => assert.equal(tier('overdosed on paracetamol earlier'), 'emergency'));
test('a past overdose is not an emergency', () => assert.notEqual(tier('i overdosed years ago and got help'), 'emergency'));
test('a denied overdose is not an emergency', () => assert.equal(tier('i have never overdosed'), 'none'));
test('symptom after taking pills escalates', () => assert.equal(tier('my vision is blurry', [{ role: 'user', content: 'i took my tablets' }]), 'emergency'));
test('symptom after prescribed pills does not', () => assert.equal(tier('i feel drowsy', [{ role: 'user', content: 'took my medication this morning as the doctor said' }]), 'none'));

// Added after the EmpatheticDialogues over-routing scan (paraphrased, not dataset text)
for (const t of ['i took my daughter to the park and bought a bunch of snacks', 'we took a lot of trips when i was small',
  'my mates dared me to jump off the pier into the sea', 'she fell but did not hurt herself', 'i need to take my tablets now before bed',
  'it has taken me 12 years to pay this off']) {
  test(`ED-style ordinary text is not an emergency: ${t}`, () => assert.notEqual(tier(t), 'emergency'));
}
test('"without hurting myself" is not risk (ED dev held-out false alarm, fixed afterwards)', () => assert.equal(tier('glad i finished the race without hurting myself'), 'none'));

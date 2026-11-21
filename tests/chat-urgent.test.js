// A message that needs safety support must get it even while a reply is still being
// written. These are source checks on Chatbot.jsx (the component is not rendered in these
// tests) plus a check that think() answers a synthetic emergency without the model.
// They show the code path exists; they are not evidence that the crisis filter catches
// every real message.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.sessionStorage = globalThis.localStorage;

const chat = readFileSync(new URL('../src/components/Chatbot.jsx', import.meta.url), 'utf8');

test('the message box stays usable while a reply is being written', () => {
  const input = chat.match(/<input\s+id="relevia-message"[\s\S]*?\/>/)[0];
  assert.doesNotMatch(input, /disabled=/);
});

test('sending while busy is allowed only for messages that need safety support', () => {
  assert.match(chat, /if \(isTyping && !safetyReply\) return;/);
  assert.match(chat, /disabled=\{!inputMessage\.trim\(\) \|\| \(isTyping && !CrisisFilter\(/);
  // the unfinished reply is invalidated rather than left to finish over the support text
  assert.match(chat, /if \(isTyping\) \{\s*generationEpoch\.current\+\+;/);
});

test('think() returns fixed support for a synthetic emergency without loading a model', async () => {
  const { think } = await import('../src/services/releviaBrain.js');
  const { FIXED_SAFETY_REPLIES, EMERGENCY_SUPPORT } = await import('../src/services/safetyS3.js');
  const reply = await think('I took a whole packet of pills an hour ago', 'synthetic-session');
  assert.ok(FIXED_SAFETY_REPLIES.includes(reply), 'expected one of the fixed safety replies');
  assert.equal(reply, EMERGENCY_SUPPORT);
});

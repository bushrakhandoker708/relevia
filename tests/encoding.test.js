import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// memoryUtils.js was once saved through the wrong encoding, so the fallback greeting
// showed "Hey! ðŸ˜Š" instead of "Hey! 😊", and a tone regex matched "â€™" instead of "’".
// These are the byte patterns UTF-8 text takes when read as Windows-1252.
const MOJIBAKE = /ðŸ|â€|Ã[\u0080-¿]/;

function files(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(jsx?|css|html)$/.test(name) ? [p] : [];
  });
}

test('no source file contains double-encoded text', () => {
  const bad = [...files('src'), 'index.html'].filter(f => MOJIBAKE.test(readFileSync(f, 'utf8')));
  assert.deepEqual(bad, []);
});

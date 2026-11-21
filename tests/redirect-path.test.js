// The refresh loop on Vercel: public/404.html sent every unknown path to /relevia/?p=...,
// which was itself unknown there, so each refresh nested the address once more until
// Vercel refused it (URI_TOO_LONG). These tests cover the clean-up of such addresses and
// check that the deployment config and the 404 page cannot loop again.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { restoredPath } from '../src/services/redirectPath.js';

const nest = (path, times) => {
  let p = path;
  for (let i = 0; i < times; i++) p = '/?p=' + encodeURIComponent(p);
  return p; // '/?p=...' wrapped `times` times
};

test('a normal redirect restores the page', () => {
  assert.equal(restoredPath('?p=%2Fcoping%2Fbreathing', '/', ''), '/coping/breathing');
  assert.equal(restoredPath('?p=%2Fcoping', '/relevia/', '/relevia'), '/coping');
});

test('a deeply nested ?p= address unwraps to the page, not another redirect', () => {
  const search = nest('/coping/journaling', 12).slice(1); // drop the leading '/'
  assert.equal(restoredPath(search, '/relevia/', ''), '/coping/journaling');
});

test('the looping address from the bug report goes home', () => {
  // the real bookmarked form: every level is '/?p=' around an empty home path
  const search = nest('/', 15).slice(1);
  assert.equal(restoredPath(search, '/relevia/', ''), '/');
});

test('a stray /relevia prefix is removed where the site lives at /', () => {
  assert.equal(restoredPath('', '/relevia/', ''), '/');
  assert.equal(restoredPath('', '/relevia/coping', ''), '/coping');
  assert.equal(restoredPath('?p=%2Frelevia%2Fabout', '/', ''), '/about');
});

test('nothing to restore leaves the URL alone', () => {
  assert.equal(restoredPath('', '/coping', ''), null);
  assert.equal(restoredPath('', '/relevia/coping', '/relevia'), null);
});

test('values that are not same-site paths go home', () => {
  assert.equal(restoredPath('?p=https%3A%2F%2Fevil.example', '/', ''), '/');
  assert.equal(restoredPath('?p=%2F%2Fevil.example', '/', ''), '/');
  assert.equal(restoredPath('?p=%E0%A4%A', '/', ''), '/');
});

test('Vercel serves index.html for app paths, so refresh never reaches 404.html', () => {
  const cfg = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  // Vercel serves real files (assets, 404.html) before applying rewrites, so a catch-all
  // only affects paths with no file behind them: the app's own routes.
  assert.deepEqual(cfg.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
});

test('the 404 page never redirects an address that already carries ?p=', () => {
  const html = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8');
  assert.match(html, /if \(\/\[\?&\]p=\/\.test\(l\.search\)\)/);
  assert.match(html, /\\\.github\\\.io\$/);
});

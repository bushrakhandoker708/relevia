// Restores the page someone asked for after public/404.html sent them to /?p=<path>.
//
// An earlier 404 page always redirected to /relevia/?p=..., even on Vercel where the site
// lives at '/'. There /relevia/ was itself a 404, so every refresh wrapped the address in
// another ?p= (/relevia/?p=%2F%3Fp%3D%252F...). Links like that may still be bookmarked,
// so the value is unwrapped until it is a plain path, and anything that is not a same-site
// path is replaced with the home page.

/**
 * @param {string} search    location.search, e.g. '?p=%2Fcoping'
 * @param {string} pathname  location.pathname
 * @param {string} base      the app's base path without a trailing slash ('' or '/relevia')
 * @returns {string|null}    the path to show (without the base), or null to leave the URL alone
 */
export function restoredPath(search, pathname, base) {
  let p = new URLSearchParams(search).get('p');
  const strayBase = !base && /^\/relevia(\/|$)/.test(pathname);
  if (p === null) return strayBase ? pathname.slice('/relevia'.length) || '/' : null;

  for (let i = 0; i < 20; i++) {
    const inner = p.match(/^\/?\?p=(.*)$/s);
    if (!inner) break;
    try { p = decodeURIComponent(inner[1]); } catch { return '/'; }
  }
  if (!p.startsWith('/') || p.startsWith('//') || /[?&]p=/.test(p)) return '/';
  if (!base && /^\/relevia(\/|$)/.test(p)) p = p.slice('/relevia'.length) || '/';
  return p;
}

// Build-time assertions for everything a page can silently get wrong.
//
// All of this was checked by hand once. Hand checks do not survive the next
// edit, which is the whole problem: metadata rot is invisible from inside the
// browser, so nothing tells you a canonical went stale or a link started
// redirecting. This runs on every build and fails it instead.
//
// Run after `astro build` and the mirror generator (see package.json).

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const SITE = 'https://rmtdco.com';

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

const all = await walk(DIST);
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const assets = new Set(all.map((f) => relative(DIST, f).split(sep).join('/')));

/** Routes the site actually serves. */
const routes = new Set(['/']);
for (const f of htmlFiles) {
  const r = '/' + relative(DIST, f).split(sep).join('/');
  routes.add(r.endsWith('/index.html') ? r.slice(0, -10) : r);
}

const one = (html, re) => (html.match(re) || [])[1] ?? null;

for (const file of htmlFiles) {
  const where = '/' + relative(DIST, file).split(sep).join('/');
  const html = await readFile(file, 'utf8');
  const is404 = where.includes('404');

  // ---- Metadata -----------------------------------------------------------
  const title = one(html, /<title>([\s\S]*?)<\/title>/i);
  const desc = one(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = one(html, /<link rel="canonical" href="([^"]*)"/i);

  if (!title || !title.trim()) fail(where, 'missing <title>');
  if (!desc || !desc.trim()) fail(where, 'missing meta description');
  if (desc && desc.length > 320) fail(where, `meta description is ${desc.length} chars`);
  if (!canonical) fail(where, 'missing canonical');
  else if (!canonical.startsWith(SITE + '/')) fail(where, `canonical is not on ${SITE}: ${canonical}`);

  if (/localhost|127\.0\.0\.1/.test(html)) fail(where, 'contains a localhost URL');

  const noindex = /<meta name="robots"[^>]*noindex/i.test(html);
  if (noindex && !is404) fail(where, 'has an unexpected noindex');
  if (!noindex && is404) fail(where, '404 is missing noindex');

  // Exactly one h1: the single strongest text signal on a page, and easy to
  // lose or duplicate when markup moves around.
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) fail(where, `has ${h1s} <h1> elements, expected 1`);

  // ---- Structured data ----------------------------------------------------
  const ld = one(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!ld) fail(where, 'missing JSON-LD');
  else {
    let graph;
    try {
      graph = JSON.parse(ld);
    } catch (e) {
      fail(where, `JSON-LD is not valid JSON: ${e.message}`);
    }
    if (graph) {
      const nodes = graph['@graph'] || [graph];
      const ids = new Set(nodes.map((n) => n['@id']).filter(Boolean));
      const refs = [];
      const collect = (v) => {
        if (Array.isArray(v)) v.forEach(collect);
        else if (v && typeof v === 'object') {
          if (Object.keys(v).length === 1 && v['@id']) refs.push(v['@id']);
          else Object.values(v).forEach(collect);
        }
      };
      collect(nodes);
      for (const r of refs) {
        if (!ids.has(r)) fail(where, `JSON-LD @id reference points at nothing: ${r}`);
      }
    }
  }

  // ---- Internal links -----------------------------------------------------
  // A link to /work/x when the route is /work/x/ still works, but every click
  // costs a 301 and the redirect target is what gets the link equity.
  for (const href of new Set([...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]))) {
    const path = href.split('#')[0].split('?')[0];
    if (!path) continue;
    if (routes.has(path) || assets.has(path.slice(1))) continue;
    if (routes.has(path + '/')) fail(where, `link to ${href} redirects; use ${path}/`);
    else fail(where, `broken internal link: ${href}`);
  }

  // ---- Markdown mirror ----------------------------------------------------
  const alt = one(html, /<link rel="alternate" type="text\/markdown" href="([^"]*)"/i);
  if (alt) {
    const rel = alt.replace(SITE + '/', '');
    if (!assets.has(rel)) fail(where, `rel=alternate points at a missing file: ${alt}`);
  } else if (/^\/(work|technical)\/.+/.test(where)) {
    fail(where, 'content page has no markdown mirror advertised');
  }
}

// ---- Sitemap --------------------------------------------------------------
const sitemapPath = join(DIST, 'sitemap-0.xml');
try {
  await stat(sitemapPath);
  const xml = await readFile(sitemapPath, 'utf8');
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)];
  if (!entries.length) fail('sitemap', 'contains no URLs');
  for (const [, loc] of entries) {
    if (!loc.startsWith(SITE + '/')) fail('sitemap', `URL is not on ${SITE}: ${loc}`);
    if (loc.includes('404')) fail('sitemap', 'includes the 404 page');
    if (loc.endsWith('.md')) fail('sitemap', `markdown mirrors should not be listed: ${loc}`);
  }
  // Every page sharing one timestamp is the "lastmod: new Date()" bug coming back.
  const stamps = new Set(entries.map((e) => e[2]).filter(Boolean));
  if (entries.length > 1 && stamps.size === 1) {
    fail('sitemap', 'every URL has the same lastmod; per-page dates are not being applied');
  }
} catch {
  fail('sitemap', 'sitemap-0.xml was not generated');
}

// ---- Report ---------------------------------------------------------------
if (problems.length) {
  console.error(`\n  ${problems.length} problem(s) found:\n`);
  for (const p of problems) console.error(`  x ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`  checked ${htmlFiles.length} pages: metadata, JSON-LD, links, mirrors, sitemap all OK`);

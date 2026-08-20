// When each route's content actually last changed, from git.
//
// The sitemap previously passed `lastmod: new Date()`, so all eight URLs
// claimed to change on every deploy. A crawler that checks twice and finds the
// dates moved but the bytes identical learns to stop trusting the field, which
// is worse than sending no date at all. These come from commit history instead,
// so a page only claims to have changed when it has.
//
// A route's date is the newest commit across its own source file and every
// local module it imports, transitively. `src/layouts/` and `src/styles/` are
// excluded on purpose: a change to the shared shell or the stylesheet does not
// mean the page's content changed, and including them would bump all nine
// routes on every layout edit, recreating the problem this fixes.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';

const PAGES = 'src/pages';
const EXCLUDE = ['src/layouts', 'src/styles'];

/** Every .astro page file. */
function pageFiles(dir = PAGES, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) pageFiles(p, out);
    else if (e.name.endsWith('.astro')) out.push(p);
  }
  return out;
}

/** Route for a page file, matching Astro's directory build format. */
function routeFor(file) {
  let r = relative(PAGES, file).split(sep).join('/').replace(/\.astro$/, '');
  if (r.endsWith('/index')) r = r.slice(0, -6);
  if (r === 'index') r = '';
  return '/' + (r ? r + '/' : '');
}

/** Local modules a file imports, resolved to real paths. */
function importsOf(file) {
  const src = readFileSync(file, 'utf8');
  const found = [];
  const re = /from\s+['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const base = resolve(dirname(file), m[1]);
    for (const cand of [base, base + '.ts', base + '.mjs', base + '.astro', join(base, 'index.astro')]) {
      if (existsSync(cand) && !cand.endsWith(sep)) {
        found.push(relative(process.cwd(), cand).split(sep).join('/'));
        break;
      }
    }
  }
  return found;
}

/** The page plus everything it pulls in, minus the shared shell. */
function depsOf(file, seen = new Set()) {
  const key = relative(process.cwd(), file).split(sep).join('/');
  if (seen.has(key) || EXCLUDE.some((x) => key.startsWith(x))) return seen;
  seen.add(key);
  for (const dep of importsOf(file)) depsOf(dep, seen);
  return seen;
}

const lastCommit = (file) => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null; // not a repo, or the file is untracked: fall back below
  }
};

/** @type {Record<string, string>} route -> ISO 8601 date */
export const pageDates = {};

for (const file of pageFiles()) {
  const dates = [...depsOf(file)].map(lastCommit).filter(Boolean).sort();
  // Untracked new files have no commit yet; today is the honest answer for them.
  const newest = dates.length ? dates[dates.length - 1] : new Date().toISOString();
  pageDates[routeFor(file)] = newest;
}

const seg = (p) => p.split('/').filter(Boolean);

/**
 * Lookup used by both the sitemap and the page schema.
 *
 * Falls back to pattern matching for dynamic routes: the map is keyed by source
 * file, so `/technical/[slug]/` is what exists, while the built pages ask about
 * `/technical/finedu/`. All three coursework pages share one source file, so
 * they correctly share its date.
 */
export const dateFor = (pathname) => {
  if (pageDates[pathname]) return pageDates[pathname];
  const want = seg(pathname);
  for (const [route, date] of Object.entries(pageDates)) {
    if (!route.includes('[')) continue;
    const pat = seg(route);
    if (pat.length !== want.length) continue;
    if (pat.every((s, i) => s.startsWith('[') || s === want[i])) return date;
  }
  return null;
};

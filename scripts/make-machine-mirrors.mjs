// Machine-readable mirrors of every content page.
//
// Why generate rather than author: the case-study copy lives inline in the
// .astro templates as markup, not as data. A hand-written mirror would drift
// from the page within one edit, and extracting every case into a data file
// would be a rewrite of the whole site to serve a plumbing goal. So the built
// HTML stays the single source of truth and these are derived from it, which
// makes drift structurally impossible rather than merely unlikely.
//
// Output: dist/work/*.md, dist/technical/*.md, dist/llms-full.txt
// Run after `astro build` (wired into the build script in package.json).

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const SITE = 'https://rmtdco.com';

// Pages worth mirroring: the homepage, the three case studies and the four
// technical projects. Only the 404 is left out, having nothing to say.
//
// The homepage earns a mirror for one reason: the timeline. Twenty-two entries
// of work history live there and nowhere else, and only as a visually hidden
// list, so it was the most resume-shaped content on the site in the least
// retrievable form.
const INCLUDE = /^(work|technical)\/|^$/;

/** Every index.html under dist, as a route path. */
async function pages(dir = DIST, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await pages(p, out);
    else if (entry.name === 'index.html') out.push(p);
  }
  return out;
}

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&uarr;/g, '\u2191')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

// Inline tags are removed outright; block tags become a space. The design sets
// single letters in accent spans mid-word (the nameplate's D in DOERFFLER),
// so treating every tag as a word boundary produced "Michael D OERFFLER".
const INLINE = /<\/?(span|a|strong|em|b|i|u|small|code|sup|sub|abbr|mark)\b[^>]*>/gi;

const text = (html) =>
  decode(html.replace(INLINE, '').replace(/<[^>]+>/g, ' '))
    // The templates wrap copy across source lines, so this has to fold every
    // kind of whitespace, not just spaces, or paragraphs keep their newlines.
    .replace(/\s+/g, ' ')
    // Inline spans leave a gap before the punctuation that followed them.
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();

/**
 * Walk the article's block elements in document order and emit markdown.
 * Deliberately narrow: headings, paragraphs, list items, blockquotes and
 * figure captions. Anything else on these pages is decoration.
 */
function toMarkdown(article) {
  const out = [];
  const seen = new Set();
  const BLOCK = /<(h[1-6]|p|li|blockquote|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = BLOCK.exec(article))) {
    const tag = m[1].toLowerCase();
    // Nested blocks (a <p> inside a <blockquote>) would otherwise print twice.
    if (/<(p|li|h[1-6])\b/i.test(m[2])) continue;
    const body = text(m[2]);
    if (!body) continue;
    const key = tag + '|' + body;
    if (seen.has(key)) continue;
    seen.add(key);
    if (tag[0] === 'h') out.push('#'.repeat(Math.min(6, +tag[1] + 1)) + ' ' + body);
    else if (tag === 'li') out.push('- ' + body);
    else if (tag === 'blockquote') out.push('> ' + body);
    else if (tag === 'figcaption') out.push('*' + body + '*');
    else out.push(body);
  }
  // Blank line between blocks, except between consecutive list items, which
  // read as one list rather than a run of separate ones.
  return out.reduce((acc, line, i) => {
    if (i === 0) return line;
    const tight = line.startsWith('- ') && out[i - 1].startsWith('- ');
    return acc + (tight ? '\n' : '\n\n') + line;
  }, '');
}

const files = (await pages()).sort();
const mirrors = [];

for (const file of files) {
  const route = relative(DIST, file).split(sep).join('/').replace(/index\.html$/, '');
  if (!INCLUDE.test(route)) continue;

  const raw = await readFile(file, 'utf8');
  // Scripts and styles carry no prose, and the timeline's SVG is a picture of
  // data rather than the data. Drop them before anything else looks at the page.
  const html = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Case and technical pages wrap their body in <article>. The homepage does
  // not, so it falls back to the whole document: the block extractor only ever
  // takes headings, paragraphs and list items, so the nav, the nameplate and
  // the skill stream (all divs, spans and anchors) never make it through.
  const article =
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  if (!article) {
    console.warn(`  ! no extractable body in /${route}, skipped`);
    continue;
  }
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, route])[1]).trim();
  const description = decode(
    (html.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1]
  ).trim();
  const url = `${SITE}/${route}`;

  // The header exists so anything quoting this file can attribute it to the
  // real page rather than to a stray text document.
  const body =
    `# ${title}\n\n` +
    `Canonical: ${url}\n` +
    `Author: Michael Doerffler\n\n` +
    (description ? `> ${description}\n\n` : '') +
    `---\n\n` +
    toMarkdown(article[1]) +
    '\n';

  // The root route has no name of its own, so its mirror is index.md.
  const mirrorRel = (route === '' ? 'index' : route.replace(/\/$/, '')) + '.md';
  const outPath = join(DIST, mirrorRel);
  await writeFile(outPath, body, 'utf8');
  mirrors.push({ route, url, title, body });
  console.log(`  + /${mirrorRel}`);
}

// One file carrying every case in full, for retrieval systems that would
// rather make a single request than seven.
const full =
  `# Michael Doerffler: full case studies and technical projects\n\n` +
  `Canonical: ${SITE}/\n` +
  `Generated from the published pages. See ${SITE}/llms.txt for the summary index.\n\n` +
  mirrors.map((m) => m.body.trim()).join('\n\n---\n\n') +
  '\n';
await writeFile(join(DIST, 'llms-full.txt'), full, 'utf8');
console.log(`  + /llms-full.txt (${mirrors.length} pages, ${Math.round(full.length / 1024)}KB)`);

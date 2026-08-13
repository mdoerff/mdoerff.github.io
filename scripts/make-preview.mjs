// Builds dist-preview/ — a disposable copy of dist/ safe to drop on Netlify.
//
// Three things must differ from the real deploy:
//   1. no CNAME, or Netlify tries to claim rmtdco.com
//   2. noindex on every page, so the preview never competes with the real site
//   3. robots.txt disallows everything, sitemaps removed (they point at rmtdco.com)
//
// The canonical tags are deliberately LEFT pointing at rmtdco.com — combined
// with noindex that is belt and braces against duplicate-content indexing.
//
// og:image is absolute and points at rmtdco.com, where the images do not exist
// yet — so on the preview the share card would come up blank. Rewrite just that
// tag to the preview host. canonical and og:url stay on rmtdco.com, which is
// correct next to noindex.
//
// Usage: node scripts/make-preview.mjs [origin]
//        default origin: https://mdportfo.netlify.app

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'dist-preview');

if (!fs.existsSync(SRC)) {
  console.error('No dist/ found. Run `npm run build` first.');
  process.exit(1);
}

// OneDrive can hold locks on a folder it is syncing, so retry rather than
// failing outright the way a plain rmSync would.
function clear(dir) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      return true;
    } catch (e) {
      if (attempt === 5) {
        console.warn('Could not fully clear dist-preview (' + e.code + '); overwriting in place.');
        return false;
      }
    }
  }
}

clear(OUT);
fs.cpSync(SRC, OUT, { recursive: true });

// 1. CNAME must not travel with the preview
const cname = path.join(OUT, 'CNAME');
if (fs.existsSync(cname)) fs.rmSync(cname);

// 2. noindex on every page, and point og:image at the preview host
const PREVIEW_ORIGIN = (process.argv[2] || 'https://mdportfo.netlify.app').replace(/\/$/, '');
const NOINDEX = '<meta name="robots" content="noindex, nofollow" />';
let pages = 0;
let imagesRepointed = 0;
function processPages(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) processPages(p);
    else if (entry.name.endsWith('.html')) {
      let html = fs.readFileSync(p, 'utf8');
      if (!html.includes('name="robots"')) {
        html = html.replace(/<head>/i, '<head>' + NOINDEX);
      }
      html = html.replace(
        /(<meta property="og:image" content=")https:\/\/rmtdco\.com/g,
        (_m, head) => { imagesRepointed++; return head + PREVIEW_ORIGIN; }
      );
      fs.writeFileSync(p, html);
      pages++;
    }
  }
}
processPages(OUT);

// 3. robots.txt locked down, sitemaps dropped
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
let maps = 0;
for (const f of fs.readdirSync(OUT)) {
  if (/^sitemap.*\.xml$/.test(f)) {
    fs.rmSync(path.join(OUT, f));
    maps++;
  }
}

console.log('dist-preview ready');
console.log('  pages with noindex : ' + pages);
console.log('  og:image host      : ' + PREVIEW_ORIGIN + ' (' + imagesRepointed + ' rewritten)');
console.log('  CNAME removed      : ' + !fs.existsSync(cname));
console.log('  sitemaps removed   : ' + maps);
console.log('  robots.txt         : Disallow: /');
console.log('  path               : ' + OUT);

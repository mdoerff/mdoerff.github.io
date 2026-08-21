import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { dateFor } from './src/data/page-dates.mjs';

export default defineConfig({
  site: 'https://rmtdco.com',
  output: 'static',
  // ClientRouter fetches each page over the network before it can swap it in,
  // and it does that without the browser's own loading indicator — so on a
  // phone a tap looks like nothing happened until the response lands. Astro's
  // default prefetch strategy is 'hover', which no touch device ever fires,
  // meaning mobile got no prefetch at all. 'viewport' warms each link as it
  // scrolls into view, so by the time a thumb reaches it the page is already
  // in cache. The whole site is eight pages of 20-50KB, so this is cheap.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  // The 404 page is excluded: it exists to be served on a miss, not to be
  // offered to search engines as a destination.
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      // Per-page lastmod from git history. This used to be `new Date()`, which
      // told crawlers every URL changed on every deploy; a field that is always
      // "just now" carries no information and trains them to ignore it.
      serialize(item) {
        const d = dateFor(new URL(item.url).pathname);
        if (d) item.lastmod = d;
        return item;
      },
    }),
  ],
});

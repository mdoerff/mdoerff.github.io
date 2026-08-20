import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { dateFor } from './src/data/page-dates.mjs';

export default defineConfig({
  site: 'https://rmtdco.com',
  output: 'static',
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

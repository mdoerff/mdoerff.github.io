import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rmtdco.com',
  output: 'static',
  // The 404 page is excluded: it exists to be served on a miss, not to be
  // offered to search engines as a destination.
  // lastmod gives crawlers a reason to come back after a change.
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      lastmod: new Date(),
    }),
  ],
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeDatabaseAssets } from './src/lib/rehype-database-assets.mjs';

export default defineConfig({
  site: 'https://maxkim-j.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeDatabaseAssets],
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeDatabaseAssets } from './src/lib/rehype-database-assets.mjs';
import { rehypeFootnotes } from './src/lib/rehype-footnotes.mjs';

export default defineConfig({
  site: 'https://maxkim-j.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeDatabaseAssets, rehypeFootnotes],
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});

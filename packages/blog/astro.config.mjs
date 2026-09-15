// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeDatabaseAssets } from './src/lib/rehype-database-assets.mjs';
import { rehypeFootnotes } from './src/lib/rehype-footnotes.mjs';

export default defineConfig({
  site: 'https://maxkim-j.github.io',
  trailingSlash: 'ignore',
  // /posts/ 는 구 블로그 주소의 리다이렉트라 noindex 다. 사이트맵에서도 제외한다.
  integrations: [sitemap({ filter: (page) => !/\/posts\//.test(page) })],
  markdown: {
    rehypePlugins: [rehypeDatabaseAssets, rehypeFootnotes],
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});

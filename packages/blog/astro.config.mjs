// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { remarkDatabaseAssets } from './src/lib/remark-database-assets.mjs';
import { rehypeDatabaseAssets } from './src/lib/rehype-database-assets.mjs';
import { rehypeFootnotes } from './src/lib/rehype-footnotes.mjs';

export default defineConfig({
  // 배포 도메인. 정규 주소와 사이트맵, RSS, 공유 카드 이미지 주소가 모두 여기서 나온다.
  site: process.env.SITE_URL ?? 'https://jonghyuk.kim',
  trailingSlash: 'ignore',
  // /posts/ 는 구 블로그 주소의 리다이렉트라 noindex 다. 사이트맵에서도 제외한다.
  integrations: [sitemap({ filter: (page) => !/\/posts\//.test(page) })],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDatabaseAssets],
      rehypePlugins: [rehypeDatabaseAssets, rehypeFootnotes],
    }),
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});

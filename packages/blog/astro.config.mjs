// @ts-check
import { defineConfig } from 'astro/config';
import { readFile, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { remarkDatabaseAssets } from './src/lib/remark-database-assets.mjs';
import { rehypeDatabaseAssets } from './src/lib/rehype-database-assets.mjs';
import { rehypeFootnotes } from './src/lib/rehype-footnotes.mjs';
import { rehypeTableScroll } from './src/lib/rehype-table-scroll.mjs';

export default defineConfig({
  // 배포 도메인. 정규 주소와 사이트맵, RSS, 공유 카드 이미지 주소가 모두 여기서 나온다.
  site: process.env.SITE_URL ?? 'https://jonghyuk.kim',
  trailingSlash: 'ignore',
  // /posts/ 는 구 블로그 주소의 리다이렉트이므로 사이트맵에서 제외한다.
  integrations: [
    sitemap({ filter: (page) => !/\/posts\//.test(page) }),
    {
      name: 'legacy-redirects',
      hooks: {
        'astro:build:done': async ({ dir, pages, logger }) => {
          const redirectsFile = new URL('_redirects', dir);
          const existing = await readFile(redirectsFile, 'utf8');
          const redirects = (
            await Promise.all(
              pages.map(async ({ pathname }) => {
                const source = `/${pathname.replace(/^\/+|\/+$/g, '')}`;
                if (!/^\/(?:en\/)?(?:posts|knowledges)\/[^/]+$/.test(source)) return [];

                let from = source;
                let to = `${source}/`;
                if (source.includes('/posts/')) {
                  const html = await readFile(new URL(`${source.slice(1)}/index.html`, dir), 'utf8');
                  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
                  if (!canonical) throw new Error(`이전 주소의 정규 URL을 찾을 수 없습니다: ${source}`);
                  to = `${new URL(canonical[1]).pathname.replace(/\/+$/, '')}/`;
                } else {
                  from = source.replace('/knowledges/', '/articles/');
                }
                return [`${from} ${to} 301`, `${from}/ ${to} 301`];
              }),
            )
          ).flat();
          await writeFile(redirectsFile, `${existing.trimEnd()}\n${redirects.join('\n')}\n`);
          logger.info(`이전 주소의 HTTP 301 리다이렉트 ${redirects.length}개 생성`);
        },
      },
    },
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDatabaseAssets],
      rehypePlugins: [rehypeDatabaseAssets, rehypeTableScroll, rehypeFootnotes],
    }),
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});

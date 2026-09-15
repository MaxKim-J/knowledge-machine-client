import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';

// 구 블로그 구독자가 /rss.xml 을 사용하고 있어 같은 경로를 유지한다.
export async function GET(context: APIContext) {
  const posts = await getPosts('ko');
  return rss({
    title: 'knowledge machine',
    description: '읽고 본 것을 잃어버리지 않기 위한 파이프라인. 김종혁의 글 모음.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: post.date,
      link: post.href,
      categories: [post.category, ...post.tags],
    })),
    customData: '<language>ko</language>',
  });
}

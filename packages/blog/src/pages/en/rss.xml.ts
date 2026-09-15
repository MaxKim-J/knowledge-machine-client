import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts('en');
  return rss({
    title: 'knowledge machine',
    description: 'A pipeline for not losing what I read and watch. Writing by Jonghyuk Max Kim.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: post.date,
      link: post.href,
      categories: [post.category, ...post.tags],
    })),
    customData: '<language>en</language>',
  });
}

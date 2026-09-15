import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** 원문의 복사본을 두지 않으므로 database 를 고치면 다음 빌드에 반영된다. */
const DATABASE = '../../database';

const entrySchema = z.object({
  type: z.enum(['article', 'knowledge']),
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(),
  slug: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  lang: z.enum(['ko', 'en']),
  published: z.boolean(),
  /** 공유 카드 이미지. 지정하지 않으면 본문 첫 이미지를, 그것도 없으면 기본 이미지를 사용한다. */
  thumbnail: z.string().optional(),
});

const collection = (kind: 'articles' | 'knowledges', file: string) =>
  defineCollection({
    loader: glob({ base: `${DATABASE}/${kind}`, pattern: `*/${file}` }),
    schema: entrySchema,
  });

export const collections = {
  articles: collection('articles', 'article.md'),
  articlesEn: collection('articles', 'article.en.md'),
  knowledges: collection('knowledges', 'knowledge.md'),
  knowledgesEn: collection('knowledges', 'knowledge.en.md'),
};

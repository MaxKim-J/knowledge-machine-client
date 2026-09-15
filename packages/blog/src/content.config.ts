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

/**
 * 언어를 컬렉션으로 가르지 않고 한 컬렉션에 모은 뒤 frontmatter 의 `lang` 으로 구분한다.
 * 영문본이 없는 종류가 생기면 빈 컬렉션이 되어 Astro 가 경고를 남긴다.
 */
const collection = (kind: 'articles' | 'knowledges', file: string) =>
  defineCollection({
    loader: glob({
      base: `${DATABASE}/${kind}`,
      pattern: `*/${file}*.md`,
      // 기본 id 는 slug 에서 나오는데 한국어 원문과 영문본이 같은 slug 를 사용한다.
      // 파일 경로로 만들어 한 컬렉션 안에서 겹치지 않게 한다.
      generateId: ({ entry }) => entry.replace(/\.md$/, ''),
    }),
    schema: entrySchema,
  });

export const collections = {
  articles: collection('articles', 'article'),
  knowledges: collection('knowledges', 'knowledge'),
};

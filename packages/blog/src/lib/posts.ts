import { getCollection, type CollectionEntry } from 'astro:content';
import { type Lang, formatDate, withLang } from './i18n';

export type Kind = 'article' | 'knowledge';

export type Post = {
  id: string;
  kind: Kind;
  lang: Lang;
  slug: string;
  title: string;
  summary: string;
  date: Date;
  category: string;
  tags: string[];
  href: string;
  meta: string;
  entry: CollectionEntry<'articles'>;
};

const COLLECTIONS = {
  article: { ko: 'articles', en: 'articlesEn' },
  knowledge: { ko: 'knowledges', en: 'knowledgesEn' },
} as const;

export function postHref(kind: Kind, slug: string, lang: Lang): string {
  return withLang(`/${kind === 'article' ? 'articles' : 'knowledges'}/${slug}`, lang);
}

function toPost(entry: CollectionEntry<'articles'>, kind: Kind, lang: Lang): Post {
  const { data } = entry;
  return {
    id: `${kind}:${data.slug}`,
    kind,
    lang,
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    date: data.date,
    category: data.category,
    tags: data.tags,
    href: postHref(kind, data.slug, lang),
    meta: formatDate(data.date, lang),
    entry,
  };
}

const byDateDesc = (a: Post, b: Post) => b.date.getTime() - a.date.getTime();

/** 해당 언어의 글 중 frontmatter `published` 가 true 인 것만 돌려준다. */
export async function getPosts(lang: Lang, kind?: Kind): Promise<Post[]> {
  const kinds: Kind[] = kind ? [kind] : ['article', 'knowledge'];
  const groups = await Promise.all(
    kinds.map(async (k) => {
      const name = COLLECTIONS[k][lang];
      const entries = (await getCollection(name as 'articles')) ?? [];
      return entries.filter((entry) => entry.data.published).map((entry) => toPost(entry, k, lang));
    }),
  );
  return groups.flat().sort(byDateDesc);
}

export async function findPost(kind: Kind, slug: string, lang: Lang): Promise<Post | undefined> {
  const posts = await getPosts(lang, kind);
  return posts.find((post) => post.slug === slug);
}

export function relatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const score = (post: Post) =>
    (post.category === current.category ? 2 : 0) +
    (post.kind === current.kind ? 1 : 0) +
    post.tags.filter((tag) => current.tags.includes(tag)).length * 2;

  return all
    .filter((post) => post.id !== current.id)
    .map((post) => ({ post, score: score(post) }))
    .sort((a, b) => b.score - a.score || byDateDesc(a.post, b.post))
    .slice(0, limit)
    .map(({ post }) => post);
}

/** article 만 journal 을 추가로 사용한다. */
export const ALL_CATEGORIES = ['tech', 'human', 'culture', 'business', 'investment'];

export function categoriesFor(kind: Kind): string[] {
  return kind === 'article' ? [...ALL_CATEGORIES, 'journal'] : ALL_CATEGORIES;
}

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

/** 한국어 조사와 영어 기능어처럼 어느 글에나 나오는 접미사. */
const PARTICLE = /(은|는|이|가|을|를|의|에|에서|으로|로|와|과|도|만|부터|까지|께|한테)$/;
const STOPWORD = new Set(['the', 'and', 'for', 'that', 'with', 'from', 'this', 'what', 'how', 'why']);

function tokenize(post: Post): Set<string> {
  const words = `${post.title} ${post.summary}`.toLowerCase().split(/[^a-z0-9가-힣]+/);
  const out = new Set<string>();
  for (const word of words) {
    const token = /[가-힣]/.test(word) ? word.replace(PARTICLE, '') : word;
    if (token.length >= 2 && !STOPWORD.has(token)) out.add(token);
  }
  return out;
}

type Index = { tokens: Map<string, Set<string>>; common: Set<string> };
const indexes = new WeakMap<Post[], Index>();

/**
 * 제목·요약 단어 겹침을 사용하려면 어느 글에나 나오는 단어를 먼저 제외해야 한다.
 * 네 편 중 한 편보다 흔한 단어는 변별력이 없으므로 점수에서 뺀다.
 */
function indexOf(all: Post[]): Index {
  const cached = indexes.get(all);
  if (cached) return cached;

  const tokens = new Map<string, Set<string>>();
  const frequency = new Map<string, number>();
  for (const post of all) {
    const set = tokenize(post);
    tokens.set(post.id, set);
    for (const token of set) frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  const ceiling = Math.max(2, all.length * 0.25);
  const common = new Set([...frequency].filter(([, n]) => n > ceiling).map(([token]) => token));

  const index = { tokens, common };
  indexes.set(all, index);
  return index;
}

/**
 * 관련도 점수. 같은 카테고리 2점, 같은 타입 1점, 겹치는 태그마다 2점에
 * 제목·요약의 겹치는 단어마다 0.4점을 최대 1.6점까지 더한다.
 *
 * 태그 어휘가 넓게 흩어져 있어 태그만으로는 같은 카테고리의 최신 글이 그대로 올라오므로
 * 단어 겹침으로 그 순서를 정한다. 단어 점수는 태그 하나(2점)를 넘지 못하게 상한을 정해,
 * 태그가 겹치는 글이 있으면 언제나 그 글이 먼저 온다.
 */
export function relatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const { tokens, common } = indexOf(all);
  const mine = tokens.get(current.id) ?? tokenize(current);

  const score = (post: Post) => {
    const theirs = tokens.get(post.id);
    let shared = 0;
    if (theirs) {
      for (const token of theirs) if (!common.has(token) && mine.has(token)) shared += 1;
    }
    return (
      (post.category === current.category ? 2 : 0) +
      (post.kind === current.kind ? 1 : 0) +
      post.tags.filter((tag) => current.tags.includes(tag)).length * 2 +
      Math.min(shared * 0.4, 1.6)
    );
  };

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

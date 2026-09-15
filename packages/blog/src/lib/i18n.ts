export type Lang = 'ko' | 'en';

export const LANGS: Lang[] = ['ko', 'en'];

export const T = {
  ko: {
    search: 'search',
    writtenBy: 'Written by 김종혁',
    email: '이메일 보내기',
    copy: '링크 복사하기',
    copied: '링크 복사됨',
    shareX: 'X에 공유하기',
    related: 'Related',
    back: '← 글 목록으로 돌아가기',
    prev: '이전글',
    next: '다음글',
    random: '랜덤',
    clear: 'clear',
    /** `{q}` 를 검색어로 치환해 사용한다. */
    noResults: 'no results for “{q}”',
  },
  en: {
    search: 'search',
    writtenBy: 'Written by Jonghyuk Max Kim',
    email: 'Send email',
    copy: 'Copy link',
    copied: 'Link copied',
    shareX: 'Share on X',
    related: 'Related',
    back: '← Back to all posts',
    prev: 'Previous',
    next: 'Next',
    random: 'Random',
    clear: 'clear',
    noResults: 'no results for “{q}”',
  },
} as const;

/** ko 는 "2025년 7월 29일", en 은 "07/29/2025" 형식. */
export function formatDate(date: Date, lang: Lang): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return lang === 'en'
    ? `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`
    : `${y}년 ${m}월 ${d}일`;
}

/** 언어별 경로 접두사. ko 는 루트, en 은 /en 아래. */
export function withLang(pathname: string, lang: Lang): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return lang === 'en' ? `/en${clean}` : clean;
}

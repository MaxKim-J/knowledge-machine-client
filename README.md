# knowledge-machine-client

[knowledge-machine-database](https://github.com/MaxKim-J/knowledge-machine-database)의 글을
정적 사이트로 만드는 블로그 클라이언트다. pnpm workspace 모노레포로 구성한다.

## 패키지

| 경로 | 이름 | 설명 |
|------|------|------|
| `packages/blog` | `blog` | Astro 정적 사이트 |
| `database` | 서브모듈 | 글 원문 저장소 |

## 실행

```bash
git submodule update --init --recursive
pnpm install
pnpm dev      # packages/blog 개발 서버
pnpm build    # 전체 패키지 빌드
```

`dev` 와 `build` 는 실행 전에 `packages/blog/scripts/sync-database.mjs` 를 수행한다.
이 스크립트는 서브모듈을 원격 최신 커밋으로 갱신하고 글에 딸린 이미지를
`packages/blog/public/images/{slug}/` 로 복사한다. 네트워크가 없으면 현재 체크아웃으로
빌드를 계속한다. 서브모듈 갱신을 건너뛰려면 `SKIP_DB_SYNC=1` 을 지정한다.

## 발행 대상

`published: true` 인 article 과 knowledge 만 페이지로 만든다. 한국어 원문은 루트 경로에,
영문 번역본은 `/en` 아래에 둔다.

| 경로 | 내용 |
|------|------|
| `/` · `/en` | article 목록 |
| `/knowledges` · `/en/knowledges` | knowledge 목록 |
| `/articles/{slug}` · `/knowledges/{slug}` | 글 상세 |
| `/about` · `/author` | 지식기계 소개, 저자 소개 |
| `/posts/{slug}` | 구 블로그 주소의 리다이렉트 |
| `/rss.xml` · `/en/rss.xml` | RSS 피드 |

## 디자인

화면은 Claude Design 프로젝트 `maxkim-j 블로그 리디자인` 의 `Knowledge Machine Blog.dc.html`
을 기준으로 구현한다. 색·간격·타이포그래피 토큰은 `packages/blog/src/styles/global.css` 에 있다.

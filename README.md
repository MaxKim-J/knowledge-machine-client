# knowledge-machine-client

[jonghyuk.kim](https://jonghyuk.kim)의 Astro 블로그다. 앱은 `packages/blog`,
글 원문은 [database 서브모듈](https://github.com/MaxKim-J/knowledge-machine-database)에 있다.

## 실행

```bash
git submodule update --init --recursive
pnpm install
pnpm dev      # 개발 서버
pnpm build    # 정적 사이트 빌드
pnpm verify   # 포맷·린트·타입 검사·테스트
```

실행·빌드 전에 원문 서브모듈을 최신화하고 이미지와 공유 카드를 준비한다.
현재 원문으로 빌드하려면 `SKIP_DB_SYNC=1 pnpm build`를 사용한다.

푸시 전에는 훅에서 `pnpm verify`를 실행한다.

## 발행

`published: true`인 Article과 Knowledge만 발행한다. 한국어는 루트 경로,
영어는 `/en` 아래에 생성한다. 영문 페이지에는 별도의 영문 원고가 필요하다.

`main`에 푸시하면 GitHub Actions가 빌드하고 Cloudflare Pages에 배포한다.

## 검색 및 방문 통계

- Search Console에는 `sitemap-index.xml`을 제출하고, 소유권 확인 파일
  `packages/blog/public/google8cec01efe6d209c6.html`을 유지한다.
- 빌드 시 발행된 페이지를 기준으로 이전 `/posts/` 주소와 Knowledge의 이전
  `/articles/` 주소를 현재 URL로 연결하는 HTTP 301 규칙을 생성한다.
- GA4 조회수는 코드에서 전송한다. 중복 집계를 막으려면 향상된 측정의
  '브라우저 방문 기록 이벤트를 토대로 한 페이지 변경사항'을 꺼 둔다.

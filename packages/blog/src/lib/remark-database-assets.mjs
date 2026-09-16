import { visit } from 'unist-util-visit';

const PREFIX = 'images/';

/**
 * 원문이 `images/...` 로 참조하는 이미지를 sync-database 가 옮겨 둔
 * public/images/{slug}/ 로 바꾼다.
 *
 * rehype 가 아니라 remark 에서 처리한다. 상대 경로가 남아 있으면 Astro 가 그 경로를
 * 마크다운 파일 기준으로 풀어 최적화본을 _astro/ 로 내보내는데, 최종 src 는 이 플러그인이
 * 정한 절대 경로라 그 사본은 아무도 참조하지 않는 채 산출물에만 쌓인다.
 */
export function remarkDatabaseAssets() {
  return (tree, file) => {
    const slug = file?.data?.astro?.frontmatter?.slug;
    if (!slug) return;

    const base = `/images/${slug}/`;
    const rewrite = (value) => base + value.slice(PREFIX.length);
    const rewritable = (value) => typeof value === 'string' && value.startsWith(PREFIX);

    visit(tree, (node) => {
      if (rewritable(node.url)) {
        node.url = rewrite(node.url);
        return;
      }
      // 손으로 적은 HTML 은 파싱되지 않고 문자열로 남는다.
      if ((node.type === 'html' || node.type === 'raw') && typeof node.value === 'string') {
        node.value = node.value.replace(
          /(\s(?:src|href)=)(["'])(images\/[^"']+)\2/g,
          (_, attribute, quote, path) => `${attribute}${quote}${rewrite(path)}${quote}`,
        );
      }
    });
  };
}

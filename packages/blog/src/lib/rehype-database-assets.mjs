import { visit } from 'unist-util-visit';

const PREFIX = 'images/';

/**
 * 마크다운이 이미지를 `images/...` 상대 경로로 참조한다. sync-database 가 파일을
 * public/images/{slug}/ 로 옮기므로 참조도 같은 경로로 바꾼다.
 *
 * 원문에는 마크다운 이미지 문법과 직접 쓴 HTML 이 섞여 있다. HTML 은 파싱되지 않고
 * raw 노드로 남아 element 순회 대상이 아니므로 문자열로 따로 처리한다.
 */
export function rehypeDatabaseAssets() {
  return (tree, file) => {
    const slug = file?.data?.astro?.frontmatter?.slug;
    if (!slug) return;

    const base = `/images/${slug}/`;
    const rewrite = (value) => base + value.slice(PREFIX.length);

    visit(tree, (node) => {
      if (node.type === 'raw' || node.type === 'html') {
        node.value = node.value.replace(
          /(\s(?:src|href)=)(["'])(images\/[^"']+)\2/g,
          (_, attribute, quote, path) => `${attribute}${quote}${rewrite(path)}${quote}`,
        );
        return;
      }

      if (node.type !== 'element') return;

      for (const attribute of ['src', 'href']) {
        const value = node.properties?.[attribute];
        if (typeof value === 'string' && value.startsWith(PREFIX)) {
          node.properties[attribute] = rewrite(value);
        }
      }

      if (node.tagName === 'img') {
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
      }
    });
  };
}

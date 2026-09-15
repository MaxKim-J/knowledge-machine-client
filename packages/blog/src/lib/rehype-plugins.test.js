import { describe, expect, it } from 'vitest';
import { rehypeDatabaseAssets } from './rehype-database-assets.mjs';
import { rehypeFootnotes } from './rehype-footnotes.mjs';

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
const raw = (value) => ({ type: 'raw', value });
const root = (children) => ({ type: 'root', children });

const file = (slug) => ({ data: { astro: { frontmatter: { slug } } } });

const run = (plugin, tree, vfile) => {
  plugin()(tree, vfile);
  return tree;
};

describe('rehypeDatabaseAssets', () => {
  it('마크다운 이미지의 상대 경로를 슬러그 아래로 옮긴다', () => {
    const tree = root([el('p', {}, [el('img', { src: 'images/foo/bar.png' })])]);
    run(rehypeDatabaseAssets, tree, file('my-post'));
    expect(tree.children[0].children[0].properties.src).toBe('/images/my-post/foo/bar.png');
  });

  it('파싱되지 않은 raw HTML 안의 src 도 함께 옮긴다', () => {
    const tree = root([raw('<div><img src="images/foo/bar.png" /></div>')]);
    run(rehypeDatabaseAssets, tree, file('my-post'));
    expect(tree.children[0].value).toContain('src="/images/my-post/foo/bar.png"');
  });

  it('외부 주소와 절대 경로는 그대로 둔다', () => {
    const tree = root([el('img', { src: 'https://example.com/a.png' }), el('img', { src: '/already/absolute.png' })]);
    run(rehypeDatabaseAssets, tree, file('my-post'));
    expect(tree.children[0].properties.src).toBe('https://example.com/a.png');
    expect(tree.children[1].properties.src).toBe('/already/absolute.png');
  });

  it('슬러그가 없으면 아무것도 바꾸지 않는다', () => {
    const tree = root([el('img', { src: 'images/foo/bar.png' })]);
    run(rehypeDatabaseAssets, tree, { data: {} });
    expect(tree.children[0].properties.src).toBe('images/foo/bar.png');
  });
});

/** `## References` 제목과 번호 목록. 원문 대부분이 쓰는 형태다. */
const referencesSection = () => [
  el('h2', {}, [text('References')]),
  text('\n'),
  el('ol', {}, [
    el('li', {}, [el('a', { href: 'https://example.com/one' }, [text('첫 번째 출처')])]),
    el('li', {}, [el('a', { href: 'https://example.com/two' }, [text('두 번째 출처')])]),
  ]),
];

const findByClass = (node, name) => {
  if (node.properties?.className?.includes(name)) return node;
  for (const child of node.children ?? []) {
    const found = findByClass(child, name);
    if (found) return found;
  }
  return null;
};

describe('rehypeFootnotes', () => {
  it('References 목록을 미주 블록으로 옮기고 원래 제목을 없앤다', () => {
    const tree = root([el('p', {}, [text('본문')]), ...referencesSection()]);
    run(rehypeFootnotes, tree);

    expect(tree.children.some((n) => n.tagName === 'h2')).toBe(false);
    const endnotes = findByClass(tree, 'endnotes');
    expect(endnotes).not.toBeNull();
    const items = endnotes.children[0].children;
    expect(items).toHaveLength(2);
    expect(items[0].properties.id).toBe('ref-1');
  });

  it('element 로 파싱된 sup 을 팝오버 표식으로 바꾼다', () => {
    const tree = root([el('p', {}, [text('주장'), el('sup', {}, [text('1')])]), ...referencesSection()]);
    run(rehypeFootnotes, tree);

    const note = findByClass(tree.children[0], 'note');
    expect(note).not.toBeNull();
    expect(note.children[0].properties.href).toBe('#ref-1');
    expect(findByClass(note, 'note-pop')).not.toBeNull();
  });

  it('한 raw 노드에 들어온 sup 을 바꾼다', () => {
    const tree = root([el('p', {}, [raw('주장 <sup>2</sup> 이어짐')]), ...referencesSection()]);
    run(rehypeFootnotes, tree);

    const note = findByClass(tree.children[0], 'note');
    expect(note).not.toBeNull();
    expect(note.children[0].children[0].value).toBe('[2]');
  });

  it('여는 태그와 닫는 태그가 나뉜 sup 을 바꾼다', () => {
    const tree = root([el('p', {}, [raw('주장 <sup>'), text('1'), raw('</sup> 이어짐')]), ...referencesSection()]);
    run(rehypeFootnotes, tree);

    expect(findByClass(tree.children[0], 'note')).not.toBeNull();
    const remaining = tree.children[0].children.filter((n) => n.type === 'raw').map((n) => n.value);
    expect(remaining.join('')).not.toContain('sup');
  });

  it('미주 목록이 없으면 본문을 건드리지 않는다', () => {
    const tree = root([el('p', {}, [text('본문'), el('sup', {}, [text('1')])])]);
    run(rehypeFootnotes, tree);

    expect(findByClass(tree, 'note')).toBeNull();
    expect(findByClass(tree, 'endnotes')).toBeNull();
    expect(tree.children[0].children[1].tagName).toBe('sup');
  });

  it('목록에 없는 번호의 표식은 그대로 둔다', () => {
    const tree = root([el('p', {}, [el('sup', {}, [text('9')])]), ...referencesSection()]);
    run(rehypeFootnotes, tree);

    expect(findByClass(tree.children[0], 'note')).toBeNull();
    expect(tree.children[0].children[0].tagName).toBe('sup');
  });
});

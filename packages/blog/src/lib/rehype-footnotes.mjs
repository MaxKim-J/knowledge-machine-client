const HEADING = /^(references?|참고\s*문헌|참고\s*자료)$/i;
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4']);

/**
 * 원문은 미주를 두 방식으로 적는다. 본문에 `<sup>N</sup>` 을 넣고 문서 끝에
 * `## References` 와 번호 목록을 적거나, GFM 각주 문법을 사용한다. 양쪽을 같은
 * 미주 블록으로 모으고 본문 표식은 팝오버가 딸린 링크로 바꾼다.
 */
export function rehypeFootnotes() {
  return (tree) => {
    const refs = collect(tree);
    if (!refs.length) return;

    markReferences(tree, refs);
    tree.children.push(rule(), endnotes(refs));
  };
}

function text(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  if (node.properties?.dataFootnoteBackref) return '';
  return (node.children ?? []).map(text).join('');
}

function firstLink(node) {
  if (node.type === 'element' && node.tagName === 'a' && !node.properties?.dataFootnoteBackref) {
    return String(node.properties.href ?? '');
  }
  for (const child of node.children ?? []) {
    const found = firstLink(child);
    if (found) return found;
  }
  return '';
}

function host(url) {
  return url.replace(/^https?:\/\//, '').split('/')[0];
}

function items(list) {
  return (list.children ?? [])
    .filter((node) => node.type === 'element' && node.tagName === 'li')
    .map((li, index) => {
      const url = firstLink(li);
      const label = text(li).trim();
      return { n: index + 1, text: url ? label.replace(/\s*$/, '') : label, url, host: host(url) };
    });
}

/** 미주 목록을 찾아 본문에서 떼어낸다. 찾지 못하면 빈 배열을 돌려준다. */
function collect(tree) {
  const children = tree.children ?? [];
  const isElement = (node, tag) => node?.type === 'element' && node.tagName === tag;

  const gfm = children.findIndex((node) => node?.properties?.dataFootnotes);
  if (gfm !== -1) {
    const list = (children[gfm].children ?? []).find((node) => isElement(node, 'ol'));
    children.splice(gfm, 1);
    if (list) return items(list);
  }

  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    if (!node || node.type !== 'element' || !HEADINGS.has(node.tagName)) continue;
    if (!HEADING.test(text(node).trim())) continue;

    // 제목과 목록 사이에는 줄바꿈 텍스트 노드가 들어간다.
    let j = i + 1;
    while (j < children.length && children[j]?.type === 'text' && !children[j].value.trim()) j += 1;
    if (!isElement(children[j], 'ol')) continue;

    const collected = items(children[j]);
    children.splice(i, j - i + 1);
    return collected;
  }
  return [];
}

const isRaw = (node) => node?.type === 'raw' || node?.type === 'html';
const SUP = /<sup>\s*(\d+)\s*<\/sup>/g;

/**
 * `<sup>N</sup>` 과 GFM 각주 링크를 팝오버 표식으로 바꾼다.
 *
 * 직접 적은 `<sup>` 은 파싱되지 않고 raw 노드로 남는다. 한 노드 안에 다 들어오기도 하고
 * 여는 태그와 닫는 태그가 텍스트를 사이에 두고 나뉘기도 하므로 두 형태를 모두 처리한다.
 */
function markReferences(tree, refs) {
  const pick = (n) => refs[Number(n) - 1];

  const walk = (node) => {
    const children = node.children;
    if (!children) return;

    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];

      if (child?.type === 'element' && child.tagName === 'sup') {
        const ref = pick(text(child).trim());
        if (ref) {
          children[i] = marker(ref);
          continue;
        }
      }

      // 여는 태그와 닫는 태그가 나뉜 형태: raw `<sup>` + 텍스트 + raw `</sup>`
      if (isRaw(child) && child.value.trimEnd().endsWith('<sup>')) {
        const middle = children[i + 1];
        const closing = children[i + 2];
        const ref = middle?.type === 'text' ? pick(middle.value.trim()) : undefined;
        if (ref && isRaw(closing) && closing.value.trimStart().startsWith('</sup>')) {
          const before = child.value.slice(0, child.value.lastIndexOf('<sup>'));
          const after = closing.value.slice(closing.value.indexOf('</sup>') + '</sup>'.length);
          children.splice(i, 3, { ...child, value: before }, marker(ref), { ...closing, value: after });
          i += 1;
          continue;
        }
      }

      // 한 raw 노드 안에 다 들어온 형태
      if (isRaw(child) && child.value.includes('<sup>')) {
        const parts = [];
        let last = 0;
        for (const match of child.value.matchAll(SUP)) {
          const ref = pick(match[1]);
          if (!ref) continue;
          parts.push({ ...child, value: child.value.slice(last, match.index) }, marker(ref));
          last = match.index + match[0].length;
        }
        if (parts.length) {
          parts.push({ ...child, value: child.value.slice(last) });
          children.splice(i, 1, ...parts);
          i += parts.length - 1;
          continue;
        }
      }

      walk(child);
    }
  };

  walk(tree);
}

const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const txt = (value) => ({ type: 'text', value });

function marker(ref) {
  const body = [el('span', { className: ['note-n'] }, [txt(String(ref.n))]), txt(ref.text)];
  if (ref.url) {
    body.push(txt(' '), el('a', { href: ref.url, target: '_blank', rel: 'noreferrer' }, [txt(ref.host)]));
  }
  return el('span', { className: ['note'] }, [
    el('a', { className: ['note-mark'], href: `#ref-${ref.n}` }, [txt(`[${ref.n}]`)]),
    el('span', { className: ['note-pop'] }, [el('span', { className: ['note-pop-body'] }, body)]),
  ]);
}

const rule = () => el('div', { className: ['endnote-rule'] }, []);

function endnotes(refs) {
  return el('section', { className: ['endnotes'] }, [
    el(
      'ol',
      {},
      refs.map((ref) =>
        el('li', { id: `ref-${ref.n}` }, [
          el('span', { className: ['endnote-n'] }, [txt(`${ref.n}.`)]),
          el('span', {}, [
            txt(ref.text),
            ...(ref.url
              ? [el('a', { className: ['endnote-host'], href: ref.url, target: '_blank', rel: 'noreferrer' }, [txt(ref.host)])]
              : []),
          ]),
        ]),
      ),
    ),
  ]);
}

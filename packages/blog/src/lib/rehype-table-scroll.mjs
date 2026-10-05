/** 각 마크다운 표를 독립적인 가로 스크롤 영역으로 감싼다. */
export function rehypeTableScroll() {
  return (tree) => {
    const wrapTables = (parent) => {
      if (!Array.isArray(parent.children)) return;

      parent.children = parent.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'table') {
          return {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-scroll'] },
            children: [child],
          };
        }

        wrapTables(child);
        return child;
      });
    };

    wrapTables(tree);
  };
}

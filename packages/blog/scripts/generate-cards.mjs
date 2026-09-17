// database 의 글마다 공유 카드를 굽는다. 손으로 만들어 둔 썸네일의 조판을 따른다.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { renderCard } from './lib/card.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(here, '..');
const dbRoot = path.resolve(blogRoot, '../../database');
const outDir = path.join(blogRoot, 'public', 'og');

const BYLINE = { ko: 'Written by 김종혁', en: 'Written by Jonghyuk Max Kim' };

const DEFAULT_CARD = {
  label: 'knowledge machine',
  title: '지식기계',
  summary:
    '읽는 속도가 쓰는 속도를 앞지르면 이해하지 못한 자료가 부채처럼 쌓입니다. 그 부채를 남겨두지 않으려고 만든 파이프라인입니다.',
  byline: 'jonghyuk.kim',
};

/**
 * frontmatter 만 읽는다. 값에 이스케이프한 따옴표가 들어가는 제목이 있어
 * 정규식으로 가르지 않고 YAML 로 파싱한다.
 */
function frontmatter(file) {
  const head = fs.readFileSync(file, 'utf8').split(/^---\s*$/m)[1];
  if (!head) return {};
  try {
    return parse(head) ?? {};
  } catch {
    console.warn(`[cards] frontmatter 를 읽지 못했습니다: ${path.relative(dbRoot, file)}`);
    return {};
  }
}

function cardOf(data) {
  const lang = data.lang === 'en' ? 'en' : 'ko';
  return {
    label: `${data.type} · ${data.category}`,
    title: data.title,
    summary: data.summary,
    byline: `${BYLINE[lang]}, ${String(data.date).slice(0, 10)}`,
  };
}

/** 내용이 그대로면 다시 굽지 않는다. 글이 많아 매 빌드마다 전부 그리면 느리다. */
const stamp = (card) => crypto.createHash('sha1').update(JSON.stringify(card)).digest('hex').slice(0, 12);

async function write(name, card, cache) {
  const target = path.join(outDir, `${name}.png`);
  const key = stamp(card);
  if (cache[name] === key && fs.existsSync(target)) return false;
  fs.writeFileSync(target, await renderCard(card));
  cache[name] = key;
  return true;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const cacheFile = path.join(outDir, '.cards.json');
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};

  let drawn = 0;
  let kept = 0;
  const seen = new Set(['default']);

  if (await write('default', DEFAULT_CARD, cache)) drawn += 1;
  else kept += 1;

  for (const kind of ['articles', 'knowledges']) {
    const kindDir = path.join(dbRoot, kind);
    if (!fs.existsSync(kindDir)) continue;

    for (const entry of fs.readdirSync(kindDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const file of fs.readdirSync(path.join(kindDir, entry.name))) {
        if (!/^(article|knowledge)(\.en)?\.md$/.test(file)) continue;

        const data = frontmatter(path.join(kindDir, entry.name, file));
        // 발행하지 않은 글과 직접 지정한 썸네일이 있는 글은 카드를 만들지 않는다.
        if (data.published !== true || !data.slug || !data.title || data.thumbnail) continue;

        const name = `${data.lang === 'en' ? 'en-' : ''}${data.slug}`;
        seen.add(name);
        if (await write(name, cardOf(data), cache)) drawn += 1;
        else kept += 1;
      }
    }
  }

  // 글이 사라지거나 썸네일을 직접 지정하면 남은 카드를 치운다.
  for (const name of Object.keys(cache)) {
    if (seen.has(name)) continue;
    fs.rmSync(path.join(outDir, `${name}.png`), { force: true });
    delete cache[name];
  }

  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  console.log(`[cards] 새로 그림 ${drawn}장, 재사용 ${kept}장`);
}

await main();

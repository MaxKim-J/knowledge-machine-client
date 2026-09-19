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

const STATIC_CARDS = {
  about: {
    label: 'about',
    title: '지식기계',
    summary:
      '지식기계는 개인 지식 시스템이자 Ontology로, AI를 통해 인간의 지식 처리 속도를 높이고 지식을 효과적으로 증강할 수 있는 방법을 가정하고 실행합니다.',
    byline: 'Written by 김종혁',
  },
  'en-about': {
    label: 'about',
    title: 'Knowledge Machine',
    summary:
      'Knowledge Machine is a personal knowledge system and an ontology that explores and puts into practice ways to accelerate human knowledge processing and augment human knowledge through AI.',
    byline: 'Written by Jonghyuk Max Kim',
  },
  author: {
    label: 'author',
    title: '김종혁',
    summary:
      '복잡한 문제를 잘 다루고 싶어하는 사람. 세상을 더 이해하고 싶은 사람. 모방할 수 없는 경험을 가지고 싶은 사람. 앞으로 어떻게 될지 모르겠는 사람. 플렉스팀의 Product Engineer.',
    byline: 'Written by 김종혁',
  },
  'en-author': {
    label: 'author',
    title: 'Jonghyuk Max Kim',
    summary:
      'A person who wants to handle complex problems well. A person who wants to understand the world better. A person who wants experiences that cannot be imitated. A person who does not know what the future holds. A Product Engineer at flex.team.',
    byline: 'Written by Jonghyuk Max Kim',
  },
};

// 메인 페이지의 기본 카드는 지식기계 소개 카드와 같은 내용을 사용한다.
const DEFAULT_CARD = STATIC_CARDS.about;

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

/**
 * 내용이 그대로면 다시 굽지 않는다. 글이 많아 매 빌드마다 전부 그리면 느리다.
 * 조판을 바꿔도 다시 굽도록 렌더러 원본까지 해시에 넣는다.
 */
const layoutStamp = crypto
  .createHash('sha1')
  .update(fs.readFileSync(path.join(here, 'lib', 'card.mjs')))
  .digest('hex')
  .slice(0, 12);

const stamp = (card) =>
  crypto.createHash('sha1').update(layoutStamp).update(JSON.stringify(card)).digest('hex').slice(0, 12);

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
  const seen = new Set(['default', ...Object.keys(STATIC_CARDS)]);

  if (await write('default', DEFAULT_CARD, cache)) drawn += 1;
  else kept += 1;

  for (const [name, card] of Object.entries(STATIC_CARDS)) {
    if (await write(name, card, cache)) drawn += 1;
    else kept += 1;
  }

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

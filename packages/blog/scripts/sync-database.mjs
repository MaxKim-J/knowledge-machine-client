// 빌드 전에 database 서브모듈을 최신화하고 글에 딸린 이미지를 public/ 으로 옮긴다.
// 마크다운은 이미지를 `images/...` 상대 경로로 참조하는데 그 디렉토리 이름이
// 글마다 중복될 수 있어(2021-retrospect 가 두 글에서 사용된다) 슬러그로 경로를 나눈다.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(here, '..');
const repoRoot = path.resolve(blogRoot, '../..');
const dbRoot = path.join(repoRoot, 'database');
const imagesOut = path.join(blogRoot, 'public', 'images');

const run = (args, cwd) =>
  execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

function updateSubmodule() {
  if (process.env.SKIP_DB_SYNC === '1') {
    console.log('[sync] SKIP_DB_SYNC=1 이므로 서브모듈 최신화를 건너뜁니다.');
    return;
  }
  try {
    run(['submodule', 'update', '--init', '--remote', '--depth', '1', 'database'], repoRoot);
    const head = run(['rev-parse', '--short', 'HEAD'], dbRoot);
    console.log(`[sync] database 최신화 완료 (${head})`);
  } catch (error) {
    // 네트워크가 없거나 서브모듈이 이미 체크아웃된 상태면 현재 트리로 계속 진행한다.
    if (!fs.existsSync(path.join(dbRoot, 'articles'))) throw error;
    console.warn(`[sync] 서브모듈 최신화에 실패해 현재 체크아웃으로 계속합니다. (${error.message.split('\n')[0]})`);
  }
}

function readSlug(markdownPath) {
  const head = fs.readFileSync(markdownPath, 'utf8').slice(0, 2000);
  return head.match(/^slug:\s*["']?([^"'\n\r]+)["']?\s*$/m)?.[1]?.trim() ?? null;
}

function copyImages() {
  fs.rmSync(imagesOut, { recursive: true, force: true });
  let copied = 0;

  for (const kind of ['articles', 'knowledges']) {
    const kindDir = path.join(dbRoot, kind);
    if (!fs.existsSync(kindDir)) continue;
    const file = kind === 'articles' ? 'article.md' : 'knowledge.md';

    for (const entry of fs.readdirSync(kindDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const source = path.join(kindDir, entry.name, 'images');
      const markdown = path.join(kindDir, entry.name, file);
      if (!fs.existsSync(source) || !fs.existsSync(markdown)) continue;

      const slug = readSlug(markdown);
      if (!slug) continue;
      fs.cpSync(source, path.join(imagesOut, slug), { recursive: true });
      copied += 1;
    }
  }
  console.log(`[sync] 이미지 복사 완료: ${copied}개 글`);
}

updateSubmodule();
copyImages();

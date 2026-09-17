import { describe, expect, it } from 'vitest';
import { CARD, renderCard } from './card.mjs';

const png = (buffer) => ({
  isPng: buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  width: buffer.readUInt32BE(16),
  height: buffer.readUInt32BE(20),
});

const sample = {
  label: 'article · tech',
  title: '제목',
  summary: '요약 문장.',
  byline: 'Written by 김종혁, 2025-10-09',
};

describe('renderCard', () => {
  it('공유 카드 비율의 PNG 를 만든다', async () => {
    const out = png(await renderCard(sample));
    expect(out.isPng).toBe(true);
    expect(out.width).toBe(CARD.width);
    expect(out.height).toBe(CARD.height);
    // 공유 카드 권장 비율 1.91:1 에서 벗어나면 잘려 보인다.
    expect(CARD.width / CARD.height).toBeCloseTo(1.91, 1);
  });

  it('제목에 따옴표가 들어가도 그린다', async () => {
    const out = png(await renderCard({ ...sample, title: '부수효과 없는 "순수함수" 맛보기' }));
    expect(out.isPng).toBe(true);
  });

  it('제목 길이가 달라도 같은 크기로 나온다', async () => {
    const short = png(await renderCard({ ...sample, title: '짧은 제목' }));
    const long = png(
      await renderCard({ ...sample, title: '아주 긴 제목을 넣어도 카드 크기는 변하지 않아야 하고 글자만 줄어든다' }),
    );
    expect(short.width).toBe(long.width);
    expect(short.height).toBe(long.height);
  });

  it('한국어와 영어 바이라인을 모두 그린다', async () => {
    const en = png(await renderCard({ ...sample, byline: 'Written by Jonghyuk Max Kim, 2025-10-09' }));
    expect(en.isPng).toBe(true);
  });
});

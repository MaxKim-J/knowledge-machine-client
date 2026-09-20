import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fontDir = path.resolve(here, '../../assets/fonts');

/**
 * 손으로 만든 기존 썸네일의 비율. 6568x3448 로 그려 두었고 그 1/4 로 굽는다.
 * 공유 카드 권장 비율(1.91:1)에 들어맞아 잘리지 않는다.
 */
export const CARD = { width: 1642, height: 862 };

const font = (file, weight) => ({
  name: 'Pretendard',
  data: fs.readFileSync(path.join(fontDir, file)),
  weight,
  style: 'normal',
});

const fonts = [
  font('Pretendard-Regular.ttf', 400),
  font('Pretendard-Bold.ttf', 700),
  font('Pretendard-ExtraBold.ttf', 800),
];

/** 제목이 길수록 글자를 줄여 세 줄을 넘지 않게 한다. */
function titleSize(title, summary) {
  if (title.length <= 14) return summary.length > 90 ? 112 : 132;
  if (title.length <= 24) return 112;
  if (title.length <= 36) return 92;
  return 78;
}

/** 설명이 길어도 하단의 작성자 표기가 카드 밖으로 밀리지 않게 한다. */
function summarySize(summary) {
  if (summary.length <= 90) return 51;
  if (summary.length <= 140) return 45;
  return 41;
}

const text = (content, style) => ({ type: 'div', props: { style, children: content } });

function layout({ label, title, summary, byline }) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        color: '#000000',
        padding: '92px 96px 84px',
        fontFamily: 'Pretendard',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              text(label, {
                fontSize: 26,
                fontWeight: 400,
                letterSpacing: '0.06em',
                color: '#8C8C8C',
                marginBottom: '28px',
                display: 'flex',
              }),
              text(title, {
                fontSize: titleSize(title, summary),
                fontWeight: 800,
                lineHeight: 1.24,
                letterSpacing: '-0.035em',
                maxWidth: '94%',
                marginBottom: '52px',
                display: 'flex',
              }),
              text(summary, {
                fontSize: summarySize(summary),
                fontWeight: 700,
                lineHeight: 1.4,
                letterSpacing: '-0.015em',
                maxWidth: '94%',
                color: '#2E2E2E',
                display: 'flex',
              }),
            ],
          },
        },
        text(byline, { fontSize: 28, fontWeight: 400, letterSpacing: '-0.01em', display: 'flex' }),
      ],
    },
  };
}

/** 카드 한 장을 PNG 버퍼로 굽는다. */
export async function renderCard(card) {
  const svg = await satori(layout(card), { width: CARD.width, height: CARD.height, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD.width } }).render().asPng();
}

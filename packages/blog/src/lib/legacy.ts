/**
 * 구 블로그 주소를 현재 슬러그에 대응시킨다.
 * 회고 네 편은 데이터베이스 슬러그가 retorspect 로 적혀 있고 구 블로그 주소는
 * retrospect 로 불일치한다. 원문 슬러그를 고치면 현재 주소가 동작하지 않으므로
 * 별칭으로 처리한다.
 */
export const OLD_PATH_ALIASES: Record<string, string> = {
  '2020-retrospect': '2020-retorspect',
  '2021-retrospect': '2021-retorspect',
  '2022-retrospect': '2022-retorspect',
  '2023-retrospect': '2023-retorspect',
};

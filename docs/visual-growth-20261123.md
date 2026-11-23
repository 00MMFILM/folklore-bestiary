# 한국 도감과 두 읽을거리의 이미지 개선

한국 도감, 한국어 콩콩귀신, 영문 비익조에 새로 생성한 창작 그림을 넣었다. 각 그림은 본문 설명 다음에 배치하고, AI 창작 해석임을 캡션으로 표시한다. 같은 그림의 JPEG를 Open Graph와 Twitter 공유 이미지에 사용한다. 출처와 기존 전승 설명은 유지했다.

한국 도감의 추천 여섯 항목은 그림 카드로 바꿨다. 기존 `GrowthLink`를 사용하므로 다음 글 이동 이벤트가 계속 기록된다. 데스크톱은 3열, 600px 이하 화면은 2열이다.

## 이미지

- `public/editorial-images/20261123/korean-folklore-atlas*`: 한국 도감
- `public/editorial-images/20261123/kongkong-school-ghost*`: 한국어 콩콩귀신과 해당 추천 카드
- `public/editorial-images/20261123/biyiniao-paired-birds*`: 영문 비익조

ChatGPT 내장 이미지 생성으로 제작했다. 원본에서 내용 변경 없이 1536×1024 WebP, 768×512 WebP, 1200×800 공유 JPEG를 만들었다. 본문은 `srcset`으로 화면에 맞는 이미지를 고른다. 다른 언어의 페이지에는 해당 언어와 맞지 않는 캡션이 나타나지 않도록 적용 범위를 제한했다.

## 확인

- 기존 성장 대상 20개 페이지 회귀 검사와 유입/다음 글 이벤트 검사 통과
- TypeScript, 변경 파일 ESLint, 전체 프로덕션 빌드 통과 (18,648 정적 경로)
- 로컬 HTTP에서 대상 3페이지와 이미지 9개 정상 응답, 공유 이미지 실제 크기 확인
- Chrome 1200px 및 390px 화면에서 이미지 표시 확인; 한국 도감의 카드에서 콩콩귀신 본문 이동 확인

배포 직후의 방문자 변화는 이미지 개선 효과로 단정하지 않는다. 기존 일일 점검에서 검색 유입, 대상 페이지 유입, 다음 글 이동을 배포 이전의 완전한 기간과 비교한다. QA 접속에는 `growth_qa=1`을 사용한다.

## 참고

- [네이버 콘텐츠 마크업](https://searchadvisor.naver.com/guide/markup-content): 페이지별 대표 이미지 지정
- [Google 이미지 가이드](https://developers.google.com/search/docs/appearance/google-images): 설명적인 파일명과 대체 텍스트, 주변 본문

검색 결과의 이미지 선택이나 순위 상승은 보장하지 않는다.

# folklore-bestiary — 에이전트 작업 규약

세계 민속 **생물** 도감. Next.js + Vercel 자동 배포. GitHub `00MMFILM/folklore-bestiary`.
GitHub Actions 봇이 하루 수회 커밋한다 (crawl → translate → image-gen → articles).

2026-10-11 기준 **4,821종 / 145개국**. 이미지 1,599종 연결(33%), 아티클 343편(7%).

작업 내역과 판단 근거는 `docs/작업내역-데이터정리-2026-08.md`, `docs/작업내역-2026-10.md`에 있다.
**데이터를 건드리기 전에 이 파일과 10월 내역서를 먼저 읽어라.**

---

## 치명적 함정 세 가지

### 1. 정본은 한 줄짜리 거대 JSON — git 병합이 불가능하다

`lib/folklore-data.ts`의 `FOLKLORE_DATA`와 `CREATURE_IMAGE_MAP`은 각각 **한 줄**이다
(정본 약 2.9MB). 충돌이 나면 수동 병합이 사실상 불가능하다.

그래서 데이터 수정은 **반드시 id 목록 기반 스크립트**로 한다. 에디터로 직접 고치지 말고,
드라이버를 짜서 파싱 → 변경 → 재직렬화한다. 해당 줄만 교체하고 파일의 나머지 구조는 보존한다.

```js
// 마커로 그 줄만 잘라내는 방식 (scripts/apply-cleanup-20260824.mjs 참고)
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';
const start = src.indexOf(MARKER) + MARKER.length;
let end = src.indexOf('\n', start);
```

### 2. 봇 커밋 레이스

작업 중에 봇이 푸시한다. 아래를 **한 체인으로** 끝내라. 중간에 빌드를 돌리면 그 사이 봇이 또 푸시한다.

```bash
git fetch -q origin
git rev-list --count HEAD..origin/main      # 0이 아니면
git stash -q -u && git pull -q --rebase && git stash pop -q
# → 검증 → 커밋 → 푸시
```

데이터 구조가 아니라 문자열 값만 바뀐 변경이면 `npm run build` 없이 파싱·정합 검증만 하고 즉시 푸시한다.

### 3. 종을 지우면 파생물 4곳이 같이 남는다

2026-08 정리 때 이미지·맵을 안 지워서 고아 항목이 쌓였다. 종을 추가·삭제할 때 아래를 함께 처리한다.

| 파생물 | 경로 | 키 |
|---|---|---|
| 번역 | `public/i18n/creatures-{ko,zh,ja}.json` | 종 id |
| 이미지맵 | `CREATURE_IMAGE_MAP` (정본 안) + `public/creatures/**` | 슬러그 (아래 참고) |
| 아티클 | `content/articles/{id}.json` | 종 id |
| 설화 링크 | `content/tale-links.json` | `scripts/build-tale-links.mjs`로 결정적 재생성 (크레딧 0) |

i18n 3종의 항목 수는 **종 수와 정확히 일치해야 한다** (현재 4,821 = 4,821 = 4,821 = 4,821).

---

## 이미지 슬러그 규칙 — 국가 접두사가 2글자가 아닐 수 있다

`getCreatureImage()`는 세 형태를 순서대로 시도한다.

```
3글자 벗김 → 2글자 벗김 → 원본 id
```

`sct-`(스코틀랜드 73종), `wls-`(웨일스 67종)가 3글자다. 2글자만 벗기면 이 140종이 이미지가 있어도
표시되지 않는다. 반대로 3글자만 벗기면 `wls-gwyllion`처럼 **id 전체가 맵 키**인 항목을 잃는다.
그래서 폴백 체인이다. 한쪽만 쓰도록 되돌리지 마라 (`c136c96`).

고아 키를 계산할 때도 같은 체인을 써야 한다. 2글자만 가정하면 **살아있는 종을 고아로 오판한다**
(실측: 72건 중 48건이 오판이었다).

---

## 크롤 게이트 — 비생물 유입 차단

`scripts/crawl-wikipedia-folklore.mjs`의 `isCreatureArticle()`이 입구다. 판정 함수 두 개를 쓴다.

| 함수 | 대상 | 구조 |
|---|---|---|
| `looksNonCreatureSubject` | 영문 extract의 **첫 계사 보어** | `NC_HARD` / `NC_SOFT`+`NC_BEING` lookahead |
| `looksNonCreatureSubjectCJK` | 한/일/중 **정의문(첫 문장)** | `CJK_NC_HARD` / `CJK_NC_SOFT`+`CJK_BEING` |

**설계 원칙 네 가지.** 고치기 전에 반드시 이해하라.

1. **첫 계사 보어만 본다.** 종속절까지 검사하면 진짜 생물이 걸린다 — `ro-langs`는
   "Ro is the word for corpse"라고 쓰지만 좀비형 생물이다.
2. **soft 명사는 존재어 lookahead로 구제한다.** `lake`·`mountain`·`folklore`는 뒤에
   `monster`·`god`·`figure`가 오면 통과시킨다. "lake monster", "mountain god", "folklore figure"를 살린다.
3. **hard 명사는 존재어가 있어도 차단한다.** 「대괴수 갓파」처럼 제목에 '괴수'가 든 1967년 영화가
   구제되면 안 된다.
4. **개별 이야기는 막지 않는다.** 도감은 `t=Folktale`로 설화·민담을 담는다(331종).
   막는 것은 작품집(`anthology`·`collection`·설화집·선집)과 설화가 아닌 장르(향가·악장·악곡)다.
   「흥부전」·「서유기」는 통과해야 한다.

### 게이트를 고칠 때

재현 테스트가 성공기준이다. 넷 다 통과해야 한다.

```bash
node scripts/test-noncreature-gate.mjs        # 영문 게이트 (reject 28 / pass 18)
node scripts/test-cjk-gate.mjs                # CJK 게이트 (reject 14 / pass 14)
node scripts/test-description-truncation.mjs  # 설명 절단 (8케이스)
node scripts/regress-gate.mjs                 # 기존 데이터 역적용 — 오차단 확인
```

`regress-gate.mjs` 결과를 **전건 눈으로 확인**하라. 새로 걸린 항목 중 진짜 생물이 있으면 오차단이다.

**실제로 밟은 오차단 함정** (전부 테스트에 고정돼 있다):

- `말이다`로 잡으면 「하늘을 나는 신성한 **말**이다」(馬)가 걸린다 → `일컫는/가리키는/이르는 말`처럼 앞 수식어를 요구한다
- 「**신들**을 묶어 이르는 말」(가미노요나나오), 「**부부신**」(오메테오틀)이 존재어로 인식되지 않아
  일본·아스텍 신이 차단됐다 → 신격 총칭을 `CJK_BEING`에 넣었다
- `deity`만 넣으면 `deities`(복수)가 안 걸려 켈트 여신 라티스가 오차단된다

### 게이트는 미래 크롤만 막는다

게이트를 고쳐도 **기존 데이터는 변하지 않는다**. 재고를 정리하려면 `regress-gate.mjs`로 역적용해
목록을 뽑고, 전수 검토한 뒤 삭제 드라이버를 돌려야 한다.

---

## 작업 절차

### 드라이버는 영구 런로그를 남긴다

삭제·재분류·발사처럼 되돌릴 필요가 있는 작업은 콘솔 출력이 아니라
`scripts/runlogs/*.jsonl`에 한 줄씩 기록한다. 무엇을·왜·언제 바꿨는지 남아야 한다.

`--dry` 옵션을 반드시 달고, 적용 전에 dry로 확인한다.

### 검증 체크리스트

데이터를 바꾼 뒤 아래를 전부 확인하고 커밋한다.

```
□ 정본·이미지맵 JSON 파싱 정상
□ 국가 145 / 종 수 기대치 일치
□ id 중복 0 · 필수필드(n·t·f·d·id) 누락 0
□ i18n 3종 항목 수 = 종 수, 미번역 0, 고아 키 0
□ 이미지맵 깨진 링크 0 · 잔여 고아 키 0
□ 삭제분이 정본·i18n·아티클에 잔존 0
□ 유형 종류 28 유지
```

### 번역은 크레딧이 든다 — 감독 승인 대상

`scripts/translate-creatures.mjs`는 OpenAI `gpt-4o-mini`를 쓴다. 키는 `.env.local`에 있고,
명령줄에 평문으로 넣지 말고 `set -a; . ./.env.local; set +a` 로 넘긴다.

**기존 번역이 있으면 건너뛴다** — 메인 루프의 `if (result[c.id]) continue;`가 그 지점이다. 재번역하려면
`scripts/invalidate-translations.mjs`로 대상 엔트리를 먼저 지워야 한다.

정본 `d`를 고쳐도 상세 페이지는 바뀌지 않는다. `app/[locale]/creatures/[id]/page.tsx`가
`trans?.d || creature.d`로 **번역본을 우선** 쓴다. 지도 화면(`FolkloreMap`)만 정본을 직접 쓴다.

#### 번역 파이프라인에서 실제로 터진 결함 (수정됨, 유사 작업 시 주의)

| 결함 | 증상 | 대책 |
|---|---|---|
| 청크 유실 | LLM이 깨진 JSON을 주면 catch가 재시도 없이 넘어가 **20건이 통째로 사라졌다** (실측 140건) | 재시도 3회 → 청크 이분할 → 문자열 내 제어문자 복구 |
| 키 변조 | LLM이 id까지 번역했다 (`br-headless-mule` → `br-无头骡`) | 응답 키가 요청 키에 없으면 폐기 (다음 실행에서 재시도됨) |
| 접두사 오역 | 한국어 '설화'가 한자로 음역 — zh `设话`(중국어에 없는 말), ja `設話`(표기는 説話) | 프롬프트 + `scripts/fix-i18n-prefix.mjs` 일괄 교정 |
| 문체 혼재 | 기본 프롬프트가 "~입니다"로 번역 (기존 4,800여 건은 평서체) | 프롬프트에 언어별 문체 못박음 (ko 평서체 / ja 常体 / zh 서면어) |
| 유형 라벨 오역 | `Spirit`을 "영혼"으로 — 장승은 신령이고, 애초에 사이트 필터가 쓰는 분류 라벨 | 28종 유형명 영문 고정 |

**대량 번역 전에 20건 시험 번역으로 품질을 먼저 확인하라.** 위 다섯 개 중 셋이 시험 단계에서 잡혔다.

---

## 주요 스크립트

| 스크립트 | 용도 |
|---|---|
| `crawl-wikipedia-folklore.mjs` | 크롤러 + 게이트 (봇이 Actions로 실행) |
| `translate-creatures.mjs` | ko/zh/ja 번역 (OpenAI, 크레딧) |
| `invalidate-translations.mjs` | 재번역 대상 엔트리 무효화 |
| `generate-images.mjs`, `select-images-to-generate.mjs` | 이미지 생성 (크레딧) |
| `build-tale-links.mjs` | 설화 링크 결정적 재생성 (크레딧 0) |
| `repair-truncated-desc.mjs` / `apply-desc-repair.mjs` | 잘린 설명 위키 재수집(1단계) / 적용(2단계) |
| `apply-cleanup-20260824.mjs` | 종 삭제 + 파생물 동시 정리. `--ids <파일> --log <이름>` |
| `apply-folktale-reclass.mjs` | 유형 → Folktale 재분류. `--from <파일>:<verdict>` |
| `cleanup-image-map-final.mjs` | 이미지맵 고아 키 정리 |
| `fix-i18n-prefix.mjs` | i18n 접두사 오역 교정 |

`find-noncreatures.mjs`, `reclassify-types.mjs`는 휴리스틱 스캐너다. **오탐이 있으니 전수 원문 판정 없이 믿지 마라.**

---

## 판정 작업에 서브에이전트를 쓸 때

수백 건 전수 판정은 서브에이전트에 맡길 수 있지만, **결과를 그대로 적용하지 마라.**

실제로 겪은 일: 297건 판정을 맡겼더니 에이전트가 "기본값 folktale + 예외만 검토" 방식을 썼다.
`head=legend/myth` 구간 18건을 직접 확인해 존재 이름이기도 한 3건
(`Labbu` 메소포타미아 뱀 괴물, `El Hombre Caimán` 악어인간, `Trentren Vilu` 마푸체 뱀신)을 빼고 적용했다.

또 다른 판정에서는 **오매칭 2건**을 잡았다. `Grani`(시구르드의 **말**)에 Sigurd(영웅) 문서를,
`Decima`(로마 파르카이)에 Moirai(그리스 운명의 세 여신) 문서를 가져왔다.

**위험 구간을 식별해 직접 전수 확인하는 과정이 빠지면 안 된다.**

---

## 남은 미결

1. **CJK 게이트가 잡는 2건** — `용비어천가`는 2026-10-11에 삭제했고,
   `아오키 마리코 현상`은 도시전설이라 `t=Folktale`로 남겼다. 추가 판단이 필요하면 감독에게 묻는다.
2. **이미지 커버리지 33%, 아티클 7%** — 늘리려면 생성 크레딧이 든다 (감독 승인 대상).
3. **유형 분류 정밀도** — 재분류로 Folktale은 바로잡았지만, 생물 유형끼리의 오분류
   (`Bedivere`=Sea Creature 류)는 남아 있다. `reclassify-types.mjs`는 OpenAI 크레딧이 필요하다.
4. **고아 이미지 파일 9개(약 2MB)** — 맵 키는 지웠지만 파일은 남겼다.
   `quetzalcoatl`·`mahakala` 같은 유명 존재는 다시 크롤될 수 있고, 그때 파일이 있으면
   맵에 등록만 하면 된다. 지우면 재생성에 크레딧이 든다. **의도적 보존이므로 "잔여물"로 보고 지우지 마라.**

---

## 감독(이창엽) 작업 규칙

- 파일 삭제·이동·덮어쓰기 전에 **무엇을·어디서·왜** 목록으로 보여주고 승인받는다
- `git push` 등 외부 공개 행위는 특히 확인한다
- 크레딧이 나가는 생성(이미지·영상·번역)은 **건별 승인**이 필요하다
- 시크릿을 명령줄 인자나 설정 파일에 평문으로 넣지 않는다
- 버그 수정은 **재현 테스트부터** 짜고 통과시킨다. "동작하게" 같은 애매한 기준으로 시작하지 않는다
- 최소 코드만. 1회용 코드에 추상화·요청 안 한 유연성을 넣지 않는다
- 분석 지시에는 인상 비평이 아니라 **전수·실측·원문**으로 답한다
- 한국어로 답한다

# Mythoria 로그인·AI 호출 보호

## 구현

- `/ko/login`, `/en/login`, `/ja/login`, `/zh/login`: Google PKCE와 이메일 코드/링크 로그인. 실제 준비된 공급자만 표시한다.
- 도감·무료 시나리오 템플릿·설화 작업실은 로그인 없이 사용한다. 로그인 왕복 시 시나리오 입력은 브라우저 세션에 임시 보존한다.
- 시나리오 POST/GET은 Supabase `auth.getUser(token)`로 서버에서 사용자를 확인한다. 익명 계정, 미인증 이메일, 위조 사용자 ID는 허용하지 않는다.
- JSON 입력 32KiB, 전체 프롬프트 40KB, 고정 모델 `gpt-4o-mini`, 출력 10,000토큰, 모델 호출 전체 120초 제한.
- SQL 예약 후에만 모델을 호출한다. 사용자 3회/UTC일, 전체 30회/UTC일·600회/UTC월, 사용자별 60초 대기. 실패·취소한 호출도 예약을 반환하지 않는다.
- 한 호출에 $0.02를 보수적으로 예약하므로 예약 상한은 하루 $0.60·월 $12다. 실제 청구액을 측정하는 장부가 아니며 다른 기능·프로젝트의 비용은 포함하지 않는다. 모델이나 가격이 바뀌면 다시 검토해야 한다.
- 이미지 생성 POST는 계속 차단한다. 기존 이미지 GET은 유지한다.

## 운영 적용 및 남은 연결

Supabase 프로젝트 `xvhhodbwukyhhjzpyqmo`에 `202610280001_scenario_quota.sql` 적용 완료. 익명 사용자의 두 RPC 호출은 모두 401/권한 없음, 서버 역할의 상태 조회는 정상 응답하며 DB 활성화 값은 false다.

인증 기본 복귀 주소는 `https://folklore-bestiary.vercel.app/en/login`, 허용 주소는 같은 운영 도메인의 `/ko/login`, `/en/login`, `/ja/login`, `/zh/login` 네 개다. 미리보기 전체 도메인 와일드카드는 추가하지 않았다.

Google Cloud 전용 프로젝트 `mythoria-login-20261028`를 만들었다. 기존 아트링크·펫워크 프로젝트를 수정하지 않았다. Google 사용자 데이터 정책 동의 화면까지 준비했으며, 동의 확인 전에는 앱 등록·OAuth 자격증명 발급을 완료하지 않는다. 필요한 콜백은 `https://xvhhodbwukyhhjzpyqmo.supabase.co/auth/v1/callback`이다. 요청 권한은 로그인용 이메일·기본 프로필로 제한한다.

Supabase에는 Google 공급자 자격증명과 운영 SMTP가 아직 없다. 기본 메일 서비스는 일반 가입자에게 발송할 수 없으므로 `AUTH_EMAIL_ENABLED`는 켜지 않았다. 이메일 템플릿 원본은 `supabase/templates/sign-in.html`이며 신규가입 확인/일회용 로그인 양쪽 템플릿에 적용한다. SMTP를 연결할 때 발신 도메인·발송 제한·외부 이메일 수신·코드 검증을 확인해야 한다.

## 개통 순서

1. Google 공급자 연결 또는 운영 SMTP 연결 후 실제 일반 사용자 로그인 성공을 확인한다. Google은 테스트 사용자 전용 상태를 해제하고 외부 계정으로 확인한다.
2. 이메일을 개통할 때만 Vercel `AUTH_EMAIL_ENABLED=true`를 설정한다. 기본 메일러 상태에서는 설정하지 않는다.
3. 로그인과 SQL 권한·한도 검증을 마친 후 DB의 `mythoria_private.scenario_generation_control.enabled`와 서버 환경변수 `SCENARIO_AI_ENABLED=true`를 모두 켠다. 하나라도 꺼져 있거나 DB 장애가 발생하면 유료 호출은 차단된다.
4. 운영 배포 후 익명 요청 401, 인증 사용자 한도 조회, 한도 초과 시 모델 미호출을 확인한다. 실제 유료 생성 검증은 건별 승인 범위에서 수행한다.

시크릿은 저장소·명령줄 인자·로그에 넣지 않는다. CLI 환경변수 입력은 표준입력/환경변수를 사용한다.

## 검증

- `node scripts/test-auth-config.mjs`
- `node scripts/test-auth-ui.mjs`
- `node scripts/test-scenario-access.mjs`
- `node scripts/test-paid-ai-lockdown.mjs`
- `node scripts/test-scenario-stream.mjs`
- `node scripts/test-writer-project.mjs`
- `scripts/test-scenario-quota.mjs`: 격리된 PostgreSQL 18의 독립 연결 50개와 PGlite에서 각각 18개 검증 통과. 테스트 스크립트 상단에 실행 환경 안내가 있다.
- `npx tsc --noEmit --incremental false`, `npm run build -- --webpack`

테스트는 실제 인증 메일이나 유료 모델 호출을 보내지 않는다.

참고: [Supabase 이메일 발송 제한](https://supabase.com/docs/guides/auth/auth-smtp), [Google 로그인 설정](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [모델 가격](https://developers.openai.com/api/docs/models/gpt-4o-mini).

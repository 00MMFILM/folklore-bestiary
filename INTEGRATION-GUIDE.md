# 🎨 GFS 크리처 이미지 시스템 — Claude Code 통합 가이드

## 개요
DALL-E 3 기반 하이브리드 이미지 생성 시스템을 folklore-bestiary 프로젝트에 통합하는 가이드입니다.

- **프리셋**: 6개 문화권 × 5개 = 30개 대표 크리처 (정적 에셋)
- **온디맨드**: 나머지 579개 크리처 (API 실시간 생성 → 캐싱)
- **스타일**: 웹툰/컨셉아트 (semi-realistic)
- **비용**: 프리셋 30개 ≈ $2.40 (HD), 온디맨드 건당 $0.08

---

## Step 1: OpenAI API 키 설정

```bash
# .env.local에 추가
echo 'OPENAI_API_KEY=sk-your-key-here' >> .env.local

# Vercel 환경변수에도 추가
vercel env add OPENAI_API_KEY
```

## Step 2: 파일 복사

아래 파일들을 프로젝트에 복사합니다:

```bash
# 프로젝트 루트에서 실행

# 1. 크리처 프롬프트 데이터베이스
cp lib/creature-prompts.ts ./lib/

# 2. API 라우트
mkdir -p app/api/generate-creature-image
cp app/api/generate-creature-image/route.ts ./app/api/generate-creature-image/

# 3. 이미지 컴포넌트
cp components/CreatureImage.tsx ./components/

# 4. 일괄 생성 스크립트
mkdir -p scripts
cp scripts/generate-preset-images.ts ./scripts/

# 5. 이미지 저장 디렉토리
mkdir -p public/creatures/{east-asia,europe,americas,africa,south-asia,oceania}
```

## Step 3: 의존성 설치

```bash
# OpenAI SDK (선택사항 - fetch로도 충분하지만 타입 지원용)
npm install openai

# 이미지 최적화 (이미 Next.js에 포함, 설정만 확인)
# next.config.js에 이미지 도메인 추가 필요
```

## Step 4: Next.js 이미지 설정

```javascript
// next.config.js (또는 next.config.mjs)에 추가
const nextConfig = {
  // ... 기존 설정 유지
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net', // DALL-E 임시 URL
      },
      // Vercel Blob 사용 시
      // {
      //   protocol: 'https',
      //   hostname: '*.public.blob.vercel-storage.com',
      // },
    ],
  },
};
```

## Step 5: 프리셋 이미지 일괄 생성

```bash
# 30개 프리셋 크리처 이미지 생성 (~2분, ~$2.40)
npx tsx scripts/generate-preset-images.ts

# 결과 확인
ls -la public/creatures/*/
cat public/creatures/generation-report.json
```

## Step 6: 기존 코드에 통합

### 크리처 카드에 이미지 추가

기존 크리처 카드 컴포넌트에서 SVG 아이콘 대신 `CreatureImage` 사용:

```tsx
import CreatureImage from '@/components/CreatureImage';
import { getCreatureById } from '@/lib/creature-prompts';

// 기존 크리처 카드 내부
function CreatureCard({ creature }) {
  const promptData = getCreatureById(creature.id);
  
  // 프리셋 이미지 경로 확인
  const presetImagePath = `/creatures/${promptData?.region}/${creature.id}.webp`;
  
  return (
    <div className="creature-card">
      <CreatureImage
        creatureId={creature.id}
        creatureName={creature.name}
        creatureNameEn={creature.nameEn}
        country={creature.country}
        fearLevel={creature.fearLevel}
        prompt={promptData?.prompt}
        imageUrl={presetImagePath}  // 프리셋 이미지가 있으면 사용
        size="md"
        showGenerateButton={!promptData} // 프리셋이 없으면 생성 버튼 표시
      />
      {/* ... 기존 카드 내용 ... */}
    </div>
  );
}
```

### 크리처 상세 페이지에 대형 이미지 추가

```tsx
// 상세 페이지에서는 xl 사이즈로
<CreatureImage
  creatureId={creature.id}
  creatureName={creature.name}
  creatureNameEn={creature.nameEn}
  country={creature.country}
  fearLevel={creature.fearLevel}
  prompt={promptData?.prompt}
  imageUrl={presetImagePath}
  size="xl"
  showGenerateButton={true}
/>
```

## Step 7: 배포

```bash
# 로컬 테스트
npm run dev

# Vercel 배포 (프리셋 이미지 포함)
git add public/creatures/
git commit -m "feat: DALL-E 3 크리처 이미지 시스템 추가 (30개 프리셋)"
git push

# Vercel이 자동 배포
```

---

## 파일 구조

```
folklore-bestiary/
├── app/
│   └── api/
│       └── generate-creature-image/
│           └── route.ts          ← DALL-E 3 API 엔드포인트
├── components/
│   └── CreatureImage.tsx         ← 이미지 표시/생성 컴포넌트
├── lib/
│   └── creature-prompts.ts       ← 30개 크리처 프롬프트 DB
├── scripts/
│   └── generate-preset-images.ts ← 일괄 생성 스크립트
└── public/
    └── creatures/
        ├── east-asia/
        │   ├── dokkaebi.webp
        │   ├── gumiho.webp
        │   └── ...
        ├── europe/
        ├── americas/
        ├── africa/
        ├── south-asia/
        ├── oceania/
        ├── image-map.json        ← 자동 생성된 이미지 매핑
        └── generation-report.json
```

---

## 비용 예측

| 항목 | 수량 | 단가 | 합계 |
|------|------|------|------|
| 프리셋 (HD) | 30개 | $0.080 | $2.40 |
| 온디맨드 (HD) | ~579개 | $0.080 | $46.32 |
| **전체** | **609개** | | **$48.72** |

> 💡 온디맨드는 사용자가 상세 페이지 진입 시 1회만 생성 후 캐싱.
> 실제 비용은 사용 패턴에 따라 훨씬 낮을 수 있음.

---

## 향후 확장

1. **Vercel Blob 캐싱** — 생성된 이미지 영구 저장 (DALL-E URL은 1시간 후 만료)
2. **이미지 변형** — 같은 크리처의 다양한 포즈/장면 생성
3. **사용자 컬렉션 썸네일** — 컬렉션에 추가된 크리처만 이미지 생성
4. **문화권 150개 확장** — 프롬프트 DB를 150개국으로 확장
5. **WebP 최적화** — Next.js Image 컴포넌트로 자동 최적화

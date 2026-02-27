import { NextRequest } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT_KO = `당신은 한국 영화/드라마 전문 시나리오 기획자입니다.
장르, 크리처, 주인공 정보, 배경, 키워드, 분위기를 받고, **기승전결 4막 × 5비트 전문 트리트먼트**를 생성합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "시나리오 제목",
  "logline": "한 문장 핵심 요약 (누가 + 무엇을 + 왜 + 장애물)",
  "setting": "배경 설명 (2-3문장)",
  "theme": "주제의식 (한 단어~짧은 구)",
  "targetAudience": "타겟 관객/등급 (예: 15세 이상, 20-40대)",
  "openingImage": "오프닝 이미지 — 첫 장면 시각 묘사 (1-2문장)",
  "closingImage": "클로징 이미지 — 마지막 장면 북엔드 (1-2문장)",
  "culturalContext": "민속학적 맥락 — 크리처의 문화적/역사적 배경 설명 (2-3문장)",
  "characterArc": {
    "protagonist": "주인공 이름",
    "role": "역할",
    "flaw": "내적 결함",
    "ghost": "결함을 만든 과거의 상처 (1문장)",
    "want": "의식적 욕구",
    "need": "무의식적 필요",
    "transformation": "변화 (결함→성장)"
  },
  "secondaryCharacter": {
    "name": "조연 이름",
    "role": "역할 (예: 멘토, 연인, 라이벌)",
    "function": "서사적 기능 (예: 주인공의 거울, 주제 강화)",
    "miniArc": "조연의 소규모 변화 아크 (1문장)"
  },
  "conflictLayers": {
    "external": "외적 갈등 (물리적 장애물/적대 세력)",
    "internal": "내적 갈등 (주인공의 내면 투쟁)",
    "relational": "관계적 갈등 (인물 간 갈등)",
    "thematic": "주제적 갈등 (작품이 던지는 질문)"
  },
  "subplot": {
    "name": "B스토리 이름",
    "description": "서브플롯 설명 (1-2문장)",
    "intersections": [2, 3]
  },
  "creatureRoles": [
    {
      "name": "존재명",
      "narrativeRole": "적대자|조력자|거울|촉매|문지기|변신자",
      "plotMechanic": "능력/약점이 플롯에 작용하는 방식 (1문장)",
      "visualSignature": "외형 시그니처 — 시각적 특징 묘사 (1문장)",
      "folkloreSignificance": "민속학적 의미 — 이 존재가 원래 전설에서 상징하는 것 (1문장)"
    }
  ],
  "acts": [
    { "act": 1, "label": "기 (Setup)", "title": "막 제목",
      "mood": "촬영 톤/분위기 노트 (1문장)",
      "keyDialogue": "이 막의 핵심 대사 1줄",
      "beats": [
        { "beat": "일상 세계", "desc": "...(3-5문장)", "emotion": "평온/불안", "subplot": false },
        { "beat": "촉발 사건", "desc": "...(3-5문장)", "emotion": "충격", "subplot": false },
        { "beat": "망설임/저항", "desc": "...(3-5문장)", "emotion": "두려움", "subplot": false },
        { "beat": "B스토리 도입", "desc": "...(3-5문장)", "emotion": "호기심", "subplot": true },
        { "beat": "결심/문턱넘기", "desc": "...(3-5문장)", "emotion": "결의", "subplot": false }
      ]
    },
    { "act": 2, "label": "승 (Development)", "title": "막 제목",
      "mood": "...", "keyDialogue": "...",
      "beats": [
        { "beat": "새로운 세계", "desc": "...", "emotion": "경이", "subplot": false },
        { "beat": "시련과 동맹", "desc": "...", "emotion": "긴장", "subplot": false },
        { "beat": "B스토리 심화", "desc": "...", "emotion": "...", "subplot": true },
        { "beat": "중간점", "desc": "...", "emotion": "각성", "subplot": false },
        { "beat": "적의 반격", "desc": "...", "emotion": "절박", "subplot": false }
      ]
    },
    { "act": 3, "label": "전 (Twist)", "title": "막 제목",
      "mood": "...", "keyDialogue": "...",
      "beats": [
        { "beat": "위기 고조", "desc": "...", "emotion": "긴장", "subplot": false },
        { "beat": "가장 어두운 순간", "desc": "...", "emotion": "절망", "subplot": false },
        { "beat": "B스토리 교차", "desc": "...", "emotion": "...", "subplot": true },
        { "beat": "반전/깨달음", "desc": "...", "emotion": "각성", "subplot": false },
        { "beat": "재기의 결단", "desc": "...", "emotion": "결의", "subplot": false }
      ]
    },
    { "act": 4, "label": "결 (Resolution)", "title": "막 제목",
      "mood": "...", "keyDialogue": "...",
      "beats": [
        { "beat": "최종 대결 준비", "desc": "...", "emotion": "비장", "subplot": false },
        { "beat": "클라이맥스", "desc": "...", "emotion": "격정", "subplot": false },
        { "beat": "B스토리 해소", "desc": "...", "emotion": "...", "subplot": true },
        { "beat": "해결", "desc": "...", "emotion": "해방", "subplot": false },
        { "beat": "새로운 일상", "desc": "...", "emotion": "평온/희망", "subplot": false }
      ]
    }
  ],
  "twist": "핵심 반전 1문장"
}

규칙:
- 총 20비트(4막×5비트). 각 비트의 desc는 **3-5문장**으로 캐릭터 행동/갈등/결과를 구체적으로 작성
- 각 비트에 emotion(감정 상태 1-3단어)과 subplot(B스토리 비트 여부 boolean) 포함
- 각 막에 mood(촬영 톤/분위기 노트)와 keyDialogue(핵심 대사 1줄) 포함
- 크리처의 능력(ab)과 약점(wk)을 플롯에 반드시 활용
- 크리처의 외형(vk)과 출처(src)를 visualSignature와 folkloreSignificance에 활용
- 캐릭터 아크: ghost가 flaw를 만들고, flaw가 장애물이 되며, 3막에서 need를 깨달아 4막에서 변화
- secondaryCharacter: 주인공을 비추는 거울이자 B스토리의 축
- conflictLayers: 4중 갈등(외적/내적/관계적/주제적)이 유기적으로 연결
- creatureRoles: 각 크리처의 서사 기능 + 시각 시그니처 + 민속학적 의미 명시
- narrativeRole 선택지: 적대자, 조력자, 거울, 촉매, 문지기(Threshold Guardian), 변신자(Shapeshifter)
- openingImage와 closingImage로 시각적 북엔드 형성
- 한국어로 작성. 전문 트리트먼트 수준으로 창의적이고 극적으로.`;

const SYSTEM_PROMPT_EN = `You are a professional film/drama scenario planner.
Given genre, creatures, protagonist info, setting era, keywords, and tone, generate a **4-act × 5-beat professional treatment**.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Scenario Title",
  "logline": "One-sentence core summary (who + what + why + obstacle)",
  "setting": "Setting description (2-3 sentences)",
  "theme": "Thematic statement (short phrase)",
  "targetAudience": "Target audience/rating (e.g., PG-15, ages 20-40)",
  "openingImage": "Opening image — first scene visual description (1-2 sentences)",
  "closingImage": "Closing image — final scene bookend (1-2 sentences)",
  "culturalContext": "Folklore context — cultural/historical background of the creatures (2-3 sentences)",
  "characterArc": {
    "protagonist": "Protagonist name",
    "role": "Role",
    "flaw": "Internal flaw",
    "ghost": "Past wound that created the flaw (1 sentence)",
    "want": "Conscious desire",
    "need": "Unconscious need",
    "transformation": "Change (flaw → growth)"
  },
  "secondaryCharacter": {
    "name": "Secondary character name",
    "role": "Role (e.g., mentor, love interest, rival)",
    "function": "Narrative function (e.g., mirror of protagonist, thematic reinforcement)",
    "miniArc": "Secondary character's small arc (1 sentence)"
  },
  "conflictLayers": {
    "external": "External conflict (physical obstacles/antagonistic forces)",
    "internal": "Internal conflict (protagonist's inner struggle)",
    "relational": "Relational conflict (interpersonal tensions)",
    "thematic": "Thematic conflict (the question the story asks)"
  },
  "subplot": {
    "name": "B-Story name",
    "description": "Subplot description (1-2 sentences)",
    "intersections": [2, 3]
  },
  "creatureRoles": [
    {
      "name": "Creature name",
      "narrativeRole": "Antagonist|Ally|Mirror|Catalyst|Threshold Guardian|Shapeshifter",
      "plotMechanic": "How abilities/weaknesses drive the plot (1 sentence)",
      "visualSignature": "Visual signature — distinctive visual trait description (1 sentence)",
      "folkloreSignificance": "Folklore significance — what this creature symbolizes in its original legend (1 sentence)"
    }
  ],
  "acts": [
    { "act": 1, "label": "Act I (Setup)", "title": "Act title",
      "mood": "Cinematography tone/mood note (1 sentence)",
      "keyDialogue": "Key dialogue line for this act",
      "beats": [
        { "beat": "Ordinary World", "desc": "...(3-5 sentences)", "emotion": "Calm/Unease", "subplot": false },
        { "beat": "Inciting Incident", "desc": "...(3-5 sentences)", "emotion": "Shock", "subplot": false },
        { "beat": "Hesitation/Resistance", "desc": "...(3-5 sentences)", "emotion": "Fear", "subplot": false },
        { "beat": "B-Story Introduction", "desc": "...(3-5 sentences)", "emotion": "Curiosity", "subplot": true },
        { "beat": "Decision/Crossing Threshold", "desc": "...(3-5 sentences)", "emotion": "Resolve", "subplot": false }
      ]
    },
    { "act": 2, "label": "Act II (Development)", "title": "Act title",
      "mood": "...", "keyDialogue": "...",
      "beats": [
        { "beat": "New World", "desc": "...", "emotion": "Wonder", "subplot": false },
        { "beat": "Trials & Allies", "desc": "...", "emotion": "Tension", "subplot": false },
        { "beat": "B-Story Deepening", "desc": "...", "emotion": "...", "subplot": true },
        { "beat": "Midpoint", "desc": "...", "emotion": "Awakening", "subplot": false },
        { "beat": "Enemy Strikes Back", "desc": "...", "emotion": "Urgency", "subplot": false }
      ]
    },
    { "act": 3, "label": "Act III (Twist)", "title": "Act title",
      "mood": "...", "keyDialogue": "...",
      "beats": [
        { "beat": "Rising Crisis", "desc": "...", "emotion": "Tension", "subplot": false },
        { "beat": "Darkest Moment", "desc": "...", "emotion": "Despair", "subplot": false },
        { "beat": "B-Story Intersection", "desc": "...", "emotion": "...", "subplot": true },
        { "beat": "Reversal/Epiphany", "desc": "...", "emotion": "Awakening", "subplot": false },
        { "beat": "Rally", "desc": "...", "emotion": "Resolve", "subplot": false }
      ]
    },
    { "act": 4, "label": "Act IV (Resolution)", "title": "Act title",
      "mood": "...", "keyDialogue": "...",
      "beats": [
        { "beat": "Final Preparation", "desc": "...", "emotion": "Gravitas", "subplot": false },
        { "beat": "Climax", "desc": "...", "emotion": "Intensity", "subplot": false },
        { "beat": "B-Story Resolution", "desc": "...", "emotion": "...", "subplot": true },
        { "beat": "Resolution", "desc": "...", "emotion": "Liberation", "subplot": false },
        { "beat": "New Normal", "desc": "...", "emotion": "Peace/Hope", "subplot": false }
      ]
    }
  ],
  "twist": "Key twist (1 sentence)"
}

Rules:
- Total 20 beats (4 acts × 5 beats). Each beat's desc should be **3-5 specific sentences** detailing character actions/conflict/consequences
- Each beat includes emotion (1-3 word emotional state) and subplot (boolean for B-story beat)
- Each act includes mood (cinematography tone note) and keyDialogue (one key dialogue line)
- Incorporate creatures' abilities (ab) and weaknesses (wk) into the plot
- Use creatures' visual features (vk) and sources (src) for visualSignature and folkloreSignificance
- Character arc: ghost creates flaw, flaw becomes obstacle, need realized in Act 3, transformation in Act 4
- secondaryCharacter: mirrors the protagonist and anchors the B-story
- conflictLayers: 4 conflict layers (external/internal/relational/thematic) organically connected
- creatureRoles: specify each creature's narrative function + visual signature + folklore significance
- narrativeRole options: Antagonist, Ally, Mirror, Catalyst, Threshold Guardian, Shapeshifter
- openingImage and closingImage form a visual bookend
- Write in English. Professional treatment quality, creative and dramatic.`;

export async function POST(req: NextRequest) {
  try {
    const { genre, beings, protagonist, era, keywords, tone, lang } = await req.json();
    const isKo = lang !== 'en';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const beingDescriptions = (beings || [])
      .map((b: { n: string; t: string; d: string; country: string; ct?: string; ab?: string[]; wk?: string[]; sh?: string | string[]; vk?: string; src?: string; ln?: string; gf?: string }) => {
        let line = `- ${b.n}${b.ln ? ` (${b.ln})` : ''} [${b.t}, ${b.country}]: ${b.d}`;
        if (b.vk) line += `\n  외형/Visual: ${b.vk}`;
        if (b.src) line += `\n  출처/Source: ${b.src}`;
        if (b.gf) line += `\n  장르적합/Genre Fit: ${b.gf}`;
        if (b.ab?.length) line += `\n  능력/Abilities: ${b.ab.join(', ')}`;
        if (b.wk?.length) line += `\n  약점/Weaknesses: ${b.wk.join(', ')}`;
        if (b.sh) line += `\n  스토리훅/Story Hook: ${Array.isArray(b.sh) ? b.sh.join('; ') : b.sh}`;
        return line;
      })
      .join('\n');

    const userPrompt = isKo
      ? [
          `장르: ${genre || '자유'}`,
          `등장 존재:\n${beingDescriptions || '(자동 배정)'}`,
          protagonist?.name ? `주인공: ${protagonist.name}${protagonist.role ? ` (${protagonist.role})` : ''}` : '',
          era ? `배경 시대: ${era}` : '',
          keywords?.length ? `키워드: ${keywords.join(', ')}` : '',
          tone ? `분위기: ${tone}` : '',
        ].filter(Boolean).join('\n')
      : [
          `Genre: ${genre || 'Free'}`,
          `Creatures:\n${beingDescriptions || '(auto-assigned)'}`,
          protagonist?.name ? `Protagonist: ${protagonist.name}${protagonist.role ? ` (${protagonist.role})` : ''}` : '',
          era ? `Era/Setting: ${era}` : '',
          keywords?.length ? `Keywords: ${keywords.join(', ')}` : '',
          tone ? `Tone: ${tone}` : '',
        ].filter(Boolean).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: isKo ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        temperature: 0.85,
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Scenario AI Error]', err);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Scenario AI] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

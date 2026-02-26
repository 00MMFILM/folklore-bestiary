import { NextRequest } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT_KO = `You are a creative scenario writer specializing in folklore and mythology-based stories.
Given genre, creatures, protagonist info, setting era, keywords, and tone, generate a compelling 5-chapter scenario.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "시나리오 제목",
  "setting": "배경 설명 (1-2문장)",
  "chapters": [
    { "num": 1, "title": "서막 — 부제", "desc": "챕터 설명 (2-3문장)" },
    { "num": 2, "title": "발단 — 부제", "desc": "챕터 설명 (2-3문장)" },
    { "num": 3, "title": "전개 — 부제", "desc": "챕터 설명 (2-3문장)" },
    { "num": 4, "title": "위기 — 부제", "desc": "챕터 설명 (2-3문장)" },
    { "num": 5, "title": "절정과 결말 — 부제", "desc": "챕터 설명 (2-3문장)" }
  ],
  "twist": "핵심 반전 (1문장)"
}

Write in Korean. Be creative and dramatic. Incorporate the creatures' abilities and weaknesses into the plot.`;

const SYSTEM_PROMPT_EN = `You are a creative scenario writer specializing in folklore and mythology-based stories.
Given genre, creatures, protagonist info, setting era, keywords, and tone, generate a compelling 5-chapter scenario.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Scenario Title",
  "setting": "Setting description (1-2 sentences)",
  "chapters": [
    { "num": 1, "title": "Prologue — Subtitle", "desc": "Chapter description (2-3 sentences)" },
    { "num": 2, "title": "Act I — Subtitle", "desc": "Chapter description (2-3 sentences)" },
    { "num": 3, "title": "Act II — Subtitle", "desc": "Chapter description (2-3 sentences)" },
    { "num": 4, "title": "Act III — Subtitle", "desc": "Chapter description (2-3 sentences)" },
    { "num": 5, "title": "Climax & Resolution — Subtitle", "desc": "Chapter description (2-3 sentences)" }
  ],
  "twist": "Key twist (1 sentence)"
}

Write in English. Be creative and dramatic. Incorporate the creatures' abilities and weaknesses into the plot.`;

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
      .map((b: { n: string; t: string; d: string; country: string; ct?: string }) =>
        `- ${b.n} (${b.t}, ${b.country}): ${b.d}`
      )
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
        temperature: 0.9,
        max_tokens: 2000,
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

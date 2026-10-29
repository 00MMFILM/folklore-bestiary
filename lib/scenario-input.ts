export const MAX_SCENARIO_BODY_BYTES = 32 * 1024;
export const MAX_SCENARIO_PROMPT_BYTES = 40000;

export type ScenarioBeing = {
  n: string; t: string; d: string; country: string;
  ct?: string; ln?: string; ab?: string[]; wk?: string[];
  sh?: string | string[]; vk?: string | string[];
  src?: string | string[]; gf?: string | string[];
};
export type ScenarioInput = {
  genre: string; beings: ScenarioBeing[];
  protagonist?: { name?: string; role?: string };
  era?: string; keywords?: string[]; tone?: string; lang: 'ko' | 'en';
};

export class ScenarioInputError extends Error {
  constructor(public readonly status = 400) { super('Invalid scenario input'); }
}

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new ScenarioInputError();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false): string | undefined {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ScenarioInputError();
  return value.trim();
}
function list(value: unknown, maxCount: number, maxLength: number): string[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > maxCount) throw new ScenarioInputError();
  return value.map(item => text(item, maxLength, true)!);
}
function textOrList(value: unknown, maxLength: number): string | string[] | undefined {
  return Array.isArray(value) ? list(value, 10, maxLength) : text(value, maxLength);
}

export function validateScenarioInput(value: unknown): ScenarioInput {
  const input = object(value, ['genre', 'beings', 'protagonist', 'era', 'keywords', 'tone', 'lang']);
  if (input.lang !== 'ko' && input.lang !== 'en') throw new ScenarioInputError();
  if (!Array.isArray(input.beings) || input.beings.length < 1 || input.beings.length > 4) throw new ScenarioInputError();
  const beings = input.beings.map(value => {
    const b = object(value, ['n', 't', 'd', 'country', 'ct', 'ln', 'ab', 'wk', 'sh', 'vk', 'src', 'gf']);
    return {
      n: text(b.n, 160, true)!, t: text(b.t, 100, true)!,
      d: text(b.d, 4000, true)!, country: text(b.country, 160, true)!,
      ct: text(b.ct, 100), ln: text(b.ln, 160),
      ab: list(b.ab, 10, 400), wk: list(b.wk, 10, 400),
      sh: textOrList(b.sh, 1000), vk: textOrList(b.vk, 1000),
      src: textOrList(b.src, 1200), gf: textOrList(b.gf, 200),
    };
  });
  const protagonist = input.protagonist == null ? undefined : object(input.protagonist, ['name', 'role']);
  return {
    genre: text(input.genre, 100, true)!, beings,
    protagonist: protagonist ? { name: text(protagonist.name, 120), role: text(protagonist.role, 200) } : undefined,
    era: text(input.era, 500), keywords: list(input.keywords, 12, 100),
    tone: text(input.tone, 200), lang: input.lang,
  };
}

export async function readScenarioInput(request: Request): Promise<ScenarioInput> {
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') throw new ScenarioInputError();
  const declaredSize = request.headers.get('content-length');
  if (declaredSize != null && (!/^\d+$/.test(declaredSize) || Number(declaredSize) > MAX_SCENARIO_BODY_BYTES)) throw new ScenarioInputError(413);
  if (!request.body || request.signal.aborted) throw new ScenarioInputError();
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: () => void = () => {};
  try {
    const interrupted = new Promise<never>((_, reject) => {
      abort = () => { void reader.cancel().catch(() => {}); reject(new ScenarioInputError()); };
      timer = setTimeout(abort, 10000);
      request.signal.addEventListener('abort', abort, { once: true });
    });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await Promise.race([reader.read(), interrupted]);
      if (done) break;
      length += value.byteLength;
      if (length > MAX_SCENARIO_BODY_BYTES) { void reader.cancel().catch(() => {}); throw new ScenarioInputError(413); }
      chunks.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    return validateScenarioInput(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)));
  } catch (error) {
    if (error instanceof ScenarioInputError) throw error;
    throw new ScenarioInputError();
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}

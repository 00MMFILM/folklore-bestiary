import { createClient } from '@supabase/supabase-js';

export class ScenarioAccessError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}
export type ScenarioQuota = {
  allowed: boolean;
  code: 'ALLOWED' | 'USER_LIMIT' | 'GLOBAL_LIMIT' | 'RATE_LIMIT' | 'GENERATION_DISABLED' | 'INVALID_USER';
  remaining: number;
  reset_at: string;
};

// Separate, non-persistent clients prevent one request's session from replacing
// the service-role authorization used by another request.
function client(request: Request, privileged: boolean) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = privileged ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]) }) },
  });
}

export async function authenticateScenarioUser(request: Request): Promise<string> {
  const header = request.headers.get('authorization') || '';
  const token = /^Bearer ([^\s]+)$/i.exec(header)?.[1];
  if (!token || token.length > 8192) throw new ScenarioAccessError(401, 'AUTH_REQUIRED');
  try {
    // getUser performs server-side token verification; browser session data and
    // x-user-id/body fields never authorize a paid operation.
    const { data, error } = await client(request, false).auth.getUser(token);
    if (error) {
      if (error.status === 0 || (error.status != null && error.status >= 500)) throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
      throw new ScenarioAccessError(401, 'AUTH_REQUIRED');
    }
    const user = data.user;
    if (!user?.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) throw new ScenarioAccessError(401, 'AUTH_REQUIRED');
    if (user.is_anonymous || !user.email || !user.email_confirmed_at) throw new ScenarioAccessError(403, 'EMAIL_UNVERIFIED');
    return user.id;
  } catch (error) {
    if (error instanceof ScenarioAccessError) throw error;
    throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
  }
}

export function requireScenarioEnabled(): void {
  if (process.env.SCENARIO_AI_ENABLED !== 'true' || !process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
}

export async function scenarioQuota(request: Request, userId: string, reserve: boolean): Promise<ScenarioQuota> {
  try {
    const { data, error } = await client(request, true).rpc(reserve ? 'reserve_scenario_generation' : 'get_scenario_generation_quota', { p_user_id: userId });
    const codes = ['ALLOWED', 'USER_LIMIT', 'GLOBAL_LIMIT', 'RATE_LIMIT', 'GENERATION_DISABLED', 'INVALID_USER'];
    if (error || !data || typeof data.allowed !== 'boolean' || !codes.includes(data.code) || !Number.isInteger(data.remaining) || data.remaining < 0 || data.remaining > 3 || typeof data.reset_at !== 'string' || !Number.isFinite(Date.parse(data.reset_at)) || data.allowed !== (data.code === 'ALLOWED')) throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
    if (data.code === 'GENERATION_DISABLED' || data.code === 'INVALID_USER') throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
    return data as ScenarioQuota;
  } catch (error) {
    if (error instanceof ScenarioAccessError) throw error;
    throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
  }
}

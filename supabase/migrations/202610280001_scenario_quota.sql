-- Paid scenario generation is fail-closed until an operator explicitly enables it.
-- Apply with a trusted database-owner session (Supabase SQL editor or migration CLI).
-- The API must verify the Supabase user and bound model/input/output before reserving.
-- One successful reservation costs one call even if the provider fails or disconnects;
-- there is deliberately no refund RPC, which would permit accounting races.
-- Reservation: USD 0.02/call; per-user 3/day, site 30/day and 600/month (UTC).
-- $0.60/day and $12/month are reserved upper bounds, not measured provider invoices.
-- Google/email delivery and API guards must pass before enabling both DB + API flags:
-- UPDATE mythoria_private.scenario_generation_control SET enabled=true, updated_at=now() WHERE singleton;
BEGIN;

CREATE SCHEMA IF NOT EXISTS mythoria_private;
REVOKE ALL ON SCHEMA mythoria_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS mythoria_private.scenario_generation_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO mythoria_private.scenario_generation_control(singleton, enabled)
VALUES (true, false) ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS mythoria_private.scenario_generation_user_usage (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  calls integer NOT NULL CHECK (calls BETWEEN 0 AND 3),
  last_reserved_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS mythoria_private.scenario_generation_daily_usage (
  day date PRIMARY KEY,
  calls integer NOT NULL CHECK (calls BETWEEN 0 AND 30),
  reserved_usd numeric(8,2) GENERATED ALWAYS AS (calls::numeric * 0.02) STORED
);
CREATE TABLE IF NOT EXISTS mythoria_private.scenario_generation_monthly_usage (
  month date PRIMARY KEY CHECK (extract(day FROM month) = 1),
  calls integer NOT NULL CHECK (calls BETWEEN 0 AND 600),
  reserved_usd numeric(8,2) GENERATED ALWAYS AS (calls::numeric * 0.02) STORED
);

ALTER TABLE mythoria_private.scenario_generation_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE mythoria_private.scenario_generation_user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE mythoria_private.scenario_generation_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE mythoria_private.scenario_generation_monthly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE mythoria_private.scenario_generation_control,
  mythoria_private.scenario_generation_user_usage,
  mythoria_private.scenario_generation_daily_usage,
  mythoria_private.scenario_generation_monthly_usage
FROM PUBLIC, anon, authenticated, service_role;

-- The single control-row lock is the serialization point for ALL users and periods.
-- Read-only status uses the same lock for a coherent snapshot but writes no counters.
-- Obtain the timestamp AFTER the lock: a queued request cannot use yesterday's quota.
CREATE OR REPLACE FUNCTION mythoria_private.scenario_generation_quota(
  p_user_id uuid,
  p_reserve boolean
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_enabled boolean;
  v_now timestamptz;
  v_day date;
  v_month date;
  v_day_reset timestamptz;
  v_month_reset timestamptz;
  v_last_reserved_at timestamptz;
  v_user_calls integer := 0;
  v_day_calls integer := 0;
  v_month_calls integer := 0;
  v_remaining integer;
BEGIN
  SELECT enabled INTO v_enabled
  FROM mythoria_private.scenario_generation_control
  WHERE singleton = true
  FOR UPDATE;

  v_now := clock_timestamp();
  v_day := (v_now AT TIME ZONE 'UTC')::date;
  v_month := date_trunc('month', v_now AT TIME ZONE 'UTC')::date;
  v_day_reset := (v_day + 1)::timestamp AT TIME ZONE 'UTC';
  v_month_reset := (v_month + interval '1 month')::timestamp AT TIME ZONE 'UTC';

  IF v_enabled IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'GENERATION_DISABLED',
      'remaining', 0, 'limit', 3, 'reset_at', v_day_reset);
  END IF;
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'INVALID_USER',
      'remaining', 0, 'limit', 3, 'reset_at', v_day_reset);
  END IF;

  SELECT CASE WHEN day = v_day THEN calls ELSE 0 END, last_reserved_at
    INTO v_user_calls, v_last_reserved_at
  FROM mythoria_private.scenario_generation_user_usage WHERE user_id = p_user_id;
  SELECT calls INTO v_day_calls FROM mythoria_private.scenario_generation_daily_usage WHERE day = v_day;
  SELECT calls INTO v_month_calls FROM mythoria_private.scenario_generation_monthly_usage WHERE month = v_month;
  v_user_calls := coalesce(v_user_calls, 0);
  v_day_calls := coalesce(v_day_calls, 0);
  v_month_calls := coalesce(v_month_calls, 0);
  v_remaining := greatest(0, least(3 - v_user_calls, 30 - v_day_calls, 600 - v_month_calls));

  -- Check the longest global reset first if multiple limits have been reached.
  IF v_month_calls >= 600 THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'GLOBAL_LIMIT',
      'remaining', 0, 'limit', 3, 'reset_at', v_month_reset, 'scope', 'global_month');
  ELSIF v_day_calls >= 30 THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'GLOBAL_LIMIT',
      'remaining', 0, 'limit', 3, 'reset_at', v_day_reset, 'scope', 'global_day');
  ELSIF v_user_calls >= 3 THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'USER_LIMIT',
      'remaining', 0, 'limit', 3, 'reset_at', v_day_reset, 'scope', 'user_day');
  ELSIF v_last_reserved_at IS NOT NULL AND v_last_reserved_at + interval '60 seconds' > v_now THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'RATE_LIMIT',
      'remaining', v_remaining, 'limit', 3,
      'reset_at', v_last_reserved_at + interval '60 seconds', 'scope', 'cooldown');
  END IF;

  IF p_reserve THEN
    INSERT INTO mythoria_private.scenario_generation_user_usage(user_id, day, calls, last_reserved_at)
    VALUES (p_user_id, v_day, 1, v_now)
    ON CONFLICT (user_id) DO UPDATE SET day = v_day, calls = v_user_calls + 1, last_reserved_at = v_now;
    INSERT INTO mythoria_private.scenario_generation_daily_usage(day, calls)
    VALUES (v_day, 1)
    ON CONFLICT (day) DO UPDATE SET calls = v_day_calls + 1;
    INSERT INTO mythoria_private.scenario_generation_monthly_usage(month, calls)
    VALUES (v_month, 1)
    ON CONFLICT (month) DO UPDATE SET calls = v_month_calls + 1;
    v_remaining := v_remaining - 1;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'code', 'ALLOWED',
    'remaining', v_remaining, 'limit', 3, 'reset_at', v_day_reset,
    'reserved_usd', CASE WHEN p_reserve THEN 0.02 ELSE 0 END,
    'retry_at', CASE WHEN p_reserve THEN v_now + interval '60 seconds' ELSE v_now END);
END;
$$;
REVOKE ALL ON FUNCTION mythoria_private.scenario_generation_quota(uuid, boolean)
FROM PUBLIC, anon, authenticated, service_role;

-- SECURITY DEFINER is restricted to these two fixed, fully qualified wrappers.
-- There are no client-controlled limit, clock, price, model, or refund parameters.
CREATE OR REPLACE FUNCTION public.reserve_scenario_generation(p_user_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT mythoria_private.scenario_generation_quota(p_user_id, true);
$$;
CREATE OR REPLACE FUNCTION public.get_scenario_generation_quota(p_user_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT mythoria_private.scenario_generation_quota(p_user_id, false);
$$;
REVOKE ALL ON FUNCTION public.reserve_scenario_generation(uuid),
  public.get_scenario_generation_quota(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_scenario_generation(uuid),
  public.get_scenario_generation_quota(uuid) TO service_role;

COMMIT;

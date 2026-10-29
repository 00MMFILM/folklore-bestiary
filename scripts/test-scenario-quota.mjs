/**
 * Executes the quota migration against PostgreSQL (PGlite), never an AI provider.
 * Install the test-only engine outside this repository:
 *   npm install --prefix /tmp/mythoria-quota-test-runtime --no-save --no-package-lock @electric-sql/pglite
 *   PGLITE_MODULE_PATH=/tmp/mythoria-quota-test-runtime/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-scenario-quota.mjs
 * PGlite queues simultaneous dispatches on one connection. These assertions verify
 * transactions and privileges; genuine multi-connection lock contention requires
 * running a native PostgreSQL test cluster. For that mode, point POSTGRES_BIN_DIR
 * at a directory with initdb/pg_ctl and PG_MODULE_PATH at the pg package entry.
 * This always creates its own temporary cluster and cannot target a production DB.
 */
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const migration = await readFile(new URL('../supabase/migrations/202610280001_scenario_quota.sql', import.meta.url), 'utf8');
let db;
let engineName;
if (process.env.POSTGRES_BIN_DIR) {
  // This mode creates a NEW isolated test cluster. Never points at production.
  // Local Unix socket only, private temporary directory, no credentials or TCP port.
  const { Client, Pool } = await import(process.env.PG_MODULE_PATH
    ? pathToFileURL(process.env.PG_MODULE_PATH).href : 'pg');
  const exec = promisify(execFile);
  const root = await mkdtemp(join(tmpdir(), 'mythoria-quota-pg-'));
  const data = join(root, 'data');
  const socket = join(root, 'socket');
  await mkdir(socket, { mode: 0o700 });
  const binary = name => join(process.env.POSTGRES_BIN_DIR, name);
  await exec(binary('initdb'), ['-D', data, '-U', 'postgres', '--auth-local=trust', '--auth-host=reject', '--no-locale']);
  await exec(binary('pg_ctl'), ['-D', data, '-l', join(root, 'postgres.log'), '-o', `-k ${socket} -p 54329 -c listen_addresses=''`, '-w', 'start']);
  const connection = { host: socket, port: 54329, user: 'postgres', database: 'postgres' };
  const client = new Client(connection);
  const pool = new Pool({ ...connection, max: 50 });
  try { await client.connect(); } catch (error) {
    await exec(binary('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop']);
    throw error;
  }
  db = {
    query: (sql, args) => client.query(sql, args),
    exec: sql => client.query(sql),
    concurrentQuery: async (sql, args) => {
      const conn = await pool.connect();
      try {
        await conn.query('set role service_role');
        return await conn.query(sql, args);
      } finally { conn.release(); }
    },
    close: async () => {
      await pool.end(); await client.end();
      await exec(binary('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop']);
    },
  };
  engineName = 'PostgreSQL with 50 independent connections';
} else {
  const moduleName = process.env.PGLITE_MODULE_PATH
    ? pathToFileURL(process.env.PGLITE_MODULE_PATH).href
    : '@electric-sql/pglite';
  const { PGlite } = await import(moduleName);
  db = new PGlite();
  db.concurrentQuery = (sql, args) => db.query(sql, args);
  engineName = 'PGlite (single connection; dispatches are queued)';
}
console.log(`Engine: ${engineName}`);
let passed = 0;
const query = async (sql, args = []) => (await db.query(sql, args)).rows;
const one = async (sql, args = []) => (await query(sql, args))[0];
const rpc = async (name, user, concurrent = false) => (await (concurrent ? db.concurrentQuery : db.query.bind(db))(`select public.${name}($1::uuid) as result`, [user])).rows[0].result;
const reserve = (user, concurrent = false) => rpc('reserve_scenario_generation', user, concurrent);
const status = (user) => rpc('get_scenario_generation_quota', user);
const userId = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const test = async (name, run) => { await run(); passed++; console.log(`PASS ${name}`); };
const reset = async () => {
  await db.exec('truncate mythoria_private.scenario_generation_user_usage, mythoria_private.scenario_generation_daily_usage, mythoria_private.scenario_generation_monthly_usage; update mythoria_private.scenario_generation_control set enabled = true where singleton;');
};
const ageUser = async (id) => query("update mythoria_private.scenario_generation_user_usage set last_reserved_at = clock_timestamp() - interval '61 seconds' where user_id = $1::uuid", [id]);
const deniedAs = async (role, sql) => {
  await db.exec(`begin; set local role ${role};`);
  let error;
  try { await db.query(sql); } catch (caught) { error = caught; }
  finally { await db.exec('rollback'); }
  assert.equal(error?.code, '42501', `${role} must receive insufficient_privilege`);
};
try {
  await db.exec('create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);');
  await query('insert into auth.users(id) select (\'00000000-0000-4000-8000-\' || lpad(n::text, 12, \'0\'))::uuid from generate_series(1, 100) n');
  await db.exec(migration);

  await test('disabled by default; no quota reservations', async () => {
    const result = await reserve(userId(1));
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'GENERATION_DISABLED');
    assert.equal((await one('select count(*)::integer as count from mythoria_private.scenario_generation_daily_usage')).count, 0);
  });
  await test('anon/authenticated cannot execute RPCs or read/write private data', async () => {
    for (const role of ['anon', 'authenticated']) {
      await deniedAs(role, `select public.reserve_scenario_generation('${userId(1)}'::uuid)`);
      await deniedAs(role, `select public.get_scenario_generation_quota('${userId(1)}'::uuid)`);
      await deniedAs(role, 'select * from mythoria_private.scenario_generation_daily_usage');
      await deniedAs(role, 'update mythoria_private.scenario_generation_control set enabled=true');
    }
  });
  await test('service role can call RPCs but has no direct private-table privileges', async () => {
    await db.exec('begin; set local role service_role;');
    assert.equal((await reserve(userId(1))).code, 'GENERATION_DISABLED');
    await db.exec('rollback');
    await deniedAs('service_role', 'select * from mythoria_private.scenario_generation_daily_usage');
  });
  await reset();
  await test('unknown user IDs and null IDs fail closed', async () => {
    assert.equal((await reserve(userId(101))).code, 'INVALID_USER');
    assert.equal((await reserve(null)).code, 'INVALID_USER');
    assert.equal((await one('select count(*)::integer as count from mythoria_private.scenario_generation_user_usage')).count, 0);
  });
  await test('first call reserves one user/global call and $0.02', async () => {
    const result = await reserve(userId(1));
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 2);
    const daily = await one('select calls, reserved_usd::text as cost from mythoria_private.scenario_generation_daily_usage');
    assert.deepEqual(daily, { calls: 1, cost: '0.02' });
  });
  await test('cooldown rejects repeats without consuming extra quota', async () => {
    const result = await reserve(userId(1));
    assert.equal(result.code, 'RATE_LIMIT');
    assert.equal(result.remaining, 2);
    assert.ok(Date.parse(result.reset_at) > Date.now());
    assert.equal((await one('select calls from mythoria_private.scenario_generation_daily_usage')).calls, 1);
  });
  await test('read-only quota status never reserves', async () => {
    const before = await one('select calls from mythoria_private.scenario_generation_daily_usage');
    for (let i = 0; i < 5; i++) assert.equal((await status(userId(2))).remaining, 3);
    assert.deepEqual(await one('select calls from mythoria_private.scenario_generation_daily_usage'), before);
    assert.equal((await one('select count(*)::integer as count from mythoria_private.scenario_generation_user_usage')).count, 1);
  });
  await test('three daily user calls allowed; fourth rejected', async () => {
    await ageUser(userId(1)); assert.equal((await reserve(userId(1))).allowed, true);
    await ageUser(userId(1)); assert.equal((await reserve(userId(1))).allowed, true);
    await ageUser(userId(1));
    const result = await reserve(userId(1));
    assert.equal(result.code, 'USER_LIMIT');
    assert.equal(result.remaining, 0);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_daily_usage')).calls, 3);
  });
  await reset();
  await test('simultaneous dispatches for one user admit one call', async () => {
    const results = await Promise.all(Array.from({ length: 25 }, () => reserve(userId(1), true)));
    assert.equal(results.filter(r => r.allowed).length, 1);
    assert.equal(results.filter(r => r.code === 'RATE_LIMIT').length, 24);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_daily_usage')).calls, 1);
  });
  await reset();
  await test('global daily count stops at 30 under 50 simultaneous users', async () => {
    const results = await Promise.all(Array.from({ length: 50 }, (_, i) => reserve(userId(i + 1), true)));
    assert.equal(results.filter(r => r.allowed).length, 30);
    assert.equal(results.filter(r => r.code === 'GLOBAL_LIMIT' && r.scope === 'global_day').length, 20);
    assert.deepEqual(await one('select calls, reserved_usd::text as cost from mythoria_private.scenario_generation_daily_usage'), { calls: 30, cost: '0.60' });
    assert.equal((await one('select sum(calls)::integer as calls from mythoria_private.scenario_generation_user_usage')).calls, 30);
  });
  await reset();
  await test('monthly count stops at 600 while daily quota remains', async () => {
    await db.exec("insert into mythoria_private.scenario_generation_monthly_usage(month, calls) values (date_trunc('month', clock_timestamp() at time zone 'UTC')::date, 599)");
    const results = await Promise.all([reserve(userId(1), true), reserve(userId(2), true), reserve(userId(3), true)]);
    assert.equal(results.filter(r => r.allowed).length, 1);
    assert.equal(results.filter(r => r.code === 'GLOBAL_LIMIT' && r.scope === 'global_month').length, 2);
    assert.deepEqual(await one('select calls, reserved_usd::text as cost from mythoria_private.scenario_generation_monthly_usage'), { calls: 600, cost: '12.00' });
    assert.equal((await one('select calls from mythoria_private.scenario_generation_daily_usage')).calls, 1);
  });
  await reset();
  await test('UTC date rollover restores user/day quota and preserves monthly spend', async () => {
    await query("insert into mythoria_private.scenario_generation_user_usage(user_id, day, calls, last_reserved_at) values ($1::uuid, (clock_timestamp() at time zone 'UTC')::date - 1, 3, clock_timestamp() - interval '1 day')", [userId(1)]);
    await db.exec("insert into mythoria_private.scenario_generation_daily_usage(day, calls) values ((clock_timestamp() at time zone 'UTC')::date - 1, 30); insert into mythoria_private.scenario_generation_monthly_usage(month, calls) values (date_trunc('month', clock_timestamp() at time zone 'UTC')::date, 30)");
    assert.equal((await reserve(userId(1))).remaining, 2);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_user_usage')).calls, 1);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_monthly_usage')).calls, 31);
    assert.equal((await one('select count(*)::integer as count from mythoria_private.scenario_generation_daily_usage')).count, 2);
  });
  await test('reapplying migration retains enabled state and spent quota', async () => {
    await db.exec(migration);
    assert.equal((await one('select enabled from mythoria_private.scenario_generation_control')).enabled, true);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_monthly_usage')).calls, 31);
  });
  await reset();
  await test('new UTC month creates a fresh monthly bucket without erasing history', async () => {
    await db.exec("insert into mythoria_private.scenario_generation_monthly_usage(month, calls) values ((date_trunc('month', clock_timestamp() at time zone 'UTC') - interval '1 month')::date, 600)");
    assert.equal((await reserve(userId(1))).allowed, true);
    const totals = await one('select count(*)::integer as buckets, sum(calls)::integer as calls from mythoria_private.scenario_generation_monthly_usage');
    assert.deepEqual(totals, { buckets: 2, calls: 601 });
  });
  await reset();
  await test('all reservation counters roll back when any write fails', async () => {
    await db.exec('alter table mythoria_private.scenario_generation_monthly_usage add constraint test_reject_reservation check (calls = 0)');
    await assert.rejects(reserve(userId(1)), error => error.code === '23514');
    for (const table of ['user_usage', 'daily_usage', 'monthly_usage']) {
      assert.equal((await one(`select count(*)::integer as count from mythoria_private.scenario_generation_${table}`)).count, 0);
    }
    await db.exec('alter table mythoria_private.scenario_generation_monthly_usage drop constraint test_reject_reservation');
  });
  await test('deleting an account never refunds the site-wide budget', async () => {
    assert.equal((await reserve(userId(100))).allowed, true);
    await query('delete from auth.users where id=$1::uuid', [userId(100)]);
    assert.equal((await one('select count(*)::integer as count from mythoria_private.scenario_generation_user_usage')).count, 0);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_daily_usage')).calls, 1);
    assert.equal((await one('select calls from mythoria_private.scenario_generation_monthly_usage')).calls, 1);
  });
  await test('database session timezone does not change UTC quota dates', async () => {
    await db.exec("set time zone 'Pacific/Honolulu'");
    const result = await reserve(userId(2));
    assert.equal(result.allowed, true);
    const expected = await one("select (clock_timestamp() at time zone 'UTC')::date::text as day");
    const actual = await one('select day::text as day from mythoria_private.scenario_generation_user_usage');
    assert.equal(actual.day, expected.day);
    const reset = new Date(result.reset_at);
    assert.equal(reset.getUTCHours(), 0);
    assert.equal(reset.getUTCMinutes(), 0);
    await db.exec("set time zone 'UTC'");
  });
  await test('missing control row fails closed', async () => {
    await db.exec('delete from mythoria_private.scenario_generation_control');
    assert.equal((await reserve(userId(1))).code, 'GENERATION_DISABLED');
    assert.equal((await status(userId(1))).code, 'GENERATION_DISABLED');
  });
  console.log(`\n${passed} PostgreSQL quota regression tests passed. No paid-provider calls.`);
} finally { await db.close(); }

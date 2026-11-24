import { Pool, type QueryResultRow } from "pg"

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Tehran',
  focus_minutes INTEGER NOT NULL DEFAULT 25,
  short_break_minutes INTEGER NOT NULL DEFAULT 5,
  long_break_minutes INTEGER NOT NULL DEFAULT 15,
  long_break_every INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks(user_id);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  seconds INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS focus_user_started_idx ON focus_sessions(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS active_timers (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  duration_sec INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  run_started_at TIMESTAMPTZ,
  elapsed_before_ms BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

const g = globalThis as unknown as {
  __pgPool?: Pool
  __pgReady?: Promise<void>
}

function getPool(): Pool {
  if (!g.__pgPool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL تنظیم نشده است")
    }
    g.__pgPool = new Pool({
      connectionString,
      max: 10,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    })
  }
  return g.__pgPool
}

async function ensureSchema(pool: Pool) {
  const client = await pool.connect()
  try {
    // قفل برای جلوگیری از اجرای هم‌زمان چند پروسه
    await client.query("SELECT pg_advisory_lock(727274)")
    try {
      await client.query(SCHEMA)
    } finally {
      await client.query("SELECT pg_advisory_unlock(727274)")
    }
  } finally {
    client.release()
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool()
  if (!g.__pgReady) {
    g.__pgReady = ensureSchema(pool).catch((err) => {
      g.__pgReady = undefined
      throw err
    })
  }
  await g.__pgReady
  const res = await pool.query<T>(text, params)
  return res.rows
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

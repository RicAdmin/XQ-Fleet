import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from './schema.ts'

type AppDb = NodePgDatabase<typeof schema>

function isDevelopment(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) return true
  if (process.env.NETLIFY_DEV === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

function databaseUrl(): string {
  const remote = process.env.DATABASE_URL?.trim()
  const local = process.env.DATABASE_URL_LOCAL?.trim()

  // Local dev: prefer DATABASE_URL_LOCAL over remote Railway URL in .env.local
  if (local && isDevelopment()) {
    return local
  }

  if (remote && /localhost|127\.0\.0\.1/.test(remote)) {
    return remote
  }

  if (!remote) {
    throw new Error(
      'DATABASE_URL is not set (optional: DATABASE_URL_LOCAL for local Netlify Postgres).',
    )
  }
  return remote
}

function useSsl(connectionString: string): boolean {
  if (process.env.DATABASE_SSL === 'true') return true
  if (process.env.DATABASE_SSL === 'false') return false
  if (/sslmode=disable/i.test(connectionString)) return false
  return (
    connectionString.includes('railway.app') ||
    connectionString.includes('rlwy.net') ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co')
  )
}

let pool: pg.Pool | undefined
let cachedUrl: string | undefined
let drizzleDb: AppDb | undefined

function getPool(): pg.Pool {
  const connectionString = databaseUrl()
  if (pool && cachedUrl === connectionString) return pool

  void pool?.end()
  cachedUrl = connectionString
  pool = new pg.Pool({
    connectionString,
    ssl: useSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15_000,
  })
  return pool
}

function getDb(): AppDb {
  const url = databaseUrl()
  if (drizzleDb && cachedUrl === url) return drizzleDb
  drizzleDb = drizzle(getPool(), { schema })
  return drizzleDb
}

export const db = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    const real = getDb()
    const value = Reflect.get(real as object, prop, receiver)
    return typeof value === 'function' ? value.bind(real) : value
  },
})

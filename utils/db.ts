import { Pool } from 'pg'

declare global {
  interface GlobalThis {
    __pgPool?: Pool
  }
}

const connectionString = process.env.POSTGRES_URL
if (!connectionString) {
  throw new Error('Please define POSTGRES_URL in .env.local')
}

// Create or reuse the Pool
const pool: Pool =
  process.env.NODE_ENV === 'development'
    ? // In dev, reuse the same pool across HMR reloads
      globalThis.__pgPool ?? new Pool({ connectionString })
    : // In prod, always create a fresh pool
      new Pool({ connectionString })

if (process.env.NODE_ENV === 'development') {
  globalThis.__pgPool = pool
}

export default pool

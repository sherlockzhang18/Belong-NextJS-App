import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../drizzle/schema'

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export const db = drizzle(pool)
export { schema }

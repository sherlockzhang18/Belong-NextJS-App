import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './drizzle/schema.ts',                // your table definitions
  out:    './drizzle/migrations',               // where migrations go
  dialect: 'postgresql',                        // ← use “dialect” not “driver” :contentReference[oaicite:0]{index=0}
  dbCredentials: {
    // ← use “url” here; match your .env var name
    url: process.env.POSTGRES_URL!  
    // or if you renamed it:
    // url: process.env.DATABASE_URL!
  },
})
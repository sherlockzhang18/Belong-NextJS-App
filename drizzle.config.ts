import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './drizzle/schema.ts',
    out: './drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.POSTGRES_URL!,
    },
})
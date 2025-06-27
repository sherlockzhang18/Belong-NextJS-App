import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    numeric,
    jsonb,
} from 'drizzle-orm/pg-core'
import { InferModel } from 'drizzle-orm'

export const users = pgTable('users', {
    uuid: uuid('uuid').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    passkey: text('passkey').notNull(),
    created_on: timestamp('created_on').defaultNow().notNull(),
    role: text('role').notNull().default('user'),
})

export const events = pgTable('events', {
    uuid: uuid('uuid').defaultRandom().primaryKey().notNull(),
    name: text('name').notNull(),
    subtitle: text('subtitle'),
    description: text('description'),
    date: integer('date').notNull(),
    end_date: integer('end_date'),
    start_time: numeric('start_time', { precision: 5, scale: 3 }).notNull(),
    end_time: numeric('end_time', { precision: 5, scale: 3 }),
    location_name: text('location_name'),
    metadata: jsonb('metadata').notNull(),
    images: jsonb('images').notNull().default('[]'),
    tm_id: text('tm_id').unique(),
})

export type NewEvent = InferModel<typeof events, 'insert'>

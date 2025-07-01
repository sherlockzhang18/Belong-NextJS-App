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
    date: integer('date').notNull(),
    end_date: integer('end_date'),
    start_time: numeric('start_time', { precision: 5, scale: 3 }).notNull(),
    end_time: numeric('end_time', { precision: 5, scale: 3 }),
    location_name: text('location_name'),
    metadata: jsonb('metadata').notNull(),
})

export const ticketOptions = pgTable('ticket_options', {
    id: uuid('id').defaultRandom().primaryKey(),
    event_id: uuid('event_id').notNull().references(() => events.uuid),
    name: text('name').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
})

export type User = InferModel<typeof users, 'select'>
export type NewUser = InferModel<typeof users, 'insert'>

export type Event = InferModel<typeof events, 'select'>
export type NewEvent = InferModel<typeof events, 'insert'>

export type TicketOption = InferModel<typeof ticketOptions, 'select'>
export type NewTicketOption = InferModel<typeof ticketOptions, 'insert'>
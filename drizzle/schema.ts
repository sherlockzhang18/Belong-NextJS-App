import {
  pgTable,
  uuid,
  text,
  date,
  time,
  numeric,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  uuid:        uuid('uuid').defaultRandom().primaryKey(),
  username:    text('username').notNull().unique(),
  passkey:     text('passkey').notNull(),
  created_on:  timestamp('created_on').defaultNow().notNull(),
  role:        text('role').notNull().default('user'),
})

export const events = pgTable('events', {
  uuid:           uuid('uuid').defaultRandom().primaryKey(),
  name:           text('name').notNull(),
  subtitle:       text('subtitle'),
  description:    text('description'),
  date:           date('date').notNull(),
  start_time:     time('start_time').notNull(),
  end_time:       time('end_time').notNull(),
  location_name:  text('location_name'),
  price:          numeric('price', { precision: 10, scale: 2 }).notNull(),
  metadata:       jsonb('metadata').notNull(),
})

import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, boolean } from 'drizzle-orm/pg-core'
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
    stadium_id: uuid('stadium_id').references(() => stadiums.id), // NEW: Link to stadium
    metadata: jsonb('metadata').notNull(),
})

// NEW: Stadium/Venue table for reusable layouts
export const stadiums = pgTable('stadiums', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    city: text('city'),
    state: text('state'),
    layout_config: jsonb('layout_config').notNull(), // SVG coordinates and paths
    created_at: timestamp('created_at').defaultNow().notNull(),
})

// NEW: Stadium sections/segments
export const stadium_sections = pgTable('stadium_sections', {
    id: uuid('id').defaultRandom().primaryKey(),
    stadium_id: uuid('stadium_id').notNull().references(() => stadiums.id),
    section_number: text('section_number').notNull(), // e.g., "101", "501", "342"
    section_name: text('section_name').notNull(), // e.g., "Lower Level 101", "Upper Level 501"
    level_type: text('level_type').notNull(), // e.g., "lower", "club", "upper", "field"
    max_row: text('max_row'), // e.g., "Z" for highest row
    seats_per_row: integer('seats_per_row').default(20),
    pricing_tier: text('pricing_tier').notNull().default('standard'), // standard, premium, club, field
    display_config: jsonb('display_config').notNull(), // SVG path, colors, positioning
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at').defaultNow().notNull(),
})

export const ticketOptions = pgTable('ticket_options', {
    id: uuid('id').defaultRandom().primaryKey(),
    event_id: uuid('event_id').notNull().references(() => events.uuid),
    name: text('name').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    seat_type: text('seat_type').notNull().default('general'), // 'general' or 'assigned'
})

export const seats = pgTable('seats', {
    id: uuid('id').defaultRandom().primaryKey(),
    event_id: uuid('event_id').notNull().references(() => events.uuid),
    ticket_option_id: uuid('ticket_option_id').notNull().references(() => ticketOptions.id),
    section_id: uuid('section_id').references(() => stadium_sections.id), // NEW: Link to section
    seat_number: text('seat_number').notNull(),
    row: text('row').notNull(),
    seat_in_row: integer('seat_in_row').notNull(),
    status: text('status').notNull().default('available'),
    reserved_until: timestamp('reserved_until'),
    created_at: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
    uuid: uuid('uuid').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => users.uuid),
    status: text('status').notNull(), // pending, completed, refunded, or failed.
    total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    stripe_payment_intent_id: text('stripe_payment_intent_id'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    metadata: jsonb('metadata').default({}),
})

export const orderItems = pgTable('order_items', {
    uuid: uuid('uuid').defaultRandom().primaryKey(),
    order_id: uuid('order_id').notNull().references(() => orders.uuid),
    event_id: uuid('event_id').notNull().references(() => events.uuid),
    ticket_option_id: uuid('ticket_option_id').references(() => ticketOptions.id),
    seat_id: uuid('seat_id').references(() => seats.id), // nullable, for seat-specific purchases
    quantity: integer('quantity').notNull(),
    unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
})

export type User = InferModel<typeof users, 'select'>
export type NewUser = InferModel<typeof users, 'insert'>

export type Event = InferModel<typeof events, 'select'>
export type NewEvent = InferModel<typeof events, 'insert'>

export type TicketOption = InferModel<typeof ticketOptions, 'select'>
export type NewTicketOption = InferModel<typeof ticketOptions, 'insert'>

export type Seat = InferModel<typeof seats, 'select'>
export type NewSeat = InferModel<typeof seats, 'insert'>

export type Order = InferModel<typeof orders, 'select'>
export type NewOrder = InferModel<typeof orders, 'insert'>

export type OrderItem = InferModel<typeof orderItems, 'select'>
export type NewOrderItem = InferModel<typeof orderItems, 'insert'>

export type Stadium = InferModel<typeof stadiums, 'select'>
export type NewStadium = InferModel<typeof stadiums, 'insert'>

export type StadiumSection = InferModel<typeof stadium_sections, 'select'>
export type NewStadiumSection = InferModel<typeof stadium_sections, 'insert'>
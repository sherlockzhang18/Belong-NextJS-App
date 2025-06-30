// File: pages/api/events.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { db, schema } from '../../utils/db'
import { eq } from 'drizzle-orm'
import { getUserFromReq } from '../../utils/auth'

/**
 * We’ve removed `description`, `images`, and `tm_id` here,
 * and left only the fields that still live as real columns—
 * plus a catch-all `metadata: any` for everything else.
 */
export type EventPayload = {
    uuid: string
    name: string
    subtitle: string | null
    date: number
    end_date: number | null
    start_time: string
    end_time: string | null
    location_name: string | null
    metadata: any
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ events: EventPayload[] } | { message: string }>
) {
    // ─── READ ───
    if (req.method === 'GET') {
        try {
            // only select your real columns + metadata
            const rows = await db
                .select({
                    uuid: schema.events.uuid,
                    name: schema.events.name,
                    subtitle: schema.events.subtitle,
                    date: schema.events.date,
                    end_date: schema.events.end_date,
                    start_time: schema.events.start_time,
                    end_time: schema.events.end_time,
                    location_name: schema.events.location_name,
                    metadata: schema.events.metadata,
                })
                .from(schema.events)
                .orderBy(schema.events.date, schema.events.start_time)

            // map directly into our slimmed‐down payload type
            const events: EventPayload[] = rows.map(r => ({
                uuid: r.uuid,
                name: r.name,
                subtitle: r.subtitle,
                date: r.date,
                end_date: r.end_date,
                start_time: r.start_time,
                end_time: r.end_time,
                location_name: r.location_name,
                metadata: r.metadata,
            }))

            return res.status(200).json({ events })
        } catch (err: any) {
            console.error('GET /api/events error', err)
            return res.status(500).json({ message: 'Internal Server Error' })
        }
    }

    // ─── WRITE (POST / PUT) ───
    // admin guard
    const user = await getUserFromReq(req, res)
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' })
    }

    // enforce required fields
    const body = req.body as Partial<EventPayload> & {
        name: string
        date: number
        start_time: string
    }
    if (!body.name || !body.date || !body.start_time) {
        return res.status(400).json({ message: 'name, date & start_time required' })
    }

    try {
        // ─── CREATE ───
        if (req.method === 'POST') {
            await db.insert(schema.events).values({
                uuid: body.uuid,           // if you omit this, PG defaultRandom() kicks in
                name: body.name,
                subtitle: body.subtitle ?? null,
                date: body.date,
                end_date: body.end_date ?? null,
                start_time: body.start_time,
                end_time: body.end_time ?? null,
                location_name: body.location_name ?? null,
                metadata: body.metadata ?? {},
            }).execute()

            return res.status(201).json({ message: 'Created' })
        }

        // ─── UPDATE ───
        if (req.method === 'PUT') {
            if (!body.uuid) {
                return res.status(400).json({ message: 'UUID required for update' })
            }
            await db
                .update(schema.events)
                .set({
                    name: body.name,
                    subtitle: body.subtitle ?? null,
                    date: body.date,
                    end_date: body.end_date ?? null,
                    start_time: body.start_time,
                    end_time: body.end_time ?? null,
                    location_name: body.location_name ?? null,
                    metadata: body.metadata ?? {},
                })
                .where(eq(schema.events.uuid, body.uuid))
                .execute()

            return res.status(200).json({ message: 'Updated' })
        }

        // disallow other methods
        res.setHeader('Allow', ['GET', 'POST', 'PUT'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err: any) {
        console.error('WRITE /api/events error', err)
        return res.status(500).json({ message: 'Database Error' })
    }
}

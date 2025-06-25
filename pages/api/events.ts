// pages/api/events.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { db, schema } from '../../utils/db'
import { sql, eq } from 'drizzle-orm'
import { getUserFromReq } from '../../utils/auth'
import { Event as ChronosEvent, EventMetadata } from '@jstiava/chronos'

type WriteBody = {
    uuid?: string
    name: string
    subtitle?: string | null
    description?: string | null
    date: string             // "YYYY-MM-DD"
    start_time: string       // "HH:mm" or "HH:mm:ss"
    end_time?: string | null // same
    location_name?: string | null
    images?: string[]
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // ─────────── READ / GET ───────────
    if (req.method === 'GET') {
        try {
            const rawRows = await db
                .select({
                    uuid: schema.events.uuid,
                    name: schema.events.name,
                    subtitle: schema.events.subtitle,
                    description: schema.events.description,
                    // date as YYYYMMDD integer
                    date: sql<number>`to_char(${schema.events.date}, 'YYYYMMDD')::int`,
                    // fractional hour: 6 + 20/60 = 6.3333…
                    start_time: sql<number>`
            EXTRACT(hour   FROM ${schema.events.start_time})
            + EXTRACT(minute FROM ${schema.events.start_time})/60
          `,
                    end_time: sql<number>`
            EXTRACT(hour   FROM ${schema.events.end_time})
            + EXTRACT(minute FROM ${schema.events.end_time})/60
          `,
                    location_name: schema.events.location_name,
                    metadata: schema.events.metadata,
                    images: schema.events.images,
                })
                .from(schema.events)
                .orderBy(schema.events.date, schema.events.start_time)

            // Rehydrate & eject so Chronos parses the fractional hours correctly
            const events = rawRows.map(raw => {
                const fixed = { ...raw, metadata: raw.metadata as EventMetadata }
                // false = no timezone shift
                return new ChronosEvent(fixed, false).eject()
            })

            return res.status(200).json({ events })
        } catch (error: any) {
            console.error('Error fetching events:', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    // ────────── PROTECTED WRITE / POST & PUT ──────────
    const user = await getUserFromReq(req, res)
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' })
    }

    const body = req.body as WriteBody
    const {
        uuid,
        name,
        subtitle = null,
        description = null,
        date: dateStr,
        start_time: startStr,
        end_time: endStr = null,
        location_name = null,
        images = []
    } = body

    if (!name || !dateStr || !startStr) {
        return res.status(400).json({ message: 'name, date & start_time are required' })
    }

    // Build + eject via ChronosEvent (false=no timezone shift)
    const chronosEvent = new ChronosEvent(
        {
            uuid,
            name,
            subtitle,
            description,
            startDateTime: `${dateStr}T${startStr}`,
            endDateTime: endStr ? `${dateStr}T${endStr}` : undefined,
            location_name,
            metadata: { description, files: images, images },
            images,
        },
        false
    )
    const e = chronosEvent.eject()

    // Ensure non-null DB format
    const parsedDate = Number(dateStr.replace(/-/g, ''))            // YYYYMMDD
    const parsedStart = startStr.length === 5 ? `${startStr}:00` : startStr
    const parsedEnd = endStr
        ? endStr.length === 5
            ? `${endStr}:00`
            : endStr
        : null

    const dbObj = {
        ...e,
        date: parsedDate,
        start_time: parsedStart,
        end_time: parsedEnd,
    }

    try {
        if (req.method === 'POST') {
            await db.insert(schema.events).values(dbObj).execute()
            return res.status(201).json({ message: 'Created' })
        }

        if (req.method === 'PUT') {
            if (!dbObj.uuid) {
                return res.status(400).json({ message: 'UUID is required for update' })
            }
            await db
                .update(schema.events)
                .set(dbObj)
                .where(eq(schema.events.uuid, dbObj.uuid))
                .execute()
            return res.status(200).json({ message: 'Updated' })
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err: any) {
        console.error('Error writing event:', err)
        return res.status(500).json({ message: 'Database Error' })
    }
}

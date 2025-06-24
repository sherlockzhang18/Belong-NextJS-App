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
    date: string
    end_date?: string | null
    start_time: string
    end_time?: string | null
    location_name?: string | null
    images?: string[]
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const rawRows = await db
                .select({
                    uuid: schema.events.uuid,
                    name: schema.events.name,
                    subtitle: schema.events.subtitle,
                    date: sql<number>`to_char(${schema.events.date}, 'YYYYMMDD')::int`,
                    start_time: sql<string>`to_char(${schema.events.start_time}, 'HH24.MI')`,
                    end_time: sql<string>`to_char(${schema.events.end_time},   'HH24.MI')`,
                    location_name: schema.events.location_name,
                    metadata: sql`metadata
            || jsonb_build_object(
                 'description', ${schema.events.description},
                 'files',       COALESCE(metadata->'files','[]'::jsonb),
                 'images',      COALESCE(${schema.events.images}, '[]'::jsonb)
               )`,
                })
                .from(schema.events)
                .orderBy(schema.events.date, schema.events.start_time)

            const events = rawRows.map(raw => {
                const fixed = {
                    ...raw,
                    metadata: raw.metadata as EventMetadata,
                }
                return new ChronosEvent(fixed, true).eject()
            })

            return res.status(200).json({ events })
        } catch (error: any) {
            console.error('Error fetching events:', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    const user = await getUserFromReq(req, res)
    if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const body = req.body as WriteBody
    const {
        uuid,
        name,
        subtitle = null,
        description = null,
        date,
        end_date = null,
        start_time,
        end_time = null,
        location_name = null,
        images = []
    } = body

    if (!name || !date || !start_time) {
        return res.status(400).json({ message: 'name, date & start_time are required' })
    }

    try {
        if (req.method === 'POST') {
            await db
                .insert(schema.events)
                .values({
                    name,
                    subtitle,
                    description,
                    date,
                    end_date,
                    start_time,
                    end_time,
                    location_name,
                    metadata: { description, files: images, images },
                    images
                })
                .execute()

            return res.status(201).json({ message: 'Created' })
        }

        if (req.method === 'PUT') {
            if (!uuid) {
                return res.status(400).json({ message: 'UUID is required for update' })
            }
            await db
                .update(schema.events)
                .set({
                    name,
                    subtitle,
                    description,
                    date,
                    end_date,
                    start_time,
                    end_time,
                    location_name,
                    metadata: { description, files: images, images },
                    images
                })
                .where(eq(schema.events.uuid, uuid))
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

import type { NextApiRequest, NextApiResponse } from 'next'
import { db, schema } from '../../utils/db'
import { sql } from 'drizzle-orm'
import { Event as ChronosEvent } from '@jstiava/chronos'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0')

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
                metadata: schema.events.metadata,
            })
            .from(schema.events)
            .orderBy(schema.events.date, schema.events.start_time)
            .execute()

        const events = rawRows
            .map(raw => new ChronosEvent(raw as any, true))
            .map(ev => ev.eject())

        return res.status(200).json({ events })
    } catch (error: any) {
        console.error('Error fetching events:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

// File: pages/api/events.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { db, schema } from '../../utils/db'
import { sql } from 'drizzle-orm'
import { Event as ChronosEvent, EventMetadata } from '@jstiava/chronos'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        // 1) Pull exactly the columns Chronos needs, merging price & description into metadata
        const rawRows = await db
            .select({
                uuid: schema.events.uuid,
                name: schema.events.name,
                subtitle: schema.events.subtitle,
                // Chronos expects date as YYYYMMDD integer
                date: sql<number>`to_char(${schema.events.date}, 'YYYYMMDD')::int`,
                // Chronos expects times as “HH24.MI” strings
                start_time: sql<string>`to_char(${schema.events.start_time}, 'HH24.MI')`,
                end_time: sql<string>`to_char(${schema.events.end_time},   'HH24.MI')`,
                location_name: schema.events.location_name,
                // merge your price & description into the metadata JSONB
                metadata: sql`metadata
          || jsonb_build_object(
               'price',       ${schema.events.price}::text,
               'description', ${schema.events.description}
             )`,
            })
            .from(schema.events)
            .orderBy(schema.events.date, schema.events.start_time)

        // 2) Wrap each row in ChronosEvent and eject back to plain data
        const events = rawRows
            .map(raw => {
                // tell TS “trust me, this really is the right shape”
                const fixed = {
                    ...raw,
                    metadata: raw.metadata as EventMetadata,
                };
                return new ChronosEvent(fixed, true);
            })
            .map(ev => ev.eject())

        return res.status(200).json({ events })
    } catch (error: any) {
        console.error('Error fetching events:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

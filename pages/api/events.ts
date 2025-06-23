// pages/api/events.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { db, schema }           from '../../utils/db'
import { sql }                  from 'drizzle-orm'
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
    const rawRows = await db
      .select({
        uuid:          schema.events.uuid,
        name:          schema.events.name,
        subtitle:      schema.events.subtitle,
        date:           sql<number>`to_char(${schema.events.date}, 'YYYYMMDD')::int`,
        start_time:    sql<string>`to_char(${schema.events.start_time}, 'HH24.MI')`,
        end_time:      sql<string>`to_char(${schema.events.end_time},   'HH24.MI')`,
        location_name: schema.events.location_name,
        metadata: sql`metadata
          || jsonb_build_object(
               'description', ${schema.events.description},
               'files',       COALESCE(metadata->'files', '[]'::jsonb)
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

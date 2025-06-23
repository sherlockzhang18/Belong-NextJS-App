import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromReq } from '../../../utils/auth'
import { db, schema } from '../../../utils/db'
import { fetchTicketMasterEvents } from '../../../services/ticketMaster'
import { sql } from 'drizzle-orm'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // 1) Admin-only
    const user = await getUserFromReq(req, res)
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
    }

    // 2) Only POST allowed
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end()
    }

    try {
        // 3) Fetch up to 30 events from TM
        const events = await fetchTicketMasterEvents()
        let synced = 0

        for (const ev of events) {
            await db
                .insert(schema.events)
                .values({
                    uuid: ev.uuid,
                    name: ev.name,
                    subtitle: ev.subtitle,
                    description: ev.description,
                    date: ev.date,
                    start_time: ev.start_time,
                    end_time: ev.end_time,
                    location_name: ev.location_name,
                    price: ev.price ?? '0.00',
                    metadata: {
                        ...ev.metadata,
                        files: ev.images,
                    },
                })
                .onConflictDoUpdate({
                    target: schema.events.uuid,
                    set: {
                        name: ev.name,
                        subtitle: ev.subtitle,
                        description: ev.description,
                        date: ev.date,
                        start_time: ev.start_time,
                        end_time: ev.end_time,
                        location_name: ev.location_name,
                        price: ev.price ?? '0.00',
                        metadata: sql`
              "events"."metadata"
              || jsonb_build_object(
                   'files', ${JSON.stringify(ev.images)}::jsonb
                 )
            `,
                    },
                })
                .execute()

            synced++
        }

        return res.status(200).json({ synced })
    } catch (err) {
        console.error('Sync error', err)
        return res.status(500).json({ error: 'Sync failed' })
    }
}

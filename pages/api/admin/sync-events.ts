import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromReq } from '../../../utils/auth'
import { db, schema } from '../../../utils/db'
import { fetchTicketMasterEvents } from '../../../services/ticketMaster'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req, res)
    if (user.role !== 'admin') return

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end()
    }

    try {
        const events = await fetchTicketMasterEvents()
        let count = 0

        for (const ev of events) {
            await db
                .insert(schema.events)
                .values(ev)
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
                        metadata: ev.metadata,
                    },
                })
                .execute()
            count++
        }

        return res.status(200).json({ synced: count })
    } catch (err) {
        console.error('Sync error', err)
        return res.status(500).json({ error: 'Sync failed' })
    }
}

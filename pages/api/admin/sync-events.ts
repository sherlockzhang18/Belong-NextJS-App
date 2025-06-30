import type { NextApiRequest, NextApiResponse } from 'next'
import { eq } from 'drizzle-orm'
import { getUserFromReq } from '../../../utils/auth'
import { db, schema } from '../../../utils/db'
import { fetchTicketMasterEvents } from '../../../services/ticketMaster'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ synced: number } | { error: string }>
) {
    const user = await getUserFromReq(req, res)
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const rows = await db
            .select({
                uuid: schema.events.uuid,
                metadata: schema.events.metadata,
            })
            .from(schema.events)

        const existingMap = new Map<string, string>()
        for (const row of rows) {
            const tl = (row.metadata as any)?.ticketing_link
            if (typeof tl === 'string') {
                existingMap.set(tl, row.uuid)
            }
        }

        const tmevents = await fetchTicketMasterEvents()
        let synced = 0

        for (const ev of tmevents) {
            if (!ev.uuid) continue
            const ticketLink = ev.uuid
            const baseMeta =
                ev.metadata && typeof ev.metadata === 'object'
                    ? (ev.metadata as Record<string, any>)
                    : {}
            const metadata = {
                ...baseMeta,
                ticketing_link: ticketLink,
            }

            if (existingMap.has(ticketLink)) {
                const rowUuid = existingMap.get(ticketLink)!
                await db
                    .update(schema.events)
                    .set({
                        name: ev.name,
                        subtitle: ev.subtitle ?? null,
                        date: ev.date,
                        end_date: ev.end_date ?? null,
                        start_time: ev.start_time,
                        end_time: ev.end_time ?? null,
                        location_name: ev.location_name ?? null,
                        metadata,
                    })
                    .where(eq(schema.events.uuid, rowUuid))
                    .execute()
            } else {
                await db
                    .insert(schema.events)
                    .values({
                        name: ev.name,
                        subtitle: ev.subtitle ?? null,
                        date: ev.date,
                        end_date: ev.end_date ?? null,
                        start_time: ev.start_time,
                        end_time: ev.end_time ?? null,
                        location_name: ev.location_name ?? null,
                        metadata,
                    })
                    .execute()
            }

            synced++
        }

        return res.status(200).json({ synced })
    } catch (err) {
        console.error('Sync error', err)
        return res.status(500).json({ error: 'Sync failed' })
    }
}

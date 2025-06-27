import type { NextApiRequest, NextApiResponse } from 'next'
import { db, schema } from '../../utils/db'
import { eq } from 'drizzle-orm'
import { getUserFromReq } from '../../utils/auth'

export type EventPayload = {
    uuid: string
    name: string
    subtitle: string | null
    description: string | null
    date: number
    end_date: number | null
    start_time: string
    end_time: string | null
    location_name: string | null
    metadata: any
    images: string[]
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ events: EventPayload[] } | { message: string }>
) {
    // get
    if (req.method === 'GET') {
        try {
            const rows = await db
                .select({
                    uuid: schema.events.uuid,
                    name: schema.events.name,
                    subtitle: schema.events.subtitle,
                    description: schema.events.description,
                    date: schema.events.date,
                    end_date: schema.events.end_date,
                    start_time: schema.events.start_time,
                    end_time: schema.events.end_time,
                    location_name: schema.events.location_name,
                    metadata: schema.events.metadata,
                    images: schema.events.images,
                })
                .from(schema.events)
                .orderBy(schema.events.date, schema.events.start_time)

            const events: EventPayload[] = rows.map(r => ({
                uuid: r.uuid,
                name: r.name,
                subtitle: r.subtitle,
                description: r.description,
                date: r.date,
                end_date: r.end_date,
                start_time: r.start_time,
                end_time: r.end_time,
                location_name: r.location_name,
                metadata: r.metadata,
                images: r.images as string[],
            }))

            return res.status(200).json({ events })
        } catch (err: any) {
            console.error('GET /api/events error', err)
            return res.status(500).json({ message: 'Internal Server Error' })
        }
    }

    // post and put req
    const user = await getUserFromReq(req, res)
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' })
    }

    const body = req.body as Partial<EventPayload> & {
        name: string
        date: number
        start_time: string
    }

    // basic required checks
    if (!body.name || !body.date || !body.start_time) {
        return res.status(400).json({ message: 'name, date & start_time required' })
    }

    try {
        if (req.method === 'POST') {
            await db.insert(schema.events).values(body as EventPayload).execute()
            return res.status(201).json({ message: 'Created' })
        }

        if (req.method === 'PUT') {
            if (!body.uuid) {
                return res.status(400).json({ message: 'UUID required for update' })
            }
            await db
                .update(schema.events)
                .set(body as EventPayload)
                .where(eq(schema.events.uuid, body.uuid))
                .execute()
            return res.status(200).json({ message: 'Updated' })
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err: any) {
        console.error('WRITE /api/events error', err)
        return res.status(500).json({ message: 'Database Error' })
    }
}

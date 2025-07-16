import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../../utils/db'
import { ticketOptions } from '../../../../drizzle/schema'
import { eq } from 'drizzle-orm'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { uuid } = req.query
    if (typeof uuid !== 'string') {
        return res.status(400).json({ message: 'Invalid event ID' })
    }

    try {
        const options = await db
            .select()
            .from(ticketOptions)
            .where(eq(ticketOptions.event_id, uuid))
            .execute()

        return res.status(200).json({ ticketOptions: options })
    } catch (error) {
        console.error('Error fetching ticket options:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 
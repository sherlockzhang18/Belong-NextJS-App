import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { events } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { uuid } = req.query;
    const { stadium_id } = req.body;

    if (typeof uuid !== 'string') {
        return res.status(400).json({ message: 'Invalid event UUID' });
    }

    if (!stadium_id) {
        return res.status(400).json({ message: 'stadium_id is required' });
    }

    try {
        const result = await db
            .update(events)
            .set({ stadium_id })
            .where(eq(events.uuid, uuid))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(200).json({
            message: 'Successfully associated event with stadium',
            event: result[0]
        });

    } catch (error) {
        console.error('Error associating stadium:', error);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

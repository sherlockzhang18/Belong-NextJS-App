import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { seats, ticketOptions, events, stadium_sections, stadiums } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { uuid } = req.query;

    if (typeof uuid !== 'string') {
        return res.status(400).json({ message: 'Invalid event UUID' });
    }

    try {
        console.log('Starting comprehensive cleanup for event:', uuid);
        
        const event = await db
            .select()
            .from(events)
            .where(eq(events.uuid, uuid))
            .limit(1);

        if (event.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const deletedCounts = {
            seats: 0,
            ticketOptions: 0,
            stadiumSections: 0,
            stadiums: 0
        };

        console.log('Deleting seats...');
        const seatDeleteResult = await db
            .delete(seats)
            .where(eq(seats.event_id, uuid));
        deletedCounts.seats = seatDeleteResult.rowCount || 0;

        console.log('Deleting ticket options...');
        const ticketOptionsDeleteResult = await db
            .delete(ticketOptions)
            .where(eq(ticketOptions.event_id, uuid));
        deletedCounts.ticketOptions = ticketOptionsDeleteResult.rowCount || 0;

        if (event[0].stadium_id) {
            console.log('Clearing stadium_id from event...');
            await db
                .update(events)
                .set({ stadium_id: null })
                .where(eq(events.uuid, uuid));

            console.log('Deleting stadium sections...');
            const sectionsDeleteResult = await db
                .delete(stadium_sections)
                .where(eq(stadium_sections.stadium_id, event[0].stadium_id));
            deletedCounts.stadiumSections = sectionsDeleteResult.rowCount || 0;

            console.log('Deleting stadium...');
            const stadiumDeleteResult = await db
                .delete(stadiums)
                .where(eq(stadiums.id, event[0].stadium_id));
            deletedCounts.stadiums = stadiumDeleteResult.rowCount || 0;
        }

        console.log('Cleanup completed:', deletedCounts);

        return res.status(200).json({
            message: 'Successfully cleaned up all stadium and seating data',
            deletedCounts,
            summary: `Deleted ${deletedCounts.seats} seats, ${deletedCounts.ticketOptions} ticket options, ${deletedCounts.stadiumSections} stadium sections, and ${deletedCounts.stadiums} stadiums`,
            nextSteps: [
                '1. Go to Admin > Stadium Setup to recreate the stadium and sections',
                '2. Then use Stadium Seat Generator to create seats for all sections'
            ]
        });

    } catch (error) {
        console.error('Error during cleanup:', error);
        return res.status(500).json({ 
            message: 'Internal server error during cleanup',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

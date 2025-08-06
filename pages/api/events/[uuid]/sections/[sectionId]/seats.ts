import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../../utils/db';
import { seats, ticketOptions, stadium_sections, events } from '../../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { uuid, sectionId } = req.query;

    if (typeof uuid !== 'string' || typeof sectionId !== 'string') {
        return res.status(400).json({ message: 'Invalid event UUID or section ID' });
    }

    if (req.method === 'GET') {
        try {
            console.log('Fetching section seats for event:', uuid, 'section:', sectionId);
            
            const [event] = await db
                .select()
                .from(events)
                .where(eq(events.uuid, uuid))
                .limit(1);

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            const [section] = await db
                .select()
                .from(stadium_sections)
                .where(eq(stadium_sections.id, sectionId))
                .limit(1);

            if (!section) {
                return res.status(404).json({ message: 'Section not found' });
            }

            console.log('Section found:', section.section_name, 'ID:', section.id);
            
            const allSeatSectionIds = await db
                .select({ section_id: seats.section_id })
                .from(seats)
                .where(eq(seats.event_id, uuid))
                .groupBy(seats.section_id);
            
            console.log('All unique section_ids in seats table for this event:', 
                allSeatSectionIds.map(s => s.section_id));
            console.log('Looking for section_id:', section.id);

            let realSeats = await db
                .select({
                    id: seats.id,
                    seat_number: seats.seat_number,
                    row: seats.row,
                    seat_in_row: seats.seat_in_row,
                    status: seats.status,
                    reserved_until: seats.reserved_until,
                    ticket_option: {
                        id: ticketOptions.id,
                        name: ticketOptions.name,
                        price: ticketOptions.price,
                        seat_type: ticketOptions.seat_type,
                    }
                })
                .from(seats)
                .innerJoin(ticketOptions, eq(seats.ticket_option_id, ticketOptions.id))
                .where(and(
                    eq(seats.event_id, uuid),
                    eq(seats.section_id, section.id)
                ))
                .orderBy(seats.row, seats.seat_in_row);

            console.log('Found seats with section_id:', realSeats.length);

            if (realSeats.length === 0) {
                console.log('No seats found with section_id, trying all seats for event');
                realSeats = await db
                    .select({
                        id: seats.id,
                        seat_number: seats.seat_number,
                        row: seats.row,
                        seat_in_row: seats.seat_in_row,
                        status: seats.status,
                        reserved_until: seats.reserved_until,
                        ticket_option: {
                            id: ticketOptions.id,
                            name: ticketOptions.name,
                            price: ticketOptions.price,
                            seat_type: ticketOptions.seat_type,
                        }
                    })
                    .from(seats)
                    .innerJoin(ticketOptions, eq(seats.ticket_option_id, ticketOptions.id))
                    .where(eq(seats.event_id, uuid))
                    .orderBy(seats.row, seats.seat_in_row);
                    
                console.log('Found seats in fallback (all seats for event):', realSeats.length);
            }

            console.log('Returning seats for section:', realSeats.length);

            return res.status(200).json({
                seats: realSeats,
                sectionInfo: {
                    section_number: section.section_number,
                    section_name: section.section_name,
                    level_type: section.level_type,
                    pricing_tier: section.pricing_tier
                },
                hasSeats: realSeats.length > 0
            });

        } catch (error) {
            console.error('Error fetching section seats:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

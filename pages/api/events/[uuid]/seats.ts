import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { seats, ticketOptions, events, stadium_sections } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { uuid } = req.query;

    if (typeof uuid !== 'string') {
        return res.status(400).json({ message: 'Invalid event UUID' });
    }

    if (req.method === 'GET') {
        try {
            console.log('Fetching seats for event:', uuid);
            
            const eventSeats = await db
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

            console.log('Found seats:', eventSeats.length);
            if (eventSeats.length > 0) {
                console.log('Sample seat:', eventSeats[0]);
            }

            const hasAssignedSeats = eventSeats.length > 0;

            if (!hasAssignedSeats) {
                console.log('No assigned seats found, checking for general tickets');
                const generalTickets = await db
                    .select()
                    .from(ticketOptions)
                    .where(and(
                        eq(ticketOptions.event_id, uuid),
                        eq(ticketOptions.seat_type, 'general')
                    ));

                console.log('General tickets found:', generalTickets.length);

                return res.status(200).json({
                    seats: [],
                    hasAssignedSeats: false,
                    generalTickets
                });
            }

            return res.status(200).json({
                seats: eventSeats,
                hasAssignedSeats: true,
                generalTickets: []
            });

        } catch (error) {
            console.error('Error fetching seats:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { ticketOptionId, sectionId, rows = 10, seatsPerRow = 10 } = req.body;

            if (!ticketOptionId) {
                return res.status(400).json({ message: 'Ticket option ID required' });
            }

            if (!sectionId) {
                return res.status(400).json({ message: 'Section ID required' });
            }

            const ticketOption = await db
                .select()
                .from(ticketOptions)
                .where(and(
                    eq(ticketOptions.id, ticketOptionId),
                    eq(ticketOptions.event_id, uuid)
                ))
                .limit(1);

            if (ticketOption.length === 0) {
                return res.status(404).json({ message: 'Ticket option not found' });
            }

            const section = await db
                .select()
                .from(stadium_sections)
                .where(eq(stadium_sections.id, sectionId))
                .limit(1);

            if (section.length === 0) {
                return res.status(404).json({ message: 'Stadium section not found' });
            }

            const seatsToInsert = [];
            const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                const rowLabel = rowLabels[rowIndex];
                for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
                    seatsToInsert.push({
                        event_id: uuid,
                        ticket_option_id: ticketOptionId,
                        section_id: sectionId,
                        seat_number: `${rowLabel}${seatNum}`,
                        row: rowLabel,
                        seat_in_row: seatNum,
                        status: 'available' as const,
                    });
                }
            }

            await db.insert(seats).values(seatsToInsert);

            return res.status(201).json({
                message: `Created ${seatsToInsert.length} seats for section ${section[0].section_name}`,
                count: seatsToInsert.length,
                sectionName: section[0].section_name
            });

        } catch (error) {
            console.error('Error creating seats:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

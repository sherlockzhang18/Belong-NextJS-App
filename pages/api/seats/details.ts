import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { seats, ticketOptions } from '../../../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { seatIds } = req.body;

        if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ message: 'Seat IDs required' });
        }

        const seatDetails = await db
            .select({
                id: seats.id,
                seat_number: seats.seat_number,
                row: seats.row,
                seat_in_row: seats.seat_in_row,
                status: seats.status,
                price: ticketOptions.price,
                ticket_option_name: ticketOptions.name,
            })
            .from(seats)
            .innerJoin(ticketOptions, eq(seats.ticket_option_id, ticketOptions.id))
            .where(inArray(seats.id, seatIds));

        return res.status(200).json({
            seats: seatDetails
        });

    } catch (error) {
        console.error('Error fetching seat details:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

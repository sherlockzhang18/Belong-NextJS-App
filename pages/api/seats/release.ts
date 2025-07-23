import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { seats } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromReq } from '../../../utils/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const user = await getUserFromReq(req, res);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { seatIds } = req.body;

        if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ message: 'Seat IDs required' });
        }

        const result = await db.transaction(async (tx) => {
            const releasedSeats = [];

            for (const seatId of seatIds) {
                const [seat] = await tx
                    .select()
                    .from(seats)
                    .where(eq(seats.id, seatId))
                    .limit(1);

                if (!seat) {
                    continue;
                }

                if (seat.status === 'reserved') {
                    await tx
                        .update(seats)
                        .set({
                            status: 'available',
                            reserved_until: null
                        })
                        .where(eq(seats.id, seatId));

                    releasedSeats.push({
                        id: seat.id,
                        seat_number: seat.seat_number
                    });
                }
            }

            return releasedSeats;
        });

        return res.status(200).json({
            message: 'Seats released successfully',
            releasedSeats: result
        });

    } catch (error) {
        console.error('Error releasing seats:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

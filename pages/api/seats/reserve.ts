import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { seats } from '../../../drizzle/schema';
import { eq, and, isNull, lt } from 'drizzle-orm';
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

        const { seatIds, reservationMinutes = 10 } = req.body;

        if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ message: 'Seat IDs required' });
        }

        const reservedUntil = new Date(Date.now() + reservationMinutes * 60 * 1000);

        const result = await db.transaction(async (tx) => {
            const currentSeats = await tx
                .select()
                .from(seats)
                .where(and(
                    eq(seats.id, seatIds[0])
                ));

            const unavailableSeats = [];
            const availableSeats = [];

            for (const seatId of seatIds) {
                const [seat] = await tx
                    .select()
                    .from(seats)
                    .where(eq(seats.id, seatId))
                    .limit(1);

                if (!seat) {
                    unavailableSeats.push({ seatId, reason: 'Seat not found' });
                    continue;
                }

                const now = new Date();
                const isAvailable = seat.status === 'available' || 
                    (seat.status === 'reserved' && seat.reserved_until && seat.reserved_until < now);

                if (!isAvailable) {
                    unavailableSeats.push({ 
                        seatId, 
                        seatNumber: seat.seat_number,
                        reason: `Seat is ${seat.status}` 
                    });
                } else {
                    availableSeats.push(seat);
                }
            }

            if (unavailableSeats.length > 0) {
                return { success: false, unavailableSeats };
            }

            for (const seatId of seatIds) {
                await tx
                    .update(seats)
                    .set({
                        status: 'reserved',
                        reserved_until: reservedUntil
                    })
                    .where(eq(seats.id, seatId));
            }

            return { 
                success: true, 
                reservedSeats: availableSeats,
                reservedUntil 
            };
        });

        if (!result.success) {
            return res.status(409).json({
                message: 'Some seats are not available',
                unavailableSeats: result.unavailableSeats
            });
        }

        return res.status(200).json({
            message: 'Seats reserved successfully',
            reservedSeats: result.reservedSeats,
            reservedUntil: result.reservedUntil
        });

    } catch (error) {
        console.error('Error reserving seats:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

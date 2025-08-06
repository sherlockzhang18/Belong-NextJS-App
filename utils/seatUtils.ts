import { db } from './db';
import { seats } from '../drizzle/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function cleanupExpiredReservations(): Promise<number> {
    try {
        const now = new Date();
        
        const expiredSeats = await db
            .select({ id: seats.id })
            .from(seats)
            .where(and(
                eq(seats.status, 'reserved'),
                lt(seats.reserved_until, now)
            ));

        if (expiredSeats.length === 0) {
            console.log('No expired seat reservations to clean up');
            return 0;
        }

        await db
            .update(seats)
            .set({
                status: 'available',
                reserved_until: null
            })
            .where(and(
                eq(seats.status, 'reserved'),
                lt(seats.reserved_until, now)
            ));

        console.log(`Cleaned up ${expiredSeats.length} expired seat reservations`);
        return expiredSeats.length;
    } catch (error) {
        console.error('Error cleaning up expired reservations:', error);
        return 0;
    }
}

export async function generateSeatsForEvent(
    eventId: string,
    ticketOptionId: string,
    sectionId?: string,
    rows: number = 10,
    seatsPerRow: number = 10
) {
    const seatsToInsert = [];
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        const rowLabel = rowLabels[rowIndex];
        for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
            seatsToInsert.push({
                event_id: eventId,
                ticket_option_id: ticketOptionId,
                section_id: sectionId || null,
                seat_number: `${rowLabel}${seatNum}`,
                row: rowLabel,
                seat_in_row: seatNum,
                status: 'available' as const,
            });
        }
    }

    await db.insert(seats).values(seatsToInsert);
    return seatsToInsert.length;
}

export async function eventHasAssignedSeating(eventId: string): Promise<boolean> {
    const eventSeats = await db
        .select({ id: seats.id })
        .from(seats)
        .where(eq(seats.event_id, eventId))
        .limit(1);
    
    return eventSeats.length > 0;
}

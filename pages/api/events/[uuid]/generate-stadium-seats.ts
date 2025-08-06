import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { seats, ticketOptions, events, stadium_sections, stadiums } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';


const LEVEL_SEAT_CONFIG = {
    lower: { rows: 1, seatsPerRow: 5, basePrice: 150 },
    club: { rows: 2, seatsPerRow: 5, basePrice: 200 },
    upper: { rows: 3, seatsPerRow: 5, basePrice: 75 },
    field: { rows: 1, seatsPerRow: 5, basePrice: 300 }
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { uuid } = req.query;

    if (typeof uuid !== 'string') {
        return res.status(400).json({ message: 'Invalid event UUID' });
    }

    if (req.method === 'POST') {
        try {
            const { generateStadiumSeats = false } = req.body;

            const eventData = await db
                .select()
                .from(events)
                .where(eq(events.uuid, uuid))
                .limit(1);

            if (eventData.length === 0) {
                return res.status(404).json({ message: 'Event not found' });
            }

            const event = eventData[0];
            console.log('Event data:', {
                name: event.name,
                location_name: event.location_name,
                stadium_id: event.stadium_id
            });
            
            const hasStadium = !!event.stadium_id;
            console.log('Has stadium:', hasStadium);

            if (generateStadiumSeats && hasStadium) {
                return await generateStadiumBasedSeats(uuid, res);
            } else {
                console.log('Failed condition - generateStadiumSeats:', generateStadiumSeats, 'hasStadium:', hasStadium);
                return res.status(400).json({ 
                    message: 'Stadium-based seat generation requires an event with a stadium association',
                    debug: {
                        generateStadiumSeats,
                        hasStadium,
                        stadium_id: event.stadium_id
                    }
                });
            }

        } catch (error) {
            console.error('Error generating stadium seats:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

async function generateStadiumBasedSeats(eventId: string, res: NextApiResponse) {
    let totalSeatsCreated = 0;
    const ticketOptionsCreated = [];

    const event = await db
        .select({ stadium_id: events.stadium_id })
        .from(events)
        .where(eq(events.uuid, eventId))
        .limit(1);

    if (!event[0]?.stadium_id) {
        console.log('Event stadium_id missing:', event[0]);
        return res.status(400).json({ message: 'Event must be associated with a stadium' });
    }

    console.log('Event stadium_id:', event[0].stadium_id);

    const stadiumSections = await db
        .select()
        .from(stadium_sections)
        .where(and(
            eq(stadium_sections.stadium_id, event[0].stadium_id),
            eq(stadium_sections.is_active, true)
        ));

    console.log('Found stadium sections:', stadiumSections.length);
    console.log('Stadium sections:', stadiumSections.map(s => ({ id: s.id, section_number: s.section_number, section_name: s.section_name })));

    if (stadiumSections.length === 0) {
        return res.status(400).json({ message: 'No active stadium sections found' });
    }

    for (const stadiumSection of stadiumSections) {
        const seatConfig = LEVEL_SEAT_CONFIG[stadiumSection.level_type as keyof typeof LEVEL_SEAT_CONFIG] 
            || LEVEL_SEAT_CONFIG.lower;

        const totalSeatsInSection = seatConfig.rows * seatConfig.seatsPerRow;

        const [ticketOption] = await db
            .insert(ticketOptions)
            .values({
                event_id: eventId,
                name: `${stadiumSection.section_name}`,
                price: seatConfig.basePrice.toString(),
                quantity: totalSeatsInSection,
                seat_type: 'assigned'
            })
            .returning();

        ticketOptionsCreated.push(ticketOption);

        const seatsToInsert = [];
        const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let rowIndex = 0; rowIndex < seatConfig.rows; rowIndex++) {
            const rowLabel = rowLabels[rowIndex];
            
            for (let seatNum = 1; seatNum <= seatConfig.seatsPerRow; seatNum++) {
                seatsToInsert.push({
                    event_id: eventId,
                    ticket_option_id: ticketOption.id,
                    section_id: stadiumSection.id,
                    seat_number: `${stadiumSection.section_number}-${rowLabel}${seatNum}`,
                    row: rowLabel,
                    seat_in_row: seatNum,
                    status: 'available' as const,
                });
            }
        }

        await db.insert(seats).values(seatsToInsert);
        totalSeatsCreated += seatsToInsert.length;
    }

    return res.status(201).json({
        message: `Successfully created ${totalSeatsCreated} seats across ${stadiumSections.length} sections`,
        sectionsCreated: stadiumSections.length,
        totalSeats: totalSeatsCreated,
        ticketOptions: ticketOptionsCreated.map(to => ({
            id: to.id,
            name: to.name,
            price: to.price
        })),
        seatConfiguration: {
            lower: `${LEVEL_SEAT_CONFIG.lower.rows} row × ${LEVEL_SEAT_CONFIG.lower.seatsPerRow} seats = ${LEVEL_SEAT_CONFIG.lower.rows * LEVEL_SEAT_CONFIG.lower.seatsPerRow} seats per section`,
            club: `${LEVEL_SEAT_CONFIG.club.rows} rows × ${LEVEL_SEAT_CONFIG.club.seatsPerRow} seats = ${LEVEL_SEAT_CONFIG.club.rows * LEVEL_SEAT_CONFIG.club.seatsPerRow} seats per section`,
            upper: `${LEVEL_SEAT_CONFIG.upper.rows} rows × ${LEVEL_SEAT_CONFIG.upper.seatsPerRow} seats = ${LEVEL_SEAT_CONFIG.upper.rows * LEVEL_SEAT_CONFIG.upper.seatsPerRow} seats per section`
        }
    });
}

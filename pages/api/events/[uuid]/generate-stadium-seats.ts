import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { seats, ticketOptions, events } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';


const BANK_OF_AMERICA_SECTIONS = [
    { section: '501', level: 'upper', pricing_tier: 'standard', rows: 25, seatsPerRow: 18, basePrice: 65 },
    { section: '502', level: 'upper', pricing_tier: 'standard', rows: 25, seatsPerRow: 18, basePrice: 65 },
    { section: '510', level: 'upper', pricing_tier: 'standard', rows: 25, seatsPerRow: 18, basePrice: 75 },

    { section: '301', level: 'club', pricing_tier: 'club', rows: 15, seatsPerRow: 16, basePrice: 175 },
    { section: '315', level: 'club', pricing_tier: 'club', rows: 15, seatsPerRow: 16, basePrice: 200 },

    { section: '101', level: 'lower', pricing_tier: 'premium', rows: 20, seatsPerRow: 20, basePrice: 150 },
    { section: '113', level: 'lower', pricing_tier: 'field', rows: 15, seatsPerRow: 20, basePrice: 250 },
    { section: '120', level: 'lower', pricing_tier: 'premium', rows: 20, seatsPerRow: 20, basePrice: 150 },
];

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
            const isBankOfAmericaStadium = event.location_name?.toLowerCase().includes('bank of america stadium');

            if (generateStadiumSeats && isBankOfAmericaStadium) {
                return await generateStadiumBasedSeats(uuid, res);
            } else {
                return res.status(400).json({ 
                    message: 'Stadium-based seat generation only available for Bank of America Stadium events' 
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

    for (const sectionData of BANK_OF_AMERICA_SECTIONS) {
        const [ticketOption] = await db
            .insert(ticketOptions)
            .values({
                event_id: eventId,
                name: `Section ${sectionData.section} - ${sectionData.level.charAt(0).toUpperCase() + sectionData.level.slice(1)} Level`,
                price: sectionData.basePrice.toString(),
                quantity: sectionData.rows * sectionData.seatsPerRow,
                seat_type: 'assigned'
            })
            .returning();

        ticketOptionsCreated.push(ticketOption);

        const seatsToInsert = [];
        const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let rowIndex = 0; rowIndex < sectionData.rows; rowIndex++) {
            const rowLabel = rowLabels[rowIndex];
            
            for (let seatNum = 1; seatNum <= sectionData.seatsPerRow; seatNum++) {
                seatsToInsert.push({
                    event_id: eventId,
                    ticket_option_id: ticketOption.id,
                    seat_number: `${sectionData.section}-${rowLabel}${seatNum}`,
                    row: rowLabel,
                    seat_in_row: seatNum,
                    status: 'available' as const,
                    section_id: null
                });
            }
        }

        await db.insert(seats).values(seatsToInsert);
        totalSeatsCreated += seatsToInsert.length;
    }

    return res.status(201).json({
        message: `Successfully created ${totalSeatsCreated} seats across ${BANK_OF_AMERICA_SECTIONS.length} sections`,
        sectionsCreated: BANK_OF_AMERICA_SECTIONS.length,
        totalSeats: totalSeatsCreated,
        ticketOptions: ticketOptionsCreated.map(to => ({
            id: to.id,
            name: to.name,
            price: to.price
        }))
    });
}

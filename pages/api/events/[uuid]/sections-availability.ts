import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { events, stadium_sections, seats } from '../../../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { uuid } = req.query;

    if (!uuid || typeof uuid !== 'string') {
        return res.status(400).json({ error: 'Invalid event UUID' });
    }

    try {
        const event = await db.select()
            .from(events)
            .where(eq(events.uuid, uuid))
            .limit(1);

        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!event[0].stadium_id) {
            return res.status(404).json({ error: 'No stadium associated with this event' });
        }

        const sectionsWithSeats = await db
            .select({
                section_id: stadium_sections.id,
                section_name: stadium_sections.section_name,
                section_number: stadium_sections.section_number,
                level_type: stadium_sections.level_type,
                seat_count: sql<number>`CAST(COUNT(${seats.id}) AS INTEGER)`,
                available_seats: sql<number>`CAST(COUNT(CASE WHEN ${seats.status} = 'available' THEN 1 END) AS INTEGER)`
            })
            .from(stadium_sections)
            .leftJoin(seats, eq(seats.section_id, stadium_sections.id))
            .where(eq(stadium_sections.stadium_id, event[0].stadium_id))
            .groupBy(stadium_sections.id, stadium_sections.section_name, stadium_sections.section_number, stadium_sections.level_type);

        const sectionsWithAvailabilityInfo = sectionsWithSeats.map(section => ({
            id: section.section_id,
            section_name: section.section_name,
            section_number: section.section_number,
            level_type: section.level_type,
            has_seats: section.seat_count > 0,
            totalSeats: section.seat_count,
            availableSeats: section.available_seats,
            available_tickets: section.available_seats,
            min_price: getMinPrice(section.level_type),
            max_price: getMaxPrice(section.level_type)
        }));

        return res.status(200).json({
            sections: sectionsWithAvailabilityInfo,
            totalSections: sectionsWithSeats.length,
            sectionsWithSeats: sectionsWithSeats.filter(s => s.seat_count > 0).length
        });

    } catch (error) {
        console.error('Error fetching sections availability:', error);
        return res.status(500).json({ error: 'Failed to fetch sections availability' });
    }
}

function getMinPrice(levelType: string): string {
    if (levelType === 'upper') return '45';
    if (levelType === 'lower') return '85';
    if (levelType === 'club') return '150';
    return '45';
}

function getMaxPrice(levelType: string): string {
    if (levelType === 'upper') return '85';
    if (levelType === 'lower') return '200';
    if (levelType === 'club') return '300';
    return '85';
}

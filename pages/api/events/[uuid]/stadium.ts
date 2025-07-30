import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../utils/db';
import { events, stadiums, stadium_sections } from '../../../../drizzle/schema';
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
            const eventData = await db
                .select({
                    event: events,
                    stadium: stadiums
                })
                .from(events)
                .leftJoin(stadiums, eq(events.stadium_id, stadiums.id))
                .where(eq(events.uuid, uuid))
                .limit(1);

            if (eventData.length === 0) {
                return res.status(404).json({ message: 'Event not found' });
            }

            const { event, stadium } = eventData[0];

            let actualStadium = stadium;
            if (!actualStadium && event.location_name?.toLowerCase().includes('bank of america stadium')) {
                const stadiumByName = await db
                    .select()
                    .from(stadiums)
                    .where(eq(stadiums.name, 'Bank of America Stadium'))
                    .limit(1);

                actualStadium = stadiumByName[0] || null;
            }

            if (!actualStadium) {
                return res.status(404).json({ 
                    message: 'No stadium data found for this event',
                    hasStadium: false 
                });
            }

            const sections = await db
                .select()
                .from(stadium_sections)
                .where(and(
                    eq(stadium_sections.stadium_id, actualStadium.id),
                    eq(stadium_sections.is_active, true)
                ));

            if (sections.length === 0) {
                return res.status(404).json({ 
                    message: 'No stadium sections found',
                    hasStadium: true,
                    hasSections: false 
                });
            }

            const sectionsWithAvailability = sections.map(section => ({
                id: section.id,
                section_number: section.section_number,
                section_name: section.section_name,
                level_type: section.level_type,
                pricing_tier: section.pricing_tier,
                available_tickets: Math.floor(Math.random() * 50) + 10,
                min_price: getMinPrice(section.level_type, section.pricing_tier),
                max_price: getMaxPrice(section.level_type, section.pricing_tier),
                display_config: section.display_config
            }));

            return res.status(200).json({
                stadium: {
                    id: actualStadium.id,
                    name: actualStadium.name,
                    layout_config: actualStadium.layout_config
                },
                sections: sectionsWithAvailability,
                hasStadium: true,
                hasSections: true
            });

        } catch (error) {
            console.error('Error fetching stadium data:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

function getMinPrice(levelType: string, pricingTier: string): string {
    if (pricingTier === 'field') return '200';
    if (pricingTier === 'club') return '150';
    if (levelType === 'upper') return '45';
    if (levelType === 'lower') return '85';
    return '45';
}

function getMaxPrice(levelType: string, pricingTier: string): string {
    if (pricingTier === 'field') return '350';
    if (pricingTier === 'club') return '300';
    if (levelType === 'upper') return '85';
    if (levelType === 'lower') return '200';
    return '85';
}

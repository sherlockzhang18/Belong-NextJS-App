import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { stadium_sections } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { bankOfAmericaStadiumData } from '../../../data/bank-of-america-stadium';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const { stadiumId } = req.body;

            if (!stadiumId) {
                return res.status(400).json({ message: 'Stadium ID is required' });
            }

            const existingSections = await db
                .select()
                .from(stadium_sections)
                .where(eq(stadium_sections.stadium_id, stadiumId))
                .limit(1);

            if (existingSections.length > 0) {
                const allSections = await db
                    .select()
                    .from(stadium_sections)
                    .where(eq(stadium_sections.stadium_id, stadiumId));

                return res.status(200).json({
                    message: 'Stadium sections already exist',
                    sectionsCount: allSections.length,
                    created: false
                });
            }

            const sectionsToInsert = bankOfAmericaStadiumData.sections.map(section => ({
                stadium_id: stadiumId,
                section_number: section.section_number,
                section_name: `${section.level_type.charAt(0).toUpperCase() + section.level_type.slice(1)} Level ${section.section_number}`,
                level_type: section.level_type,
                max_row: 'Z',
                seats_per_row: 20,
                pricing_tier: section.pricing_tier,
                display_config: {
                    default_color: getLevelColor(section.level_type),
                    hover_color: "#FF5722",
                    position: {
                        path: "M 100 100 L 200 100 L 200 200 L 100 200 Z",
                        center_x: 400,
                        center_y: 300,
                        angle: 0
                    }
                },
                is_active: true
            }));

            await db.insert(stadium_sections).values(sectionsToInsert);

            return res.status(201).json({
                message: `Successfully created ${sectionsToInsert.length} stadium sections`,
                sectionsCount: sectionsToInsert.length,
                created: true,
                sections: sectionsToInsert.map(s => ({
                    section_number: s.section_number,
                    level_type: s.level_type,
                    pricing_tier: s.pricing_tier
                }))
            });

        } catch (error) {
            console.error('Error seeding stadium sections:', error);
            return res.status(500).json({ 
                message: 'Failed to create stadium sections',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

function getLevelColor(level: string): string {
    switch (level) {
        case 'upper': return '#424242';
        case 'club': return '#7B1FA2';
        case 'lower': return '#1976D2';
        default: return '#4A90E2';
    }
}

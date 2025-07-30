import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { stadiums, stadium_sections } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const stadium = await db
                .select()
                .from(stadiums)
                .where(eq(stadiums.name, 'Bank of America Stadium'))
                .limit(1);

            if (stadium.length === 0) {
                return res.status(404).json({
                    message: 'Bank of America Stadium not found',
                    hasStadium: false,
                    hasSections: false
                });
            }

            const sections = await db
                .select()
                .from(stadium_sections)
                .where(eq(stadium_sections.stadium_id, stadium[0].id));

            const sectionsByLevel = sections.reduce((acc, section) => {
                const level = section.level_type;
                if (!acc[level]) acc[level] = [];
                acc[level].push(section);
                return acc;
            }, {} as Record<string, any[]>);

            return res.status(200).json({
                message: 'Stadium data verified successfully',
                hasStadium: true,
                hasSections: sections.length > 0,
                stadium: {
                    id: stadium[0].id,
                    name: stadium[0].name,
                    city: stadium[0].city,
                    state: stadium[0].state
                },
                sections: {
                    total: sections.length,
                    byLevel: {
                        upper: sectionsByLevel.upper?.length || 0,
                        club: sectionsByLevel.club?.length || 0,
                        lower: sectionsByLevel.lower?.length || 0
                    }
                },
                summary: `Stadium "${stadium[0].name}" has ${sections.length} sections configured`
            });

        } catch (error) {
            console.error('Error verifying stadium data:', error);
            return res.status(500).json({ 
                message: 'Failed to verify stadium data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { stadiums, stadium_sections } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'DELETE') {
        try {
            const stadium = await db
                .select()
                .from(stadiums)
                .where(eq(stadiums.name, 'Bank of America Stadium'))
                .limit(1);

            if (stadium.length === 0) {
                return res.status(200).json({
                    message: 'No stadium data found to reset',
                    deleted: false
                });
            }

            const deletedSections = await db
                .delete(stadium_sections)
                .where(eq(stadium_sections.stadium_id, stadium[0].id));

            const deletedStadium = await db
                .delete(stadiums)
                .where(eq(stadiums.id, stadium[0].id));

            return res.status(200).json({
                message: 'Stadium data reset successfully',
                deleted: true,
                details: {
                    stadium: stadium[0].name,
                    sectionsDeleted: deletedSections.rowCount || 0,
                    stadiumDeleted: deletedStadium.rowCount || 0
                }
            });

        } catch (error) {
            console.error('Error resetting stadium data:', error);
            return res.status(500).json({ 
                message: 'Failed to reset stadium data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

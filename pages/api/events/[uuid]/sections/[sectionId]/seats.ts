import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../../utils/db';
import { seats, ticketOptions, stadium_sections } from '../../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { uuid, sectionId } = req.query;

    if (typeof uuid !== 'string' || typeof sectionId !== 'string') {
        return res.status(400).json({ message: 'Invalid event UUID or section ID' });
    }

    if (req.method === 'GET') {
        try {
            const mockSeats = [];
            const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const seatsPerRow = 20;
            const numRows = 15;
            
            for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                const rowLabel = rowLabels[rowIndex];
                for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
                    const seatId = `${sectionId}-${rowLabel}${seatNum}`;
                    const price = getSectionPrice(sectionId);
                    
                    mockSeats.push({
                        id: seatId,
                        seat_number: `${rowLabel}${seatNum}`,
                        row: rowLabel,
                        seat_in_row: seatNum,
                        status: 'available',
                        reserved_until: null,
                        ticket_option: {
                            id: `to-${sectionId}`,
                            name: `Section ${sectionId}`,
                            price: price.toString(),
                            seat_type: 'assigned'
                        }
                    });
                }
            }

            return res.status(200).json({
                seats: mockSeats,
                sectionInfo: {
                    section_number: sectionId,
                    section_name: `Section ${sectionId}`,
                    level_type: getSectionLevel(sectionId),
                    pricing_tier: getSectionPricingTier(sectionId)
                }
            });

        } catch (error) {
            console.error('Error fetching section seats:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

function getSectionPrice(sectionId: string): number {
    const sectionNum = parseInt(sectionId);
    
    if (sectionNum >= 500) return 75;
    if (sectionNum >= 300) return 175;
    if (sectionNum >= 110 && sectionNum <= 116) return 250;
    if (sectionNum >= 100) return 150;
    
    return 100;
}

function getSectionLevel(sectionId: string): string {
    const sectionNum = parseInt(sectionId);
    
    if (sectionNum >= 500) return 'upper';
    if (sectionNum >= 300) return 'club';
    if (sectionNum >= 100) return 'lower';
    
    return 'lower';
}

function getSectionPricingTier(sectionId: string): string {
    const sectionNum = parseInt(sectionId);
    
    if (sectionNum >= 110 && sectionNum <= 116) return 'field';
    if (sectionNum >= 300 && sectionNum <= 349) return 'club';
    if (sectionNum >= 511 && sectionNum <= 518) return 'premium';
    
    return 'standard';
}

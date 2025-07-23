import { NextApiRequest, NextApiResponse } from 'next';
import { cleanupExpiredReservations } from '../../../utils/seatUtils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const cleanedCount = await cleanupExpiredReservations();
        
        return res.status(200).json({
            message: `Cleaned up ${cleanedCount} expired reservations`,
            cleanedCount
        });

    } catch (error) {
        console.error('Error cleaning up expired reservations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

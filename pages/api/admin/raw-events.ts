import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromReq } from '../../../utils/auth'
import { fetchTicketMasterRaw } from '../../../services/ticketMaster'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req, res)
    if (user.role !== 'admin') return

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end()
    }

    try {
        const raw = await fetchTicketMasterRaw()
        res.status(200).json(raw)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch raw TM data' })
    }
}

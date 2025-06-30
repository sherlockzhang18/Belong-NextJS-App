import type { NextApiRequest, NextApiResponse } from 'next'
import { requireUser } from '../../utils/requireUser'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const user = await requireUser(req)
        return res.status(200).json(user)
    } catch {
        return res.status(401).json({ message: 'Not authenticated' })
    }
}

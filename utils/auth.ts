import type { NextApiRequest, NextApiResponse } from 'next'
import { requireUser, UserSession } from './requireUser'

export async function getUserFromReq(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<UserSession> {
    try {
        return await requireUser(req)
    } catch {
        res.status(401).end('Not authenticated')
        throw new Error('No user')
    }
}

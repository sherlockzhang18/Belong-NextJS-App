import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'cookie'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'

export type UserSession = { uuid: string; username: string; role: string }

export async function getUserFromReq(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<UserSession> {
    const cookie = req.headers.cookie
    if (!cookie) {
        res.status(401).end('Not authenticated')
        throw new Error('No cookie')
    }
    const { session: token } = parse(cookie)
    if (!token) {
        res.status(401).end('Not authenticated')
        throw new Error('No token')
    }
    const secret = process.env.JWT_SECRET!
    const decoded = jwt.verify(token, secret) as JwtPayload & {
        uuid: string
        username: string
    }
    if (!decoded.uuid) {
        res.status(401).end('Invalid token')
        throw new Error('Bad token payload')
    }

    const [user] = await db
        .select({
            username: schema.users.username,
            role: schema.users.role,
        })
        .from(schema.users)
        .where(eq(schema.users.uuid, decoded.uuid))

    if (!user) {
        res.status(404).end('User not found')
        throw new Error('No user')
    }

    return { uuid: decoded.uuid, username: user.username, role: user.role }
}

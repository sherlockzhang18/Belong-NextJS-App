import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'cookie'
import jwt, { JwtPayload } from 'jsonwebtoken'
import pool from '../../utils/db'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const cookieHeader = req.headers.cookie
        if (!cookieHeader) {
            return res.status(401).json({ message: 'Not authenticated' })
        }

        const { session: token } = parse(cookieHeader)
        if (typeof token !== 'string') {
            return res.status(401).json({ message: 'Not authenticated' })
        }

        const secret = process.env.JWT_SECRET
        if (!secret) {
            console.error('JWT_SECRET is not defined')
            return res.status(500).json({ message: 'Server misconfiguration' })
        }

        const decoded = jwt.verify(token, secret) as JwtPayload & {
            uuid: string
            username: string
        }

        if (!decoded.uuid) {
            return res.status(401).json({ message: 'Invalid token payload' })
        }

        const { rows, rowCount = 0 } = await pool.query<{
            username: string
            created_on: Date
        }>(
            'SELECT username, created_on FROM users WHERE uuid = $1',
            [decoded.uuid]
        )

        if (rowCount === 0) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.status(200).json({
            uuid: decoded.uuid,
            username: rows[0].username,
        })
    } catch (err) {
        console.error('me.ts error', err)
        return res.status(401).json({ message: 'Invalid or expired session' })
    }
}

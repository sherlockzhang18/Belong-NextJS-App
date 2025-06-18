import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import { serialize } from 'cookie'
import jwt, { Secret } from 'jsonwebtoken'
import { db, schema } from '../../utils/db'
import { eq } from 'drizzle-orm'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { username, password } = req.body as {
        username: string
        password: string
    }
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' })
    }

    const users = await db
        .select({
            uuid: schema.users.uuid,
            passkey: schema.users.passkey,
        })
        .from(schema.users)
        .where(eq(schema.users.username, username))

    if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { uuid, passkey } = users[0]
    const valid = await bcrypt.compare(password, passkey)
    if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ uuid, username }, process.env.JWT_SECRET as Secret)
    res.setHeader(
        'Set-Cookie',
        serialize('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 3600,
            path: '/',
        })
    )

    return res.status(200).json({ success: true, uuid, username })
}

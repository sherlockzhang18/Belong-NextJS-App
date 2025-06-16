import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import { serialize } from 'cookie'
import jwt, { Secret } from 'jsonwebtoken'
import pool from '../../utils/db'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { username, password } = req.body as { username: string; password: string }
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' })
    }

    try {
        const chk = await pool.query('SELECT uuid FROM users WHERE username = $1', [username])
        if ((chk.rowCount ?? 0) > 0) {
            return res.status(409).json({ message: 'Username already taken' })
        }

        const passkey = await bcrypt.hash(password, 10)
        const insert = await pool.query<{ uuid: string }>(
            `INSERT INTO users (username, passkey) VALUES ($1,$2) RETURNING uuid`,
            [username, passkey]
        )
        const userUuid = insert.rows[0].uuid

        const token = jwt.sign({ uuid: userUuid, username }, process.env.JWT_SECRET as Secret)
        res.setHeader('Set-Cookie', serialize('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 3600,
            path: '/',
        }))

        return res.status(201).json({ success: true, uuid: userUuid, username })
    } catch (err: any) {
        console.error('Register error', err)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

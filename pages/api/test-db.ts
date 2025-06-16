import type { NextApiRequest, NextApiResponse } from 'next'
import pool from '../../utils/db'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { rows } = await pool.query('SELECT NOW() AS now')
        res.status(200).json({ now: rows[0].now })
    } catch (error: any) {
        console.error('DB test failed', error)
        res.status(500).json({ error: error.message })
    }
}

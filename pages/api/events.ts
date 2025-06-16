// File: pages/api/events.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import pool from '../../utils/db'

// We’ll explicitly shape the row into the EventData fields Chronos expects
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { rows } = await pool.query(`
      SELECT
        uuid,
        name,
        subtitle,
        description,
        -- 20250701 as a number
        to_char(date,'YYYYMMDD')::int     AS date,
        -- "9.000", "14.500" as strings
        to_char(start_time,'HH24.MI')     AS start_time,
        to_char(end_time,'HH24.MI')       AS end_time,
        location_name,
        price,
        metadata
      FROM events
      ORDER BY date, start_time
    `)

        // rows already match EventData’s shape
        return res.status(200).json({ events: rows })
    } catch (error: any) {
        console.error('Error fetching events:', error)
        return res
            .status(500)
            .json({ error: 'Internal Server Error' })
    }
}

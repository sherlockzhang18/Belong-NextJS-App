import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'cookie'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { db, schema } from '../../utils/db'
import { eq } from 'drizzle-orm'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) throw new Error('No cookie')

    const { session: token } = parse(cookieHeader)
    if (!token) throw new Error('No token')

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('No JWT_SECRET')

    const decoded = jwt.verify(token, secret) as
      | (JwtPayload & { uuid: string; username: string })
      | null
    if (!decoded?.uuid) throw new Error('Invalid token payload')

    // Fetch the user record
    const rows = await db
      .select({
        username:   schema.users.username,
        createdOn:  schema.users.created_on,
      })
      .from(schema.users)
      .where(eq(schema.users.uuid, decoded.uuid))

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      uuid:     decoded.uuid,
      username: rows[0].username,
      // optionally: createdOn: rows[0].createdOn
    })
  } catch (err: any) {
    console.error('me.ts error', err)
    return res.status(401).json({ message: 'Invalid or expired session' })
  }
}

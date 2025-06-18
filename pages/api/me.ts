// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'cookie'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { db, schema } from '../../utils/db'
import { eq } from 'drizzle-orm'

type MeResponse = {
  uuid: string
  username: string
  role:   string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse | { message: string }>
) {
  try {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) throw new Error()

    const { session: token } = parse(cookieHeader)
    if (!token) throw new Error()

    const secret = process.env.JWT_SECRET!
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      uuid: string
      username: string
    }
    if (!decoded.uuid) throw new Error()

    const [user] = await db
      .select({
        username: schema.users.username,
        role:     schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.uuid, decoded.uuid))

    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.status(200).json({
      uuid:     decoded.uuid,
      username: user.username,
      role:     user.role,
    })
  } catch {
    return res.status(401).json({ message: 'Not authenticated' })
  }
}

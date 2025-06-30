import { parse } from 'cookie'
import jwt, { JwtPayload } from 'jsonwebtoken'
import type { NextApiRequest } from 'next'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'

export type UserSession = { uuid: string; username: string; role: string }

export async function requireUser(req: NextApiRequest): Promise<UserSession> {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) throw new Error('No cookie')
  const { session: token } = parse(cookieHeader)
  if (!token) throw new Error('No token')

  const secret = process.env.JWT_SECRET!
  const decoded = jwt.verify(token, secret) as JwtPayload & {
    uuid: string
    username: string
  }
  if (!decoded.uuid) throw new Error('Bad token payload')

  const [user] = await db
    .select({
      username: schema.users.username,
      role:     schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.uuid, decoded.uuid))

  if (!user) throw new Error('User not found')
  return { uuid: decoded.uuid, username: user.username, role: user.role }
}

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
    return res.status(400).json({
      message: 'Username and password required',
    })
  }

  // 1) Check for existing
  const existing = await db
    .select({ uuid: schema.users.uuid })
    .from(schema.users)
    .where(eq(schema.users.username, username))

  if (existing.length > 0) {
    return res
      .status(409)
      .json({ message: 'Username already taken' })
  }

  // 2) Hash & insert
  const passkey = await bcrypt.hash(password, 10)
  const inserted = await db
    .insert(schema.users)
    .values({
      username,
      passkey,
    })
    .returning({ uuid: schema.users.uuid })
    .execute()

  const userUuid = inserted[0]!.uuid

  // 3) Sign & set cookie
  const token = jwt.sign({ uuid: userUuid, username }, process.env.JWT_SECRET as Secret)
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

  return res
    .status(201)
    .json({ success: true, uuid: userUuid, username })
}

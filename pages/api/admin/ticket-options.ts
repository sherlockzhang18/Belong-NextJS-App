import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../utils/db'
import { ticketOptions } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { requireUser } from '../../../utils/requireUser'

interface TicketOptionInput {
    event_id?: string;
    name?: string;
    price?: number;
    quantity?: number;
}

function validateTicketOption(data: TicketOptionInput): string[] {
    return [
        ...(!data.event_id ? ['Event ID is required'] : []),
        ...(!data.name ? ['Name is required'] : []),
        ...(typeof data.price !== 'number' || data.price < 0 ? ['Price must be a non-negative number'] : []),
        ...(data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 0) 
            ? ['Quantity must be a non-negative number'] 
            : [])
    ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const user = await requireUser(req)
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' })
        }

        switch (req.method) {
            case 'POST': {
                const errors = validateTicketOption(req.body)
                if (errors.length > 0) {
                    return res.status(400).json({ errors })
                }

                const newOption = await db.insert(ticketOptions).values({
                    event_id: req.body.event_id,
                    name: req.body.name,
                    price: req.body.price.toString(),
                    quantity: req.body.quantity || 1,
                    seat_type: req.body.seat_type || 'general',
                }).returning()
                return res.status(201).json(newOption[0])
            }

            case 'GET': {
                const eventId = req.query.event_id as string
                if (!eventId) {
                    return res.status(400).json({ error: 'Event ID is required' })
                }
                const options = await db.select().from(ticketOptions).where(eq(ticketOptions.event_id, eventId))
                return res.json(options)
            }

            case 'PUT': {
                const { id, ...updateData } = req.body
                if (!id) {
                    return res.status(400).json({ error: 'Ticket option ID is required' })
                }

                const errors = validateTicketOption(updateData)
                if (errors.length > 0) {
                    return res.status(400).json({ errors })
                }

                const updated = await db.update(ticketOptions)
                    .set(updateData)
                    .where(eq(ticketOptions.id, id))
                    .returning()

                if (!updated.length) {
                    return res.status(404).json({ error: 'Ticket option not found' })
                }
                return res.json(updated[0])
            }

            case 'DELETE': {
                const optionId = req.query.id as string
                if (!optionId) {
                    return res.status(400).json({ error: 'Ticket option ID is required' })
                }
                const deleted = await db.delete(ticketOptions)
                    .where(eq(ticketOptions.id, optionId))
                    .returning()
                
                if (!deleted.length) {
                    return res.status(404).json({ error: 'Ticket option not found' })
                }
                return res.status(204).end()
            }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
                return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Ticket options API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

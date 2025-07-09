import { NextApiRequest, NextApiResponse } from 'next';
import { db, schema } from '../../../utils/db';
import { getUserFromReq } from '../../../utils/auth';
import { createPaymentIntent, CreatePaymentIntentData } from '../../../utils/stripe';
import { eq } from 'drizzle-orm';
import { Event as ChronosEvent } from '@jstiava/chronos';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        // 1. Get user and validate request
        const user = await getUserFromReq(req, res);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { items } = req.body as CreatePaymentIntentData;
        if (!items?.length) {
            return res.status(400).json({ message: 'No items provided' });
        }

        // 2. Fetch all events and validate they exist
        const events = await Promise.all(
            items.map(item =>
                db.select()
                    .from(schema.events)
                    .where(eq(schema.events.uuid, item.eventId))
                    .execute()
            )
        );

        // Validate all events exist
        if (events.some(e => !e?.length)) {
            return res.status(400).json({ message: 'One or more events not found' });
        }

        // 3. If ticket options are specified, validate them
        const ticketOptions = await Promise.all(
            items
                .filter(item => item.ticketOptionId)
                .map(item =>
                    db.select()
                        .from(schema.ticketOptions)
                        .where(eq(schema.ticketOptions.id, item.ticketOptionId!))
                        .execute()
                )
        );

        // Validate all specified ticket options exist
        if (ticketOptions.some(t => !t?.length)) {
            return res.status(400).json({ message: 'One or more ticket options not found' });
        }

        // 4. Calculate total amount
        let total = 0;
        items.forEach((item, idx) => {
            const event = new ChronosEvent(events[idx][0] as any);
            const quantity = item.quantity;

            if (item.ticketOptionId) {
                // Use ticket option price if specified
                const ticketOption = ticketOptions.find(t => 
                    t[0].id === item.ticketOptionId
                )?.[0];
                if (ticketOption) {
                    total += Number(ticketOption.price) * quantity;
                }
            } else {
                // Use event metadata price
                const price = parseFloat(event.metadata.price || '0');
                total += price * quantity;
            }
        });

        // 5. Create a pending order
        const [order] = await db.insert(schema.orders)
            .values({
                user_id: user.uuid,
                status: 'pending',
                total_amount: total.toFixed(2),
                metadata: { items }
            })
            .returning()
            .execute();

        // 6. Create order items
        await db.insert(schema.orderItems)
            .values(
                items.map(item => {
                    const event = new ChronosEvent(events.find(e => e[0].uuid === item.eventId)![0] as any);
                    const ticketOption = item.ticketOptionId 
                        ? ticketOptions.find(t => t[0].id === item.ticketOptionId)![0]
                        : null;
                    
                    const unitPrice = ticketOption 
                        ? Number(ticketOption.price)
                        : parseFloat(event.metadata.price || '0');

                    return {
                        order_id: order.uuid,
                        event_id: item.eventId,
                        ticket_option_id: item.ticketOptionId || null,
                        quantity: item.quantity,
                        unit_price: unitPrice.toFixed(2), // Convert to string for database
                        subtotal: (unitPrice * item.quantity).toFixed(2)
                    };
                })
            )
            .execute();

        // 7. Create Stripe payment intent
        const paymentIntent = await createPaymentIntent(total, {
            orderId: order.uuid,
            userId: user.uuid
        });

        // 8. Update order with payment intent ID
        await db.update(schema.orders)
            .set({ stripe_payment_intent_id: paymentIntent.id })
            .where(eq(schema.orders.uuid, order.uuid))
            .execute();

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });

    } catch (error) {
        console.error('Error in create-intent:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
} 
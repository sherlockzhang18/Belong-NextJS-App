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
        const user = await getUserFromReq(req, res);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { items } = req.body as CreatePaymentIntentData;
        if (!items?.length) {
            return res.status(400).json({ message: 'No items provided' });
        }

        const events = await Promise.all(
            items.map(item =>
                db.select()
                    .from(schema.events)
                    .where(eq(schema.events.uuid, item.eventId))
                    .execute()
            )
        );

        if (events.some(e => !e?.length)) {
            return res.status(400).json({ message: 'One or more events not found' });
        }

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

        if (ticketOptions.some(t => !t?.length)) {
            return res.status(400).json({ message: 'One or more ticket options not found' });
        }

        let total = 0;
        items.forEach((item, idx) => {
            const event = new ChronosEvent(events[idx][0] as any);
            const quantity = item.quantity;

            if (item.ticketOptionId) {
                const ticketOption = ticketOptions.find(t =>
                    t[0].id === item.ticketOptionId
                )?.[0];
                if (ticketOption) {
                    total += Number(ticketOption.price) * quantity;
                }
            } else {
                const price = parseFloat(event.metadata.price || '0');
                total += price * quantity;
            }
        });

        const [order] = await db.insert(schema.orders)
            .values({
                user_id: user.uuid,
                status: 'pending',
                total_amount: total.toFixed(2),
                metadata: { items }
            })
            .returning()
            .execute();

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
                        unit_price: unitPrice.toFixed(2),
                        subtotal: (unitPrice * item.quantity).toFixed(2)
                    };
                })
            )
            .execute();

        const paymentIntent = await createPaymentIntent(total, {
            orderId: order.uuid,
            userId: user.uuid
        });

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
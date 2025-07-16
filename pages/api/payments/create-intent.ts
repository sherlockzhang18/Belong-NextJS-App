import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { getUserFromReq } from '../../../utils/auth';
import { createPaymentIntent } from '../../../utils/stripe';
import { eq } from 'drizzle-orm';
import { events, ticketOptions, orders, orderItems } from '../../../drizzle/schema';

interface OrderItem {
    eventId: string;
    quantity: number;
    ticketOptionId?: string;
}

interface CreatePaymentIntentData {
    items: OrderItem[];
}

interface EventMetadata {
    price?: number | string;
    description?: string;
    files?: string[];
    ticketing_link?: string;
    [key: string]: any;
}

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

        // Fetch all events and ticket options in parallel
        const [eventsData, ticketOptionsData] = await Promise.all([
            Promise.all(
                items.map(item =>
                    db.select()
                        .from(events)
                        .where(eq(events.uuid, item.eventId))
                        .execute()
                )
            ),
            Promise.all(
                items
                    .filter(item => item.ticketOptionId)
                    .map(item =>
                        db.select()
                            .from(ticketOptions)
                            .where(eq(ticketOptions.id, item.ticketOptionId!))
                            .execute()
                    )
            )
        ]);

        // Validate events exist
        if (eventsData.some(e => !e?.length)) {
            return res.status(400).json({ message: 'One or more events not found' });
        }

        // Validate ticket options exist
        if (ticketOptionsData.some(t => !t?.length)) {
            return res.status(400).json({ message: 'One or more ticket options not found' });
        }

        // Calculate total
        let total = 0;
        items.forEach((item) => {
            if (item.ticketOptionId) {
                const option = ticketOptionsData
                    .flat()
                    .find(t => t.id === item.ticketOptionId);
                if (option) {
                    total += Number(option.price) * item.quantity;
                }
            } else {
                const event = eventsData
                    .flat()
                    .find(e => e.uuid === item.eventId);
                if (event) {
                    const metadata = event.metadata as EventMetadata;
                    const price = metadata.price ? parseFloat(metadata.price.toString()) : 0;
                    total += price * item.quantity;
                }
            }
        });

        // Validate total amount
        if (total <= 0) {
            return res.status(400).json({ message: 'Total amount must be greater than 0' });
        }

        // Convert to cents and ensure it's a valid integer
        const amountInCents = Math.round(total * 100);
        if (amountInCents < 50) { // Stripe's minimum amount is 50 cents
            return res.status(400).json({ 
                message: 'Total amount must be at least $0.50 to process payment'
            });
        }

        // Create order
        const [order] = await db.insert(orders)
            .values({
                user_id: user.uuid,
                status: 'pending',
                total_amount: total.toFixed(2),
                metadata: { items }
            })
            .returning()
            .execute();

        // Create order items
        await db.insert(orderItems)
            .values(
                items.map(item => {
                    const event = eventsData.flat().find(e => e.uuid === item.eventId)!;
                    const ticketOption = item.ticketOptionId
                        ? ticketOptionsData.flat().find(t => t.id === item.ticketOptionId)
                        : null;

                    const metadata = event.metadata as EventMetadata;
                    const unitPrice = ticketOption
                        ? Number(ticketOption.price)
                        : (metadata.price ? parseFloat(metadata.price.toString()) : 0);

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

        // Create Stripe payment intent
        const paymentIntent = await createPaymentIntent({
            amount: amountInCents, // Already in cents and validated
            currency: 'usd',
            metadata: {
                order_id: order.uuid,
                user_id: user.uuid
            }
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            orderId: order.uuid
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
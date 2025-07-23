import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { stripe, relevantEvents } from '../../../utils/stripe';
import { db, schema } from '../../../utils/db';
import { eq } from 'drizzle-orm';
import { seats, orderItems } from '../../../drizzle/schema';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return res.status(500).json({ message: 'Stripe webhook secret is not set' });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
        const error = err as Error;
        console.log(`Error message: ${error.message}`);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (relevantEvents.has(event.type)) {
        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    const orderId = paymentIntent.metadata.order_id;
                    
                    // Update order status
                    await db.update(schema.orders)
                        .set({ 
                            status: 'completed',
                            stripe_payment_intent_id: paymentIntent.id,
                            metadata: {
                                ...paymentIntent.metadata,
                                stripe_payment_status: 'succeeded',
                                payment_method: paymentIntent.payment_method_types[0]
                            }
                        })
                        .where(eq(schema.orders.uuid, orderId))
                        .execute();

                    // Mark seats as sold if this order contains seat purchases
                    const orderItemsWithSeats = await db
                        .select()
                        .from(orderItems)
                        .where(eq(orderItems.order_id, orderId))
                        .execute();

                    const seatUpdatePromises = orderItemsWithSeats
                        .filter(item => item.seat_id)
                        .map(item =>
                            db.update(seats)
                                .set({ 
                                    status: 'sold',
                                    reserved_until: null
                                })
                                .where(eq(seats.id, item.seat_id!))
                                .execute()
                        );

                    await Promise.all(seatUpdatePromises);
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const paymentIntent = event.data.object;
                    const orderId = paymentIntent.metadata.order_id;
                    
                    // Update order status
                    await db.update(schema.orders)
                        .set({ 
                            status: 'failed',
                            metadata: {
                                ...paymentIntent.metadata,
                                stripe_payment_status: 'failed',
                                failure_message: paymentIntent.last_payment_error?.message
                            }
                        })
                        .where(eq(schema.orders.uuid, orderId))
                        .execute();

                    // Release reserved seats back to available
                    const orderItemsWithSeats = await db
                        .select()
                        .from(orderItems)
                        .where(eq(orderItems.order_id, orderId))
                        .execute();

                    const seatReleasePromises = orderItemsWithSeats
                        .filter(item => item.seat_id)
                        .map(item =>
                            db.update(seats)
                                .set({ 
                                    status: 'available',
                                    reserved_until: null
                                })
                                .where(eq(seats.id, item.seat_id!))
                                .execute()
                        );

                    await Promise.all(seatReleasePromises);
                    break;
                }
                case 'payment_intent.canceled': {
                    const paymentIntent = event.data.object;
                    const orderId = paymentIntent.metadata.order_id;
                    
                    // Update order status
                    await db.update(schema.orders)
                        .set({ 
                            status: 'failed',
                            metadata: {
                                ...paymentIntent.metadata,
                                stripe_payment_status: 'canceled',
                                cancel_reason: paymentIntent.cancellation_reason
                            }
                        })
                        .where(eq(schema.orders.uuid, orderId))
                        .execute();

                    // Release reserved seats back to available
                    const orderItemsWithSeats = await db
                        .select()
                        .from(orderItems)
                        .where(eq(orderItems.order_id, orderId))
                        .execute();

                    const seatReleasePromises = orderItemsWithSeats
                        .filter(item => item.seat_id)
                        .map(item =>
                            db.update(seats)
                                .set({ 
                                    status: 'available',
                                    reserved_until: null
                                })
                                .where(eq(seats.id, item.seat_id!))
                                .execute()
                        );

                    await Promise.all(seatReleasePromises);
                    break;
                }
                default:
                    throw new Error(`Unhandled relevant event: ${event.type}`);
            }
        } catch (error: any) {
            console.log(error);
            return res.status(500).json({
                message: 'Webhook handler failed',
                error: error.message || 'Unknown error'
            });
        }
    }

    res.json({ received: true });
}
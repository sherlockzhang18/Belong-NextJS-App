import { NextApiRequest, NextApiResponse } from 'next';
import { db, schema } from '../../../utils/db';
import { getUserFromReq } from '../../../utils/auth';
import { stripe } from '../../../utils/stripe';
import { eq } from 'drizzle-orm';

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

        const { paymentIntentId } = req.body;
        if (!paymentIntentId) {
            return res.status(400).json({ message: 'Payment intent ID is required' });
        }

        // Verify payment status with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            // Update order status to completed
            const [updatedOrder] = await db.update(schema.orders)
                .set({ 
                    status: 'completed',
                    metadata: {
                        stripe_payment_status: 'succeeded',
                        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                        verified_at: new Date().toISOString()
                    }
                })
                .where(eq(schema.orders.stripe_payment_intent_id, paymentIntentId))
                .returning()
                .execute();

            if (!updatedOrder) {
                return res.status(404).json({ message: 'Order not found' });
            }

            return res.status(200).json({ 
                success: true, 
                order: updatedOrder,
                paymentStatus: paymentIntent.status 
            });
        } else {
            // Payment failed or still processing
            await db.update(schema.orders)
                .set({ 
                    status: paymentIntent.status === 'canceled' ? 'failed' : 'pending',
                    metadata: {
                        stripe_payment_status: paymentIntent.status,
                        last_error: paymentIntent.last_payment_error?.message
                    }
                })
                .where(eq(schema.orders.stripe_payment_intent_id, paymentIntentId))
                .execute();

            return res.status(200).json({ 
                success: false, 
                paymentStatus: paymentIntent.status,
                message: `Payment ${paymentIntent.status}`
            });
        }

    } catch (error) {
        console.error('Error in verify-payment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

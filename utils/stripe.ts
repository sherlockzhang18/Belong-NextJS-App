import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
});

export type CreatePaymentIntentData = {
    items: Array<{
        eventId: string;
        ticketOptionId?: string;
        quantity: number;
    }>;
    metadata?: Record<string, any>;
};

export async function createPaymentIntent(amount: number, metadata: Record<string, any> = {}) {
    return stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to cents
        currency: 'usd',
        metadata,
        automatic_payment_methods: {
            enabled: true,
        },
    });
}

export const relevantEvents = new Set([
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
]); 
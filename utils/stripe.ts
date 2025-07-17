import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
});

interface CreatePaymentIntentOptions {
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
}

export async function createPaymentIntent({ amount, currency = 'usd', metadata = {} }: CreatePaymentIntentOptions) {
    return stripe.paymentIntents.create({
        amount,
        currency,
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
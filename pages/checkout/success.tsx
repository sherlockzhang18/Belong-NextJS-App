import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useCurrentUser } from '../../services/useCurrentUser'

export default function CheckoutSuccess() {
    const router = useRouter()
    const { payment_intent, payment_intent_client_secret, redirect_status } = router.query
    const { isAuthenticated } = useCurrentUser()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [orderDetails, setOrderDetails] = useState<any>(null)

    const verifyPayment = useCallback(async () => {
        try {
            setLoading(true)

            if (redirect_status === 'succeeded' && payment_intent) {
                const response = await fetch('/api/payments/verify-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        paymentIntentId: payment_intent
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setOrderDetails({
                        paymentIntentId: payment_intent,
                        status: data.success ? 'completed' : data.paymentStatus,
                        orderId: data.order?.uuid
                    });
                } else {
                    throw new Error('Failed to verify payment');
                }
            } else {
                setError('Payment was not completed successfully')
            }
        } catch (err) {
            setError('Failed to verify payment status')
        } finally {
            setLoading(false)
        }
    }, [payment_intent, redirect_status])

    useEffect(() => {
        if (payment_intent && redirect_status) {
            verifyPayment()
        } else {
            setError('Missing payment information')
            setLoading(false)
        }
    }, [payment_intent, redirect_status, verifyPayment])

    if (!isAuthenticated) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <CircularProgress />
                <div style={{ marginTop: '1rem' }}>Loading...</div>
            </main>
        )
    }

    if (loading) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: 'auto' }}>
                <CircularProgress size={60} />
                <h2>Verifying your payment...</h2>
                <p>Please wait while we confirm your order.</p>
            </main>
        )
    }

    if (error) {
        return (
            <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
                <Alert severity="error" style={{ marginBottom: '2rem' }}>
                    <strong>Payment Error</strong>
                    <br />
                    {error}
                </Alert>

                <div style={{ textAlign: 'center' }}>
                    <Button
                        component={Link}
                        href="/cart"
                        variant="contained"
                        color="primary"
                        style={{ marginRight: '1rem' }}
                    >
                        Back to Cart
                    </Button>
                    <Button
                        component={Link}
                        href="/"
                        variant="outlined"
                    >
                        Continue Shopping
                    </Button>
                </div>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto', textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
                <CheckCircleIcon
                    style={{
                        fontSize: '4rem',
                        color: '#4caf50',
                        marginBottom: '1rem'
                    }}
                />
                <h1 style={{ color: '#4caf50', marginBottom: '0.5rem' }}>
                    Payment Successful!
                </h1>
                <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
                    Thank you for your purchase. Your tickets have been confirmed.
                </p>
            </div>

            {orderDetails && (
                <Alert severity="success" style={{ marginBottom: '2rem', textAlign: 'left' }}>
                    <strong>Order Confirmation</strong>
                    <br />
                    Payment ID: {orderDetails.paymentIntentId}
                    <br />
                    Status: {orderDetails.status}
                    {orderDetails.orderId && (
                        <>
                            <br />
                            Order ID: {orderDetails.orderId.slice(0, 8)}
                        </>
                    )}
                </Alert>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h3>What&apos;s Next?</h3>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>You will receive a confirmation email shortly</li>
                    <li>Your tickets will be available in your account</li>
                    <li>Present your tickets at the event venue</li>
                </ul>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button
                    component={Link}
                    href="/orders"
                    variant="contained"
                    color="primary"
                >
                    View My Orders
                </Button>
                <Button
                    component={Link}
                    href="/"
                    variant="outlined"
                >
                    Browse More Events
                </Button>
            </div>
        </main>
    )
}

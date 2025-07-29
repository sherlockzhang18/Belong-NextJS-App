import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { useCart } from '../services/useCart'
import { useCurrentUser } from '../services/useCurrentUser'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
    clientSecret: string
    onSuccess: () => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ clientSecret, onSuccess }) => {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setProcessing(true)
        setError(null)

        const { error: submitError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success`,
            },
        })

        if (submitError) {
            setError(submitError.message ?? 'An unexpected error occurred')
            setProcessing(false)
        } else {
            onSuccess()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <PaymentElement />
            {error && (
                <Alert severity="error" style={{ marginTop: '1rem' }}>
                    {error}
                </Alert>
            )}
            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!stripe || processing}
                fullWidth
                style={{ marginTop: '1.5rem', padding: '0.75rem' }}
                startIcon={processing ? <CircularProgress size={20} /> : undefined}
            >
                {processing ? 'Processing...' : 'Complete Payment'}
            </Button>
        </form>
    )
}

export default function CheckoutPage() {
    const router = useRouter()
    const { items, totalPrice, getItemPrice, getItemPriceDisplay, clear } = useCart()
    const { user, isAuthenticated } = useCurrentUser()
    const [clientSecret, setClientSecret] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [seatDetails, setSeatDetails] = useState<Record<string, any>>({})

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const fetchSeatDetails = async () => {
            const allSeatIds = items
                .filter(item => item.seatIds && item.seatIds.length > 0)
                .flatMap(item => item.seatIds || [])

            if (allSeatIds.length > 0) {
                try {
                    const response = await fetch('/api/seats/details', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ seatIds: allSeatIds })
                    })
                    const data = await response.json()
                    const seatMap = data.seats.reduce((acc: any, seat: any) => {
                        acc[seat.id] = seat
                        return acc
                    }, {})
                    setSeatDetails(seatMap)
                } catch (error) {
                    console.error('Error fetching seat details:', error)
                }
            }
        }

        if (items.length > 0) {
            fetchSeatDetails()
        }
    }, [items])

    useEffect(() => {
        if (mounted && items.length === 0) {
            const timer = setTimeout(() => {
                router.push('/cart')
            }, 2000)

            return () => clearTimeout(timer)
        }
    }, [mounted, items.length, router])

    const createPaymentIntent = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    items: items.map(item => ({
                        eventId: item.event.uuid,
                        quantity: item.quantity,
                        ticketOptionId: item.ticketOptionId,
                        seatIds: item.seatIds
                    }))
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to create payment intent')
            }

            const data = await response.json()
            setClientSecret(data.clientSecret)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [items])

    useEffect(() => {
        if (isAuthenticated && mounted && items.length > 0) {
            createPaymentIntent()
        }
    }, [isAuthenticated, mounted, items.length, createPaymentIntent])

    const handlePaymentSuccess = () => {
        clear()
        router.push('/checkout/success')
    }

    if (!isAuthenticated || !mounted) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <CircularProgress />
                <div style={{ marginTop: '1rem' }}>Loading...</div>
            </main>
        )
    }

    if (items.length === 0) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Your cart is empty</h2>
                <p>Add some items to your cart before checking out.</p>
                <Button
                    onClick={() => router.push('/')}
                    variant="contained"
                    color="primary"
                    style={{ marginTop: '1rem' }}
                >
                    Browse Events
                </Button>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
            <h1>Checkout</h1>

            <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2>Order Summary</h2>
                {items.map((item) => {
                    let unitPrice = 0
                    let lineTotal = 0
                    let ticketType = ''

                    if (item.seatIds && item.seatIds.length > 0) {
                        // For seated items, calculate from seat details
                        const seatPrices = item.seatIds.map(seatId => {
                            const seatDetail = seatDetails[seatId]
                            return seatDetail ? parseFloat(seatDetail.price) : 0
                        })
                        lineTotal = seatPrices.reduce((sum, price) => sum + price, 0)
                        unitPrice = lineTotal / item.seatIds.length
                        ticketType = `${item.seatIds.length} Selected Seat${item.seatIds.length !== 1 ? 's' : ''}`
                    } else {
                        // For general admission items
                        unitPrice = getItemPrice(item)
                        lineTotal = unitPrice * item.quantity
                        ticketType = getItemPriceDisplay(item)
                    }

                    return (
                        <div key={`${item.event.uuid}-${item.ticketOptionId || 'general'}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #eee'
                        }}>
                            <div>
                                <strong>{item.event.name}</strong>
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                    {item.seatIds && item.seatIds.length > 0 ? (
                                        <>
                                            {ticketType}
                                            <br />
                                            Seats: {item.seatIds.map(seatId =>
                                                seatDetails[seatId]?.seat_number || `Seat ${seatId.slice(-4)}`
                                            ).join(', ')}
                                        </>
                                    ) : (
                                        `${ticketType} - Quantity: ${item.quantity} × $${unitPrice.toFixed(2)}`
                                    )}
                                </div>
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                                ${lineTotal.toFixed(2)}
                            </div>
                        </div>
                    )
                })}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    padding: '1rem 0',
                    borderTop: '2px solid #333',
                    fontSize: '1.2em',
                    fontWeight: 'bold'
                }}>
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2>Payment Information</h2>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <CircularProgress />
                        <div style={{ marginTop: '1rem' }}>Setting up payment...</div>
                    </div>
                )}

                {error && (
                    <Alert severity="error" style={{ marginBottom: '1rem' }}>
                        {error}
                        <Button
                            onClick={createPaymentIntent}
                            style={{ marginLeft: '1rem' }}
                            size="small"
                        >
                            Retry
                        </Button>
                    </Alert>
                )}

                {clientSecret && !loading && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
                    </Elements>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Button
                    onClick={() => router.push('/cart')}
                    variant="text"
                    color="inherit"
                >
                    ← Back to Cart
                </Button>
            </div>
        </main>
    )
}

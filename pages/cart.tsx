// File: pages/cart.tsx

import React from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import { useCart, CartItem } from '../services/useCart'

export default function CartPage() {
    const { items, add, remove, clear, totalPrice } = useCart()

    if (items.length === 0) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Your Cart Is Empty</h1>
                <Button component={Link} href="/" variant="contained">
                    Back to Events
                </Button>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
            <h1>Your Cart</h1>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map(({ event, quantity }: CartItem) => {
                    // pull numeric price
                    const raw = event.metadata?.price?.toString().replace(/[^0-9.]/g, '') || '0'
                    const unit = parseFloat(raw) || 0
                    const lineTotal = unit * quantity

                    return (
                        <li
                            key={event.uuid}
                            style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                border: '1px solid var(--foreground)',
                                borderRadius: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <strong>{event.name}</strong>
                                <div>Unit Price: ${unit.toFixed(2)}</div>
                                <div>Quantity: {quantity}</div>
                                <div>Total: ${lineTotal.toFixed(2)}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => remove(event)}
                                >
                                    −1
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => add(event)}
                                >
                                    +1
                                </Button>
                            </div>
                        </li>
                    )
                })}
            </ul>

            <h2>Total Price: ${totalPrice.toFixed(2)}</h2>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <Button variant="contained" color="primary">
                    Checkout
                </Button>
                <Button variant="text" color="secondary" onClick={clear}>
                    Clear Cart
                </Button>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Button component={Link} href="/" variant="text">
                    ← Back to Events
                </Button>
            </div>
        </main>
    )
}

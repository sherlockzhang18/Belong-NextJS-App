import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import { useCart } from '../services/useCart'
import { Box, Typography, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function CartPage() {
    const { items, remove, add, totalPrice, ticketOptions } = useCart()
    const router = useRouter()
    const [seatDetails, setSeatDetails] = useState<Record<string, any>>({})

    useEffect(() => {
        const fetchSeatDetails = async () => {
            const allSeatIds = items
                .filter(item => item.seatIds && item.seatIds.length > 0)
                .flatMap(item => item.seatIds || [])

            if (allSeatIds.length > 0) {
                try {
                    const response = await axios.post('/api/seats/details', { seatIds: allSeatIds })
                    const seatMap = response.data.seats.reduce((acc: any, seat: any) => {
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

    if (items.length === 0) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Your cart is empty</h2>
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
        <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Shopping Cart
            </Typography>

            <Box sx={{ listStyle: 'none', padding: 0 }}>
                {items.map((item, index) => {
                    const ticketOption = item.ticketOptionId ? ticketOptions[item.ticketOptionId] : null

                    let unitPrice = 0
                    let lineTotal = 0

                    if (item.seatIds && item.seatIds.length > 0) {
                        // For seated items, calculate price from seat details
                        const seatPrices = item.seatIds.map(seatId => {
                            const seatDetail = seatDetails[seatId]
                            return seatDetail ? parseFloat(seatDetail.price) : 0
                        })
                        lineTotal = seatPrices.reduce((sum, price) => sum + price, 0)
                        unitPrice = lineTotal / item.seatIds.length // Average price per seat
                    } else {
                        // For general admission items
                        unitPrice = ticketOption
                            ? parseFloat(ticketOption.price)
                            : parseFloat(item.event.metadata?.price?.toString() || '0')
                        lineTotal = unitPrice * item.quantity
                    }

                    const itemKey = item.seatIds
                        ? `${item.event.uuid}-seats-${item.seatIds.join('-')}`
                        : `${item.event.uuid}-${item.ticketOptionId || 'default'}-${index}`

                    return (
                        <Box
                            key={itemKey}
                            sx={{
                                mb: 2,
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom>
                                    {item.event.name}
                                </Typography>

                                {item.seatIds && item.seatIds.length > 0 ? (
                                    <>
                                        <Typography variant="body1" color="text.secondary" gutterBottom>
                                            Selected Seats: {item.seatIds.length} seat{item.seatIds.length !== 1 ? 's' : ''}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                                            Seats: {item.seatIds.map(seatId => {
                                                const seatDetail = seatDetails[seatId]
                                                const seatPrice = seatDetail ? parseFloat(seatDetail.price) : 0
                                                return `${seatDetail?.seat_number || `Seat ${seatId.slice(-4)}`} ($${seatPrice.toFixed(2)})`
                                            }).join(', ')}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        {ticketOption && (
                                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                                Ticket Type: {ticketOption.name}
                                            </Typography>
                                        )}
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <Typography variant="body2">Quantity:</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => remove(item.event, { ticketOptionId: item.ticketOptionId })}
                                            >
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <Typography variant="body1" sx={{ mx: 1 }}>
                                                {item.quantity}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => add(item.event, { ticketOptionId: item.ticketOptionId })}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </>
                                )}

                                {item.seatIds && item.seatIds.length > 0 ? (
                                    <Typography variant="body2" gutterBottom>
                                        Total for {item.seatIds.length} seat{item.seatIds.length !== 1 ? 's' : ''}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" gutterBottom>
                                        Unit Price: ${unitPrice.toFixed(2)}
                                    </Typography>
                                )}
                                <Typography variant="body1" fontWeight="bold">
                                    Total: ${lineTotal.toFixed(2)}
                                </Typography>
                            </Box>

                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={async () => {
                                    if (item.seatIds && item.seatIds.length > 0) {
                                        try {
                                            await axios.post('/api/seats/release', { seatIds: item.seatIds })
                                        } catch (error) {
                                            console.error('Error releasing seats:', error)
                                        }
                                    }
                                    remove(item.event, {
                                        ticketOptionId: item.ticketOptionId,
                                        seatIds: item.seatIds
                                    })
                                }}
                            >
                                Remove
                            </Button>
                        </Box>
                    )
                })}
            </Box>

            <Box
                sx={{
                    mt: 4,
                    pt: 2,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h5">
                    Total: ${totalPrice.toFixed(2)}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/checkout')}
                    disabled={items.length === 0}
                    size="large"
                >
                    Proceed to Checkout
                </Button>
            </Box>
        </main>
    )
}

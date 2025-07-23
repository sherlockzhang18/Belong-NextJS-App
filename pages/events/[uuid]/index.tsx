import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '@mui/material/Button'
import axios from 'axios'
import { Event as ChronosEvent } from '@jstiava/chronos'
import { useCart } from '../../../services/useCart'
import { parseRawEvent, RawEvent } from '../../../services/eventUtils'
import Image from 'next/image'
import { Typography, Box } from '@mui/material'
import TicketOptionCard from '../../../components/TicketOptionCard'
import SeatMap from '../../../components/SeatMap'

interface TicketOption {
    id: string
    name: string
    price: string
    quantity: number
    seat_type?: string
}

export default function EventDetail() {
    const router = useRouter()
    const { uuid } = router.query
    const [event, setEvent] = useState<ChronosEvent | null>(null)
    const [loading, setLoading] = useState(true)
    const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([])
    const [hasAssignedSeats, setHasAssignedSeats] = useState(false)
    const [selectedSeats, setSelectedSeats] = useState<string[]>([])
    const cart = useCart()

    useEffect(() => {
        if (typeof uuid !== 'string') return
        
        axios.get<{ events: RawEvent[] }>('/api/events')
            .then(res => {
                const raw = res.data.events.find(e => e.uuid === uuid)
                setEvent(raw ? parseRawEvent(raw) : null)
            })
            .catch(console.error)
            .finally(() => setLoading(false))

        axios.get(`/api/events/${uuid}/seats`)
            .then(res => {
                setHasAssignedSeats(res.data.hasAssignedSeats)
                if (!res.data.hasAssignedSeats) {
                    setTicketOptions(res.data.generalTickets || [])
                }
            })
            .catch(console.error)

        axios.get<{ ticketOptions: TicketOption[] }>(`/api/events/${uuid}/ticket-options`)
            .then(res => {
                if (!hasAssignedSeats) {
                    setTicketOptions(res.data.ticketOptions)
                }
            })
            .catch(console.error)
    }, [uuid, hasAssignedSeats])

    if (!router.isReady || loading) return <p>Loading…</p>
    if (!event) return (
        <div>
            <p>Event not found.</p>
            <Button component={Link} href="/" variant="text">← Back</Button>
        </div>
    )

    const dateStr = event.date?.format('MMMM D, YYYY') || ''
    const fmt = (t: NonNullable<ChronosEvent['start_time']>) =>
        t.getDayjs().format('H:mm')

    const firstImage = Array.isArray(event.metadata?.files) && event.metadata.files.length > 0
        ? event.metadata.files[0]
        : null

    const handleAddToCart = (ticketOptionId: string, quantity: number) => {
        cart.add(event, { ticketOptionId, quantity })
    }

    const handleSeatSelection = (seatIds: string[]) => {
        setSelectedSeats(seatIds)
    }

    const handleAddSeatsToCart = async () => {
        if (selectedSeats.length === 0) return

        try {
            await axios.post('/api/seats/reserve', { seatIds: selectedSeats })
            
            cart.add(event, { 
                seatIds: selectedSeats,
                quantity: selectedSeats.length 
            })
            
            setSelectedSeats([])
            
            router.push('/cart')
        } catch (error: any) {
            console.error('Error reserving seats:', error)
            alert(error.response?.data?.message || 'Failed to reserve seats')
        }
    }

    return (
        <main className="event-detail" style={{ padding: '1rem' }}>
            <Button component={Link} href="/" variant="text" sx={{ mb: 2 }}>
                ← Back to events
            </Button>

            {firstImage && (
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 600,
                        height: 400,
                        margin: '0 auto 1.5rem',
                    }}
                >
                    <Image
                        src={firstImage}
                        alt={event.name}
                        fill
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        priority
                    />
                </div>
            )}

            <h1>{event.name}</h1>
            <p>
                {dateStr}
                {event.start_time && ` • ${fmt(event.start_time)}`}
                {event.end_time && `–${fmt(event.end_time)}`}
            </p>
            {event.location_name && <p>{event.location_name}</p>}

            {event.metadata?.description && (
                <p className="detail-desc">{event.metadata.description}</p>
            )}

            {hasAssignedSeats ? (
                <Box sx={{ my: 3 }}>
                    <SeatMap
                        eventId={uuid as string}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelection}
                        maxSelectable={8}
                    />
                    
                    {selectedSeats.length > 0 && (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={handleAddSeatsToCart}
                            >
                                Add {selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''} to Cart
                            </Button>
                        </Box>
                    )}
                </Box>
            ) : ticketOptions.length > 0 ? (
                <Box sx={{ my: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select Tickets
                    </Typography>
                    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                        {ticketOptions.map((option) => (
                            <TicketOptionCard
                                key={option.id}
                                option={option}
                                onAddToCart={(quantity) => handleAddToCart(option.id, quantity)}
                            />
                        ))}
                    </Box>
                </Box>
            ) : (
                <Box sx={{ my: 3 }}>
                    <Typography color="error">
                        No tickets available at this time.
                    </Typography>
                </Box>
            )}

            {event.metadata?.ticketing_link && (
                <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    component="a"
                    href={event.metadata.ticketing_link}
                    target="_blank"
                >
                    View on Ticketmaster
                </Button>
            )}
        </main>
    )
}

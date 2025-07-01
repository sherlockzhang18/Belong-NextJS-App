import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '@mui/material/Button'
import axios from 'axios'
import { Event as ChronosEvent } from '@jstiava/chronos'
import { useCart } from '../../../services/useCart'
import { parseRawEvent, RawEvent } from '../../../services/eventUtils'
import Image from 'next/image'

export default function EventDetail() {
    const router = useRouter()
    const { uuid } = router.query
    const [event, setEvent] = useState<ChronosEvent | null>(null)
    const [loading, setLoading] = useState(true)
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
    }, [uuid])

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

    const rawPrice = event.metadata?.price
    const displayPrice = rawPrice && !isNaN(parseFloat(rawPrice))
        ? `$${parseFloat(rawPrice).toFixed(2)}`
        : null

    const firstImage = Array.isArray(event.metadata?.files) && event.metadata.files.length > 0
        ? event.metadata.files[0]
        : null

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
            {event.metadata?.price && (
                <p><strong>Price:&nbsp;</strong>{displayPrice}</p>
            )}
            {event.metadata?.ticketing_link && (
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    component="a"
                    href={event.metadata.ticketing_link}
                    target="_blank"
                >
                    Buy Tickets
                </Button>
            )}

            <Button
                variant="contained"
                sx={{ mt: 1 }}
                onClick={() => cart.add(event)}
            >
                Add to cart
            </Button>
            <Button
                component={Link}
                href={`/events/${event.uuid}/edit`}
                variant="outlined"
                size="small"
                sx={{ mt: 5 }}
            >
                Edit
            </Button>
        </main>
    )
}

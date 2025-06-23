import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '@mui/material/Button'
import axios from 'axios'
import { Event as ChronosEvent, dayjs } from '@jstiava/chronos'
import { useCart } from '../../services/useCart'

export default function EventDetail() {
    const router = useRouter()
    const { uuid } = router.query
    const [event, setEvent] = useState<ChronosEvent | null>(null)
    const [loading, setLoading] = useState(true)
    const cart = useCart()

    useEffect(() => {
        if (typeof uuid !== 'string') return
        axios.get<{ events: any[] }>('/api/events')
            .then(res => {
                const raw = res.data.events.find(e => e.uuid === uuid)
                setEvent(raw ? new ChronosEvent(raw, true) : null)
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
        `${t.getHour()}:${String(Math.round(t.getMinute() || 0)).padStart(2, '0')}`

    return (
        <main className="event-detail">
            <Button component={Link} href="/" variant="text" sx={{ mb: 2 }}>
                ← Back to events
            </Button>

            {/* show all images */}
            <div className="detail-images">
                {event.metadata?.files?.map((url, i) => (
                    <img key={i} src={url} alt={`${event.name} #${i + 1}`} className="detail-img" />
                ))}
            </div>

            <h1>{event.name}</h1>
            <p>{dateStr}
                {event.start_time && ` • ${fmt(event.start_time)}`}
                {event.end_time && `–${fmt(event.end_time)}`}
            </p>
            {event.location_name && <p>{event.location_name}</p>}
            {event.metadata?.description && (
                <p className="detail-desc">{event.metadata.description}</p>
            )}

            <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => cart.add(event)}
            >
                Add to cart
            </Button>
        </main>
    )
}

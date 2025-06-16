import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import Button from '@mui/material/Button'
import { Event as ChronosEvent, dayjs } from '@jstiava/chronos'
import EventCard from '../components/EventCard'

export default function Home() {
    const [events, setEvents] = useState<ChronosEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        axios
            .get<{ events: any[] }>('/api/events')
            .then(({ data }) => {
                const wrapped = data.events.map(e => new ChronosEvent(e, true))
                setEvents(wrapped)
            })
            .catch(err => {
                console.error(err)
                setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <p>Loading events…</p>
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

    // filter
    const today = dayjs().startOf('day')
    const upcoming = events.filter(e =>
        e.date
            ? e.date.isSame(today, 'day') || e.date.isAfter(today, 'day')
            : false
    )

    return (
        <main>
            <div style={{ padding: '1rem' }}>
                <Button component={Link} href="/cart" variant="contained" color="primary">
                    View Cart
                </Button>
            </div>

            <h1>Upcoming Events</h1>
            <div className="event-grid">
                {upcoming.map(e => (
                    <EventCard key={e.uuid} event={e} />
                ))}
            </div>
        </main>
    )
}

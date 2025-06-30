import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import { Event as ChronosEvent, dayjs } from '@jstiava/chronos'
import EventCard from '../components/EventCard'
import { useCurrentUser } from '../services/useCurrentUser'
import { parseRawEvent, RawEvent } from '../services/eventUtils'

export default function Home() {
    const router = useRouter()
    const { isAdmin, isAuthenticated, refresh } = useCurrentUser()
    const [events, setEvents] = useState<ChronosEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        axios.get<{ events: RawEvent[] }>('/api/events')
            .then(res => {
                const wrapped = res.data.events.map(raw => parseRawEvent(raw))
                setEvents(wrapped)
            })
            .catch(err => {
                console.error(err)
                setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [])

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout', {}, { withCredentials: true })
            refresh()
            router.push('/login')
        } catch (err) {
            console.error('Logout failed', err)
        }
    }

    if (loading) return <p>Loading events…</p>
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

    const today = dayjs().startOf('day')
    const upcoming = events.filter(e =>
        e.date ? e.date.isSame(today, 'day') || e.date.isAfter(today, 'day') : false
    )

    return (
        <main>
            <div style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                <Button component={Link} href="/cart" variant="contained" color="primary">
                    View Cart
                </Button>
                <Button component={Link} href="/events/create" variant="contained" color="primary">
                    Create Event
                </Button>
                {isAdmin && (
                    <Button component={Link} href="/admin" variant="outlined" color="secondary">
                        Admin Dashboard
                    </Button>
                )}
                {isAuthenticated && (
                    <Button onClick={handleLogout} variant="outlined" color="inherit">
                        Log Out
                    </Button>
                )}
            </div>

            <h1>Upcoming Events</h1>
            <div className="event-grid">
                {upcoming.map(e => (
                    <EventCard key={e.uuid} event={e} editMode={isAdmin} />
                ))}
            </div>
        </main>
    )
}

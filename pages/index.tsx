import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import { Event as ChronosEvent, dayjs } from '@jstiava/chronos'
import EventCard from '../components/EventCard'
import { useCurrentUser } from '../services/useCurrentUser'

export default function Home() {
    const router = useRouter()
    const { isAdmin, isAuthenticated, refresh } = useCurrentUser()
    const [events, setEvents] = useState<ChronosEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        axios
            .get<{ events: any[] }>('/api/events')
            .then(({ data }) => {
                console.log('RAW times:', data.events.map(e => ({
                    uuid: e.uuid,
                    rawStart: e.start_time,
                    rawEnd: e.end_time
                })))

                const wrapped = data.events.map(e => {
                    const ev = new ChronosEvent(e, false)
                    console.log(`EVENT ${ev.uuid} → HMN:`, ev.start_time?.getHMN(), ' Dayjs:', ev.start_time?.getDayjs().format('HH:mm:ss'))
                    return ev
                })

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

    const today = dayjs().startOf('day')
    console.log('Today:', today.format('YYYY-MM-DD'))

    const upcoming = events.filter(e => {
        const ds = e.date?.format('YYYY-MM-DD') ?? '<none>'
        console.log(`Comparing event ${e.uuid} date=${ds}`,
            'isSame?', e.date?.isSame(today, 'day'),
            'isAfter?', e.date?.isAfter(today, 'day')
        )
        return e.date ? e.date.isSame(today, 'day') || e.date.isAfter(today, 'day') : false
    })

    return (
        <main>
            <div style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                <Button component={Link} href="/cart" variant="contained" color="primary">
                    View Cart
                </Button>
                {isAdmin && (
                    <Button component={Link} href="/admin" variant="outlined" color="secondary">
                        Admin Dashboard
                    </Button>
                )}
                {isAuthenticated && (
                    <Button onClick={() => {
                        axios.post('/api/logout', {}, { withCredentials: true })
                            .then(() => { refresh(); router.push('/login') })
                    }} variant="text" color="inherit">
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

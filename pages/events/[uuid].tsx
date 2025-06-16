// File: pages/events/[uuid].tsx

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
    setLoading(true)

    axios
      .get<{ events: any[] }>('/api/events')
      .then((res) => {
        // Find the matching raw event and wrap it
        const raw = res.data.events.find((e) => e.uuid === uuid)
        setEvent(raw ? new ChronosEvent(raw, true) : null)
      })
      .catch((err) => {
        console.error('Failed to load event:', err)
        setEvent(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [uuid])

  if (!router.isReady || loading) {
    return <p>Loading…</p>
  }

  if (!event) {
    return (
      <div className="event-detail">
        <p>Event not found.</p>
        <Button component={Link} href="/" variant="text" color="primary">
          ← Back to events
        </Button>
      </div>
    )
  }

  // Format date and time
  const dateStr = event.date?.format('MMMM D, YYYY') || ''
  const formatTime = (c: NonNullable<ChronosEvent['start_time']>) => {
    const h = c.getHour()
    const m = Math.round(c.getMinute() || 0)
    return `${h}:${String(m).padStart(2, '0')}`
  }
  const timeStr =
    event.start_time && event.end_time
      ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
      : event.start_time
      ? formatTime(event.start_time)
      : ''

  return (
    <main className="event-detail">
      <Button component={Link} href="/" variant="text" color="primary" sx={{ mb: 2 }}>
        ← Back to events
      </Button>

      <h1>{event.name}</h1>

      {event.getCoverImageLink() && (
        <img
          src={event.getCoverImageLink()!}
          alt={event.name}
          className="detail-image"
        />
      )}

      <p className="detail-info">
        {dateStr}
        {timeStr && <> • {timeStr}</>}
      </p>

      {event.location_name && (
        <p className="detail-info">{event.location_name}</p>
      )}

      {event.metadata?.description && (
        <p className="detail-description">{event.metadata.description}</p>
      )}

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={() => cart.add(event)}
      >
        Add to cart
      </Button>
    </main>
  )
}

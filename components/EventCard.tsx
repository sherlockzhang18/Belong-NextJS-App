import React from 'react'
import Link from 'next/link'
import { Event as ChronosEvent } from '@jstiava/chronos'
import Button from '@mui/material/Button'

type Props = {
    event: ChronosEvent
    editMode: boolean
}

export default function EventCard({ event, editMode }: Props) {
    const dateStr = event.date?.format('MMM D, YYYY') || ''

    const formatTime = (c?: ChronosEvent['start_time'] | ChronosEvent['end_time']) => {
        if (!c) return ''
        const h = c.getHour()
        const m = Math.round(c.getMinute() || 0)
        return `${h}:${String(m).padStart(2, '0')}`
    }
    const timeStr =
        event.start_time && event.end_time
            ? `${formatTime(event.start_time)}–${formatTime(event.end_time)}`
            : event.start_time
                ? formatTime(event.start_time)
                : ''

    const description = event.metadata?.description
    const price = event.metadata?.price

    return (
        <div className="event-card">
            {event.getCoverImageLink() && (
                <img src={event.getCoverImageLink()!} alt={event.name} className="cover-image" />
            )}
            <div className="event-body">
                <h2>{event.name}</h2>
                <p className="subtitle">{event.subtitle}</p>
                {description && <p className="description">{description}</p>}

                <p className="info">
                    <span>{dateStr}</span>
                    {timeStr && <span> • {timeStr}</span>}
                </p>
                <p className="info">
                    <span>{event.location_name}</span>
                    {price && <span> • ${price}</span>}
                </p>

                <Button
                    component={Link}
                    href={`/events/${event.uuid}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    View Details
                </Button>

                {editMode && (
                    <Button
                        component={Link}
                        href={`/admin/events/${event.uuid}`}
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        Edit Event
                    </Button>
                )}
            </div>
        </div>
    )
}

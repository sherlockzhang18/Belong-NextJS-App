import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Event as ChronosEvent } from '@jstiava/chronos'
import Button from '@mui/material/Button'

type Props = {
    event: ChronosEvent
    editMode?: boolean
}

export default function EventCard({ event, editMode = false }: Props) {
    const files = event.metadata?.files as string[] | undefined
    const firstImage = files?.[0] ?? event.getCoverImageLink()

    const dateStr = event.date?.format('MMM D, YYYY') || ''
    const timeStr = event.start_time
        ? event.end_time
            ? `${event.start_time.getDayjs().format('H:mm')}–${event.end_time.getDayjs().format('H:mm')}`
            : event.start_time.getDayjs().format('H:mm')
        : ''

    return (
        <div className="event-card">
            {firstImage && (
                <div className="cover-container">
                    <Image
                        src={firstImage}
                        alt={event.name}
                        fill
                        style={{ objectFit: 'cover' }}
                    />
                </div>
            )}
            <div className="event-body">
                <h2 className="event-title">{event.name}</h2>
                {event.subtitle && <p className="event-subtitle">{event.subtitle}</p>}
                {event.metadata?.description && (
                    <p className="event-description">{event.metadata.description}</p>
                )}

                <p className="event-info">
                    {dateStr}
                    {timeStr && ` • ${timeStr}`}
                </p>
                <p className="event-info">{event.location_name}</p>

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
                        href={`/events/${event.uuid}/edit`}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                    >
                        Edit
                    </Button>
                )}
            </div>
        </div>
    )
}

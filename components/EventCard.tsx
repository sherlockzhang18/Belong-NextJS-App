import React from "react";
import Link from "next/link";
import { Event as ChronosEvent } from "@jstiava/chronos";

type Props = {
    event: ChronosEvent;
};

export default function EventCard({ event }: Props) {
    // Format date
    const dateStr = event.date?.format("MMM D, YYYY") || "";

    // Format times (Chronos decimal‐hour → HH:MM)
    const formatTime = (
        c: ChronosEvent["start_time"] | ChronosEvent["end_time"]
    ) => {
        if (!c) return "";
        const h = c.getHour();
        const m = Math.round(c.getMinute() || 0);
        return `${h}:${String(m).padStart(2, "0")}`;
    };
    const timeStr =
        event.start_time && event.end_time
            ? `${formatTime(event.start_time)}–${formatTime(event.end_time)}`
            : event.start_time
            ? formatTime(event.start_time)
            : "";

    return (
        <div className="event-card">
            {event.getCoverImageLink() && (
                <img
                    src={event.getCoverImageLink()!}
                    alt={event.name}
                    className="cover-image"
                />
            )}
            <div className="event-body">
                <h2>{event.name}</h2>
                <p className="subtitle">{event.subtitle}</p>
                <p className="description">{event.metadata?.description}</p>

                <p className="info">
                    <span>{dateStr}</span>
                    {timeStr && <span> • {timeStr}</span>}
                </p>
                <p className="info">
                    <span>{event.location_name}</span>
                    {event.metadata?.price && (
                        <span> • {event.metadata.price}</span>
                    )}
                </p>

                {/* VIEW DETAILS BUTTON */}
                <Link href={`/events/${event.uuid}`} className="detail-button">
                    View Details
                </Link>
            </div>
        </div>
    );
}

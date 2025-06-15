import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Event as ChronosEvent, dayjs } from "@jstiava/chronos";
import { sampleEvents } from "../../services/eventsData";
import { useCart } from "../../services/useCart";

export default function EventDetail() {
    const router = useRouter();
    const { uuid } = router.query;
    const [event, setEvent] = useState<ChronosEvent | null>(null);
    const cart = useCart();

    useEffect(() => {
        if (typeof uuid !== "string") return;
        const raw = sampleEvents.find((e) => e.uuid === uuid);
        setEvent(raw ? new ChronosEvent(raw) : null);
    }, [uuid]);

    if (!router.isReady) return <p>Loading…</p>;
    if (!event)
        return (
            <div className="event-detail">
                <p>Event not found.</p>
                <Button
                    component={Link}
                    href="/"
                    variant="text"
                    color="primary"
                >
                    ← Back to events
                </Button>
            </div>
        );

    const dateStr = event.date?.format("MMMM D, YYYY") || "";
    const formatTime = (c: NonNullable<ChronosEvent["start_time"]>) => {
        const h = c.getHour(),
            m = Math.round(c.getMinute() || 0);
        return `${h}:${String(m).padStart(2, "0")}`;
    };
    const timeStr =
        event.start_time && event.end_time
            ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
            : event.start_time
            ? formatTime(event.start_time)
            : "";

    return (
        <main className="event-detail">
            <Button
                component={Link}
                href="/"
                variant="text"
                color="primary"
                sx={{ mb: 2 }}
            >
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
            <p className="detail-info">{event.location_name}</p>
            {event.metadata?.description && (
                <p className="detail-description">
                    {event.metadata.description}
                </p>
            )}
            <Button
                variant="contained"
                color="primary"
                onClick={() => cart.add(event)}
            >
                Add to cart
            </Button>
        </main>
    );
}

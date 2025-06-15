import React from "react";
import Link from "next/link";
import { sampleEvents } from "../services/eventsData";
import { Event } from "@jstiava/chronos";
import { dayjs } from "@jstiava/chronos";
import EventCard from "../components/EventCard";

export default function Home() {
    const wrapped = sampleEvents.map((raw) => new Event(raw));
    const today = dayjs().startOf("day");
    const upcoming = wrapped.filter((e) =>
        e.date
            ? e.date.isSame(today, "day") || e.date.isAfter(today, "day")
            : false
    );

    return (
        <main>
            <div style={{ padding: "1rem" }}>
                <Link href="/cart">🛒 View Cart</Link>
            </div>
            <h1>Upcoming Events</h1>
            <div className="event-grid">
                {upcoming.map((e) => (
                    <EventCard key={e.uuid} event={e} />
                ))}
            </div>
        </main>
    );
}

import React from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import { sampleEvents } from "../services/eventsData";
import { Event, dayjs } from "@jstiava/chronos";
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
                <Button
                    component={Link}
                    href="/cart"
                    variant="contained"
                    color="primary"
                >
                    View Cart
                </Button>
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

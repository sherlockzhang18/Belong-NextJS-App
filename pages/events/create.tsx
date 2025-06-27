import React from 'react'
import EventForm from '../../components/EventForm'

export default function CreateEventPage() {
    return (
        <>
            <h1>Create Event</h1>
            <EventForm onSuccess={() => alert('Created! You can now edit.')} />
        </>
    )
}

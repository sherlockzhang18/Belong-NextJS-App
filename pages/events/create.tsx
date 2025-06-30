import React from 'react'
import { useRouter } from 'next/router'
import EventForm from '../../components/EventForm'
import { formatForApi } from '../../services/eventUtils'

export default function CreateEventPage() {
    const router = useRouter()

    const handleSubmit = async (values: any) => {
        const payload = formatForApi(values)
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (!res.ok) {
            const { message } = await res.json()
            throw new Error(message || 'Create failed')
        }
        router.push(`/events/${values.uuid || ''}/edit`)
    }

    return (
        <>
            <h1>Create Event</h1>
            <EventForm
                onSubmit={handleSubmit}
                onSuccess={() => alert('Created!')}
            />
        </>
    )
}

// services/eventApi.ts
import axios from 'axios'
import type { EventPayload } from '../pages/api/events'
import type { EventInput } from './eventUtils'

export async function listEvents(): Promise<EventPayload[]> {
    const res = await axios.get<{ events: EventPayload[] }>('/api/events', {
        withCredentials: true,
    })
    return res.data.events
}

export async function createEvent(input: EventInput) {
    await axios.post(
        '/api/events',
        input,
        { withCredentials: true }
    )
}

export async function updateEvent(input: EventInput) {
    await axios.put(
        '/api/events',
        input,
        { withCredentials: true }
    )
}

export async function deleteEvent(uuid: string) {
    // pass uuid as query parameter
    await axios.delete('/api/events', {
        params: { uuid },
        withCredentials: true,
    })
}

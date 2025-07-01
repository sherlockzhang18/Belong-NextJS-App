import axios from 'axios'
import type { RawEvent, EventInput } from './eventUtils'
import { formatForApi } from './eventUtils'

export async function listEvents(): Promise<RawEvent[]> {
    const res = await axios.get<{ events: RawEvent[] }>('/api/events', {
        withCredentials: true,
    })
    return res.data.events
}

export async function createEvent(input: EventInput): Promise<void> {
    await axios.post('/api/events', formatForApi(input), {
        withCredentials: true,
    })
}

export async function updateEvent(input: EventInput): Promise<void> {
    await axios.put('/api/events', formatForApi(input), {
        withCredentials: true,
    })
}

export async function deleteEvent(uuid: string): Promise<void> {
    await axios.delete(`/api/events?uuid=${uuid}`, {
        withCredentials: true,
    })
}

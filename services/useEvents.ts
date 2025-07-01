import useSWR from 'swr'
import type { RawEvent, EventInput } from './eventUtils'
import {
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} from './eventApi'

export function useEvents() {
    const { data, error, mutate } = useSWR('events', listEvents)

    return {
        events: data ?? [],
        loading: !data && !error,
        error,
        create: async (input: EventInput) => {
            await createEvent(input)
            mutate()
        },
        update: async (input: EventInput) => {
            await updateEvent(input)
            mutate()
        },
        remove: async (uuid: string) => {
            await deleteEvent(uuid)
            mutate()
        },
    }
}

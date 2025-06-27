import { Event as ChronosEvent } from '@jstiava/chronos'
import type { EventPayload } from '../pages/api/events'
import type { EventInput } from '../components/EventForm'


export type RawEvent = EventPayload


export function parseRawEvent(
    raw: RawEvent,
    time_zone_conversion: boolean = false
): ChronosEvent {
    return new ChronosEvent(raw as any, time_zone_conversion)
}


export function formatForApi(input: EventInput): Omit<RawEvent, 'uuid'> & { uuid?: string } {
    const dateNum = Number(input.date.replace(/-/g, ''))
    const endDateNum = input.end_date ? Number(input.end_date.replace(/-/g, '')) : null

    const toFrac = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return (h + m / 60).toFixed(3)
    }

    return {
        uuid: input.uuid,
        name: input.name,
        subtitle: input.subtitle || null,
        description: input.description || null,
        date: dateNum,
        end_date: endDateNum,
        start_time: toFrac(input.start_time),
        end_time: input.end_time ? toFrac(input.end_time) : null,
        location_name: input.location_name || null,
        metadata: {},
        images: input.images,
    }
}

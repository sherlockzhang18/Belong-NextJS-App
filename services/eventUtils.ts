import { Event as ChronosEvent } from '@jstiava/chronos'
import type { EventPayload } from '../pages/api/events'

export type RawEvent = EventPayload

export type EventInput = {
    uuid?: string
    name: string
    subtitle: string
    description: string
    date: string
    end_date: string
    start_time: string
    end_time: string
    location_name: string
    images: string[]
    price?: string
    ticketing_link?: string
}

export function parseRawEvent(
    raw: RawEvent,
    time_zone_conversion: boolean = false
): ChronosEvent {
    return new ChronosEvent(raw as any, time_zone_conversion)
}

export function formatForApi(
    input: EventInput
): Omit<RawEvent, 'uuid'> & { uuid?: string } {
    const dateNum = Number(input.date.replace(/-/g, ''))
    const endDateNum = input.end_date
        ? Number(input.end_date.replace(/-/g, ''))
        : null

    const toFrac = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return (h + m / 60).toFixed(3)
    }

    const metadata: Record<string, any> = {}
    if (input.description) metadata.description = input.description
    if (input.price) metadata.price = input.price
    if (input.ticketing_link) metadata.ticketing_link = input.ticketing_link
    if (input.images.length) metadata.files = input.images

    return {
        uuid: input.uuid,
        name: input.name,
        subtitle: input.subtitle || null,
        date: dateNum,
        end_date: endDateNum,
        start_time: toFrac(input.start_time),
        end_time: input.end_time ? toFrac(input.end_time) : null,
        location_name: input.location_name || null,
        metadata,
    }
}

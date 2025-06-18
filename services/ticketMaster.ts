import axios from 'axios'
import type { NewEvent } from '../drizzle/schema'

const API_KEY = process.env.TM_API_KEY!
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'
const PAGE_SIZE = 30

/** Raw unmodified TM JSON payload */
export async function fetchTicketMasterRaw(): Promise<any> {
    const res = await axios.get(`${BASE_URL}/events.json`, {
        params: { apikey: API_KEY, classificationName: 'music', size: PAGE_SIZE },
    })
    return res.data
}

/**
 * Normalize up to 30 TM events into exactly the shape
 * your `events` table needs (no top-level price column).
 */
export async function fetchTicketMasterEvents(): Promise<NewEvent[]> {
    const listRes = await axios.get(`${BASE_URL}/events.json`, {
        params: {
            apikey: API_KEY,
            size: PAGE_SIZE,
            locale: 'en-us',
        },
    })
    const items = (listRes.data._embedded?.events as any[]) || []

    const seen = new Set<string>()
    const uniques = items.filter(e => {
        if (seen.has(e.name)) return false
        seen.add(e.name)
        return true
    }).slice(0, PAGE_SIZE)

    const detailed: NewEvent[] = []
    for (const e of uniques) {
        let full: any = e
        try {
            const detailRes = await axios.get(`${BASE_URL}/events/${e.id}.json`, {
                params: { apikey: API_KEY, locale: 'en-us' },
            })
            full = detailRes.data
        } catch {
        }

        const dateStr = full.dates?.start?.localDate ?? '1970-01-01'
        const rawStart = full.dates?.start?.localTime || ''
        const [sh, sm, ss] = rawStart.split(':')
        const startTime = rawStart
            ? [sh.padStart(2, '0'), sm.padStart(2, '0'), (ss || '00').padStart(2, '0')].join(':')
            : '00:00:00'

        let endTime = startTime
        const endIso = full.sales?.public?.endDateTime
        if (endIso) {
            const dt = new Date(endIso)
            const hh = dt.getHours().toString().padStart(2, '0')
            const mm = dt.getMinutes().toString().padStart(2, '0')
            const ss2 = dt.getSeconds().toString().padStart(2, '0')
            endTime = `${hh}:${mm}:${ss2}`
        }

        let priceStr: string | null = null
        if (Array.isArray(full.priceRanges) && full.priceRanges[0]) {
            const pr = full.priceRanges[0]
            priceStr = pr.min === pr.max
                ? pr.min.toFixed(2)
                : `${pr.min.toFixed(2)}–${pr.max.toFixed(2)}`
        }

        const description = full.info || full.description || null
        const venue = full._embedded?.venues?.[0]?.name ?? null

        detailed.push({
            uuid: full.id,
            name: full.name,
            subtitle: null,
            description,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            location_name: venue,
            metadata: {
                ...(priceStr && { price: priceStr }),
                ...(description && { description }),
                event_link: full.url ?? null,
            },
        })
    }

    return detailed
}
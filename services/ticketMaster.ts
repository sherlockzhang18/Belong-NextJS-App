import axios from 'axios'
import type { NewEvent } from '../drizzle/schema'

const API_KEY = process.env.TM_API_KEY!
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'
const PAGE_SIZE = 30

export async function fetchTicketMasterRaw(): Promise<any> {
    const res = await axios.get(`${BASE_URL}/events.json`, {
        params: { apikey: API_KEY, classificationName: 'NBA', size: PAGE_SIZE },
    })
    return res.data
}

export async function fetchTicketMasterEvents(): Promise<NewEvent[]> {
    const listRes = await axios.get(`${BASE_URL}/events.json`, {
        params: { apikey: API_KEY, classificationName: 'music', size: PAGE_SIZE, locale: 'en-us' },
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
        let full = e
        try {
            const detail = await axios.get(`${BASE_URL}/events/${e.id}.json`, {
                params: { apikey: API_KEY, locale: 'en-us' },
            })
            full = detail.data
        }
        catch { }

        const dateStr = full.dates?.start?.localDate ?? '1970-01-01'
        const dateNum = parseInt(dateStr.replace(/-/g, ''), 10)
        const [sh, sm, ss] = (full.dates?.start?.localTime || '').split(':')
        const startTimeStr = full.dates?.start?.localTime
            ? [sh.padStart(2, '0'),
            sm.padStart(2, '0'),
            (ss || '00').padStart(2, '0')].join(':')
            : '00:00:00'

        let endTimeStr: string | null = null
        if (full.dates?.end?.localTime) {
            const [eh, em, es] = full.dates.end.localTime.split(':')
            endTimeStr = [
                eh.padStart(2, '0'),
                em.padStart(2, '0'),
                (es || '00').padStart(2, '0'),
            ].join(':')
        }

        const toFrac = (hms: string): string => {
            const [h, m, s] = hms.split(':').map(Number)
            return (h + m / 60 + s / 3600).toFixed(3)
        }

        let priceStr: string | null = null
        if (Array.isArray(full.priceRanges) && full.priceRanges.length > 0) {
            const pr = full.priceRanges[0]
            priceStr = pr.min === pr.max
                ? pr.min.toFixed(2)
                : `${pr.min.toFixed(2)}–${pr.max.toFixed(2)}`
        }

        const tmImages: string[] = (full.images as any[] || [])
            .slice(0, 3)
            .map(img => img.url)

        const description = full.info || full.description || null
        const venue = full._embedded?.venues?.[0]?.name ?? null

        const metadata: Record<string, any> = {
            event_link: full.url ?? null,
        }
        if (priceStr) metadata.price = priceStr
        if (description) metadata.description = description
        if (tmImages.length) metadata.files = tmImages
        metadata.ticketing_link = full.id

        detailed.push({
            uuid: full.id,
            name: full.name,
            subtitle: null,
            date: dateNum,
            start_time: toFrac(startTimeStr),
            end_time: endTimeStr ? toFrac(endTimeStr) : null,
            location_name: venue,
            metadata,
        } as NewEvent)
    }

    return detailed
}

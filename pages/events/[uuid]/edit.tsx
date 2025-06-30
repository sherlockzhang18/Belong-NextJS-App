import React from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import EventForm from '../../../components/EventForm'
import { parseRawEvent, RawEvent, EventInput, formatForApi } from '../../../services/eventUtils'

export default function EditPage({ initial }: { initial: EventInput }) {
    const router = useRouter()

    const handleSubmit = async (values: EventInput) => {
        const payload = formatForApi(values)
        const res = await fetch('/api/events', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (!res.ok) {
            const { message } = await res.json()
            throw new Error(message || 'Update failed')
        }
    }

    return (
        <>
            <h1>Edit Event</h1>
            <EventForm
                initial={initial}
                onSubmit={handleSubmit}
                onSuccess={() => alert('Event updated!')}
            />
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
    const uuid = params?.uuid as string
    const proto = req.headers['x-forwarded-proto'] ?? 'http'
    const host = req.headers.host
    const res = await fetch(`${proto}://${host}/api/events`)
    if (!res.ok) return { notFound: true }

    const { events }: { events: RawEvent[] } = await res.json()
    const raw = events.find(e => e.uuid === uuid)
    if (!raw) return { notFound: true }

    const ev = parseRawEvent(raw)
    const fmtDate = (d: any) => d.format('YYYY-MM-DD')
    const fmtTime = (t: any) => t.getDayjs().format('HH:mm')
    const files = Array.isArray(raw.metadata?.files) ? raw.metadata.files : []

    const initial: EventInput = {
        uuid: ev.uuid,
        name: ev.name,
        subtitle: ev.subtitle ?? '',
        description: ev.metadata?.description ?? '',
        date: fmtDate(ev.date!),
        end_date: ev.end_date ? fmtDate(ev.end_date) : '',
        start_time: ev.start_time ? fmtTime(ev.start_time) : '',
        end_time: ev.end_time ? fmtTime(ev.end_time) : '',
        location_name: ev.location_name ?? '',
        images: files,
        price: ev.metadata?.price ?? '',
        ticketing_link: ev.metadata?.ticketing_link ?? '',
    }

    return { props: { initial } }
}

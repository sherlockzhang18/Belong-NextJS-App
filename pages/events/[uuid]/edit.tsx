import React from 'react'
import { GetServerSideProps } from 'next'
import EventForm, { EventInput } from '../../../components/EventForm'
import { parseRawEvent, RawEvent } from '../../../services/eventUtils'

export default function EditPage({ initial }: { initial: EventInput }) {
    const handleSuccess = () => alert('Event updated!')
    return (
        <>
            <h1>Edit Event</h1>
            <EventForm initial={initial} onSuccess={handleSuccess} />
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

    const formatDate = (d: any) => d.format('YYYY-MM-DD')
    const formatTime = (t: any) => t.getDayjs().format('HH:mm')

    const initial: EventInput = {
        uuid: ev.uuid,
        name: ev.name,
        subtitle: ev.subtitle ?? '',
        description: ev.metadata?.description ?? '',
        date: formatDate(ev.date!),
        end_date: ev.end_date ? formatDate(ev.end_date) : '',
        start_time: ev.start_time ? formatTime(ev.start_time) : '',
        end_time: ev.end_time ? formatTime(ev.end_time) : '',
        location_name: ev.location_name ?? '',
        images: raw.images,
    }

    return { props: { initial } }
}

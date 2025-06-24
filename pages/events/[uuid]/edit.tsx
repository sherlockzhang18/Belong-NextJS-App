import React from 'react'
import { GetServerSideProps, NextPage } from 'next'
import EventForm, { EventInput } from '../../../components/EventForm'

interface Props {
    initial: EventInput
}

const EditPage: NextPage<Props> = ({ initial }) => {
    const handleSuccess = () => alert('Event updated!')

    return (
        <>
            <h1>Edit Event</h1>
            <EventForm initial={initial} onSuccess={handleSuccess} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
    const uuid = params?.uuid as string
    const proto = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const res = await fetch(`${proto}://${host}/api/events?uuid=${uuid}`)
    if (!res.ok) return { notFound: true }

    const { events } = await res.json()
    const e = events.find((x: any) => x.uuid === uuid)
    if (!e) return { notFound: true }

    // helper to convert anything numeric or dotted into "HH:MM"
    const toTime = (t?: string | number) => {
        if (t == null) return ''
        const s = String(t).trim()

        if (/^\d+(\.\d+)?$/.test(s)) {
            const num = parseFloat(s)
            const hh = Math.floor(num)
            const mm = Math.round((num - hh) * 60)
            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
        }

        if (/^\d+\.\d\d$/.test(s)) {
            const [hh, mm] = s.split('.')
            return `${hh.padStart(2, '0')}:${mm}`
        }

        if (/^\d{1,2}:\d{1,2}/.test(s)) {
            const [hh, mm] = s.split(':')
            return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
        }

        return ''
    }

    const rawDate = String(e.date).padStart(8, '0')
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`

    let end_date = ''
    if (e.end_date) {
        const rd = String(e.end_date).padStart(8, '0')
        end_date = `${rd.slice(0, 4)}-${rd.slice(4, 6)}-${rd.slice(6, 8)}`
    }

    const initial: EventInput = {
        uuid: e.uuid,
        name: e.name,
        subtitle: e.subtitle || '',
        description: e.description || '',
        date,
        end_date,
        start_time: toTime(e.start_time),
        end_time: toTime(e.end_time),
        location_name: e.location_name || '',
        images: e.images || [],
    }

    return { props: { initial } }
}

export default EditPage

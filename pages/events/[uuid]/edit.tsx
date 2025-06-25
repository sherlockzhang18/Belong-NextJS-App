import React from 'react'
import { GetServerSideProps, NextPage } from 'next'
import { Event as ChronosEvent } from '@jstiava/chronos'
import EventForm, { EventInput } from '../../../components/EventForm'

interface Props {
    initial: EventInput
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
    const uuid = params?.uuid as string
    const proto = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const res = await fetch(`${proto}://${host}/api/events`)
    if (!res.ok) return { notFound: true }

    const { events } = await res.json()
    const raw = events.find((e: any) => e.uuid === uuid)
    if (!raw) return { notFound: true }

    // <<< false to disable timezone shifting >>>
    const ev = new ChronosEvent(raw, false)

    const initial: EventInput = {
        uuid: ev.uuid,
        name: ev.name,
        subtitle: ev.subtitle ?? '',
        description: ev.metadata?.description ?? '',
        date: ev.date!.format('YYYY-MM-DD'),
        start_time: ev.start_time
            ? ev.start_time.getDayjs().format('HH:mm')
            : '',
        end_time: ev.end_time
            ? ev.end_time.getDayjs().format('HH:mm')
            : '',
        location_name: ev.location_name ?? '',
        images: ev.metadata?.files ?? [],
    }

    return { props: { initial } }
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

export default EditPage
//             
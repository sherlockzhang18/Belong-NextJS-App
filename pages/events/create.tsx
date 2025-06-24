import React from 'react'
import { NextPage } from 'next'
import EventForm, { EventInput } from '../../components/EventForm'

const Create: NextPage = () => {
    const handleSuccess = () => {
        // after create you might re-fetch your list, or redirect
        alert('Event created! You can now edit it.')
    }

    return (
        <>
            <h1>Create Event</h1>
            <EventForm onSuccess={handleSuccess} />
        </>
    )
}

export default Create

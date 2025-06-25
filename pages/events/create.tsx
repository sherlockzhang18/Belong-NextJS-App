import React from 'react'
import { NextPage } from 'next'
import EventForm from '../../components/EventForm'

const CreatePage: NextPage = () => {
    const handleSuccess = () => {
        alert('Event created! You can now edit it.')
    }
    return (
        <>
            <h1>Create Event</h1>
            <EventForm onSuccess={handleSuccess} />
        </>
    )
}

export default CreatePage

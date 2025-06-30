import React, { useState, useEffect, FormEvent } from 'react'
import { Box, Stack, TextField, Button, Alert } from '@mui/material'
import { formatForApi } from '../services/eventUtils'

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

type Props = {
    initial?: EventInput
    onSuccess(): void
}

export default function EventForm({ initial, onSuccess }: Props) {
    const [input, setInput] = useState<EventInput>({
        name: '', subtitle: '', description: '',
        date: '', end_date: '',
        start_time: '', end_time: '',
        location_name: '', images: [],
        price: '', ticketing_link: '',
        ...initial,
    })
    const [rawImages, setRawImages] = useState(initial?.images.join(',') ?? '')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setInput(i => ({
            ...i,
            images: rawImages
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
        }))
    }, [rawImages])

    const handleChange = (f: keyof EventInput) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setInput(i => ({ ...i, [f]: e.target.value }))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (input.end_date && input.end_date < input.date) {
            return setError('End date cannot be before start date')
        }
        if (input.end_time && input.end_time < input.start_time) {
            return setError('End time cannot be before start time')
        }

        setLoading(true)
        try {
            const payload = formatForApi(input)
            const method = input.uuid ? 'PUT' : 'POST'
            const res = await fetch('/api/events', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const { message } = await res.json()
                throw new Error(message || res.statusText)
            }
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
            <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">Saved!</Alert>}

                <TextField label="Name" required
                    value={input.name}
                    onChange={handleChange('name')}
                />
                <TextField label="Subtitle"
                    value={input.subtitle}
                    onChange={handleChange('subtitle')}
                />
                <TextField label="Description" multiline rows={3}
                    value={input.description}
                    onChange={handleChange('description')}
                />

                <Stack direction="row" spacing={2}>
                    <TextField label="Date" type="date" required
                        value={input.date}
                        onChange={handleChange('date')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField label="End Date" type="date"
                        value={input.end_date}
                        onChange={handleChange('end_date')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField label="Start Time" type="time" required
                        value={input.start_time}
                        onChange={handleChange('start_time')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField label="End Time" type="time"
                        value={input.end_time}
                        onChange={handleChange('end_time')}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>

                <TextField label="Location Name"
                    value={input.location_name}
                    onChange={handleChange('location_name')}
                />

                <TextField label="Image URLs (comma-separated)"
                    value={rawImages}
                    onChange={e => setRawImages(e.target.value)}
                />

                <TextField label="Price"
                    value={input.price ?? ''}
                    onChange={handleChange('price')}
                />
                <TextField label="Ticketing Link"
                    value={input.ticketing_link ?? ''}
                    onChange={handleChange('ticketing_link')}
                />

                <Button type="submit" variant="contained" disabled={loading}>
                    {input.uuid ? 'Update Event' : 'Create Event'}
                </Button>
            </Stack>
        </Box>
    )
}

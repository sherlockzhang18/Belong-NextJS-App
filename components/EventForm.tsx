import React, { useState, useEffect, FormEvent } from 'react'
import { TextField, Button, Alert, Stack, Box } from '@mui/material'

export type EventInput = {
    uuid?: string
    name: string
    subtitle: string
    description: string
    date: string        // YYYY-MM-DD
    start_time: string  // HH:mm
    end_time: string    // HH:mm
    location_name: string
    images: string[]
}

type Props = {
    initial?: EventInput
    onSuccess: () => void
}

export default function EventForm({ initial, onSuccess }: Props) {
    const [input, setInput] = useState<EventInput>({
        name: '',
        subtitle: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        location_name: '',
        images: [],
        ...initial,
    })

    const [rawImages, setRawImages] = useState(
        initial?.images.join(',') ?? ''
    )
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
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

    const handleChange = (field: keyof EventInput) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setInput(i => ({ ...i, [field]: e.target.value }))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (input.end_time < input.start_time) {
            return setError('End time cannot be before start time')
        }

        setLoading(true)
        try {
            const method = input.uuid ? 'PUT' : 'POST'
            const res = await fetch('/api/events', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            })
            if (!res.ok) {
                const { message } = await res.json()
                throw new Error(message || res.statusText)
            }
            setSuccess(true)
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

                <TextField label="Name" required value={input.name} onChange={handleChange('name')} />
                <TextField label="Subtitle" value={input.subtitle} onChange={handleChange('subtitle')} />
                <TextField
                    label="Description"
                    multiline
                    rows={3}
                    value={input.description}
                    onChange={handleChange('description')}
                />

                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Date"
                        type="date"
                        required
                        value={input.date}
                        onChange={handleChange('date')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Start Time"
                        type="time"
                        required
                        value={input.start_time}
                        onChange={handleChange('start_time')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="End Time"
                        type="time"
                        required
                        value={input.end_time}
                        onChange={handleChange('end_time')}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>

                <TextField
                    label="Location Name"
                    value={input.location_name}
                    onChange={handleChange('location_name')}
                />

                <TextField
                    label="Image URLs (comma-separated)"
                    value={rawImages}
                    onChange={e => setRawImages(e.target.value)}
                />

                <Button type="submit" variant="contained" disabled={loading}>
                    {input.uuid ? 'Update Event' : 'Create Event'}
                </Button>
            </Stack>
        </Box>
    )
}

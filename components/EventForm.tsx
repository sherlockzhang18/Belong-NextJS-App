import React, { useState, useEffect, FormEvent } from 'react'
import { Box, Stack, TextField, Button, Alert } from '@mui/material'
import { UploadButton } from '../utils/uploadthing'
import type { EventInput } from '../services/eventUtils'

type Props = {
    /** Initial values for edit mode */
    initial?: EventInput
    /** Called when the form is submitted */
    onSubmit(values: EventInput): Promise<void>
    /** Optional callback after successful submission */
    onSuccess?(): void
}

export default function EventForm({ initial, onSubmit, onSuccess }: Props) {
    const [input, setInput] = useState<EventInput>({
        name: '',
        subtitle: '',
        description: '',
        date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location_name: '',
        images: [],
        ...initial,
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Remove an image by index
    const removeImage = (idx: number) => {
        setInput(i => ({
            ...i,
            images: i.images.filter((_, i2) => i2 !== idx),
        }))
    }

    // Generic field‐change handler
    const handleChange = (field: keyof EventInput) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setInput(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        // Basic date/time validation
        if (input.end_date && input.end_date < input.date) {
            return setError('End date cannot be before start date')
        }
        if (input.end_time && input.end_time < input.start_time) {
            return setError('End time cannot be before start time')
        }

        setLoading(true)
        try {
            await onSubmit(input)
            onSuccess?.()
        } catch (err: any) {
            setError(err.message || 'Submission failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
            <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="Name"
                    required
                    value={input.name}
                    onChange={handleChange('name')}
                />

                <TextField
                    label="Subtitle"
                    value={input.subtitle}
                    onChange={handleChange('subtitle')}
                />

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
                        label="End Date"
                        type="date"
                        value={input.end_date}
                        onChange={handleChange('end_date')}
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

                {/* UploadThing button for images */}
                <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(files) => {
                        // files: UploadedFileData<{ uploadedBy: string }>[]
                        const urls = files.map(f => f.url)
                        setInput(prev => ({ ...prev, images: [...prev.images, ...urls] }))
                    }}
                    onUploadError={(err) => {
                        console.error('Upload error', err)
                        setError(err.message)
                    }}
                />

                {/* Thumbnails + remove buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {input.images.map((url, idx) => (
                        <Box key={idx} sx={{ position: 'relative' }}>
                            <img
                                src={url}
                                alt={`Uploaded #${idx + 1}`}
                                style={{
                                    width: 80,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                }}
                            />
                            <Button
                                size="small"
                                onClick={() => removeImage(idx)}
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    minWidth: 'auto',
                                    padding: '2px',
                                }}
                            >
                                ✕
                            </Button>
                        </Box>
                    ))}
                </Box>

                <Button type="submit" variant="contained" disabled={loading}>
                    {initial ? 'Update Event' : 'Create Event'}
                </Button>
            </Stack>
        </Box>
    )
}

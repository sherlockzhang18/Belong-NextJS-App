import React, { useState } from 'react'
import Button from '@mui/material/Button'
import axios from 'axios'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleSync = async () => {
        setLoading(true)
        try {
            const res = await axios.post('/api/admin/sync-events', {}, {
                withCredentials: true
            })
            setMessage(`Synced ${res.data.count} events.`)
        } catch (err: any) {
            setMessage('Sync failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: '1rem' }}>
            <h1>Admin Dashboard</h1>
            <Button
                variant="contained"
                onClick={handleSync}
                disabled={loading}
            >
                {loading ? 'Syncing…' : 'Sync Events from TicketMaster'}
            </Button>
            {message && <p>{message}</p>}
        </div>
    )
}

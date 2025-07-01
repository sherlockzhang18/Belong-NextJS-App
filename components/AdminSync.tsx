import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import axios from 'axios'

export default function AdminSync() {
    const [loading, setLoading] = useState(false)
    const [snack, setSnack] = useState<{ open: boolean; message: string }>({
        open: false,
        message: '',
    })

    const handleSync = async () => {
        setLoading(true)
        try {
            const res = await axios.post(
                '/api/admin/sync-events',
                {},
                { withCredentials: true }
            )
            setSnack({ open: true, message: `Synced ${res.data.synced} events.` })
        } catch {
            setSnack({ open: true, message: 'Sync failed' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button variant="contained" onClick={handleSync} disabled={loading}>
                {loading ? 'Syncing…' : 'Sync Events from TicketMaster'}
            </Button>
            <Snackbar
                open={snack.open}
                message={snack.message}
                autoHideDuration={3000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
            />
        </>
    )
}

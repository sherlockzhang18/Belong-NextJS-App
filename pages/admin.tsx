import React from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AdminSync from '@/components/AdminSync'
import AdminEventsGrid from '@/components/AdminEventsGrid'

export default function AdminPage() {
    return (
        <Box
            component="main"
            sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Admin Dashboard</Typography>
                <Button
                    component={Link}
                    href="/"
                    variant="text"
                >
                    ← Back to Events
                </Button>
            </Box>

            <Box>
                <AdminSync />
            </Box>

            <Box>
                <AdminEventsGrid />
            </Box>
        </Box>
    )
}

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AdminSync from '../components/AdminSync'
import AdminEventsGrid from '../components/AdminEventGrid'

export default function AdminPage() {
    return (
        <Box p={2}>
            <Typography variant="h4">Admin Dashboard</Typography>

            <Box mt={2} mb={4}>
                <AdminSync />
            </Box>

            <AdminEventsGrid />
        </Box>
    )
}

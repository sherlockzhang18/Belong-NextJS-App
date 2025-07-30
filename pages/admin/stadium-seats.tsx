import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel,
    Alert,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import Link from 'next/link';
import axios from 'axios';

interface Event {
    uuid: string;
    name: string;
    location_name?: string;
}

export default function StadiumSeatGenerator() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('/api/events');
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const selectedEventData = events.find(e => e.uuid === selectedEvent);
    const isBankOfAmericaStadium = selectedEventData?.location_name?.toLowerCase().includes('bank of america stadium');

    const generateStadiumSeats = async () => {
        if (!selectedEvent) return;

        try {
            setLoading(true);
            setMessage('');

            const response = await axios.post(`/api/events/${selectedEvent}/generate-stadium-seats`, {
                generateStadiumSeats: true
            });

            setMessage(`Success! ${response.data.message}`);
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to generate stadium seats');
        } finally {
            setLoading(false);
        }
    };

    const checkCurrentSeats = async () => {
        if (!selectedEvent) return;

        try {
            const response = await axios.get(`/api/events/${selectedEvent}/seats`);
            if (response.data.hasAssignedSeats) {
                setMessage(`Event already has ${response.data.seats.length} seats configured.`);
            } else {
                setMessage('Event has no assigned seats yet - ready for stadium seat generation.');
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to check seats');
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Stadium Seat Generator</Typography>
                <Button component={Link} href="/admin" variant="text">
                    ← Back to Admin
                </Button>
            </Box>

            {message && (
                <Alert 
                    severity={message.includes('Success') ? 'success' : message.includes('already has') ? 'warning' : 'info'} 
                    sx={{ mb: 3 }}
                >
                    {message}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Select Event for Stadium Seating
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Select Event</InputLabel>
                        <Select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            label="Select Event"
                        >
                            {events.map((event) => (
                                <MenuItem key={event.uuid} value={event.uuid}>
                                    {event.name} {event.location_name ? `- ${event.location_name}` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedEvent && (
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={checkCurrentSeats}
                                sx={{ mr: 2 }}
                            >
                                Check Current Seats
                            </Button>
                            
                            {selectedEventData && (
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    Selected: {selectedEventData.name}
                                    {selectedEventData.location_name && ` at ${selectedEventData.location_name}`}
                                </Typography>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {selectedEvent && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Stadium Seating Configuration
                        </Typography>

                        {isBankOfAmericaStadium ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    ✅ Bank of America Stadium detected! Stadium seating generation available.
                                </Alert>
                                
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    This will generate seats for the following sections:
                                </Typography>
                                
                                <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>Upper Level (500s):</Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>• Sections 501, 502, 510 (25 rows, 18 seats each) - $65-75</Typography>
                                    
                                    <Typography variant="subtitle2" gutterBottom>Club Level (300s):</Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>• Sections 301, 315 (15 rows, 16 seats each) - $175-200</Typography>
                                    
                                    <Typography variant="subtitle2" gutterBottom>Lower Level (100s):</Typography>
                                    <Typography variant="body2">• Sections 101, 113, 120 (15-20 rows, 20 seats each) - $150-250</Typography>
                                </Box>

                                <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                                    Total: ~3,000 seats across 8 sections with different pricing tiers
                                </Typography>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={generateStadiumSeats}
                                    disabled={loading}
                                    fullWidth
                                >
                                    {loading ? 'Generating Stadium Seats...' : 'Generate Bank of America Stadium Seats'}
                                </Button>
                            </Box>
                        ) : (
                            <Alert severity="warning">
                                Stadium seating generation is currently only available for Bank of America Stadium events.
                                <br />
                                Please ensure the event&apos;s location includes &quot;Bank of America Stadium&quot; in the name.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {selectedEvent && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Divider sx={{ mb: 2 }} />
                    <Button
                        component={Link}
                        href={`/events/${selectedEvent}`}
                        variant="contained"
                        color="secondary"
                    >
                        View Event Page
                    </Button>
                </Box>
            )}
        </Box>
    );
}

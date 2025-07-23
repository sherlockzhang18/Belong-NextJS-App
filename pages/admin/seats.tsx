import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    TextField, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel,
    Alert,
    Card,
    CardContent
} from '@mui/material';
import Link from 'next/link';
import axios from 'axios';

interface Event {
    uuid: string;
    name: string;
}

interface TicketOption {
    id: string;
    name: string;
    price: string;
    seat_type: string;
}

export default function AdminSeats() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
    const [selectedTicketOption, setSelectedTicketOption] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [rows, setRows] = useState(10);
    const [seatsPerRow, setSeatsPerRow] = useState(10);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchTicketOptions(selectedEvent);
        }
    }, [selectedEvent]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('/api/events');
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchTicketOptions = async (eventId: string) => {
        try {
            const response = await axios.get(`/api/events/${eventId}/ticket-options`);
            setTicketOptions(response.data.ticketOptions || []);
        } catch (error) {
            console.error('Error fetching ticket options:', error);
        }
    };

    const createTicketOption = async () => {
        if (!selectedEvent) return;

        try {
            setLoading(true);
            const response = await axios.post(`/api/admin/ticket-options`, {
                event_id: selectedEvent,
                name: 'Standard Seat',
                price: 50.00,
                seat_type: 'assigned'
            });

            setMessage('Ticket option created successfully!');
            fetchTicketOptions(selectedEvent);
            setSelectedTicketOption(response.data.id);
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create ticket option');
        } finally {
            setLoading(false);
        }
    };

    const generateSeats = async () => {
        if (!selectedEvent || !selectedTicketOption) return;

        try {
            setLoading(true);
            const response = await axios.post(`/api/events/${selectedEvent}/seats`, {
                ticketOptionId: selectedTicketOption,
                rows,
                seatsPerRow
            });

            setMessage(`Successfully created ${response.data.count} seats!`);
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to generate seats');
        } finally {
            setLoading(false);
        }
    };

    const checkSeats = async () => {
        if (!selectedEvent) return;

        try {
            const response = await axios.get(`/api/events/${selectedEvent}/seats`);
            if (response.data.hasAssignedSeats) {
                setMessage(`Event has ${response.data.seats.length} seats already configured.`);
            } else {
                setMessage('Event has no assigned seats yet.');
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to check seats');
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Admin - Seat Management</Typography>
                <Button component={Link} href="/admin" variant="text">
                    ← Back to Admin
                </Button>
            </Box>

            {message && (
                <Alert severity={message.includes('Successfully') || message.includes('created') ? 'success' : 'info'} sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Step 1: Select Event
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
                                        {event.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedEvent && (
                            <Button
                                variant="outlined"
                onClick={checkSeats}
                                sx={{ mr: 2 }}
                            >
                                Check Current Seats
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {selectedEvent && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Step 2: Select or Create Ticket Option
                            </Typography>
                            
                            {ticketOptions.length > 0 ? (
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Select Ticket Option</InputLabel>
                                    <Select
                                        value={selectedTicketOption}
                                        onChange={(e) => setSelectedTicketOption(e.target.value)}
                                        label="Select Ticket Option"
                                    >
                                        {ticketOptions.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>
                                                {option.name} - ${option.price} ({option.seat_type})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Typography color="textSecondary" sx={{ mb: 2 }}>
                                    No ticket options found. Create one for assigned seating.
                                </Typography>
                            )}

                            <Button
                                variant="outlined"
                                onClick={createTicketOption}
                                disabled={loading}
                            >
                                Create Assigned Seating Ticket Option
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {selectedEvent && selectedTicketOption && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Step 3: Generate Seats
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    label="Number of Rows"
                                    type="number"
                                    value={rows}
                                    onChange={(e) => setRows(parseInt(e.target.value) || 10)}
                                    inputProps={{ min: 1, max: 26 }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Seats per Row"
                                    type="number"
                                    value={seatsPerRow}
                                    onChange={(e) => setSeatsPerRow(parseInt(e.target.value) || 10)}
                                    inputProps={{ min: 1, max: 50 }}
                                    sx={{ flex: 1 }}
                                />
                            </Box>

                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                This will create {rows * seatsPerRow} seats total.
                            </Typography>

                            <Button
                                variant="contained"
                                onClick={generateSeats}
                                disabled={loading}
                                size="large"
                            >
                                Generate {rows * seatsPerRow} Seats
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {selectedEvent && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
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

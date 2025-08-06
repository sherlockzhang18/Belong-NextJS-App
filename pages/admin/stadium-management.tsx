import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Alert,
    Card,
    CardContent,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Paper
} from '@mui/material';
import Link from 'next/link';
import axios from 'axios';

interface Event {
    uuid: string;
    name: string;
    location_name?: string;
    stadium_id?: string;
}

interface SeedResponse {
    stadium: {
        id: string;
        name: string;
        city: string;
        state: string;
    };
    sectionsCount: number;
    alreadyExists: boolean;
    message: string;
}

export default function StadiumManagement() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [seedResult, setSeedResult] = useState<SeedResponse | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [operationType, setOperationType] = useState<'cleanup' | 'full-setup'>('full-setup');

    const steps = [
        'Select Event',
        'Setup Stadium Structure', 
        'Associate Event with Stadium',
        'Generate Stadium Seats'
    ];

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

    const cleanupEventData = async () => {
        if (!selectedEvent) return;

        try {
            setLoading(true);
            setMessage('');
            setError('');

            const response = await axios.post(`/api/events/${selectedEvent}/cleanup-all-data`);
            setMessage(`✅ Cleanup completed: ${response.data.summary}`);
            
            await fetchEvents();
            
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to cleanup event data');
        } finally {
            setLoading(false);
            setConfirmDialog(false);
        }
    };

    const setupStadium = async () => {
        try {
            setLoading(true);
            setMessage('');
            setError('');
            setSeedResult(null);
            setActiveStep(1);

            const response = await axios.post('/api/admin/seed-stadium');
            setSeedResult(response.data);
            setMessage(`Stadium setup: ${response.data.message}`);
            setActiveStep(2);
            
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to setup stadium');
            setActiveStep(0);
        } finally {
            setLoading(false);
        }
    };

    const associateEventWithStadium = async () => {
        if (!selectedEvent || !seedResult?.stadium?.id) return;

        try {
            setLoading(true);
            const response = await axios.post(`/api/events/${selectedEvent}/associate-stadium`, {
                stadium_id: seedResult.stadium.id
            });
            
            setMessage(prev => prev + `\n Event association: ${response.data.message}`);
            await fetchEvents();
            setActiveStep(3);
            
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to associate event with stadium');
        } finally {
            setLoading(false);
        }
    };

    const generateStadiumSeats = async () => {
        if (!selectedEvent) return;

        try {
            setLoading(true);
            const response = await axios.post(`/api/events/${selectedEvent}/generate-stadium-seats`, {
                generateStadiumSeats: true
            });
            
            setMessage(prev => prev + `\n Seat generation: ${response.data.message}`);
            setActiveStep(4);
            
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to generate stadium seats');
        } finally {
            setLoading(false);
        }
    };

    const runFullSetup = async () => {
        setActiveStep(0);
        await setupStadium();
        
        if (seedResult?.stadium?.id) {
            await associateEventWithStadium();
            await generateStadiumSeats();
        }
    };

    return (
        <Box component="main" sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4"> Stadium Management</Typography>
                <Button component={Link} href="/admin" variant="text">
                    ← Back to Admin
                </Button>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Step 1: Select Event
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Select Event</InputLabel>
                        <Select
                            value={selectedEvent}
                            onChange={(e) => {
                                setSelectedEvent(e.target.value);
                                setActiveStep(selectedEvent ? 1 : 0);
                                setMessage('');
                                setError('');
                            }}
                            label="Select Event"
                        >
                            {events.map((event) => (
                                <MenuItem key={event.uuid} value={event.uuid}>
                                    {event.name} {event.location_name ? `- ${event.location_name}` : ''}
                                    {event.stadium_id ? ' (Has Stadium)' : ' (No Stadium)'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedEventData && (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                                <strong>Selected:</strong> {selectedEventData.name}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Location:</strong> {selectedEventData.location_name || 'Not specified'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Stadium Status:</strong> {selectedEventData.stadium_id ? ' Associated' : ' Not associated'}
                            </Typography>
                        </Paper>
                    )}
                </CardContent>
            </Card>

            {selectedEvent && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Stadium Operations
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    setOperationType('full-setup');
                                    setConfirmDialog(true);
                                }}
                                disabled={loading}
                                size="large"
                            >
                                 Full Stadium Setup
                            </Button>
                            
                            <Button
                                variant="outlined"
                                color="warning"
                                onClick={() => {
                                    setOperationType('cleanup');
                                    setConfirmDialog(true);
                                }}
                                disabled={loading}
                            >
                                 Cleanup Event Data
                            </Button>
                            
                            <Button
                                component={Link}
                                href={`/events/${selectedEvent}`}
                                variant="outlined"
                                color="secondary"
                            >
                                👁️ View Event
                            </Button>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            <strong>Full Stadium Setup:</strong> Creates stadium structure, associates with event, and generates seats for all sections
                            <br />
                            <strong>Cleanup:</strong> Removes all stadium data, sections, and seats for this event
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {message && (
                <Alert severity="success" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                    {message}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {seedResult && !loading && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Setup Results
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">Stadium Information:</Typography>
                            <Typography variant="body2">
                                <strong>Name:</strong> {seedResult.stadium.name}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Location:</strong> {seedResult.stadium.city}, {seedResult.stadium.state}
                            </Typography>
                        </Box>

                        {seedResult.sectionsCount && (
                            <Typography variant="body2">
                                <strong>Sections Created:</strong> {seedResult.sectionsCount} stadium sections
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            )}

            <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
                <DialogTitle>
                    {operationType === 'cleanup' ? 'Confirm Data Cleanup' : 'Confirm Full Stadium Setup'}
                </DialogTitle>
                <DialogContent>
                    {operationType === 'cleanup' ? (
                        <Typography>
                            This will delete ALL stadium data, sections, seats, and ticket options for this event. 
                            This action cannot be undone. Are you sure?
                        </Typography>
                    ) : (
                        <Typography>
                            This will create a complete stadium setup with all sections and generate seats. 
                            If stadium data already exists, it will be used. Continue?
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={operationType === 'cleanup' ? cleanupEventData : runFullSetup}
                        color={operationType === 'cleanup' ? 'warning' : 'primary'}
                        variant="contained"
                    >
                        {operationType === 'cleanup' ? 'Delete All Data' : 'Setup Stadium'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

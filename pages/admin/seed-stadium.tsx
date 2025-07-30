import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Alert,
    Card,
    CardContent,
    Divider,
    CircularProgress
} from '@mui/material';
import Link from 'next/link';
import axios from 'axios';

interface SeedResponse {
    message: string;
    stadium?: {
        id: string;
        name: string;
        city: string;
        state: string;
    };
    sectionsCount?: number;
    alreadyExists: boolean;
}

export default function SeedStadium() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [seedResult, setSeedResult] = useState<SeedResponse | null>(null);

    const seedStadium = async () => {
        try {
            setLoading(true);
            setMessage('');
            setError('');
            setSeedResult(null);

            const response = await axios.post('/api/admin/seed-stadium');
            
            setSeedResult(response.data);
            setMessage(response.data.message);
            
        } catch (error: any) {
            console.error('Error seeding stadium:', error);
            setError(error.response?.data?.error || 'An error occurred while seeding the stadium');
        } finally {
            setLoading(false);
        }
    };

    const resetStadiumData = async () => {
        try {
            setLoading(true);
            setMessage('');
            setError('');
            setSeedResult(null);

            const response = await axios.post('/api/admin/reset-stadium-data');
            
            setMessage(response.data.message);
            
        } catch (error: any) {
            console.error('Error resetting stadium data:', error);
            setError(error.response?.data?.error || 'An error occurred while resetting stadium data');
        } finally {
            setLoading(false);
        }
    };

    const verifyStadiumData = async () => {
        try {
            setLoading(true);
            setMessage('');
            setError('');

            const response = await axios.get('/api/admin/verify-stadium-data');
            
            setMessage(response.data.message);
            
        } catch (error: any) {
            console.error('Error verifying stadium data:', error);
            setError(error.response?.data?.error || 'An error occurred while verifying stadium data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component="main"
            sx={{ p: 3, maxWidth: 800, mx: 'auto' }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">🏗️ Stadium Setup</Typography>
                <Button
                    component={Link}
                    href="/admin"
                    variant="text"
                >
                    ← Back to Admin
                </Button>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Bank of America Stadium Generator
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        This tool will seed the database with Bank of America Stadium data including 
                        stadium information and all seating sections with their configurations.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={seedStadium}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Seeding...' : 'Seed Stadium Data'}
                        </Button>
                        
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={resetStadiumData}
                            disabled={loading}
                        >
                            Reset Stadium Data
                        </Button>
                        
                        <Button
                            variant="outlined"
                            color="info"
                            onClick={verifyStadiumData}
                            disabled={loading}
                        >
                            Verify Stadium Data
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {message && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {message}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {seedResult && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Seeding Results
                        </Typography>
                        
                        {seedResult.stadium && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Stadium Information:
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {seedResult.stadium.name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Location:</strong> {seedResult.stadium.city}, {seedResult.stadium.state}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>ID:</strong> {seedResult.stadium.id}
                                </Typography>
                            </Box>
                        )}

                        {seedResult.sectionsCount && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Sections Created:
                                </Typography>
                                <Typography variant="body2">
                                    {seedResult.sectionsCount} stadium sections have been created
                                </Typography>
                            </Box>
                        )}

                        {seedResult.alreadyExists && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                The stadium already exists in the database. No new data was created.
                            </Alert>
                        )}

                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                component={Link}
                                href="/admin/stadium-seats"
                                variant="contained"
                                color="primary"
                            >
                                🏟️ View Stadium Seats
                            </Button>
                            
                            <Button
                                component={Link}
                                href="/admin"
                                variant="outlined"
                            >
                                Return to Admin Dashboard
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        About Bank of America Stadium
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Bank of America Stadium is located in Charlotte, NC and serves as the home venue 
                        for major events. This seeding process creates a comprehensive database of all 
                        seating sections including upper level (500s), club level (200s-300s), and 
                        lower level (100s) sections with appropriate pricing tiers and display configurations.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}

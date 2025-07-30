import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import axios from 'axios';

interface Seat {
    id: string;
    seat_number: string;
    row: string;
    seat_in_row: number;
    status: 'available' | 'reserved' | 'sold';
    reserved_until?: string;
    ticket_option: {
        id: string;
        name: string;
        price: string;
        seat_type: string;
    };
}

interface SectionSeatMapProps {
    eventId: string;
    sectionId: string;
    sectionName: string;
    selectedSeats: string[];
    onSeatSelect: (seatIds: string[]) => void;
    onBackToOverview: () => void;
    maxSelectable?: number;
}

export default function SectionSeatMap({
    eventId,
    sectionId,
    sectionName,
    selectedSeats,
    onSeatSelect,
    onBackToOverview,
    maxSelectable = 8
}: SectionSeatMapProps) {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSeatsForSection = async () => {
            try {
                setLoading(true);
                setError(null);

                await axios.post('/api/seats/cleanup').catch(console.warn);

                const response = await axios.get(`/api/events/${eventId}/sections/${sectionId}/seats`);
                setSeats(response.data.seats);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load seats for this section');
            } finally {
                setLoading(false);
            }
        };

        fetchSeatsForSection();

        const interval = setInterval(fetchSeatsForSection, 30000);
        return () => clearInterval(interval);
    }, [eventId, sectionId]);

    const handleSeatClick = (seatId: string, seatStatus: string) => {
        if (seatStatus === 'sold') return;

        if (selectedSeats.includes(seatId)) {
            onSeatSelect(selectedSeats.filter(id => id !== seatId));
        } else {
            if (selectedSeats.length < maxSelectable) {
                onSeatSelect([...selectedSeats, seatId]);
            }
        }
    };

    const getSeatColor = (seat: Seat) => {
        if (selectedSeats.includes(seat.id)) return '#1976d2';
        if (seat.status === 'sold') return '#d32f2f';
        if (seat.status === 'reserved') return '#ed6c02';
        return '#2e7d32';
    };

    const getSeatCursor = (seat: Seat) => {
        if (seat.status === 'sold') return 'not-allowed';
        return 'pointer';
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading seats for {sectionName}...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (seats.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Button onClick={onBackToOverview} sx={{ mb: 2 }}>
                    ← Back to Stadium Overview
                </Button>
                <Typography>No seats available in this section.</Typography>
            </Box>
        );
    }

    const seatsByRow = seats.reduce((acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
    }, {} as Record<string, Seat[]>);

    const sortedRows = Object.keys(seatsByRow).sort();
    sortedRows.forEach(row => {
        seatsByRow[row].sort((a, b) => a.seat_in_row - b.seat_in_row);
    });

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: '100%' }}>
            <Button onClick={onBackToOverview} sx={{ mb: 2 }}>
                ← Back to Stadium Overview
            </Button>

            <Typography variant="h5" gutterBottom>
                {sectionName} - Select Your Seats
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip label="Available" sx={{ backgroundColor: '#2e7d32', color: 'white' }} size="small" />
                <Chip label="Selected" sx={{ backgroundColor: '#1976d2', color: 'white' }} size="small" />
                <Chip label="Reserved" sx={{ backgroundColor: '#ed6c02', color: 'white' }} size="small" />
                <Chip label="Sold" sx={{ backgroundColor: '#d32f2f', color: 'white' }} size="small" />
            </Box>

            <Box sx={{
                textAlign: 'center',
                mb: 2,
                p: 0.5,
                backgroundColor: '#f5f5f5',
                borderRadius: 1
            }}>
                <Typography variant="body2" color="textSecondary">
                    🏟️ FIELD / STAGE
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: 2,
                p: 2,
                backgroundColor: '#fafafa'
            }}>
                {sortedRows.map(rowLabel => (
                    <Box key={rowLabel} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                width: 25,
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#666',
                                fontSize: '0.75rem'
                            }}
                        >
                            {rowLabel}
                        </Typography>

                        {seatsByRow[rowLabel].map(seat => (
                            <Box
                                key={seat.id}
                                onClick={() => handleSeatClick(seat.id, seat.status)}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    backgroundColor: getSeatColor(seat),
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1,
                                    cursor: getSeatCursor(seat),
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    border: selectedSeats.includes(seat.id) ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)',
                                    '&:hover': seat.status !== 'sold' ? {
                                        opacity: 0.8,
                                        transform: 'scale(1.1)',
                                        boxShadow: 2
                                    } : {},
                                    transition: 'all 0.2s ease',
                                    mx: 0.125
                                }}
                                title={`Seat ${seat.seat_number} - ${seat.status} - $${seat.ticket_option.price}`}
                            >
                                {seat.seat_in_row}
                            </Box>
                        ))}

                        <Typography
                            variant="body2"
                            sx={{
                                width: 25,
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#666',
                                fontSize: '0.75rem'
                            }}
                        >
                            {rowLabel}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {selectedSeats.length > 0 && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Selected Seats: {selectedSeats.length} / {maxSelectable}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedSeats.map(seatId => {
                            const seat = seats.find(s => s.id === seatId);
                            return seat ? (
                                <Chip
                                    key={seatId}
                                    label={`${seat.seat_number} - $${seat.ticket_option.price}`}
                                    onDelete={() => handleSeatClick(seatId, seat.status)}
                                    size="small"
                                    sx={{ 
                                        backgroundColor: '#1976d2', 
                                        color: 'white',
                                        '& .MuiChip-deleteIcon': {
                                            color: 'white'
                                        }
                                    }}
                                />
                            ) : null;
                        })}
                    </Box>
                    
                    <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                        Total: ${selectedSeats.reduce((total, seatId) => {
                            const seat = seats.find(s => s.id === seatId);
                            return total + (seat ? parseFloat(seat.ticket_option.price) : 0);
                        }, 0).toFixed(2)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

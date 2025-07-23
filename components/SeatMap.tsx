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

interface SeatMapProps {
    eventId: string;
    selectedSeats: string[];
    onSeatSelect: (seatIds: string[]) => void;
    maxSelectable?: number;
}

export default function SeatMap({
    eventId,
    selectedSeats,
    onSeatSelect,
    maxSelectable = 8
}: SeatMapProps) {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAssignedSeats, setHasAssignedSeats] = useState(false);

    useEffect(() => {
        const fetchSeatsForEvent = async () => {
            try {
                setLoading(true);
                setError(null);

                await axios.post('/api/seats/cleanup').catch(console.warn);

                const response = await axios.get(`/api/events/${eventId}/seats`);
                setSeats(response.data.seats);
                setHasAssignedSeats(response.data.hasAssignedSeats);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load seats');
            } finally {
                setLoading(false);
            }
        };

        fetchSeatsForEvent();

        const interval = setInterval(fetchSeatsForEvent, 30000);

        return () => clearInterval(interval);
    }, [eventId]);

    const fetchSeats = async () => {
        try {
            setLoading(true);
            setError(null);

            await axios.post('/api/seats/cleanup').catch(console.warn);

            const response = await axios.get(`/api/events/${eventId}/seats`);
            setSeats(response.data.seats);
            setHasAssignedSeats(response.data.hasAssignedSeats);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load seats');
        } finally {
            setLoading(false);
        }
    };

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
        if (selectedSeats.includes(seat.id)) return '#1976d2'; // Selected
        if (seat.status === 'sold') return '#d32f2f'; // Sold
        if (seat.status === 'reserved') return '#ed6c02'; // Reserved
        return '#2e7d32'; // Available
    };

    const getSeatCursor = (seat: Seat) => {
        if (seat.status === 'sold') return 'not-allowed';
        return 'pointer';
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading seat map...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Button onClick={fetchSeats} sx={{ mt: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (!hasAssignedSeats) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>This event uses general admission - no seat selection required.</Typography>
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
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Select Your Seats
            </Typography>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip label="Available" sx={{ backgroundColor: '#2e7d32', color: 'white' }} size="small" />
                <Chip label="Selected" sx={{ backgroundColor: '#1976d2', color: 'white' }} size="small" />
                <Chip label="Reserved" sx={{ backgroundColor: '#ed6c02', color: 'white' }} size="small" />
                <Chip label="Sold" sx={{ backgroundColor: '#d32f2f', color: 'white' }} size="small" />
            </Box>

            <Box sx={{
                textAlign: 'center',
                mb: 3,
                p: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 1
            }}>
                <Typography variant="body2" color="textSecondary">
                    🎭 STAGE
                </Typography>
            </Box>

            {/* Seat Grid */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
            }}>
                {sortedRows.map(rowLabel => (
                    <Box key={rowLabel} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                width: 20,
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            {rowLabel}
                        </Typography>

                        {seatsByRow[rowLabel].map(seat => (
                            <Box
                                key={seat.id}
                                onClick={() => handleSeatClick(seat.id, seat.status)}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: getSeatColor(seat),
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1,
                                    cursor: getSeatCursor(seat),
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    border: selectedSeats.includes(seat.id) ? '2px solid #fff' : 'none',
                                    '&:hover': seat.status !== 'sold' ? {
                                        opacity: 0.8,
                                        transform: 'scale(1.05)'
                                    } : {},
                                    transition: 'all 0.2s ease'
                                }}
                                title={`Seat ${seat.seat_number} - ${seat.status} - $${seat.ticket_option.price}`}
                            >
                                {seat.seat_in_row}
                            </Box>
                        ))}

                        <Typography
                            variant="body2"
                            sx={{
                                width: 20,
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            {rowLabel}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {selectedSeats.length > 0 && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body1" gutterBottom>
                        Selected Seats: {selectedSeats.length} / {maxSelectable}
                    </Typography>
                    {selectedSeats.map(seatId => {
                        const seat = seats.find(s => s.id === seatId);
                        return seat ? (
                            <Chip
                                key={seatId}
                                label={`${seat.seat_number} - $${seat.ticket_option.price}`}
                                onDelete={() => handleSeatClick(seatId, seat.status)}
                                sx={{ mr: 1, mb: 1 }}
                                size="small"
                            />
                        ) : null;
                    })}
                </Box>
            )}
        </Box>
    );
}

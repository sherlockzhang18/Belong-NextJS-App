import axios from 'axios';

interface SeatInfo {
    id: string;
    seat_number: string;
    row: string;
    seat_in_row: number;
    price: string;
}

export async function getSeatsByIds(seatIds: string[]): Promise<Record<string, SeatInfo>> {
    try {
        const response = await axios.post('/api/seats/details', { seatIds });
        return response.data.seats.reduce((acc: Record<string, SeatInfo>, seat: SeatInfo) => {
            acc[seat.id] = seat;
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching seat details:', error);
        return {};
    }
}

export function formatSeatNumbers(seats: Record<string, SeatInfo>): string {
    const seatNumbers = Object.values(seats)
        .sort((a, b) => {
            if (a.row !== b.row) return a.row.localeCompare(b.row);
            return a.seat_in_row - b.seat_in_row;
        })
        .map(seat => seat.seat_number);
    
    if (seatNumbers.length <= 8) {
        return seatNumbers.join(', ');
    }
    
    return `${seatNumbers.slice(0, 8).join(', ')} + ${seatNumbers.length - 8} more`;
}

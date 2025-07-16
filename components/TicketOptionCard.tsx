import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface TicketOption {
    id: string;
    name: string;
    price: string;
    quantity: number;
}

interface TicketOptionCardProps {
    option: TicketOption;
    onAddToCart: (quantity: number) => void;
}

export default function TicketOptionCard({ option, onAddToCart }: TicketOptionCardProps) {
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const maxQuantity = Math.min(option.quantity, 10);

    const handleIncrement = () => {
        if (selectedQuantity < maxQuantity) {
            setSelectedQuantity(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (selectedQuantity > 1) {
            setSelectedQuantity(prev => prev - 1);
        }
    };

    return (
        <Paper 
            elevation={2}
            sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': {
                    borderColor: 'primary.main',
                }
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="div">
                    {option.name}
                </Typography>
                <Typography variant="h6" color="primary">
                    ${parseFloat(option.price).toFixed(2)}
                </Typography>
            </Box>

            {option.quantity <= 10 && (
                <Typography variant="body2" color="error" mb={2}>
                    Only {option.quantity} tickets left!
                </Typography>
            )}

            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                    <IconButton 
                        onClick={handleDecrement}
                        disabled={selectedQuantity <= 1}
                        size="small"
                    >
                        <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ mx: 2 }}>{selectedQuantity}</Typography>
                    <IconButton 
                        onClick={handleIncrement}
                        disabled={selectedQuantity >= maxQuantity}
                        size="small"
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
                <Button 
                    variant="contained"
                    onClick={() => onAddToCart(selectedQuantity)}
                    disabled={option.quantity === 0}
                >
                    Add to Cart
                </Button>
            </Box>
        </Paper>
    );
} 
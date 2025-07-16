import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import { useCart } from '../services/useCart'
import { Box, Typography, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'

export default function CartPage() {
    const { items, remove, add, totalPrice, ticketOptions } = useCart()
    const router = useRouter()

    if (items.length === 0) {
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Your cart is empty</h2>
                <Button
                    onClick={() => router.push('/')}
                    variant="contained"
                    color="primary"
                    style={{ marginTop: '1rem' }}
                >
                    Browse Events
                </Button>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Shopping Cart
            </Typography>
            
            <Box sx={{ listStyle: 'none', padding: 0 }}>
                {items.map((item) => {
                    const ticketOption = item.ticketOptionId ? ticketOptions[item.ticketOptionId] : null
                    const unitPrice = ticketOption 
                        ? parseFloat(ticketOption.price)
                        : parseFloat(item.event.metadata?.price?.toString() || '0')
                    const lineTotal = unitPrice * item.quantity

                    return (
                        <Box
                            key={`${item.event.uuid}-${item.ticketOptionId || 'default'}`}
                            sx={{
                                mb: 2,
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom>
                                    {item.event.name}
                                </Typography>
                                {ticketOption && (
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        Ticket Type: {ticketOption.name}
                                    </Typography>
                                )}
                                <Typography variant="body2" gutterBottom>
                                    Unit Price: ${unitPrice.toFixed(2)}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Typography variant="body2">Quantity:</Typography>
                                    <IconButton 
                                        size="small"
                                        onClick={() => remove(item.event, { ticketOptionId: item.ticketOptionId })}
                                    >
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="body1" sx={{ mx: 1 }}>
                                        {item.quantity}
                                    </Typography>
                                    <IconButton 
                                        size="small"
                                        onClick={() => add(item.event, { ticketOptionId: item.ticketOptionId })}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" fontWeight="bold">
                                    Total: ${lineTotal.toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>
                    )
                })}
            </Box>

            <Box
                sx={{
                    mt: 4,
                    pt: 2,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h5">
                    Total: ${totalPrice.toFixed(2)}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/checkout')}
                    disabled={items.length === 0}
                    size="large"
                >
                    Proceed to Checkout
                </Button>
            </Box>
        </main>
    )
}

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { useCurrentUser } from '../services/useCurrentUser'
import { useRouter } from 'next/router'

interface OrderItem {
  uuid: string
  quantity: number
  unit_price: string
  subtotal: string
  event: {
    uuid: string
    name: string
    date: number
  }
}

interface Order {
  uuid: string
  status: string
  total_amount: string
  created_at: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const { isAuthenticated } = useCurrentUser()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50'
      case 'pending':
        return '#ff9800'
      case 'failed':
        return '#f44336'
      default:
        return '#757575'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <CircularProgress />
        <h2>Loading...</h2>
      </main>
    )
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <CircularProgress />
        <h2>Loading your orders...</h2>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
        <Alert severity="error" style={{ marginBottom: '2rem' }}>
          {error}
        </Alert>
        <Button onClick={fetchOrders} variant="contained">
          Retry
        </Button>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Orders</h1>
        <Button component={Link} href="/" variant="outlined">
          Browse Events
        </Button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No orders found</h3>
          <p>You haven&apos;t made any purchases yet.</p>
          <Button component={Link} href="/" variant="contained" color="primary">
            Start Shopping
          </Button>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <div 
              key={order.uuid} 
              style={{ 
                marginBottom: '2rem', 
                padding: '1.5rem', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                backgroundColor: '#fafafa'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    Order #{order.uuid.slice(0, 8)}
                  </h3>
                  <p style={{ margin: '0', color: '#666' }}>
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div 
                    style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(order.status),
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {order.status}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Items:</h4>
                {order.items?.map((item) => (
                  <div 
                    key={item.uuid}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <div>
                      <strong>{item.event.name}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Quantity: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                )) || (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No items found</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

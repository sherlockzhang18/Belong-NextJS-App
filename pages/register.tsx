import React, { useState } from 'react'
import { useRouter } from 'next/router'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import axios from 'axios'

export default function RegisterPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post(
                '/api/register',
                { username, password },
                { withCredentials: true }
            )
            router.push('/')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed')
        }
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <h1>Register</h1>
            <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
                <TextField
                    label="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <Button type="submit" variant="contained">
                    Register
                </Button>
            </form>
            <Button onClick={() => router.push('/login')} sx={{ mt: 2 }}>
                Already have an account? Log In
            </Button>
        </Container>
    )
}

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sampleEvents } from '../services/eventsData'
import { Event as ChronosEvent, dayjs } from '@jstiava/chronos'
import Button from '@mui/material/Button'

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS!
const STORAGE_KEY = 'admin-token'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    setToken(localStorage.getItem(STORAGE_KEY))
  }, [])

  const isAuthorized = token === ADMIN_PASS
  const events: ChronosEvent[] = sampleEvents.map(raw => new ChronosEvent(raw))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === ADMIN_PASS) {
      localStorage.setItem(STORAGE_KEY, input)
      setToken(input)
      setInput('')
    } else {
      alert('Wrong password')
    }
  }

  const onLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }

  if (!isAuthorized) {
    return (
      <main className="admin-page">
        <h1>Admin Login</h1>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Enter password"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem' }}
          />
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          ← <Link href="/">Back to events</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-controls">
          <Button variant="outlined" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>
      <ul className="admin-list">
        {events.map(evt => (
          <li className="admin-item" key={evt.uuid}>
            <div className="item-info">
              <span className="item-title">{evt.name}</span>
              <span className="item-date">{evt.date?.format('MMM D, YYYY')}</span>
            </div>
            <div className="item-actions">
              <Button variant="contained" size="small" onClick={() => alert('Edit stub')}>
                Edit
              </Button>
              <Button variant="text" size="small" color="error" onClick={() => alert('Delete stub')}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <footer className="admin-footer">
        <Link href="/">← Back to events</Link>
      </footer>
    </main>
)
}

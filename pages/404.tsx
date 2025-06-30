import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404 — Page Not Found</h1>
      <p>Oops! The page you’re looking for doesn’t exist.</p>
      <Link href="/" style={{ color: '#0070f3' }}>
        ← Back to Home
      </Link>
    </main>
  )
}

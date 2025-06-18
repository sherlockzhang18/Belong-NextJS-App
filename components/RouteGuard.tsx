import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface RouteGuardProps {
  children: React.ReactNode
}

const PROTECTED_PATHS = ['/cart', '/admin']

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // authCheck runs on initial load and on every route change
    const authCheck = async (url: string) => {
      const path = url.split('?')[0]
      const needsAuth = PROTECTED_PATHS.some(p => path.startsWith(p))

      if (!needsAuth) {
        setAuthorized(true)
        return
      }

      try {
        const res = await fetch('/api/me', {
          credentials: 'include',  // ← send HTTP-only session cookie
        })
        if (res.ok) {
          setAuthorized(true)
        } else {
          setAuthorized(false)
          router.push('/login')
        }
      } catch {
        setAuthorized(false)
        router.push('/login')
      }
    }

    // run the initial check
    authCheck(router.asPath)

    // re-check on route changes
    router.events.on('routeChangeComplete', authCheck)
    return () => {
      router.events.off('routeChangeComplete', authCheck)
    }
  }, [router])

  // while we’re waiting for auth, don't render children
  if (!authorized) return null
  return <>{children}</>
}

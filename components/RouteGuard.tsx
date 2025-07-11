import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface RouteGuardProps {
  children: React.ReactNode
}

const PROTECTED_PATHS = ['/cart', '/admin', '/checkout', '/orders']

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const authCheck = async (url: string) => {
      const path = url.split('?')[0]
      const needsAuth = PROTECTED_PATHS.some(p => path.startsWith(p))

      if (!needsAuth) {
        setAuthorized(true)
        return
      }

      try {
        const res = await fetch('/api/me', {
          credentials: 'include',
        })
        if (res.ok) {
          setAuthorized(true)
        } else {
          setAuthorized(false)
          router.push(`/login?redirect=${encodeURIComponent(url)}`)
        }
      } catch {
        setAuthorized(false)
        router.push(`/login?redirect=${encodeURIComponent(url)}`)
      }
    }

    authCheck(router.asPath)

    router.events.on('routeChangeComplete', authCheck)
    return () => {
      router.events.off('routeChangeComplete', authCheck)
    }
  }, [router])

  if (!authorized) return null
  return <>{children}</>
}

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
        authCheck(router.asPath)

        const handleComplete = (url: string) => authCheck(url)
        router.events.on('routeChangeComplete', handleComplete)
        return () => {
            router.events.off('routeChangeComplete', handleComplete)
        }
    }, [])

    async function authCheck(url: string) {
        const path = url.split('?')[0]
        const isProtected = PROTECTED_PATHS.includes(path)

        if (!isProtected) {
            setAuthorized(true)
            return
        }

        try {
            const res = await fetch('/api/me')
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

    if (!authorized) return null
    return <>{children}</>
}
// 
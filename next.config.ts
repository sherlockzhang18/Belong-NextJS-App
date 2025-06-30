import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: false,

    async redirects() {
        return [
            {
                source: '/login',
                destination: '/',
                permanent: false,
            },
        ]
    },

    experimental: {
        forceSwcTransforms: true, // ✅ Forces SWC even if Babel is present
    },

    images: {
        domains: [
            'localhost',
            'your-production-domain.com',
            's1.ticketm.net',
            'utfs.io',
        ],
    },
}

export default nextConfig

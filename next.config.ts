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
            // your local dev host
            'localhost',
            // your production domain (replace accordingly)
            'your-production-domain.com',
            // allow Ticketmaster CDN
            's1.ticketm.net',
        ],
    },
}

export default nextConfig

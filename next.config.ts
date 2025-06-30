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
        remotePatterns: [
            // uploadthing
            {
                protocol: 'https',
                hostname: 'utfs.io',
                port: '',
                pathname: '/**',
            },

            // ticketmaster
            {
                protocol: 'https',
                hostname: 's1.ticketm.net',
                port: '',
                pathname: '/**',
            },

            // localhost
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/**',
            },
        ],
    },
}

export default nextConfig

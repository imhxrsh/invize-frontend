/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
}

export default nextConfig

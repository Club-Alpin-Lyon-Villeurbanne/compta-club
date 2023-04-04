/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.clubalpinlyon.fr',
        port: '',
        pathname: '/**',
      },
    ],
  }
}

module.exports = nextConfig

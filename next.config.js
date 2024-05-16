/** @type {import('next').NextConfig} */
const nextConfig = {
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

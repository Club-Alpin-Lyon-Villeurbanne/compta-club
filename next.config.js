/** @type {import('next').NextConfig} */
// Base Next.js config
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /require-in-the-middle/ },
        { module: /@opentelemetry\/instrumentation/ },
      ];
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
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
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

// Conditionally wrap with Sentry only in production
let exportedConfig = nextConfig;
if (process.env.NODE_ENV === 'production') {
  const { withSentryConfig } = require('@sentry/nextjs');
  exportedConfig = withSentryConfig(
    nextConfig,
    {
      org: 'club-alpin-lyon',
      project: 'compta-staging',
      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,
      // Upload a larger set of source maps for prettier stack traces
      widenClientFileUpload: true,
      // Automatically annotate React components
      reactComponentAnnotation: { enabled: true },
      // Route browser requests to Sentry through a Next.js rewrite
      tunnelRoute: '/monitoring',
      // Hide source maps from generated client bundles
      hideSourceMaps: true,
      // Automatically tree-shake Sentry logger statements
      disableLogger: true,
      // Enable Vercel Cron Monitors instrumentation
      automaticVercelMonitors: true,
    }
  );
}

module.exports = exportedConfig;
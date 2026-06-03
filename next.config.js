/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // HTTP cache headers for static assets and pages
  async headers() {
    return [
      {
        // Next.js built static assets (JS, CSS, chunks) — immutable, long cache
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Static files in /public — long cache with revalidation
        source: '/:path*(lib|live2d|pdfjs|stickers|uploads)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Images — moderate cache
        source: '/:path*.(:png|jpg|jpeg|gif|svg|webp|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' },
        ],
      },
      {
        // HTML pages — short cache to reduce repeated load under flaky tunnel
        source: '/((?!api|_next|static|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      {
        // API routes — never cache
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scholars-tea.428312321.xyz',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '10.72.212.33',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.byteimg.com',
      },
    ],
  },
  serverExternalPackages: ['archiver'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('undici');
      config.externals.push('pdf2json');
      config.externals.push('archiver');
    }
    // Exclude transformers.js and onnxruntime from webpack bundling
    // They are loaded dynamically in the browser only via dynamic import
    config.externals = config.externals || [];
    config.externals.push({
      '@xenova/transformers': 'commonjs @xenova/transformers',
      'onnxruntime-node': 'commonjs onnxruntime-node',
    });
    return config;
  },
};

module.exports = nextConfig;

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Use admin directory as tracing root so Next doesn't infer parent monorepo root
  // (avoids "multiple lockfiles" warning and "Failed to find Server Action" after deploy)
  outputFileTracingRoot: __dirname,
  webpack(config) {
    // Explicitly set @/ alias so it always resolves to this directory,
    // even when Next.js detects a monorepo structure with nested package.json files.
    config.resolve.alias['@'] = __dirname
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;

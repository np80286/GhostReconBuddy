import type { NextConfig } from 'next';

const imageConfig = {
  remotePatterns: [
    { protocol: 'https' as const, hostname: 'commons.wikimedia.org' },
    { protocol: 'https' as const, hostname: 'upload.wikimedia.org' },
    { protocol: 'https' as const, hostname: 'thumb.wikimedia.org' },
  ],
};

const nextConfig: NextConfig = process.env.GITHUB_PAGES
  ? {
      output: 'export',
      basePath: '/GhostReconBuddy',
      images: { ...imageConfig, unoptimized: true },
    }
  : { images: imageConfig };

export default nextConfig;

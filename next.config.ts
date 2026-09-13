import type { NextConfig } from 'next';

const nextConfig: NextConfig = process.env.GITHUB_PAGES
  ? {
      output: 'export',
      basePath: '/GhostReconBuddy',
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;

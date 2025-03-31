/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core configurations
  reactStrictMode: false,
  
  // Disable certain checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization
  images: {
    unoptimized: true,
  },

  // Experimental features (keeping only essential ones)
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

export default nextConfig

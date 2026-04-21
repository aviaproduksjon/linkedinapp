/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the shared workspace package.
  transpilePackages: ['@linkedin-hub/shared'],
  experimental: {
    // Server actions + typed routes will be useful later.
    typedRoutes: true,
  },
};

export default nextConfig;

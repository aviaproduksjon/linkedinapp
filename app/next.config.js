/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the shared workspace package.
  transpilePackages: ['@linkedin-hub/shared'],
  // typedRoutes is off for now — the dynamic filter paths (`/ideas?filter=...`)
  // don't play nicely with it. Can turn it back on once we have a richer
  // route map and use `Route` types explicitly.
  experimental: {},
};

export default nextConfig;

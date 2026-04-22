/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions are enabled by default in Next 15.
    // Keeping this file minimal by design — production-oriented tweaks go here later.
  },
};

module.exports = nextConfig;

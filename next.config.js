/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@polkadot/types-codec'],
    transpilePackages: ['@tanstack/query-core'],
    reactStrictMode: true,
    webpack: config => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      return config;
    },
  };

module.exports = nextConfig

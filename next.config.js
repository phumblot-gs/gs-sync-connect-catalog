/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour les environnements multiples
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Environment',
            value: process.env.NODE_ENV || 'development',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig; 
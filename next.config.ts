import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
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

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
      };
    }
    
    // Fix for bcrypt
    if (isServer) {
      config.externals = [...(config.externals || []), 'bcrypt'];
    }
    
    return config;
  },
  
  // Configure image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

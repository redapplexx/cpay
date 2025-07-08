import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // optimizeCss: true, // Disabled due to critters module issue
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config, { isServer }) => {
    // Handle genkit/handlebars webpack issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Exclude problematic modules from client-side bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'handlebars': false,
        'genkit': false,
        '@genkit-ai/core': false,
      };
    }

    return config;
  },
  // Exclude AI flows from build to prevent webpack issues
  serverExternalPackages: ['genkit', '@genkit-ai/core'],
};

export default nextConfig;

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
<<<<<<< HEAD
=======
  /* config options here */
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

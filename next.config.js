import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
  },
  // Configure Turbopack to work with our @ alias paths
  turbopack: {},
  // Configure webpack to work with our @ alias paths
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname;
    config.resolve.alias['@components'] = __dirname + '/src/components';
    config.resolve.alias['@controllers'] = __dirname + '/src/controllers';
    config.resolve.alias['@utils'] = __dirname + '/src/utils';
    config.resolve.alias['@types'] = __dirname + '/src/types';
    return config;
  },
};

export default nextConfig;

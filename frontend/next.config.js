/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Allows all paths/cloud names on res.cloudinary.com
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      { // Added this entry for Firebase Storage, for future compatibility or other assets
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**', // Allows all paths within your Firebase Storage bucket
      },
    ],
  },
};

module.exports = nextConfig;

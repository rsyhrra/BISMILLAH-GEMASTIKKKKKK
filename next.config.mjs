/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '10.10.120.167',
    '192.168.1.9',
    '192.168.1.2',
    'localhost:3000',
    '*.loca.lt',
    '*.ngrok-free.app',
    '*.pinggy.link',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

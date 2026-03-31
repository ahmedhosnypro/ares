/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shinawy.github.io', // ده القديم بتاعك سيبه زي ما هو
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // ده اللي ضفناه عشان الصور الجديدة
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
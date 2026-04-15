/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backend",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "shinawy.github.io", // ده القديم بتاعك سيبه زي ما هو
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // ده اللي ضفناه عشان الصور الجديدة
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary (votre CDN principal)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Unsplash (pour les images de test/développement)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Localhost (développement backend)
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      // Picsum (images placeholder)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Votre domaine de production (à adapter)
      {
        protocol: 'https',
        hostname: 'api.waxeho.com',
      },
      {
        protocol: 'https',
        hostname: 'waxeho.com',
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: 'https',
        hostname: 'itourisme-nomade.vercel.app',
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "**", // 🔥 autorise toutes les images
      },
    ],
  },
};

export default nextConfig;

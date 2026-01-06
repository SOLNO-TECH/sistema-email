import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Para producción optimizada
  // Configuración para evitar errores de build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Deshabilitar indicadores de desarrollo (botón de Turbo Pack en la esquina)
  // Esto oculta el botón que muestra información de rutas y Turbo Pack
  // devIndicators ya no acepta buildActivity en esta versión de Next.js
  // Optimización de imágenes para SEO
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Headers para SEO y seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

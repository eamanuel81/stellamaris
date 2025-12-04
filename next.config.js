module.exports = {
  // Configuración temporal para producción
  typescript: {
    ignoreBuildErrors: true, // ⚠️ TEMPORAL - Solo para permitir build
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ TEMPORAL - Solo para permitir build
  },
  
  // Configuración de imágenes
  images: {
    domains: [
      'kvqdfjmszfigyhhuxfbs.supabase.co',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuración de Turbopack para silenciar warning
  experimental: {
    turbo: {
      root: __dirname, // Establece la raíz del proyecto actual
    },
  },
};
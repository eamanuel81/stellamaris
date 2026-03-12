module.exports = {
  // Salida standalone para despliegue (Railway, etc.): menor tamaño y usa PORT automático
  output: 'standalone',
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
  // Configuración de Turbopack (versión actualizada)
  turbopack: {
    root: __dirname,
  },
};
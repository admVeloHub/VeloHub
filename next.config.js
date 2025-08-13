/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para Vercel
  experimental: {
    // Desabilitar features experimentais que podem causar problemas
  },
  // Configurações de segurança
  poweredByHeader: false,
  // Configurações de compressão
  compress: true,
  // Configurações de cache
  generateEtags: true,
  // Configurações para Vercel
  output: 'standalone',
  // Configurações de headers
  async headers() {
    return [
      {
        source: '/(.*)',
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
    ]
  },
}

module.exports = nextConfig

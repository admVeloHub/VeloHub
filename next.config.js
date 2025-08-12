/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configuração para GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/VeloHub' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/VeloHub/' : ''
}

module.exports = nextConfig

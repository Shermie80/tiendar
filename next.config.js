/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Permitir 'unsafe-eval'
              "style-src 'self' 'unsafe-inline'", // Solo estilos locales
              "font-src 'self'", // Solo fuentes locales
              "img-src 'self' data:", // Permitir imágenes locales y data URLs
              "connect-src 'self' ws://localhost:3000 wss://localhost:3000 https://*.supabase.co", // Conexiones a Supabase y WebSockets
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

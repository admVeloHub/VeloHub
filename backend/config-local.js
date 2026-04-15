// VeloHub V3 - Configuração Local para Testes
// VERSION: v1.0.1 | DATE: 2026-04-15 | AUTHOR: VeloHub Development Team
// v1.0.1: PORT fallback 8090 (backend dev); front VeloHub usa 8080 — alinhado a src/config/api-config.js

// Configuração para testes locais com dados reais
const config = {
  // MongoDB - Substitua pela sua URI real
  MONGO_ENV: process.env.MONGO_ENV || 'mongodb+srv://REDACTED',
  
  // Servidor
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8090,
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret-here',
  
  // APIs de IA (opcional para testes de tickets)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-your-openai-key-here',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AI-your-gemini-key-here',
  
  // Configurações de teste
  LOCAL_TESTING: process.env.LOCAL_TESTING || 'false'
};

// Definir variáveis de ambiente se não estiverem definidas
// IMPORTANTE: Não sobrescrever variáveis já definidas no .env
Object.keys(config).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = config[key];
    console.log(`🔧 Definindo ${key} (fallback): ${key.includes('KEY') || key.includes('SECRET') || key.includes('MONGO_ENV') ? '***' : config[key]}`);
  } else {
    // Log para debug - mostrar que variável do .env está sendo usada
    if (key === 'MONGO_ENV') {
      console.log(`✅ Usando MONGO_ENV do arquivo .env (primeiros 30 chars): ${process.env[key].substring(0, 30)}...`);
    }
  }
});

module.exports = config;

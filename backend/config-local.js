// VeloHub V3 - Configuração Local para Testes
// VERSION: v1.0.2 | DATE: 2026-04-22 | AUTHOR: VeloHub Development Team
// v1.0.2: Sem URI/credenciais literais nem log de prefixo de MONGO_ENV (auditoria de segredos)
// v1.0.1: PORT fallback 8090 (backend dev); front VeloHub usa 8080 — alinhado a src/config/api-config.js

// Configuração para testes locais — preencha via backend/.env ou variáveis de ambiente (sem literais no repositório)
const config = {
  MONGO_ENV: process.env.MONGO_ENV || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8090,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  LOCAL_TESTING: process.env.LOCAL_TESTING || 'false'
};

Object.keys(config).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = config[key];
    const mask = key.includes('KEY') || key.includes('SECRET') || key === 'MONGO_ENV';
    console.log(`🔧 Definindo ${key} (fallback): ${mask ? '(vazio — defina no .env)' : config[key]}`);
  } else if (key === 'MONGO_ENV') {
    console.log('✅ Usando MONGO_ENV do arquivo .env ou ambiente');
  }
});

module.exports = config;

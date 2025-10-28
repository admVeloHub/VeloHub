// VeloHub V3 - Configuração Local para Testes
// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team

// Configuração para testes locais com dados reais
const config = {
  // MongoDB - Substitua pela sua URI real
  MONGO_ENV: process.env.MONGO_ENV || 'mongodb+srv://usuario:senha@cluster.mongodb.net/console_conteudo',
  
  // Servidor
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8080,
  
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
Object.keys(config).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = config[key];
    console.log(`🔧 Definindo ${key}: ${key.includes('KEY') || key.includes('SECRET') ? '***' : config[key]}`);
  }
});

module.exports = config;

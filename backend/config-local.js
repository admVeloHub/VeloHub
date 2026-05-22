// VeloHub V3 - Configuração local para testes
// VERSION: v1.4.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
// v1.4.0: IDs de vector store VeloBot removidos (hardcoded em velobotRagConstants.js)
// VERSION: v1.2.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
// v1.2.0: OPENAI_VELOBOT_VECTOR_STORE_IDS / OPENAI_VELOBOT_RESPONSES_MODEL (RAG VeloBot)
// VERSION: v1.1.0 | DATE: 2026-04-22 | AUTHOR: VeloHub Development Team
// v1.1.0: removidos fallbacks com URIs, segredos ou placeholders de chaves no repositório.
// v1.0.1: PORT fallback 8090 (backend dev); front VeloHub usa 8080 — alinhado a src/config/api-config.js
//
// Preencha credenciais em FONTE DA VERDADE/. (VARIAVEIS_AMBIENTE.md); não defina segredos aqui.

const config = {
  MONGO_ENV: process.env.MONGO_ENV,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8090,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_VELOBOT_RESPONSES_MODEL: process.env.OPENAI_VELOBOT_RESPONSES_MODEL,
  VELOBOT_TELEMETRY_WEBHOOK_URL: process.env.VELOBOT_TELEMETRY_WEBHOOK_URL,
  VELOBOT_TELEMETRY_WEBHOOK_SECRET: process.env.VELOBOT_TELEMETRY_WEBHOOK_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  LOCAL_TESTING: process.env.LOCAL_TESTING || 'false'
};

Object.keys(config).forEach((key) => {
  if (process.env[key]) {
    if (key === 'MONGO_ENV' && process.env.MONGO_ENV) {
      console.log(
        '✅ Usando MONGO_ENV (primeiros 30 chars):',
        process.env.MONGO_ENV.substring(0, 30) + '...'
      );
    }
    return;
  }
  const v = config[key];
  if (v === undefined || v === null) return;
  process.env[key] = String(v);
});

module.exports = config;

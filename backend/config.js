// Configuração do VeloHub V3 - Baseada em Variáveis de Ambiente
// VERSION: v1.7.6 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
// v1.7.6: VELOBOT_PRIMARY_RAG_ENABLED — RAG OpenAI VeloBot (congelado via velobotRagConstants FORCE_DISABLED)
// v1.7.5: VELOHUB_PIX_RECONCILE_SECRET — header X-Velohub-Pix-Reconcile-Secret (job reconciliação pixLiberado 15 min)
// v1.7.1: OCTADESK_STATUS_RESOLVIDO_ID obrigatório na abertura de ticket (GET /tickets/status)
// v1.7.0: OCTADESK_* — integração tickets (JWT, IDs grupo/assunto/status, custom field CPF)
// VERSION: v1.6.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
// v1.6.0: Removidas env de IDs de vector store VeloBot (hardcoded em velobotRagConstants.js); telemetria opcional VELOBOT_TELEMETRY_*
// v1.5.0: OPENAI_VELOBOT_VECTOR_STORE_ID_PUBLIC / INTERNAL — modo primário RAG (duas stores); lista legada mantida
// VERSION: v1.4.7 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
// v1.4.7: OPENAI_VELOBOT_VECTOR_STORE_IDS / OPENAI_VELOBOT_RESPONSES_MODEL — RAG VeloBot via Responses API (file_search)
// VERSION: v1.4.6 | DATE: 2026-05-04 | AUTHOR: Lucas Gravina - VeloHub Development Team
// v1.4.6: VELOHUB_TICKET_NOTIFY_SECRET — enviado no header X-Velohub-Ticket-Notify-Secret (notify Apoio → SKYNET)
// v1.4.5: VELOHUB_TICKET_NOTIFY_SECRET — corpo JSON do notify novo ticket Apoio → SKYNET
// v1.4.4: SKYNET_API_URL resolvida também a partir de SKYNET no .env (ex.: porta 3001 → http://localhost:3001)
// v1.4.3: Comentário: SKYNET_API_URL também usada pelo Apoio (notify novo ticket)
// v1.4.2: Removidos WHATSAPP_API_URL / WHATSAPP_DEFAULT_JID (integração descontinuada)
// v1.4.1: PORT fallback 8090 em dev local; produção (Cloud Run) define PORT=8080

/**
 * Base URL da API SKYNET (Ambiente de teste: FONTE DA VERDADE/.env com SKYNET=3001).
 * Prioridade: SKYNET_API_URL explícita; senão SKYNET (somente dígitos → localhost; URL completa → como está; host:porta → http://...).
 */
const { isPrimaryVelobotRagEnabled } = require('./services/chatbot/velobotRagConstants');

function resolveSkynetApiBaseUrl() {
  const explicit = process.env.SKYNET_API_URL;
  if (explicit != null && String(explicit).trim() !== '') {
    return String(explicit).trim().replace(/\/+$/, '');
  }

  const skynet = process.env.SKYNET;
  if (skynet == null || String(skynet).trim() === '') {
    return '';
  }

  const s = String(skynet).trim().replace(/\/+$/, '');

  if (/^\d+$/.test(s)) {
    return `http://localhost:${s}`;
  }
  if (/^https?:\/\//i.test(s)) {
    return s;
  }
  if (/^[\w.-]+:\d+$/.test(s)) {
    return `http://${s}`;
  }
  return s;
}

module.exports = {
  // ===========================================
  // APIs DE INTELIGÊNCIA ARTIFICIAL
  // ===========================================
  
  // OpenAI API Key (para fallback)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Modelo Responses (file_search) — override opcional; default hardcoded em velobotRagConstants.js
  OPENAI_VELOBOT_RESPONSES_MODEL:
    process.env.OPENAI_VELOBOT_RESPONSES_MODEL != null
      ? String(process.env.OPENAI_VELOBOT_RESPONSES_MODEL).trim()
      : '',

  // Google Gemini API Key (IA primária)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // RAG OpenAI VeloBot (Responses + file_search) — false = fluxo legado Mongo/Gemini em /api/chatbot/ask
  VELOBOT_PRIMARY_RAG_ENABLED: isPrimaryVelobotRagEnabled(process.env.VELOBOT_PRIMARY_RAG_ENABLED),
  
  // ===========================================
  // BANCO DE DADOS
  // ===========================================
  
  // MongoDB Connection String
  MONGODB_URI: process.env.MONGO_ENV,
  
  // ===========================================
  // GOOGLE SERVICES
  // ===========================================
  
  // Google OAuth (para SSO)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  
  // ===========================================
  // CONFIGURAÇÕES DO SERVIDOR
  // ===========================================
  
  // Ambiente de execução
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Porta do servidor (produção: Cloud Run injeta PORT; local sem PORT → 8090, front em 8080)
  PORT: process.env.PORT || 8090,
  
  
  // ===========================================
  // CONFIGURAÇÕES OPCIONAIS
  // ===========================================
  
  // Ponto Mais API (se necessário)
  PONTO_MAIS_API_KEY: process.env.PONTO_MAIS_API_KEY,
  PONTO_MAIS_COMPANY_ID: process.env.PONTO_MAIS_COMPANY_ID,
  
  // SKYNET: URL base (produção: SKYNET_API_URL; teste local: SKYNET= porta ou URL em FONTE DA VERDADE/.env)
  SKYNET_API_URL: resolveSkynetApiBaseUrl(),

  // Segredo compartilhado: header X-Velohub-Ticket-Notify-Secret no POST notify-new-ticket-velohub (variável VELOHUB_TICKET_NOTIFY_SECRET)
  VELOHUB_TICKET_NOTIFY_SECRET:
    process.env.VELOHUB_TICKET_NOTIFY_SECRET != null
      ? String(process.env.VELOHUB_TICKET_NOTIFY_SECRET).trim()
      : '',

  // Job reconciliação pixLiberado (Cloud Scheduler 15 min): header X-Velohub-Pix-Reconcile-Secret
  VELOHUB_PIX_RECONCILE_SECRET:
    process.env.VELOHUB_PIX_RECONCILE_SECRET != null
      ? String(process.env.VELOHUB_PIX_RECONCILE_SECRET).trim()
      : '',
  
  // Cache timeout para dados do chatbot (em ms)
  CHATBOT_CACHE_TIMEOUT: parseInt(process.env.CHATBOT_CACHE_TIMEOUT) || 300000,

  // Telemetria opcional do chat principal VeloBot (webhook externo)
  VELOBOT_TELEMETRY_WEBHOOK_URL:
    process.env.VELOBOT_TELEMETRY_WEBHOOK_URL != null
      ? String(process.env.VELOBOT_TELEMETRY_WEBHOOK_URL).trim()
      : '',
  VELOBOT_TELEMETRY_WEBHOOK_SECRET:
    process.env.VELOBOT_TELEMETRY_WEBHOOK_SECRET != null
      ? String(process.env.VELOBOT_TELEMETRY_WEBHOOK_SECRET).trim()
      : '',

  // ===========================================
  // OCTADESK (tickets — Requisições / Reclamações)
  // ===========================================

  OCTADESK_API_BASE_URL:
    process.env.OCTADESK_API_BASE_URL != null
      ? String(process.env.OCTADESK_API_BASE_URL).trim().replace(/\/+$/, '')
      : 'https://api.octadesk.services',
  OCTADESK_API_TOKEN:
    process.env.OCTADESK_API_TOKEN != null ? String(process.env.OCTADESK_API_TOKEN).trim() : '',
  OCTADESK_API_EMAIL:
    process.env.OCTADESK_API_EMAIL != null ? String(process.env.OCTADESK_API_EMAIL).trim() : '',
  OCTADESK_API_PASSWORD:
    process.env.OCTADESK_API_PASSWORD != null
      ? String(process.env.OCTADESK_API_PASSWORD).trim()
      : '',
  OCTADESK_STATUS_EM_ANDAMENTO_ID:
    process.env.OCTADESK_STATUS_EM_ANDAMENTO_ID != null
      ? String(process.env.OCTADESK_STATUS_EM_ANDAMENTO_ID).trim()
      : '',
  OCTADESK_STATUS_RESOLVIDO_ID:
    process.env.OCTADESK_STATUS_RESOLVIDO_ID != null
      ? String(process.env.OCTADESK_STATUS_RESOLVIDO_ID).trim()
      : '',
  OCTADESK_GROUP_CASOS_ESPECIAIS_ID:
    process.env.OCTADESK_GROUP_CASOS_ESPECIAIS_ID != null
      ? String(process.env.OCTADESK_GROUP_CASOS_ESPECIAIS_ID).trim()
      : '',
  OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID:
    process.env.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID != null
      ? String(process.env.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID).trim()
      : '',
  /** Legado/documentação; abertura usa key fixa cpf_do_titular no payload. */
  OCTADESK_CUSTOM_FIELD_CPF_KEY:
    process.env.OCTADESK_CUSTOM_FIELD_CPF_KEY != null
      ? String(process.env.OCTADESK_CUSTOM_FIELD_CPF_KEY).trim()
      : 'cpf_do_titular',
  OCTADESK_NUMBER_CHANNEL:
    process.env.OCTADESK_NUMBER_CHANNEL != null ? String(process.env.OCTADESK_NUMBER_CHANNEL).trim() : '',
  OCTADESK_ID_FORM:
    process.env.OCTADESK_ID_FORM != null ? String(process.env.OCTADESK_ID_FORM).trim() : '',
  // ===========================================
  // VALIDAÇÃO DE CONFIGURAÇÃO
  // ===========================================
  
  /**
   * Valida se as configurações essenciais estão presentes
   * @returns {Object} Status da validação
   */
  validateConfig() {
    const required = [
      'MONGO_ENV',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    const optional = [
      'OPENAI_API_KEY',
      'OPENAI_VELOBOT_RESPONSES_MODEL',
      'GEMINI_API_KEY',
      'VELOBOT_TELEMETRY_WEBHOOK_URL',
      'VELOBOT_TELEMETRY_WEBHOOK_SECRET'
    ];
    
    const missing = required.filter(key => !this[key]);
    const available = optional.filter(key => this[key]);
    
    return {
      isValid: missing.length === 0,
      missing,
      available,
      hasAI: this.OPENAI_API_KEY || this.GEMINI_API_KEY
    };
  }
};

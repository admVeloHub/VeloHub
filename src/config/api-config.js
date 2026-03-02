/**
 * VeloHub V3 - API Configuration
 * VERSION: v1.0.21 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * REGRA: Frontend porta 8080 | Backend porta 8090 | VeloChat Server porta 3002 na rede local
 * 
 * Mudanças v1.0.21:
 * - CORREÇÃO CORS: Frontend agora usa proxy do backend (/api/whatsapp/send) ao invés de chamar ngrok diretamente
 * - getWhatsAppEndpoint() agora retorna endpoint do backend que faz proxy para ngrok
 * - Resolve problema de CORS ao chamar ngrok diretamente do frontend
 * 
 * Mudanças v1.0.20:
 * - Alterada URL da API WhatsApp de produção para https://carmina-peskier-balletically.ngrok-free.dev
 * 
 * Mudanças v1.0.19:
 * - Alterada URL da API WhatsApp de produção para https://genes-conservation-perth-beverages.trycloudflare.com
 * 
 * Mudanças v1.0.18:
 * - Alterada URL da API WhatsApp para localhost:3001 em desenvolvimento local
 * 
 * Mudanças v1.0.17:
 * - Revertida URL da API WhatsApp para usar whatsapp-api-new-54aw.onrender.com/send
 * 
 * Mudanças v1.0.16:
 * - Alterada porta do VeloChat Server de 3001 para 3002 em desenvolvimento local
 * 
 * Mudanças v1.0.15:
 * - Atualizada URL da API WhatsApp para usar nova API no backend GCP
 *   - Local: http://localhost:3001/api/whatsapp/send
 *   - Produção: https://backend-gcp-278491073220.us-east1.run.app/api/whatsapp/send
 * 
 * Mudanças v1.0.14:
 * - Corrigida URL da API WhatsApp para usar whatsapp-api-new-54aw.onrender.com (mesma do UPDATE PAINEL que funciona)
 * 
 * Mudanças v1.0.13:
 * - Mantida porta 8090 para desenvolvimento local (backend local)
 * - Porta 8080 é apenas para Cloud Run em produção
 * 
 * Mudanças v1.0.12:
 * - Removidos logs de debug que tentavam conectar em 127.0.0.1:7244 (causavam ERR_CONNECTION_REFUSED)
 */

/**
 * Obtém a URL base da API automaticamente baseada no ambiente
 * VERSION: v1.0.11 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * @returns {string} URL base da API (já inclui /api no final)
 */
export const getApiBaseUrl = () => {
  // Prioridade 1: Se há uma variável de ambiente definida, usar ela
  if (process.env.REACT_APP_API_URL) {
    // Garantir que termina com /api se não terminar
    const url = process.env.REACT_APP_API_URL.trim();
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  
  // Prioridade 2: Detecta automaticamente a URL baseada no domínio atual
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    // Se estamos em localhost, usar o backend local na porta 8090
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:8090/api';
    }
    
    // Se estamos no Cloud Run diretamente (staging ou produção), usar o mesmo domínio
    if (currentHost.includes('run.app')) {
      return `https://${currentHost}/api`;
    }
    
    // Se estamos em produção (domínio velotax.com.br ou velohub.velotax.com.br)
    // usar o backend do Cloud Run apropriado
    if (currentHost.includes('velotax.com.br') || currentHost.includes('velohub')) {
      // Detectar se é staging pelo hostname
      if (currentHost.includes('staging')) {
        return 'https://velohub-main-staging-278491073220.us-east1.run.app/api';
      }
      return 'https://velohub-278491073220.us-east1.run.app/api';
    }
    
    // Fallback para URL padrão online (produção)
    return 'https://velohub-278491073220.us-east1.run.app/api';
  }
  
  // Fallback para server-side rendering - sempre URL de produção
  return 'https://velohub-278491073220.us-east1.run.app/api';
};

/**
 * Obtém a URL da API do WhatsApp baseada no ambiente
 * VERSION: v1.0.20 | DATE: 2025-02-26 | AUTHOR: VeloHub Development Team
 * @returns {string} URL base da API do WhatsApp (sem /send no final)
 * 
 * API WhatsApp:
 * - Local: http://localhost:3001
 * - Produção: https://carmina-peskier-balletically.ngrok-free.dev
 */
export const getWhatsAppApiUrl = () => {
  // Prioridade 1: Variável de ambiente específica para WhatsApp
  if (process.env.REACT_APP_WHATSAPP_API_URL) {
    return process.env.REACT_APP_WHATSAPP_API_URL.trim();
  }
  
  // Prioridade 2: Detectar ambiente
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // Em produção (domínio velotax.com.br ou velohub), usar API ngrok
    if (currentHost.includes('velotax.com.br') || currentHost.includes('velohub')) {
      return 'https://carmina-peskier-balletically.ngrok-free.dev';
    }
    
    // Em desenvolvimento (localhost), usar localhost:3001
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  
  // Fallback: usar ngrok em produção
  return 'https://carmina-peskier-balletically.ngrok-free.dev';
};

/**
 * Obtém o endpoint completo da API do WhatsApp baseado no ambiente
 * VERSION: v1.0.21 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.0.21:
 * - CORREÇÃO CORS: Frontend agora usa proxy do backend (/api/whatsapp/send) ao invés de chamar ngrok diretamente
 * - Backend faz proxy para ngrok, resolvendo problemas de CORS
 * 
 * Endpoints:
 * - Frontend sempre usa: /api/whatsapp/send (proxy do backend)
 * - Backend faz proxy para:
 *   - Local (localhost:3001): http://localhost:3001/api/whatsapp/send
 *   - Produção (ngrok): https://carmina-peskier-balletically.ngrok-free.dev/send
 */
export const getWhatsAppEndpoint = () => {
  // SEMPRE usar proxy do backend para evitar problemas de CORS
  const backendApiUrl = getApiBaseUrl().replace('/api', ''); // Remover /api para adicionar /api/whatsapp/send
  return `${backendApiUrl}/api/whatsapp/send`;
};

/**
 * Obtém o JID padrão do WhatsApp baseado no ambiente
 * VERSION: v1.0.10 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * @returns {string} JID padrão do grupo WhatsApp
 */
export const getWhatsAppDefaultJid = () => {
  // Prioridade 1: Variável de ambiente
  if (process.env.REACT_APP_WHATSAPP_DEFAULT_JID) {
    return process.env.REACT_APP_WHATSAPP_DEFAULT_JID.trim();
  }
  
  // Fallback: JID padrão do grupo
  return '120363400851545835@g.us';
};

/**
 * URL base da API (calculada automaticamente)
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * URL da API do WhatsApp (calculada automaticamente)
 */
export const WHATSAPP_API_URL = getWhatsAppApiUrl();

/**
 * Endpoint completo da API do WhatsApp (calculado automaticamente)
 */
export const WHATSAPP_ENDPOINT = getWhatsAppEndpoint();

/**
 * JID padrão do WhatsApp (calculado automaticamente)
 */
export const WHATSAPP_DEFAULT_JID = getWhatsAppDefaultJid();

/**
 * Obtém a URL base da API do VeloChat automaticamente baseada no ambiente
 * VERSION: v1.0.2 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * IMPORTANTE: VeloChat Server é um projeto separado com deploy próprio
 * - Produção: https://velochat-server-278491073220.us-east1.run.app
 * - Staging: https://velochat-server-278491073220.us-east1.run.app (mesmo servidor)
 * - Local: http://localhost:3002 (porta padrão do VeloChat Server em desenvolvimento)
 * 
 * @returns {string} URL base da API do VeloChat Server (sem /api no final)
 */
export const getVeloChatApiUrl = () => {
  // Prioridade 1: Se há uma variável de ambiente definida, usar ela
  if (process.env.REACT_APP_VELOCHAT_API_URL) {
    const url = process.env.REACT_APP_VELOCHAT_API_URL.trim();
    return url;
  }
  
  // Prioridade 2: Detecta automaticamente a URL baseada no ambiente do VeloHub
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // Se estamos em localhost, usar o VeloChat Server local na porta 3002
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:3002';
    }
    
    // Se estamos em staging ou produção do VeloHub, usar o VeloChat Server de produção
    // O VeloChat Server tem deploy único que serve ambos os ambientes
    if (currentHost.includes('run.app') || currentHost.includes('velotax.com.br') || currentHost.includes('velohub')) {
      return 'https://velochat-server-278491073220.us-east1.run.app';
    }
    
    // Fallback para URL padrão do VeloChat Server (produção)
    return 'https://velochat-server-278491073220.us-east1.run.app';
  }
  
  // Fallback para server-side rendering - sempre URL do VeloChat Server de produção
  return 'https://velochat-server-278491073220.us-east1.run.app';
};

/**
 * Obtém a URL do WebSocket do VeloChat automaticamente baseada no ambiente
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * @returns {string} URL do WebSocket do VeloChat
 */
export const getVeloChatWsUrl = () => {
  // Prioridade 1: Se há uma variável de ambiente definida, usar ela
  if (process.env.REACT_APP_VELOCHAT_WS_URL) {
    return process.env.REACT_APP_VELOCHAT_WS_URL.trim();
  }
  
  // Prioridade 2: Usar a mesma URL da API (mesmo servidor)
  return getVeloChatApiUrl();
};

/**
 * Log da configuração da API (apenas em desenvolvimento)
 */
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Config:', {
    baseUrl: API_BASE_URL,
    velochatApiUrl: getVeloChatApiUrl(),
    velochatWsUrl: getVeloChatWsUrl(),
    environment: process.env.NODE_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
    reactAppApiUrl: process.env.REACT_APP_API_URL,
    reactAppVeloChatApiUrl: process.env.REACT_APP_VELOCHAT_API_URL,
    nodeEnv: process.env.NODE_ENV
  });
}

// Log sempre (para debug do problema)
console.log('🔧 API Config (SEMPRE):', {
  baseUrl: API_BASE_URL,
  whatsappApiUrl: WHATSAPP_API_URL,
  whatsappEndpoint: WHATSAPP_ENDPOINT,
  velochatApiUrl: getVeloChatApiUrl(),
  velochatWsUrl: getVeloChatWsUrl(),
  environment: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  reactAppApiUrl: process.env.REACT_APP_API_URL,
  reactAppWhatsappApiUrl: process.env.REACT_APP_WHATSAPP_API_URL,
  reactAppVeloChatApiUrl: process.env.REACT_APP_VELOCHAT_API_URL,
  detectedEnv: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'DEV' 
        : 'PROD')
    : 'server-side'
});

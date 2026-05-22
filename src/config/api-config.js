/**
 * VeloHub V3 - API Configuration
 * VERSION: v1.0.25 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * REGRA: Frontend porta 8080 | Backend porta 8090 | VeloChat Server porta 8091 na rede local
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.23: Removidas funções e exports relacionados a WhatsApp (integração descontinuada; sem env REACT_APP_WHATSAPP_*)
 * - v1.0.22: Atualizado: agora sempre usa ngrok (removido Skynet)
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
 * URL base da API (calculada automaticamente)
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Obtém a URL base da API do VeloChat automaticamente baseada no ambiente
 * VERSION: v1.0.3 | DATE: 2026-04-20 | AUTHOR: VeloHub Development Team
 * 
 * IMPORTANTE: VeloChat Server é um projeto separado com deploy próprio
 * - Produção: https://velochat-server-278491073220.us-east1.run.app
 * - Staging: https://velochat-server-278491073220.us-east1.run.app (mesmo servidor)
 * - Local: http://localhost:8091 (porta padrão do VeloChat Server em desenvolvimento; front em 8080)
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
    
    // Se estamos em localhost, usar o VeloChat Server local na porta 8091 (front 8080)
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:8091';
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
  velochatApiUrl: getVeloChatApiUrl(),
  velochatWsUrl: getVeloChatWsUrl(),
  environment: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  reactAppApiUrl: process.env.REACT_APP_API_URL,
  reactAppVeloChatApiUrl: process.env.REACT_APP_VELOCHAT_API_URL,
  detectedEnv: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'DEV' 
        : 'PROD')
    : 'server-side'
});

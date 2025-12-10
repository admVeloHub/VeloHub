/**
 * VeloHub V3 - API Configuration
 * VERSION: v1.0.10 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * REGRA: Frontend porta 8080 | Backend porta 8090 na rede local
 */

/**
 * Obtém a URL base da API automaticamente baseada no ambiente
 * VERSION: v1.0.10 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
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
    
    // Se estamos no Cloud Run diretamente, usar o mesmo domínio
    if (currentHost.includes('run.app')) {
      return `https://${currentHost}/api`;
    }
    
    // Se estamos em produção (domínio velotax.com.br ou velohub.velotax.com.br)
    // usar o backend do Cloud Run (não o mesmo domínio do frontend)
    if (currentHost.includes('velotax.com.br') || currentHost.includes('velohub')) {
      return 'https://velohub-278491073220.us-east1.run.app/api';
    }
    
    // Fallback para URL padrão online
    return 'https://velohub-278491073220.us-east1.run.app/api';
  }
  
  // Fallback para server-side rendering - sempre URL online
  return 'https://velohub-278491073220.us-east1.run.app/api';
};

/**
 * Obtém a URL da API do WhatsApp baseada no ambiente
 * VERSION: v1.0.10 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * @returns {string} URL base da API do WhatsApp (sem /send no final)
 */
export const getWhatsAppApiUrl = () => {
  // Prioridade 1: Variável de ambiente específica para WhatsApp
  if (process.env.REACT_APP_WHATSAPP_API_URL) {
    return process.env.REACT_APP_WHATSAPP_API_URL.trim();
  }
  
  // Prioridade 2: Detectar ambiente
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // Em produção (domínio velotax.com.br ou velohub), usar API do Render
    if (currentHost.includes('velotax.com.br') || currentHost.includes('velohub')) {
      return 'https://whatsapp-api-y40p.onrender.com';
    }
    
    // Em desenvolvimento (localhost), usar Render também
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'https://whatsapp-api-y40p.onrender.com';
    }
  }
  
  // Fallback: sempre usar Render
  return 'https://whatsapp-api-y40p.onrender.com';
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
 * JID padrão do WhatsApp (calculado automaticamente)
 */
export const WHATSAPP_DEFAULT_JID = getWhatsAppDefaultJid();

/**
 * Log da configuração da API (apenas em desenvolvimento)
 */
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Config:', {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
    reactAppApiUrl: process.env.REACT_APP_API_URL,
    nodeEnv: process.env.NODE_ENV
  });
}

// Log sempre (para debug do problema)
console.log('🔧 API Config (SEMPRE):', {
  baseUrl: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  reactAppApiUrl: process.env.REACT_APP_API_URL,
  detectedEnv: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'DEV' 
        : 'PROD')
    : 'server-side'
});

/**
 * VeloHub V3 - API Configuration
 * VERSION: v1.0.3 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
 */

/**
 * Obtém a URL base da API automaticamente baseada no ambiente
 * VERSION: v1.0.3 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
 * @returns {string} URL base da API
 */
export const getApiBaseUrl = () => {
  // Se há uma variável de ambiente definida, usar ela
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // SEMPRE usar a URL online, mesmo em desenvolvimento
  // Detecta automaticamente a URL baseada no domínio atual
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // Se estamos no Cloud Run, usar o mesmo domínio
    if (currentHost.includes('run.app')) {
      return `https://${currentHost}/api`;
    }
    
    // Fallback para URL padrão online
    return 'https://velohub-278491073220.us-east1.run.app/api';
  }
  
  // Fallback para server-side rendering - sempre URL online
  return 'https://velohub-278491073220.us-east1.run.app/api';
};

/**
 * URL base da API (calculada automaticamente)
 */
export const API_BASE_URL = getApiBaseUrl();

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
  reactAppApiUrl: process.env.REACT_APP_API_URL
});

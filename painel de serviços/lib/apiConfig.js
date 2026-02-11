/**
 * VeloHub - API Configuration
 * VERSION: v1.0.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
 * 
 * Gestão centralizada de URL da API WhatsApp
 * 
 * Funções:
 * - getApiUrl(): Retorna URL da API com fallback e normalização
 * - DEFAULT_API_URL: URL padrão da API WhatsApp
 */

export const DEFAULT_API_URL = 'https://whatsapp-api-new-54aw.onrender.com';

/**
 * Obtém a URL da API WhatsApp
 * - Usa NEXT_PUBLIC_API_URL se configurado
 * - Fallback para DEFAULT_API_URL
 * - Remove trailing slash automaticamente
 * 
 * @returns {string} URL da API sem trailing slash
 */
export function getApiUrl() {
  const url = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  return url;
}

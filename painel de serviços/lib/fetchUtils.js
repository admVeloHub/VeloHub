/**
 * VeloHub - Fetch Utilities
 * VERSION: v1.0.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
 * 
 * Utilitários para requisições HTTP com timeout
 * 
 * Funções:
 * - fetchWithTimeout(): Fetch com timeout configurável usando AbortController
 */

/**
 * Executa fetch com timeout configurável
 * 
 * @param {string} url - URL para requisição
 * @param {Object} options - Opções do fetch (headers, method, body, etc.)
 * @param {number} ms - Timeout em milissegundos (padrão: 20000 = 20s)
 * @returns {Promise<Response>} Promise que resolve com Response ou rejeita com AbortError
 * 
 * @example
 * // Timeout padrão (20s)
 * const response = await fetchWithTimeout('/api/data');
 * 
 * // Timeout customizado (15s)
 * const response = await fetchWithTimeout('/api/data', {}, 15000);
 * 
 * // Com opções completas
 * const response = await fetchWithTimeout('/api/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ data: 'value' })
 * }, 20000);
 */
export function fetchWithTimeout(url, options = {}, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(t));
}

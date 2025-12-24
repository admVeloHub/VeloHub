/**
 * VeloHub V3 - API Service
 * VERSION: v1.1.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.1.0:
 * - getRecent agora passa limit como query parameter ao backend
 * - Removida ordenação e limitação no cliente (backend já faz isso)
 */

import { API_BASE_URL } from '../config/api-config';

// Função genérica para fazer requisições
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro na requisição');
    }
    
    return data;
  } catch (error) {
    console.error(`Erro na API ${endpoint}:`, error);
    // Se for erro de rede, retornar dados vazios em vez de quebrar
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('API não disponível, retornando dados vazios');
      return { data: [] };
    }
    throw error;
  }
}

// API principal - busca todos os dados de uma vez
export const mainAPI = {
  // Buscar todos os dados
  getAllData: () => apiRequest('/data'),
};

// API para VeloNews (mantida para compatibilidade)
export const veloNewsAPI = {
  // Buscar todas as notícias
  getAll: () => apiRequest('/velo-news'),
  
  // Buscar notícias recentes (limitadas por quantidade)
  // O backend já faz a ordenação e limitação, então apenas passamos o limit como query parameter
  getRecent: (limit = 4) => {
    console.log('🔍 [veloNewsAPI.getRecent] Iniciando busca com limit:', limit);
    return apiRequest(`/velo-news?limit=${limit}`).then(data => {
      // Backend já retorna as notícias ordenadas e limitadas
      const news = data?.data || [];
      console.log('🔍 [veloNewsAPI.getRecent] Notícias recebidas do backend:', news.length);
      
      return { data: news };
    }).catch(error => {
      console.error('❌ [veloNewsAPI.getRecent] Erro ao buscar notícias:', error);
      return { data: [] };
    });
  },
  
  // Buscar notícias críticas
  getCritical: () => apiRequest('/velo-news').then(data => 
    data.data.filter(news => news.is_critical)
  ),
};

// API para Artigos (mantida para compatibilidade)
export const articlesAPI = {
  // Buscar todos os artigos
  getAll: () => apiRequest('/articles'),
  
  // Buscar artigo por ID
  getById: (id) => apiRequest(`/articles/${id}`),
};

// API para FAQ (mantida para compatibilidade)
export const faqAPI = {
  // Buscar todas as perguntas frequentes
  getAll: () => apiRequest('/faq'),
};

// API de teste
export const testAPI = {
  // Testar conexão
  testConnection: () => apiRequest('/test'),
};

export default {
  main: mainAPI,
  veloNews: veloNewsAPI,
  articles: articlesAPI,
  faq: faqAPI,
  test: testAPI,
};

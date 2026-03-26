/**
 * VeloHub V3 - API Service
 * VERSION: v1.4.0 | DATE: 2026-03-26 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.4.0:
 * - articlesAPI.getCategories: GET /articles/categories (ordem oficial a partir de artigos_categorias)
 * 
 * Mudanças v1.3.0:
 * - Melhorado tratamento de erros em apiRequest para operações de escrita (PUT/POST/DELETE)
 * - Adicionada validação de Content-Type antes de fazer parse JSON
 * - Operações de escrita agora sempre lançam erro ao invés de retornar dados vazios
 * 
 * Mudanças v1.2.0:
 * - Adicionada função addComment para adicionar comentários ao thread do Velonews
 * 
 * Mudanças v1.1.0:
 * - getRecent agora passa limit como query parameter ao backend
 * - Removida ordenação e limitação no cliente (backend já faz isso)
 */

import { API_BASE_URL } from '../config/api-config';

// Função genérica para fazer requisições
async function apiRequest(endpoint, options = {}) {
  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Resposta inválida do servidor: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Erro na API ${endpoint}:`, error);
    
    // Para operações de escrita (POST, PUT, DELETE), sempre lançar erro
    const isWriteOperation = options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase());
    
    if (isWriteOperation) {
      throw error;
    }
    
    // Se for erro de rede em operação de leitura, retornar dados vazios
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
  
  // Adicionar comentário ao thread de uma notícia
  addComment: async (newsId, userName, comentario) => {
    try {
      const response = await apiRequest(`/velo-news/${newsId}/comment`, {
        method: 'PUT',
        body: JSON.stringify({
          userName,
          comentario
        })
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw new Error(error.message || 'Erro ao adicionar comentário. Verifique se o servidor está rodando.');
    }
  },
};

// API para Artigos (mantida para compatibilidade)
export const articlesAPI = {
  // Buscar todos os artigos
  getAll: () => apiRequest('/articles'),

  /** Categorias ordenadas (collection artigos_categorias) */
  getCategories: () => apiRequest('/articles/categories'),
  
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

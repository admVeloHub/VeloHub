// Configuração da API - funciona tanto local quanto remoto
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://velohub-backend.vercel.app/api' : 'http://localhost:5000/api');

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

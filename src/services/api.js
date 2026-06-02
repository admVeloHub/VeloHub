/**
 * VeloHub V3 - API Service
 * VERSION: v1.7.3 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.7.3: homeAvisosAPI feed hub_avisos; homeDestaquesAPI só carrossel
 * - v1.7.1: corporateAPI — etica-conduta (corpo_etica&conduta + acknowledgment)
 * - v1.7.0: corporateAPI — Políticas, LGPD, Termos e compliance/pending
 * - v1.6.1: denunciasAPI — modo anônimo não envia x-user-email
 * - v1.6.0: googleCalendarAPI — OAuth pessoal + eventos da Home
 * - v1.5.5: hubDocumentosAPI — GET /hub-documentos (aba Documentos / Conhecimento)
 * - v1.5.4: apiRequest — merge de headers sem sobrescrever Content-Type (POST com x-user-email)
 * - v1.5.3: denunciasAPI — POST /portal/denuncias (canal denúncias)
 * - v1.5.2: homeDestaquesAPI — carrossel e feed da nova Home
 * - v1.4.0: articlesAPI.getCategories: GET /articles/categories (ordem oficial a partir de artigos_categorias)
 * - v1.3.0: Melhorado tratamento de erros em apiRequest para operações de escrita (PUT/POST/DELETE)
 */

import { API_BASE_URL } from '../config/api-config';

// Função genérica para fazer requisições
async function apiRequest(endpoint, options = {}) {
  const { headers: optionHeaders, ...restOptions } = options;
  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(optionHeaders || {}),
      },
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
      const err = new Error(data.message || data.error || `Erro ${response.status}: ${response.statusText}`);
      err.status = response.status;
      err.data = data;
      throw err;
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

/** Conhecimento — aba Documentos: console_conteudo.hub_documentos */
export const hubDocumentosAPI = {
  getAll: () => apiRequest('/hub-documentos'),
  getCategories: () => apiRequest('/hub-documentos/categories'),
};

/** Conhecimento — aba Tutoriais: vídeos da playlist YouTube (backend chama Data API v3) */
export const tutorialsAPI = {
  getPlaylistVideos: () => apiRequest('/tutorials'),
};

// API para FAQ (mantida para compatibilidade)
export const faqAPI = {
  // Buscar todas as perguntas frequentes
  getAll: () => apiRequest('/faq'),
};

// API Home — Destaques (somente carrossel banner)
export const homeDestaquesAPI = {
  getCarousel: () => apiRequest('/home/destaques/carousel'),
};

export const homeAvisosAPI = {
  getRecent: (limit = 4) =>
    apiRequest(`/home/avisos/feed?limit=${limit}`).then((data) => ({
      data: data?.data || [],
      pagination: data?.pagination,
    })),
  getFeed: (limit, skip = 0) =>
    apiRequest(`/home/avisos/feed?limit=${limit}&skip=${skip}`),
  getAll: () => apiRequest('/home/avisos/feed'),
};

/** Fonte da agenda na Home: mongodb (Google Calendar temporariamente desabilitado na Home) */
export const HOME_AGENDA_SOURCE = 'mongodb';

export const homeAgendaAPI = {
  getEventos: (limit = 4) => apiRequest(`/home/agenda/eventos?limit=${limit}`),
};

function headersSessaoVelohub() {
  let userEmail = '';
  try {
    const sessionData =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('velohub_user_session') ||
          localStorage.getItem('veloacademy_user_session') ||
          localStorage.getItem('user_session')
        : null;
    if (sessionData) {
      const session = JSON.parse(sessionData);
      userEmail = session?.user?.email || session?.email || '';
    }
  } catch {
    /* ignore */
  }
  const h = {};
  if (userEmail) h['x-user-email'] = userEmail;
  return h;
}

function headersSessaoDenuncias(modoComunicacao) {
  const modo = modoComunicacao != null ? String(modoComunicacao).trim().toLowerCase() : '';
  if (modo === 'anonimo') {
    return {};
  }
  return headersSessaoVelohub();
}

export const googleCalendarAPI = {
  getStatus: () =>
    apiRequest('/google-calendar/status', {
      headers: headersSessaoVelohub(),
    }),
  connect: (code) =>
    apiRequest('/google-calendar/connect', {
      method: 'POST',
      headers: headersSessaoVelohub(),
      body: JSON.stringify({ code }),
    }),
  disconnect: () =>
    apiRequest('/google-calendar/disconnect', {
      method: 'POST',
      headers: headersSessaoVelohub(),
    }),
  getEventos: (limit = 4) =>
    apiRequest(`/google-calendar/eventos?limit=${limit}`, {
      headers: headersSessaoVelohub(),
    }),
};

export const denunciasAPI = {
  submit: ({ modoComunicacao, mensagem }) =>
    apiRequest('/portal/denuncias', {
      method: 'POST',
      headers: headersSessaoDenuncias(modoComunicacao),
      body: JSON.stringify({ modoComunicacao, mensagem }),
    }),
};

/** Corporate — Ética e Conduta, LGPD, Termos e ciência obrigatória */
export const corporateAPI = {
  getEticaCondutaLatest: () => apiRequest('/corporate/etica-conduta/latest'),
  getEticaCondutaAcknowledgments: (userEmail) =>
    apiRequest(`/corporate/etica-conduta/acknowledgments/${encodeURIComponent(userEmail)}`),
  acknowledgeEticaConduta: (versaoId, userId, userName) =>
    apiRequest(`/corporate/etica-conduta/${versaoId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    }),
  /** @deprecated alias — use getEticaCondutaLatest */
  getPoliticasNormasLatest: () => apiRequest('/corporate/etica-conduta/latest'),
  getPoliticasNormasAcknowledgments: (userEmail) =>
    apiRequest(`/corporate/etica-conduta/acknowledgments/${encodeURIComponent(userEmail)}`),
  acknowledgePoliticasNormas: (versaoId, userId, userName) =>
    apiRequest(`/corporate/etica-conduta/${versaoId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    }),
  getLgpdLatest: () => apiRequest('/corporate/lgpd/latest'),
  getLgpdAcknowledgments: (userEmail) =>
    apiRequest(`/corporate/lgpd/acknowledgments/${encodeURIComponent(userEmail)}`),
  acknowledgeLgpd: (versaoId, userId, userName) =>
    apiRequest(`/corporate/lgpd/${versaoId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    }),
  getTermoUsuarioLatest: () => apiRequest('/corporate/termo-usuario/latest'),
  getTermoUsuarioAcknowledgments: (userEmail) =>
    apiRequest(`/corporate/termo-usuario/acknowledgments/${encodeURIComponent(userEmail)}`),
  acknowledgeTermoUsuario: (versaoId, userId, userName) =>
    apiRequest(`/corporate/termo-usuario/${versaoId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    }),
  getCompliancePending: (userEmail) =>
    apiRequest(`/corporate/compliance/pending?userEmail=${encodeURIComponent(userEmail)}`),
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
  tutorials: tutorialsAPI,
  faq: faqAPI,
  homeDestaques: homeDestaquesAPI,
  homeAvisos: homeAvisosAPI,
  homeAgenda: homeAgendaAPI,
  googleCalendar: googleCalendarAPI,
  denuncias: denunciasAPI,
  corporate: corporateAPI,
  test: testAPI,
};

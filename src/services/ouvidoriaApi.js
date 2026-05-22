/**
 * VeloHub V3 - Ouvidoria API Service
 * VERSION: v2.13.2 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 * v2.13.2: Removida instrumentação agent log (localhost:7635) em apiRequest
 *
 * Referência (detalhes no Git):
 * - v2.13.1: apiRequest/upload — await ensureSessionId antes do fetch (x-session-id obrigatório no backend ouvidoria)
 * - v2.13.0: reclamacoesAPI.gerarTicketOctadesk — POST /:id/gerar-ticket-octadesk
 * - v2.12.5: apiRequest usa `getUserSession()` de auth (chave SESSION_KEY VeloHub) — não priorizar veloacademy_user_session antes do hub (evita x-user-email/registro paralelo stale)
 * - v2.12.4: reclamacoesAPI.getByColaborador — `pagination.colaboradorEmail` opcional (query GET Minhas reclamações por dono da sessão) lê corpo como texto e aceita JSON ou mensagem útil quando Content-Type não é JSON (ex.: proxy/HTML em 500)
 * - v2.12.2: chargebackAPI.getProximoProtocoloSugerido (GET prévia protocolo CBK)
 * - v2.12.1: reclamacoesAPI.getByCpf / getByColaborador aceitam `{ page, limit }` opcional (lista paginada)
 * - v2.12.0: chargebackAPI.getById / chargebackAPI.update (GET/PUT `:id`); `_saveMode` no create
 * - v2.11.0: chargebackAPI (GET/POST `hub_ouvidoria.reclamacoes_chargeback` via `/ouvidoria/chargeback`)
 * - v2.8.0: reclamacoesAPI.getAll: parâmetro opcional produto (query)
 * - v2.7.0: reclamacoesAPI.remove: DELETE /ouvidoria/reclamacoes/:id?tipo=
 */

import { API_BASE_URL } from '../config/api-config';
import { getUserSession, ensureSessionId, isSessionValid } from './auth';

/**
 * Função genérica para fazer requisições
 * @param {string} endpoint - Endpoint da API
 * @param {object} options - Opções da requisição
 * @returns {Promise<any>} Resposta da API
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🔍 [ouvidoriaApi] Fazendo requisição para: ${url}`);
  
  // Mesma fonte da sessão que o restante do VeloHub (auth.js → SESSION_KEY)
  let userEmail = null;
  try {
    const session = getUserSession();
    userEmail =
      session && typeof session === 'object'
        ? session?.user?.email || session?.email || null
        : null;
    console.log(`🔍 [ouvidoriaApi] Email obtido da sessão: ${userEmail || 'não encontrado'}`);
    console.log(`🔍 [ouvidoriaApi] Estrutura da sessão:`, {
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      sessionEmail: session?.email,
      sessionKeys: session && typeof session === 'object' ? Object.keys(session) : [],
    });
  } catch (error) {
    console.error('❌ [ouvidoriaApi] Erro ao obter email da sessão:', error);
  }
  
  const lsSessionIdBefore = localStorage.getItem('velohub_session_id');

  let sessionId = lsSessionIdBefore;
  if (!sessionId || !String(sessionId).trim()) {
    sessionId = await ensureSessionId();
  }
  console.log(`🔍 [ouvidoriaApi] SessionId: ${sessionId ? `${String(sessionId).substring(0, 8)}...` : 'não encontrado'}`);

  if (!sessionId) {
    const err = new Error('Sessão do servidor indisponível. Atualize a página ou faça login novamente.');
    err.code = 'SESSION_ID_MISSING';
    throw err;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Adicionar email e sessionId aos headers se disponíveis
    if (userEmail) {
      headers['x-user-email'] = userEmail;
      console.log(`✅ [ouvidoriaApi] Header x-user-email adicionado: ${userEmail}`);
    } else {
      console.warn(`⚠️ [ouvidoriaApi] Email não disponível - header x-user-email não será enviado`);
    }
    headers['x-session-id'] = sessionId;
    console.log(`✅ [ouvidoriaApi] Header x-session-id adicionado: ${String(sessionId).substring(0, 8)}...`);
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    // Verificar se a resposta é JSON antes de tentar parsear
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ [ouvidoriaApi] Resposta não é JSON. Status: ${response.status}, Content-Type: ${contentType}`);
      console.error(`❌ [ouvidoriaApi] Conteúdo recebido:`, text.substring(0, 200));
      throw new Error(`Resposta não é JSON. Status: ${response.status}. A rota pode não estar registrada no servidor.`);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erro na requisição');
    }
    
    return data;
  } catch (error) {
    console.error(`❌ [ouvidoriaApi] Erro na API ${endpoint}:`, error);
    console.error(`❌ [ouvidoriaApi] URL completa: ${url}`);
    throw error;
  }
}

/**
 * API para Reclamações
 */
export const reclamacoesAPI = {
  /**
   * Buscar todas as reclamações
   * @param {Object} params - Parâmetros opcionais (page, limit, tipo)
   * @returns {Promise<Object>} Objeto com data, count, total, page, limit, totalPages
   */
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.tipo) query.append('tipo', params.tipo);
    if (params.dataInicio) query.append('dataInicio', params.dataInicio);
    if (params.dataFim) query.append('dataFim', params.dataFim);
    if (params.motivo) query.append('motivo', params.motivo);
    if (params.produto) query.append('produto', params.produto);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString();
    return apiRequest(`/ouvidoria/reclamacoes${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Buscar reclamação por ID
   * @param {string} id - ID da reclamação
   * @param {string} tipo - Tipo da reclamação (BACEN, OUVIDORIA) - opcional, busca em todas se não informado
   * @returns {Promise<Object>} Reclamação
   */
  getById: (id, tipo = null) => {
    const url = tipo 
      ? `/ouvidoria/reclamacoes/${id}?tipo=${tipo}`
      : `/ouvidoria/reclamacoes/${id}`;
    return apiRequest(url);
  },

  /**
   * Criar nova reclamação
   * @param {Object} data - Dados da reclamação (deve incluir campo 'tipo')
   * @returns {Promise<Object>} Reclamação criada
   */
  create: (data) => apiRequest('/ouvidoria/reclamacoes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Criar ticket Octadesk e persistir ticketRegistro na reclamação.
   * @param {string} id - ID MongoDB
   * @param {string} tipo - Tipo da ocorrência (query)
   * @returns {Promise<Object>}
   */
  gerarTicketOctadesk: (id, tipo) => {
    const tid = String(id || '').trim();
    const ttipo = String(tipo || '').trim();
    if (!tid || !ttipo) {
      return Promise.reject(new Error('ID e tipo são obrigatórios para gerar ticket'));
    }
    return apiRequest(
      `/ouvidoria/reclamacoes/${encodeURIComponent(tid)}/gerar-ticket-octadesk?tipo=${encodeURIComponent(ttipo)}`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  },

  /**
   * Atualizar reclamação
   * @param {string} id - ID da reclamação
   * @param {Object} data - Dados atualizados (deve incluir campo 'tipo' ou passar como query param)
   * @param {string} tipo - Tipo da reclamação (BACEN, OUVIDORIA) - opcional se estiver em data.tipo
   * @returns {Promise<Object>} Reclamação atualizada
   */
  update: (id, data, tipo = null) => {
    const tipoParam = tipo || data.tipo;
    const url = tipoParam 
      ? `/ouvidoria/reclamacoes/${id}?tipo=${encodeURIComponent(tipoParam)}`
      : `/ouvidoria/reclamacoes/${id}`;
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Excluir reclamação permanentemente
   * @param {string} id - ID MongoDB
   * @param {string} tipo - Tipo (ex.: BACEN, N2 Pix, Reclame Aqui) — define a coleção
   */
  remove: (id, tipo) => {
    const tid = String(id || '').trim();
    const ttipo = String(tipo || '').trim();
    if (!tid || !ttipo) {
      return Promise.reject(new Error('ID e tipo são obrigatórios para excluir'));
    }
    const url = `/ouvidoria/reclamacoes/${encodeURIComponent(tid)}?tipo=${encodeURIComponent(ttipo)}`;
    return apiRequest(url, { method: 'DELETE' });
  },

  /**
   * Buscar reclamações por CPF
   * @param {string} cpf - CPF para buscar
   * @returns {Promise<Array>} Lista de reclamações
   */
  getByCpf: (cpf, pagination = {}) => {
    const q = new URLSearchParams();
    q.set('cpf', String(cpf || '').replace(/\D/g, ''));
    if (pagination.page != null && String(pagination.page).trim() !== '') {
      q.set('page', String(pagination.page));
    }
    if (pagination.limit != null && String(pagination.limit).trim() !== '') {
      q.set('limit', String(pagination.limit));
    }
    return apiRequest(`/ouvidoria/reclamacoes?${q.toString()}`);
  },

  /**
   * Confirmar fusão entre duas ocorrências (mesmo CPF)
   * @param {object} body - { cpf, currentId, currentTipo, targetId, targetTipo, cenario, redundantePapel? }
   */
  confirmFusao: (body) =>
    apiRequest('/ouvidoria/reclamacoes/fusao', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * Buscar reclamações por colaborador
   * @param {string} colaboradorNome - Nome do colaborador
   * @param {{ page?: number|string, limit?: number|string, colaboradorEmail?: string }} pagination
   * @returns {Promise<Array>} Lista de reclamações
   */
  getByColaborador: (colaboradorNome, pagination = {}) => {
    const q = new URLSearchParams();
    const nome = String(colaboradorNome || '').trim();
    if (nome) {
      q.set('colaboradorNome', nome);
    }
    const emailLc =
      pagination.colaboradorEmail != null
        ? String(pagination.colaboradorEmail || '').trim().toLowerCase()
        : '';
    if (emailLc) {
      q.set('colaboradorEmail', emailLc);
    }
    if (pagination.page != null && String(pagination.page).trim() !== '') {
      q.set('page', String(pagination.page));
    }
    if (pagination.limit != null && String(pagination.limit).trim() !== '') {
      q.set('limit', String(pagination.limit));
    }
    return apiRequest(`/ouvidoria/reclamacoes?${q.toString()}`);
  },

  /**
   * Prévia read-only do próximo número de protocolo (não consome sequência).
   * @param {string} tipo — ex.: BACEN, OUVIDORIA, RECLAME_AQUI
   */
  getProximoNumeroProtocoloSugerido: (tipo) => {
    const t = encodeURIComponent(String(tipo || '').trim());
    return apiRequest(`/ouvidoria/reclamacoes/proximo-numero-protocolo-sugerido?tipo=${t}`);
  },

};

/**
 * API para Colaboradores
 */
export const colaboradoresAPI = {
  /**
   * Buscar lista de colaboradores com acesso à ouvidoria
   * @returns {Promise<Array>} Lista de colaboradores
   */
  getColaboradores: () => apiRequest('/ouvidoria/colaboradores'),
};

/**
 * API para Dashboard
 */
export const dashboardAPI = {
  /**
   * Buscar estatísticas gerais
   * @param {Object} filtros - Filtros opcionais (dataInicio, dataFim, produtos)
   * @returns {Promise<Object>} Estatísticas
   */
  getStats: (filtros = {}) => {
    const query = new URLSearchParams();
    if (filtros.dataInicio) query.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) query.append('dataFim', filtros.dataFim);
    if (filtros.produtos && Array.isArray(filtros.produtos)) {
      filtros.produtos.forEach(p => { if (p) query.append('produtos', p); });
    }
    if (filtros.motivos && Array.isArray(filtros.motivos)) {
      filtros.motivos.forEach(m => { if (m) query.append('motivos', m); });
    }
    const queryString = query.toString();
    return apiRequest(`/ouvidoria/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Buscar métricas específicas
   * @param {Object} filtros - Filtros opcionais (dataInicio, dataFim, produtos, motivos)
   * @returns {Promise<Object>} Métricas
   */
  getMetricas: (filtros = {}) => {
    const query = new URLSearchParams();
    if (filtros.dataInicio) query.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) query.append('dataFim', filtros.dataFim);
    if (filtros.produtos && Array.isArray(filtros.produtos)) {
      filtros.produtos.forEach(p => { if (p) query.append('produtos', p); });
    }
    if (filtros.motivos && Array.isArray(filtros.motivos)) {
      filtros.motivos.forEach(m => { if (m) query.append('motivos', m); });
    }
    const queryString = query.toString();
    return apiRequest(`/ouvidoria/dashboard/metricas${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * API para Clientes
 */
export const clientesAPI = {
  /**
   * Buscar histórico do cliente por CPF
   * @param {string} cpf - CPF do cliente
   * @returns {Promise<Array>} Histórico de reclamações
   */
  getHistorico: (cpf) => apiRequest(`/ouvidoria/clientes/${cpf}/historico`),
};

/**
 * API para Relatórios
 */
export const relatoriosAPI = {
  /**
   * Gerar relatório
   * @param {Object} params - Parâmetros do relatório (período, filtros, etc)
   * @returns {Promise<Object>} Dados do relatório
   */
  gerar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/ouvidoria/relatorios${query ? `?${query}` : ''}`);
  },

  /**
   * Gerar relatório detalhado com agregações por mês
   * @param {Object} params - Parâmetros do relatório (dataInicio, dataFim, tipo)
   * @returns {Promise<Object>} Dados detalhados para gráficos e tabelas
   */
  detalhado: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/ouvidoria/relatorios/detalhado${query ? `?${query}` : ''}`);
  },

  /**
   * Gerar relatório diário com agregações por dia
   * @param {Object} params - Parâmetros do relatório (dataInicio, dataFim, tipo)
   * @returns {Promise<Object>} Dados diários para tabelas
   */
  diario: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/ouvidoria/relatorios/diario${query ? `?${query}` : ''}`);
  },
};

/**
 * API Chargeback — coleção `reclamacoes_chargeback` (DB hub_ouvidoria)
 */
export const chargebackAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/ouvidoria/chargeback${query ? `?${query}` : ''}`);
  },
  /** Próximo número CBK sugerido (read-only; mesma regra do servidor na criação). */
  getProximoProtocoloSugerido: () => apiRequest('/ouvidoria/chargeback/proximo-protocolo-sugerido'),
  getById: (id) => apiRequest(`/ouvidoria/chargeback/${encodeURIComponent(id)}`),
  create: (body) =>
    apiRequest('/ouvidoria/chargeback', {
      method: 'POST',
      body: JSON.stringify(body && typeof body === 'object' ? body : {}),
    }),
  update: (id, body) =>
    apiRequest(`/ouvidoria/chargeback/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body && typeof body === 'object' ? body : {}),
    }),
};

/**
 * API para Anexos
 */
export const anexosAPI = {
  /**
   * Upload de anexo
   * @param {File} file - Arquivo a ser enviado
   * @param {string} tipo - Tipo de reclamação (BACEN, OUVIDORIA)
   * @returns {Promise<Object>} URL do arquivo enviado
   */
  upload: async (file, tipo = 'BACEN') => {
    const url = `${API_BASE_URL}/ouvidoria/anexos/upload`;
    
    // Obter email da sessão
    let userEmail = null;
    try {
      const sessionData = 
        localStorage.getItem('veloacademy_user_session') ||
        localStorage.getItem('velohub_user_session') ||
        localStorage.getItem('user_session');
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        userEmail = session?.user?.email || session?.email;
      }
    } catch (error) {
      console.error('Erro ao obter email da sessão:', error);
    }
    
    let sessionId = localStorage.getItem('velohub_session_id');
    if (!sessionId || !String(sessionId).trim()) {
      sessionId = await ensureSessionId();
    }
    if (!sessionId) {
      throw new Error('Sessão do servidor indisponível. Atualize a página ou faça login novamente.');
    }

    const formData = new FormData();
    formData.append('anexo', file);
    formData.append('tipo', tipo);
    if (userEmail) {
      formData.append('userEmail', userEmail);
    }
    
    const headers = {};
    if (userEmail) {
      headers['x-user-email'] = userEmail;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const rawText = await response.text();
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      /** @type {{ success?: boolean; url?: string; message?: string; error?: string; details?: string }} */
      let data = {};

      if (ct.includes('application/json')) {
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          data = {
            success: false,
            error:
              rawText.trim().slice(0, 400) ||
              `Resposta JSON inválida (HTTP ${response.status})`,
          };
        }
      } else {
        data = {
          success: false,
          error:
            rawText.trim().slice(0, 400) ||
            `Falha no upload (HTTP ${response.status}). Verifique o backend e credenciais do Google Cloud Storage.`,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            data.details ||
            `Erro no upload (HTTP ${response.status})`,
        );
      }

      return data;
    } catch (error) {
      console.error('❌ [anexosAPI] Erro no upload:', error);
      throw error;
    }
  },
};

export default {
  reclamacoes: reclamacoesAPI,
  dashboard: dashboardAPI,
  clientes: clientesAPI,
  relatorios: relatoriosAPI,
  chargeback: chargebackAPI,
  anexos: anexosAPI,
};

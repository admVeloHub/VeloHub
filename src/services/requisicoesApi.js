/**
 * VeloHub V3 — Serviço HTTP Requisições (rotas `/api/escalacoes/*`)
 * VERSION: v1.5.8 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.5.8: GET solicitações aceita paginação opcional (page/limit) em getAll e getByCpf
 * - v1.5.7: addReply passa a enviar x-user-email da sessão (paridade com gate backend para marcação de status em Dev)
 * - v1.5.6: Rename do ficheiro escalacoesApi.js → requisicoesApi.js; prefixos de log `[requisicoesApi]` (URLs inalteradas)
 * - v1.5.5: devMarcacaoChamarStatus — POST só dev local (sessão VeloHub + x-user-email)
 * - v1.5.4: Contrato POST .../reply: mensagens opcionais; primário é status (backend solicitações/erros-bugs)
 * - v1.5.0: apoioN1API: GET /escalacoes/apoio-n1/overview e /agentes (credencial Apoio N1; email em query + x-user-email)
 * - v1.4.2: errosBugsAPI.update(id, body) → PUT .../erros-bugs/:id (merge de payload no cliente)
 */

import { API_BASE_URL } from '../config/api-config';

/**
 * Função genérica para fazer requisições
 * @param {string} endpoint - Endpoint da API
 * @param {object} options - Opções da requisição
 * @returns {Promise<any>} Resposta da API
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🔍 [requisicoesApi] Fazendo requisição para: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Verificar se a resposta é JSON antes de tentar parsear
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ [requisicoesApi] Resposta não é JSON. Status: ${response.status}, Content-Type: ${contentType}`);
      console.error(`❌ [requisicoesApi] Conteúdo recebido:`, text.substring(0, 200));
      throw new Error(`Resposta não é JSON. Status: ${response.status}. A rota pode não estar registrada no servidor.`);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erro na requisição');
    }
    
    return data;
  } catch (error) {
    console.error(`❌ [requisicoesApi] Erro na API ${endpoint}:`, error);
    console.error(`❌ [requisicoesApi] URL completa: ${url}`);
    throw error;
  }
}

/**
 * Headers com e-mail/session VeloHub (mesmas chaves de sessão que ouvidoriaApi).
 * @returns {Record<string, string>}
 */
function headersSessaoVelohubPreferencia() {
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
  const sessionId =
    typeof localStorage !== 'undefined' ? localStorage.getItem('velohub_session_id') : '';

  const h = { 'Content-Type': 'application/json' };
  if (userEmail) h['x-user-email'] = userEmail;
  if (sessionId) h['x-session-id'] = sessionId;
  return h;
}

/**
 * API para Solicitações Técnicas
 */
export const solicitacoesAPI = {
  /**
   * Buscar todas as solicitações
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<Array>} Lista de solicitações
   */
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (Number.isFinite(params.page) && Number(params.page) > 0) {
      q.set('page', String(Math.trunc(Number(params.page))));
    }
    if (Number.isFinite(params.limit) && Number(params.limit) > 0) {
      q.set('limit', String(Math.trunc(Number(params.limit))));
    }
    const qs = q.toString();
    return apiRequest(`/escalacoes/solicitacoes${qs ? `?${qs}` : ''}`);
  },

  /**
   * Buscar solicitação por ID
   * @param {string} id - ID da solicitação
   * @returns {Promise<Object>} Solicitação
   */
  getById: (id) => apiRequest(`/escalacoes/solicitacoes/${id}`),

  /**
   * Criar nova solicitação
   * @param {Object} data - Dados da solicitação
   * @returns {Promise<Object>} Solicitação criada
   */
  create: (data) => apiRequest('/escalacoes/solicitacoes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Atualizar solicitação
   * @param {string} id - ID da solicitação
   * @param {Object} data - Dados atualizados
   * @returns {Promise<Object>} Solicitação atualizada
   */
  update: (id, data) => apiRequest(`/escalacoes/solicitacoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Buscar solicitações por CPF
   * @param {string} cpf - CPF para buscar
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<Array>} Lista de solicitações
   */
  getByCpf: (cpf, params = {}) => {
    const q = new URLSearchParams();
    q.set('cpf', String(cpf || ''));
    if (Number.isFinite(params.page) && Number(params.page) > 0) {
      q.set('page', String(Math.trunc(Number(params.page))));
    }
    if (Number.isFinite(params.limit) && Number(params.limit) > 0) {
      q.set('limit', String(Math.trunc(Number(params.limit))));
    }
    return apiRequest(`/escalacoes/solicitacoes?${q.toString()}`);
  },

  /**
   * Buscar solicitações por colaborador
   * @param {string} colaboradorNome - Nome do colaborador
   * @returns {Promise<Array>} Lista de solicitações
   */
  getByColaborador: (colaboradorNome) => apiRequest(`/escalacoes/solicitacoes?colaboradorNome=${encodeURIComponent(colaboradorNome)}`),
  
  /**
   * Buscar solicitações por agente (compatibilidade - usa colaboradorNome internamente)
   * @param {string} agente - Nome do agente
   * @returns {Promise<Array>} Lista de solicitações
   * @deprecated Use getByColaborador ao invés disso
   */
  getByAgente: (agente) => apiRequest(`/escalacoes/solicitacoes?colaboradorNome=${encodeURIComponent(agente)}`),

  /**
   * Confirmar visualização de resposta do WhatsApp
   * @param {string} requestId - ID da solicitação
   * @param {string} replyMessageId - ID da mensagem de resposta
   * @param {string} confirmedBy - Nome de quem confirmou
   * @returns {Promise<Object>} Resultado da confirmação
   */
  confirmarResposta: (requestId, replyMessageId, confirmedBy) => apiRequest(`/escalacoes/solicitacoes/${requestId}/reply-confirm`, {
    method: 'POST',
    body: JSON.stringify({ replyMessageId, confirmedBy }),
  }),

  /**
   * Adicionar reply ao array reply da solicitação (time Produtos ou N1)
   * @param {string} solicitacaoId - ID da solicitação
   * @param {Object} data - { origem: "produtos"|"n1", status: "enviado"|"feito"|"não feito", msgProdutos?, msgN1? } — textos opcionais
   * @returns {Promise<Object>} Resultado
   */
  addReply: (solicitacaoId, data) => apiRequest(`/escalacoes/solicitacoes/${solicitacaoId}/reply`, {
    method: 'POST',
    headers: headersSessaoVelohubPreferencia(),
    body: JSON.stringify(data),
  }),

  /**
   * Cancelar solicitação: acrescenta em reply { status: "Cancelado", msgProdutos: null, msgN1: null, at }
   * @param {string} solicitacaoId - ID da solicitação
   * @returns {Promise<Object>} Resultado
   */
  cancelarSolicitacao: (solicitacaoId) => apiRequest(`/escalacoes/solicitacoes/${solicitacaoId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ cancelarSolicitacao: true }),
  }),

  /**
   * DEV local: marca chamado como feito ou não feito (exige VELOHUB_DEV_* no backend e flags no frontend).
   * @param {string} solicitacaoMongoId — _id em solicitacoes_tecnicas ou liberacao_pix_prod
   * @param {'feito'|'não feito'} status
   */
  devMarcacaoChamarStatus: (solicitacaoMongoId, status) =>
    apiRequest(
      `/escalacoes/solicitacoes/dev/marcar-chamado-status/${encodeURIComponent(solicitacaoMongoId)}`,
      {
        method: 'POST',
        headers: headersSessaoVelohubPreferencia(),
        body: JSON.stringify({ status }),
      },
    ),
};

/**
 * Rotas restritas Apoio N1 (visão geral Req_Prod — todos os agentes)
 */
export const apoioN1API = {
  /**
   * @param {Object} params - origem (todos|solicitacoes|erros-bugs|liberacao-chave-pix), dataInicio, dataFim, colaboradorNome, statusChamado
   * @param {string} email - obrigatório para validação no backend
   */
  getOverview: (params = {}, email) => {
    const q = new URLSearchParams();
    if (params.origem) q.set('origem', params.origem);
    if (params.dataInicio) q.set('dataInicio', params.dataInicio);
    if (params.dataFim) q.set('dataFim', params.dataFim);
    if (params.colaboradorNome) q.set('colaboradorNome', params.colaboradorNome);
    if (params.statusChamado) q.set('statusChamado', params.statusChamado);
    if (email) q.set('email', email);
    const qs = q.toString();
    return apiRequest(`/escalacoes/apoio-n1/overview${qs ? `?${qs}` : ''}`, {
      headers: {
        ...(email ? { 'x-user-email': email } : {}),
      },
    });
  },

  /**
   * @param {string} email
   */
  getAgentes: (email) => {
    const q = new URLSearchParams();
    if (email) q.set('email', email);
    return apiRequest(`/escalacoes/apoio-n1/agentes?${q.toString()}`, {
      headers: {
        ...(email ? { 'x-user-email': email } : {}),
      },
    });
  },
};

/**
 * API para Erros/Bugs
 */
export const errosBugsAPI = {
  /**
   * Buscar todos os erros/bugs
   * @returns {Promise<Array>} Lista de erros/bugs
   */
  getAll: () => apiRequest('/escalacoes/erros-bugs'),

  /**
   * Buscar erros/bugs por colaborador (mesmo query do backend que solicitações)
   * @param {string} colaboradorNome
   * @returns {Promise<Object>} { success, data }
   */
  getByColaborador: (colaboradorNome) =>
    apiRequest(`/escalacoes/erros-bugs?colaboradorNome=${encodeURIComponent(colaboradorNome)}`),

  /**
   * Criar novo erro/bug
   * @param {Object} data - Dados do erro/bug
   * @returns {Promise<Object>} Erro/bug criado
   */
  create: (data) => apiRequest('/escalacoes/erros-bugs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Buscar erros/bugs por CPF
   * @param {string} cpf - CPF para buscar
   * @returns {Promise<Array>} Lista de erros/bugs
   */
  getByCpf: (cpf) => apiRequest(`/escalacoes/erros-bugs?cpf=${cpf}`),

  /**
   * Buscar erro/bug por ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  getById: (id) => apiRequest(`/escalacoes/erros-bugs/${id}`),

  /**
   * Atualizar erro/bug (ex.: mesclar anexos em payload)
   * @param {string} id
   * @param {Object} body - campos a enviar no $set (ex.: { payload })
   */
  update: (id, body) =>
    apiRequest(`/escalacoes/erros-bugs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  /**
   * Adicionar item ao array reply (origem produtos | n1)
   */
  addReply: (id, data) =>
    apiRequest(`/escalacoes/erros-bugs/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Cancelar: novo item em reply com status Cancelado (mesmo body que solicitações)
   */
  cancelarRegistro: (id) =>
    apiRequest(`/escalacoes/erros-bugs/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ cancelarSolicitacao: true }),
    }),
};

/**
 * API para Atendimento (Otimizador)
 */
export const atendimentoAPI = {
  /**
   * Processar pergunta e retornar resposta otimizada
   * @param {string} pergunta - Pergunta do cliente
   * @returns {Promise<Object>} Resposta otimizada
   */
  processar: (pergunta) => apiRequest('/escalacoes/atendimento', {
    method: 'POST',
    body: JSON.stringify({ pergunta }),
  }),
};

/**
 * API para Feedback
 */
export const feedbackAPI = {
  /**
   * Enviar feedback sobre resposta
   * @param {Object} data - Dados do feedback
   * @returns {Promise<Object>} Feedback criado
   */
  create: (data) => apiRequest('/escalacoes/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export default {
  solicitacoes: solicitacoesAPI,
  errosBugs: errosBugsAPI,
  apoioN1: apoioN1API,
  atendimento: atendimentoAPI,
  feedback: feedbackAPI,
};


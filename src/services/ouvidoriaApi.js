/**
 * VeloHub V3 - Ouvidoria API Service
 * VERSION: v2.3.1 | DATE: 2026-02-26 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.3.1:
 * - Atualizado comentário: reclamacoes_ouvidoria → reclamacoes_n2Pix
 * 
 * Mudanças v2.2.0:
 * - Removido método getByIdSecao (campo idSecao removido)
 * 
 * Mudanças v2.0.0:
 * - Atualizado para suportar coleções separadas (reclamacoes_bacen, reclamacoes_n2Pix)
 * - getById e update agora requerem tipo como parâmetro
 * 
 * Mudanças v1.3.0:
 * - Adicionado método uploadAnexo para upload de arquivos para Cloud Storage
 * 
 * Mudanças v1.1.0:
 * - Adicionado envio automático de email e sessionId nos headers das requisições
 * - Headers x-user-email e x-session-id incluídos para middleware de acesso
 * 
 * Serviço de API para o módulo de Ouvidoria (BACEN, N2 Pix)
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
  console.log(`🔍 [ouvidoriaApi] Fazendo requisição para: ${url}`);
  
  // Obter email da sessão para incluir nas requisições
  let userEmail = null;
  try {
    const sessionData = 
      localStorage.getItem('veloacademy_user_session') ||
      localStorage.getItem('velohub_user_session') ||
      localStorage.getItem('user_session');
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      userEmail = session?.user?.email || session?.email;
      console.log(`🔍 [ouvidoriaApi] Email obtido da sessão: ${userEmail || 'não encontrado'}`);
      console.log(`🔍 [ouvidoriaApi] Estrutura da sessão:`, {
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        sessionEmail: session?.email,
        sessionKeys: Object.keys(session || {})
      });
    } else {
      console.warn(`⚠️ [ouvidoriaApi] Nenhuma sessão encontrada no localStorage`);
    }
  } catch (error) {
    console.error('❌ [ouvidoriaApi] Erro ao obter email da sessão:', error);
  }
  
  // Obter sessionId se disponível
  const sessionId = localStorage.getItem('velohub_session_id');
  console.log(`🔍 [ouvidoriaApi] SessionId: ${sessionId || 'não encontrado'}`);
  
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
    if (sessionId) {
      headers['x-session-id'] = sessionId;
      console.log(`✅ [ouvidoriaApi] Header x-session-id adicionado: ${sessionId}`);
    }
    
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
   * Atualizar reclamação
   * @param {string} id - ID da reclamação
   * @param {Object} data - Dados atualizados (deve incluir campo 'tipo' ou passar como query param)
   * @param {string} tipo - Tipo da reclamação (BACEN, OUVIDORIA) - opcional se estiver em data.tipo
   * @returns {Promise<Object>} Reclamação atualizada
   */
  update: (id, data, tipo = null) => {
    const tipoParam = tipo || data.tipo;
    const url = tipoParam 
      ? `/ouvidoria/reclamacoes/${id}?tipo=${tipoParam}`
      : `/ouvidoria/reclamacoes/${id}`;
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Buscar reclamações por CPF
   * @param {string} cpf - CPF para buscar
   * @returns {Promise<Array>} Lista de reclamações
   */
  getByCpf: (cpf) => apiRequest(`/ouvidoria/reclamacoes?cpf=${cpf}`),

  /**
   * Buscar reclamações por colaborador
   * @param {string} colaboradorNome - Nome do colaborador
   * @returns {Promise<Array>} Lista de reclamações
   */
  getByColaborador: (colaboradorNome) => apiRequest(`/ouvidoria/reclamacoes?colaboradorNome=${encodeURIComponent(colaboradorNome)}`),

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
   * @param {Object} filtros - Filtros opcionais (dataInicio, dataFim)
   * @returns {Promise<Object>} Estatísticas
   */
  getStats: (filtros = {}) => {
    const query = new URLSearchParams();
    if (filtros.dataInicio) query.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) query.append('dataFim', filtros.dataFim);
    const queryString = query.toString();
    return apiRequest(`/ouvidoria/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Buscar métricas específicas
   * @param {Object} filtros - Filtros opcionais (dataInicio, dataFim)
   * @returns {Promise<Object>} Métricas
   */
  getMetricas: (filtros = {}) => {
    const query = new URLSearchParams();
    if (filtros.dataInicio) query.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) query.append('dataFim', filtros.dataFim);
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
    
    const sessionId = localStorage.getItem('velohub_session_id');
    
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
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta não é JSON. Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro no upload');
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
  anexos: anexosAPI,
};

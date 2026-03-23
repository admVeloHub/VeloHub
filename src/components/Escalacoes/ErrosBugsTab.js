/**
 * VeloHub V3 - ErrosBugsTab Component
 * VERSION: v1.27.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.27.0:
 * - Sidebar unificada (paridade Solicitações): um painel “Busca e acompanhamento”, CPF+Buscar+Atualizar, scroll único com resultados da busca + envios recentes; altura da sidebar = card principal (ResizeObserver)
 * 
 * Mudanças v1.26.0:
 * - Paridade com aba Solicitações: modal (cabeçalho status, grid 3 colunas, diálogo reply, N1+Cancelar, altura), API reply/cancelar, sidebar consulta com borda se msg Produtos não lida
 * - Status do card e logs derivados de reply[] (getStatusChamado); cache local com requestId/reply após refresh/criação
 * 
 * Mudanças v1.25.0:
 * - Migração de anexos: base64 → upload via signed URL GCS (mediabank_velohub/anexos_produto)
 * - imagens: [{ nome, imagemUrl }], videos: [{ nome, videoUrl }]
 * - processFiles agora faz upload imediato via backend /api/anexos-produto/get-upload-url
 * - Modal de anexos e respostas suportam ambos formatos (legado e novo)
 * 
 * Mudanças v1.24.1:
 * - Melhorado tratamento de erro 503 (WhatsApp desconectado) com logs mais informativos
 * 
 * Mudanças v1.24.0:
 * - Atualizado para usar WHATSAPP_ENDPOINT que detecta automaticamente o endpoint correto
 * - Em localhost:3001 usa /api/whatsapp/send, em produção usa /send
 * 
 * Mudanças v1.23.0:
 * - Adicionados campos cpf, solicitacao e agente no payload do WhatsApp API
 * - Payload agora inclui metadados necessários para correlacionar replies automaticamente
 * - API WhatsApp agora consegue salvar replies no MongoDB quando detecta menções
 * - Alinhado com padrão do FormSolicitacao que funciona corretamente
 * 
 * Mudanças v1.22.0:
 * - Adicionados campos "Marca" e "Modelo" após campo "Descrição"
 * - Campos Marca e Modelo na mesma linha do grid (grid-cols-2)
 * - Campos incluídos na mensagem WhatsApp quando preenchidos
 * - Campos incluídos no payload enviado ao backend
 * - Campos limpos após envio do formulário
 * 
 * Mudanças v1.21.0:
 * - Adicionados logs de debug no modal para rastrear replies recebidas
 * - Normalização do campo replies no modal para garantir exibição correta
 * - Verificação melhorada de replies antes de exibir no modal
 * 
 * Mudanças v1.20.0:
 * - CPF sempre enviado apenas com números (sem pontos ou traços) em todas as operações
 * - Normalização aplicada ao salvar no backend, logs e cache local
 * - Máscara visual mantida na interface, mas dados sempre normalizados antes do envio
 * 
 * Mudanças v1.19.0:
 * - TODOS os cards são SEMPRE clicáveis e SEMPRE abrem modal quando clicados
 * - Modal mostra todas as informações: básicas, anexos (se houver) e respostas (se houver)
 * - Removida lógica condicional - cards sempre têm cursor-pointer e hover
 * - Modal unificado mostra tudo em um único lugar
 * 
 * Mudanças v1.17.0:
 * - Corrigido modal de respostas não abrindo quando há respostas e anexos
 * - Ajustado stopPropagation para não bloquear clique do card quando há respostas
 * - Adicionado z-index explícito (9999) no modal para garantir visibilidade
 * - Adicionados logs de debug para rastrear cliques e abertura do modal
 * - Priorização de respostas sobre anexos quando ambos existem
 * - Botão "Ver anexos" desabilitado quando há respostas (prioridade)
 * 
 * Mudanças v1.16.0:
 * - Cards de resultados de busca agora são clicáveis para abrir modal de respostas quando há respostas
 * - Adicionado modal para visualização de respostas (replies) do WhatsApp
 * - Adicionada função confirmarResposta para confirmar visualização de respostas
 * - Indicador visual de quantidade de respostas no card
 * 
 * Mudanças v1.15.0:
 * - Corrigido container de consulta de CPF para conter resultados e permitir scroll quando necessário
 * - Adicionado overflow-hidden no container pai e estrutura flex para garantir contenção
 * - Removido limite de 8 resultados, agora mostra todos com scroll
 * - Aplicada mesma solução usada na aba Solicitações
 * Branch: escalacoes
 * 
 * Componente para reportar erros e bugs com anexos de imagem/vídeo
 * 
 * Mudanças v1.14.0:
 * - Adicionado bloco condicional com checkboxes para "Exclusão de Conta"
 * - Campos: excluirVelotax, excluirCelcoin, saldoZerado, portabilidadePendente, dividaIrpfQuitada
 * - Atualizada função montarLegenda para incluir campos de exclusão de conta
 * - Campos incluídos no payload ao criar registro
 * 
 * Mudanças v1.13.0:
 * - Adicionada opção "Exclusão de Conta" no select de tipos (movida da aba Solicitações)
 * 
 * Mudanças v1.12.0:
 * - Revertida API WhatsApp para usar whatsapp-api-new-54aw.onrender.com/send
 * 
 * Mudanças v1.11.0:
 * - Atualizado endpoint WhatsApp para usar nova API do backend GCP: /api/whatsapp/send
 *   - Local: http://localhost:3001/api/whatsapp/send
 *   - Produção: https://backend-gcp-278491073220.us-east1.run.app/api/whatsapp/send
 * - Melhorado tratamento de erros e logs de debug
 * 
 * Mudanças v1.10.0:
 * - Corrigido envio de WhatsApp: agora usa WHATSAPP_API_URL e WHATSAPP_DEFAULT_JID de api-config.js
 * - Alinhado com padrão do FormSolicitacao que funciona corretamente
 * - Resolve problema de mensagens não sendo enviadas para o grupo WhatsApp
 * - Configurações agora usam fallback automático quando variáveis de ambiente não estão definidas
 * 
 * Mudanças v1.9.0:
 * - Adicionada proteção contra requisições simultâneas (isLoadingRef)
 * - Adicionado controle de montagem do componente (isMountedRef)
 * - Prevenção de atualizações de estado após desmontagem do componente
 * - Verificação de montagem antes de atualizar estado após requisições assíncronas
 * - Intervalo de atualização automática agora verifica montagem antes de executar
 * - Resolve problema de múltiplas requisições repetidas aos mesmos endpoints
 * 
 * Mudanças v1.8.0:
 * - Melhorado tratamento de erros no carregamento de estatísticas
 * - Adicionada validação robusta de resposta da API
 * - Adicionada mensagem de erro visível para o usuário quando API falhar
 * - Adicionados logs de debug para facilitar diagnóstico em produção
 * - Componente agora sempre renderiza mesmo com erros de API
 * - Validação de datas melhorada para evitar erros com valores inválidos
 * 
 * Mudanças v1.7.0:
 * - Corrigido envio de imagens: adicionado imageData no payload com dados completos em base64
 * - Backend agora extrai imagens de imageData ao invés de previews (thumbnails)
 * - Envio de imagens e vídeos agora funciona corretamente via WhatsApp
 * 
 * Mudanças v1.6.0:
 * - Implementada visualização e reprodução de vídeos no modal de anexos
 * - Adicionado modal de visualização de vídeo com player HTML5
 * - Implementada função de download de vídeos
 * - Vídeos agora podem ser reproduzidos quando os dados estão disponíveis no payload (videoData)
 * - Botões "Reproduzir" e "Download" adicionados para vídeos com dados disponíveis
 * 
 * Mudanças v1.5.0:
 * - Adicionado modal de visualização de imagem em tamanho maior
 * - Implementada função de download de imagens
 * - Melhorada interação com anexos: botões "Ver" e "Download" ao passar o mouse
 * - Corrigido problema de abertura de anexos que não funcionava corretamente
 * 
 * Mudanças v1.4.0:
 * - Reorganizado card de resultados da consulta de CPF para melhor visualização
 * - Removido prefixo "Erro/Bug - " do tipo de erro exibido no card
 * - Layout reorganizado: [Tipo] [CPF] na primeira linha, [agente] [data] [hora] [Status] na segunda linha, [Anexos] [ver anexos] na terceira linha
 * - Data e hora formatadas separadamente para melhor legibilidade
 * 
 * Mudanças v1.3.0:
 * - Corrigido envio de vídeos para WhatsApp: formato correto { data, type }
 * - Adicionado videoData no payload para incluir dados completos dos vídeos
 * - Formatação correta de imagens e vídeos antes de enviar para API WhatsApp
 * 
 * Mudanças v1.2.0:
 * - Adicionada funcionalidade de drag and drop para upload de arquivos
 * - Feedback visual quando arrastando arquivos sobre a área de upload
 * - Função processFiles unificada para processar arquivos de qualquer origem
 * 
 * Mudanças v1.1.0:
 * - Reorganizado layout para seguir padrão da aba Solicitações
 * - Adicionados cards de estatísticas no topo
 * - Campo agente automático movido para o topo
 * - Botão "Atualizar agora" com estilo gradiente no topo
 * - Consulta de CPF movida para sidebar superior
 * - Logs de Envio movidos para sidebar inferior
 * - Aplicados estilos consistentes (hover, focus ring reduzido)
 * - Implementada atualização automática a cada 3 minutos
 */

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { errosBugsAPI, logsAPI, solicitacoesAPI } from '../../services/escalacoesApi';
import { API_BASE_URL } from '../../config/api-config';
import toast from 'react-hot-toast';
import {
  STORAGE_PROD_READ_ERROS_BUGS,
  getStatusChamado,
  lastProdutosReplyAtMs,
  setProdutosReadMs,
  hasUnreadProdutosInReplies,
  buildProdutosN1Dialogue,
  statusChamadoBadgeClass,
  buildModalExtraPayloadCells,
  ModalInfoGridCell,
} from '../../utils/escalacoesModalHelpers';

/**
 * Componente de aba para Erros/Bugs
 */
const ErrosBugsTab = () => {
  const [agente, setAgente] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [cpf, setCpf] = useState('');
  const [tipo, setTipo] = useState('App');
  const [descricao, setDescricao] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [imagens, setImagens] = useState([]); // [{ nome, imagemUrl }] - upload via signed URL GCS
  const [videos, setVideos] = useState([]);   // [{ nome, videoUrl }] - upload via signed URL GCS
  const [uploading, setUploading] = useState(false);
  // Campos para Exclusão de Conta
  const [excluirVelotax, setExcluirVelotax] = useState(false);
  const [excluirCelcoin, setExcluirCelcoin] = useState(false);
  const [saldoZerado, setSaldoZerado] = useState(false);
  const [portabilidadePendente, setPortabilidadePendente] = useState(false);
  const [dividaIrpfQuitada, setDividaIrpfQuitada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // URL da imagem selecionada para visualização
  const [selectedVideo, setSelectedVideo] = useState(null); // { data, type, name } do vídeo selecionado para visualização
  const [localLogs, setLocalLogs] = useState([]); // {cpf, tipo, waMessageId, status, createdAt}
  const [selectedRepliesRequest, setSelectedRepliesRequest] = useState(null); // Request selecionado para visualizar respostas no modal
  
  // Debug: monitorar mudanças no estado do modal (apenas quando há mudança significativa)
  useEffect(() => {
    if (selectedRepliesRequest) {
      const repliesCount = Array.isArray(selectedRepliesRequest.replies) ? selectedRepliesRequest.replies.length : 0;
      console.log('[ErrosBugsTab] Modal aberto:', {
        id: selectedRepliesRequest._id || selectedRepliesRequest.id,
        tipo: selectedRepliesRequest.tipo,
        repliesCount
      });
    }
  }, [selectedRepliesRequest?._id, selectedRepliesRequest?.tipo]);

  const [modalN1Draft, setModalN1Draft] = useState('');
  const [modalSalvarN1Loading, setModalSalvarN1Loading] = useState(false);
  const [modalCancelarRegLoading, setModalCancelarRegLoading] = useState(false);
  const [prodReadEpoch, setProdReadEpoch] = useState(0);

  useEffect(() => {
    setModalN1Draft('');
  }, [selectedRepliesRequest?._id, selectedRepliesRequest?.id]);

  useEffect(() => {
    const doc = selectedRepliesRequest;
    if (!doc) return;
    const id = doc._id ?? doc.id;
    if (id == null || id === '') return;
    const t = lastProdutosReplyAtMs(doc.reply);
    if (t > 0) {
      setProdutosReadMs(String(id), t, STORAGE_PROD_READ_ERROS_BUGS);
      setProdReadEpoch((e) => e + 1);
    }
  }, [selectedRepliesRequest]);
  
  const [searchCpf, setSearchCpf] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, done: 0 });
  
  // Função para confirmar visualização de resposta
  const confirmarResposta = async (requestId, replyMessageId, confirmedBy = null) => {
    try {
      const result = await solicitacoesAPI.confirmarResposta(requestId, replyMessageId, confirmedBy);
      if (result && result.ok) {
        toast.success('Confirmado! Reação ✓ enviada no WhatsApp.');
        // Recarregar busca se houver CPF pesquisado
        if (searchCpf) {
          buscarCpf();
        }
      } else {
        throw new Error(result?.error || 'Erro ao confirmar resposta');
      }
      return result;
    } catch (error) {
      console.error('[ErrosBugsTab confirmarResposta] Erro:', error);
      toast.error(error.message || 'Erro ao confirmar resposta');
      throw error;
    }
  };

  const [statsLoading, setStatsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errosBugsRaw, setErrosBugsRaw] = useState([]);
  const prevErrosBugsRef = useRef([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const isLoadingRef = useRef(false); // Proteção contra requisições simultâneas
  const isMountedRef = useRef(true); // Controle de montagem do componente
  const errosBugsMainCardRef = useRef(null);
  const [errosBugsSidebarHeightPx, setErrosBugsSidebarHeightPx] = useState(null);

  useLayoutEffect(() => {
    const el = errosBugsMainCardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const sync = () => {
      const h = el.offsetHeight;
      if (h > 0) setErrosBugsSidebarHeightPx(h);
    };
    sync();
    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  /**
   * Normalizar nome do agente (Title Case, espaços simples)
   * @param {string} s - String a normalizar
   * @returns {string} String normalizada
   */
  const toTitleCase = (s = '') => {
    const lower = String(s).toLowerCase().replace(/\s+/g, ' ').trim();
    const keepLower = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
    return lower.split(' ').filter(Boolean).map((p, i) => {
      if (i > 0 && keepLower.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  /**
   * Carregar nome do agente da sessão do usuário
   */
  useEffect(() => {
    try {
      // Tentar obter da sessão do VeloHub primeiro
      const sessionData = localStorage.getItem('velohub_user_session');
      let agentName = '';
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session?.user?.name) {
            agentName = session.user.name;
          }
        } catch (err) {
          console.error('Erro ao decodificar sessão:', err);
        }
      }
      
      // Fallback para localStorage antigo se não houver sessão
      if (!agentName) {
        agentName = localStorage.getItem('velotax_agent') || '';
      }
      
      if (agentName) {
        const normalized = toTitleCase(agentName);
        setSelectedAgent(normalized);
        setAgente(normalized);
        // Salvar também no localStorage para compatibilidade
        try {
          localStorage.setItem('velotax_agent', normalized);
        } catch (err) {
          console.error('Erro ao salvar agente:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
    }
  }, []);

  /**
   * Carregar logs do cache local
   */
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_local_logs_bugs');
      if (cached) setLocalLogs(JSON.parse(cached));
    } catch (err) {
      console.error('Erro ao carregar logs do cache:', err);
    }
  }, []);

  /**
   * Carregar estatísticas e erros/bugs
   */
  const loadStats = async () => {
    // Proteção contra requisições simultâneas
    if (isLoadingRef.current) {
      console.log('[ErrosBugsTab] Requisição já em andamento, ignorando...');
      return;
    }
    
    // Verificar se componente ainda está montado
    if (!isMountedRef.current) {
      console.log('[ErrosBugsTab] Componente desmontado, cancelando requisição...');
      return;
    }
    
    isLoadingRef.current = true;
    setStatsLoading(true);
    setLoadError(null);
    try {
      console.log('[ErrosBugsTab] Iniciando carregamento de estatísticas...');
      const result = await errosBugsAPI.getAll();
      
      // Verificar novamente se componente ainda está montado após requisição
      if (!isMountedRef.current) {
        console.log('[ErrosBugsTab] Componente desmontado durante requisição, ignorando resposta...');
        return;
      }
      
      console.log('[ErrosBugsTab] Resposta recebida:', result);
      
      // Validação de resposta
      if (!result) {
        console.error('[ErrosBugsTab] Resposta vazia da API');
        throw new Error('Resposta vazia da API');
      }
      
      // Aceitar tanto { success: true, data: [] } quanto { data: [] } diretamente
      const data = result.data !== undefined ? result.data : (Array.isArray(result) ? result : []);
      
      if (!result.success && result.success !== undefined && result.message) {
        console.error('[ErrosBugsTab] API retornou erro:', result.message);
        throw new Error(result.message || result.error || 'Erro ao carregar dados');
      }
      
      const list = Array.isArray(data) ? data : [];
      console.log('[ErrosBugsTab] Lista processada:', list.length, 'itens');
      
      // Log detalhado de replies para debug (sempre, para identificar problemas)
      if (list.length > 0) {
        list.forEach(item => {
          if (item.waMessageId) {
            console.log(`🔍 [ErrosBugsTab] Item recebido da API ${item._id}:`, {
              waMessageId: item.waMessageId,
              hasRepliesField: 'replies' in item,
              repliesType: typeof item.replies,
              repliesValue: item.replies,
              repliesIsArray: Array.isArray(item.replies),
              repliesLength: Array.isArray(item.replies) ? item.replies.length : 'N/A',
              allKeys: Object.keys(item)
            });
          }
        });
        
        const itemsWithReplies = list.filter(item => {
          const replies = Array.isArray(item.replies) ? item.replies : [];
          return replies.length > 0;
        });
        console.log(`[ErrosBugsTab] Itens com replies: ${itemsWithReplies.length}/${list.length}`);
        if (itemsWithReplies.length > 0) {
          itemsWithReplies.forEach(item => {
            const replies = Array.isArray(item.replies) ? item.replies : [];
            console.log(`  - ${item._id}: ${replies.length} replies`, replies);
          });
        }
      }
      
      setErrosBugsRaw(list);
      setLastUpdated(new Date());

      // Calcular estatísticas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = list.filter(item => {
        try {
          if (!item || !item.createdAt) return false;
          const createdAt = new Date(item.createdAt);
          if (isNaN(createdAt.getTime())) return false;
          createdAt.setHours(0, 0, 0, 0);
          return createdAt.getTime() === today.getTime();
        } catch {
          return false;
        }
      }).length;

      const pendingCount = list.filter((item) => {
        const status = String(getStatusChamado(item) || '').toLowerCase();
        return status === 'em aberto' || status === 'enviado';
      }).length;

      const doneCount = list.filter((item) => {
        const status = String(getStatusChamado(item) || '').toLowerCase();
        return (
          status === 'feito' ||
          status === 'não feito' ||
          status === 'nao feito' ||
          status === 'cancelado'
        );
      }).length;

      setStats({
        today: todayCount,
        pending: pendingCount,
        done: doneCount
      });
    } catch (err) {
      // Verificar se componente ainda está montado antes de atualizar estado
      if (!isMountedRef.current) {
        console.log('[ErrosBugsTab] Componente desmontado durante erro, ignorando...');
        return;
      }
      
      console.error('Erro ao carregar estatísticas:', err);
      
      // Verificar se é erro de conexão (503) ou timeout
      const isConnectionError = err?.message?.includes('conexão') || 
                                err?.message?.includes('timeout') ||
                                err?.message?.includes('503') ||
                                err?.message?.includes('Service Unavailable');
      
      const errorMessage = isConnectionError 
        ? 'Erro de conexão com o banco de dados. Verifique sua conexão e tente novamente.'
        : (err?.message || 'Erro ao conectar com o servidor');
      
      setLoadError(errorMessage);
      
      // Manter valores anteriores em caso de erro de conexão (não limpar dados)
      // Apenas limpar se for erro diferente de conexão
      if (!isConnectionError) {
        setStats({ today: 0, pending: 0, done: 0 });
        setErrosBugsRaw([]);
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setStatsLoading(false);
      }
    }
  };

  // Carregar estatísticas ao montar componente
  useEffect(() => {
    // Marcar componente como montado
    isMountedRef.current = true;
    isLoadingRef.current = false;
    
    // Contador de erros consecutivos para backoff
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;
    
    console.log('[ErrosBugsTab] Componente montado, carregando estatísticas...');
    
    const loadStatsWithRetry = async () => {
      try {
        await loadStats();
        // Resetar contador de erros em caso de sucesso
        consecutiveErrors = 0;
      } catch (err) {
        consecutiveErrors++;
        console.error(`[ErrosBugsTab] Erro ao carregar (tentativa ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);
        
        // Se muitos erros consecutivos, aumentar intervalo de retry
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.warn('[ErrosBugsTab] Muitos erros consecutivos, aumentando intervalo de retry...');
        }
      }
    };
    
    loadStatsWithRetry();
    
    // Atualização automática a cada 3 minutos (padrão VeloHub - intelligent refresh)
    // Se houver muitos erros, aumentar intervalo para 5 minutos
    let refreshInterval = null;
    const setupRefreshInterval = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      
      const interval = consecutiveErrors >= MAX_CONSECUTIVE_ERRORS ? 5 * 60 * 1000 : 3 * 60 * 1000;
      
      refreshInterval = setInterval(() => {
        // Verificar se componente ainda está montado antes de atualizar
        if (isMountedRef.current && !isLoadingRef.current) {
          loadStatsWithRetry();
        }
      }, interval);
    };
    
    setupRefreshInterval();
    
    return () => {
      console.log('[ErrosBugsTab] Componente desmontado, limpando intervalos...');
      // Marcar componente como desmontado
      isMountedRef.current = false;
      isLoadingRef.current = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  /**
   * Salvar logs no cache local
   * @param {Array} items - Array de logs
   */
  const saveCache = (items) => {
    setLocalLogs(items);
    try {
      localStorage.setItem('velotax_local_logs_bugs', JSON.stringify(items));
    } catch (err) {
      console.error('Erro ao salvar logs no cache:', err);
    }
  };

  /**
   * Upload para GCS via signed URL (backend /api/anexos-produto/get-upload-url)
   * @param {File} file - Arquivo a enviar
   * @param {string} tipoAnexo - 'imagem' ou 'video'
   * @returns {Promise<{nome, imagemUrl}|{nome, videoUrl}>}
   */
  const uploadToGcs = async (file, tipoAnexo) => {
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const res = await fetch(`${baseUrl}/api/anexos-produto/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || (tipoAnexo === 'imagem' ? 'image/jpeg' : 'video/mp4'),
        tipo: tipoAnexo
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao obter URL de upload');
    const putRes = await fetch(data.signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || (tipoAnexo === 'imagem' ? 'image/jpeg' : 'video/mp4') }
    });
    if (!putRes.ok) throw new Error('Falha no upload para o servidor');
    return tipoAnexo === 'imagem'
      ? { nome: file.name, imagemUrl: data.publicUrl }
      : { nome: file.name, videoUrl: data.publicUrl };
  };

  /**
   * Processar arquivos arrastados ou selecionados - upload via signed URL GCS
   * @param {FileList|Array<File>} files - Lista de arquivos
   */
  const processFiles = async (files) => {
    const fileArray = Array.from(files || []);
    if (!fileArray.length) return;
    setUploading(true);
    try {
      for (const file of fileArray) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`O arquivo "${file.name}" é muito grande. Máximo: 50MB`);
          continue;
        }
        if (file.type && file.type.startsWith('image/')) {
          const item = await uploadToGcs(file, 'imagem');
          setImagens((prev) => [...prev, item]);
        } else if (file.type && file.type.startsWith('video/')) {
          const item = await uploadToGcs(file, 'video');
          setVideos((prev) => [...prev, item]);
        }
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      toast.error(err?.message || 'Erro ao enviar anexo');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Abrir modal de anexos
   * @param {Object} request - Requisição com anexos
   */
  const openAttachmentsModal = (request) => {
    setSelectedRequest(request);
    setShowAttachmentsModal(true);
  };

  /**
   * Fechar modal de anexos
   */
  const closeAttachmentsModal = () => {
    setSelectedRequest(null);
    setShowAttachmentsModal(false);
    setSelectedImage(null);
    setSelectedVideo(null);
  };

  /**
   * Abrir imagem em visualização ampliada
   * @param {string} imageUrl - URL da imagem (data URL)
   */
  const openImage = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  /**
   * Fechar visualização de imagem
   */
  const closeImage = () => {
    setSelectedImage(null);
  };

  /**
   * Download de imagem
   * @param {string} imageUrl - URL da imagem (data URL)
   * @param {string} filename - Nome do arquivo
   */
  const downloadImage = (imageUrl, filename = 'imagem') => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || 'imagem.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao fazer download da imagem:', err);
      // Fallback: abrir em nova aba
      window.open(imageUrl, '_blank');
    }
  };

  /**
   * Abrir vídeo em visualização ampliada
   * @param {Object} videoData - Dados do vídeo { data, type, name }
   */
  const openVideo = (videoData) => {
    if (videoData && videoData.data) {
      setSelectedVideo(videoData);
    }
  };

  /**
   * Fechar visualização de vídeo
   */
  const closeVideo = () => {
    setSelectedVideo(null);
  };

  /**
   * Download de vídeo
   * @param {string} videoDataUrl - Data URL do vídeo
   * @param {string} filename - Nome do arquivo
   */
  const downloadVideo = (videoDataUrl, filename = 'video') => {
    try {
      const link = document.createElement('a');
      link.href = videoDataUrl;
      link.download = filename || 'video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao fazer download do vídeo:', err);
    }
  };

  /**
   * Buscar erros/bugs por CPF
   */
  const buscarCpf = async () => {
    const digits = String(searchCpf || '').replace(/\D/g, '');
    if (!digits) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const result = await errosBugsAPI.getByCpf(digits);
      
      // Validação de resposta
      if (!result) {
        throw new Error('Resposta vazia da API');
      }
      
      if (!result.success && result.success !== undefined) {
        throw new Error(result.message || result.error || 'Erro ao buscar CPF');
      }
      
      setSearchResults(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Erro ao buscar CPF:', err);
      setSearchResults([]);
      // Mostrar erro apenas se não for erro de validação (CPF vazio)
      if (digits) {
        alert(`Erro ao buscar CPF: ${err?.message || 'Erro desconhecido'}`);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const atualizarErroBugNoModal = async (docId) => {
    const id = docId || selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return;
    try {
      const res = await errosBugsAPI.getById(id);
      if (res?.success && res?.data) setSelectedRepliesRequest(res.data);
    } catch (err) {
      console.error('[ErrosBugsTab] atualizarErroBugNoModal:', err);
    }
  };

  const abrirModalDesdeLogLocal = async (logItem) => {
    const lid = logItem?.requestId;
    try {
      if (lid) {
        const result = await errosBugsAPI.getById(lid);
        if (result?.success && result?.data) {
          setSelectedRepliesRequest(result.data);
          return;
        }
      }
      const arr = Array.isArray(errosBugsRaw) ? errosBugsRaw : [];
      const match = logItem?.waMessageId
        ? arr.find((r) => r.waMessageId === logItem.waMessageId)
        : arr.find((r) => r.cpf === logItem.cpf && String(r.tipo || '').startsWith('Erro/Bug'));
      if (match) {
        setSelectedRepliesRequest(match);
        return;
      }
      toast.error('Não foi possível carregar este registro. Atualize os logs ou busque por CPF.');
    } catch (err) {
      console.error('[ErrosBugsTab] abrirModalDesdeLogLocal:', err);
      toast.error(err.message || 'Erro ao abrir detalhes');
    }
  };

  const handleModalSalvarRespostaN1 = async () => {
    const texto = String(modalN1Draft || '').trim();
    if (!texto) {
      toast.error('Digite a resposta do N1 antes de salvar.');
      return;
    }
    const id = selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return;
    setModalSalvarN1Loading(true);
    try {
      await errosBugsAPI.addReply(id, {
        origem: 'n1',
        status: 'enviado',
        msgProdutos: null,
        msgN1: texto,
      });
      await atualizarErroBugNoModal(id);
      setModalN1Draft('');
      toast.success('Resposta N1 registrada.');
      await loadStats();
      if (searchCpf) await buscarCpf();
    } catch (err) {
      console.error('[ErrosBugsTab] handleModalSalvarRespostaN1:', err);
      toast.error(err.message || 'Erro ao salvar resposta');
    } finally {
      setModalSalvarN1Loading(false);
    }
  };

  const handleModalCancelarRegistro = async () => {
    if (!window.confirm('Cancelar este registro? O status será gravado como Cancelado no histórico.')) {
      return;
    }
    const id = selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return;
    setModalCancelarRegLoading(true);
    try {
      await errosBugsAPI.cancelarRegistro(id);
      await atualizarErroBugNoModal(id);
      toast.success('Registro cancelado.');
      await loadStats();
      if (searchCpf) await buscarCpf();
    } catch (err) {
      console.error('[ErrosBugsTab] handleModalCancelarRegistro:', err);
      toast.error(err.message || 'Erro ao cancelar');
    } finally {
      setModalCancelarRegLoading(false);
    }
  };

  const sidebarConsultaUnread = useMemo(() => {
    for (const r of searchResults || []) {
      const id = r._id ?? r.id;
      if (id != null && id !== '' && hasUnreadProdutosInReplies(String(id), r.reply, STORAGE_PROD_READ_ERROS_BUGS)) {
        return true;
      }
    }
    for (const l of localLogs || []) {
      if (l?.requestId && Array.isArray(l.reply)) {
        if (hasUnreadProdutosInReplies(String(l.requestId), l.reply, STORAGE_PROD_READ_ERROS_BUGS)) return true;
      }
    }
    return false;
  }, [searchResults, localLogs, prodReadEpoch]);

  /**
   * Atualizar status dos logs locais e estatísticas
   */
  const refreshNow = async () => {
    await loadStats();
    if (!localLogs.length) return;
    try {
      const result = await errosBugsAPI.getAll();
      const all = Array.isArray(result.data) ? result.data : [];
      const updated = localLogs.map((item) => {
        const match = item.waMessageId
          ? all.find((r) => r.waMessageId === item.waMessageId)
          : all.find((r) => r.cpf === item.cpf && String(r.tipo || '').startsWith('Erro/Bug'));
        if (!match) return item;
        const rid =
          match._id != null ? String(match._id) : match.id != null ? String(match.id) : item.requestId;
        return {
          ...item,
          status: getStatusChamado(match),
          requestId: item.requestId || rid || undefined,
          reply: Array.isArray(match.reply) ? match.reply : item.reply,
        };
      });
      saveCache(updated);
    } catch (err) {
      console.error('Erro ao atualizar logs:', err);
    }
  };

  /**
   * Montar legenda para WhatsApp
   * @returns {string} Legenda formatada
   */
  const montarLegenda = () => {
    const agentName = selectedAgent || agente || '';
    const simNao = v => (v ? '✅ Sim' : '❌ Não');
    let m = `*Novo Erro/Bug - ${tipo}*\n\n`;
    m += `Agente: ${agentName}\n`;
    if (cpf) m += `CPF: ${cpf}\n`;
    
    if (tipo === 'Exclusão de Conta') {
      m += `\nExcluir conta Velotax: ${simNao(excluirVelotax)}\n`;
      m += `Excluir conta Celcoin: ${simNao(excluirCelcoin)}\n`;
      m += `Conta zerada: ${simNao(saldoZerado)}\n`;
      m += `Portabilidade pendente: ${simNao(portabilidadePendente)}\n`;
      m += `Dívida IRPF quitada: ${simNao(dividaIrpfQuitada)}\n`;
      m += `\nDescrição:\n${descricao || '—'}\n`;
    } else {
      m += `\nDescrição:\n${descricao || '—'}\n`;
    }
    
    if (marca || modelo) {
      if (marca) m += `Marca: ${marca}\n`;
      if (modelo) m += `Modelo: ${modelo}\n`;
    }
    
    if (imagens?.length || videos?.length) {
      const totalAnexos = (imagens?.length || 0) + (videos?.length || 0);
      const tipos = [];
      if (imagens?.length) tipos.push(`${imagens.length} imagem(ns)`);
      if (videos?.length) tipos.push(`${videos.length} vídeo(s)`);
      m += `\n[Anexos: ${totalAnexos} - ${tipos.join(', ')}]\n`;
    }
    return m;
  };

  /**
   * Enviar erro/bug
   * @param {Event} e - Evento do formulário
   */
  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const legenda = montarLegenda();
    const agentName = selectedAgent || agente || '';

    try {
      // Criar registro no backend (WhatsApp descontinuado - replies via polling MongoDB)
      // CPF sempre apenas números (sem formatação) para o backend e WhatsApp
      const cpfApenasNumeros = String(cpf || '').replace(/\D/g, '');
      
      const erroBugData = {
        agente: agentName,
        cpf: cpfApenasNumeros, // CPF normalizado (apenas números)
        tipo,
        payload: {
          agente: agentName,
          cpf: cpfApenasNumeros, // CPF normalizado no payload também
          tipo,
          descricao,
          marca: marca || '',
          modelo: modelo || '',
          imagens: imagens?.map(({ nome, imagemUrl }) => ({ nome, imagemUrl })) || [],
          videos: videos?.map(({ nome, videoUrl }) => ({ nome, videoUrl })) || [],
          // Campos para Exclusão de Conta
          exclusao: tipo === 'Exclusão de Conta' ? {
            excluirVelotax: !!excluirVelotax,
            excluirCelcoin: !!excluirCelcoin,
            saldoZerado: !!saldoZerado,
            portabilidadePendente: !!portabilidadePendente,
            dividaIrpfQuitada: !!dividaIrpfQuitada,
          } : undefined
        }
      };

      const result = await errosBugsAPI.create(erroBugData);

      // 3) Criar log
      try {
        await logsAPI.create({
          action: 'send_request',
          detail: {
            tipo: `Erro/Bug - ${tipo}`,
            cpf: cpfApenasNumeros,
            whatsappSent: false
          }
        });
      } catch (logErr) {
        console.error('Erro ao criar log:', logErr);
      }

      // 4) Adicionar ao cache local
      const created = result?.data;
      const requestId =
        created?._id != null
          ? String(created._id)
          : created?.id != null
            ? String(created.id)
            : undefined;
      const newItem = {
        requestId,
        cpf: cpfApenasNumeros,
        tipo: `Erro/Bug - ${tipo}`,
        waMessageId: null,
        status: getStatusChamado(created) || 'enviado',
        createdAt: new Date().toISOString(),
        reply: Array.isArray(created?.reply) ? created.reply : undefined,
      };
      saveCache([newItem, ...localLogs].slice(0, 50));

      setMsg('Registrado no painel com sucesso.');
      // Não limpar agente, pois é automático
      setCpf('');
      setDescricao('');
      setMarca('');
      setModelo('');
      setImagens([]);
      setVideos([]);
      // Limpar campos de Exclusão de Conta
      setExcluirVelotax(false);
      setExcluirCelcoin(false);
      setSaldoZerado(false);
      setPortabilidadePendente(false);
      setDividaIrpfQuitada(false);
      // Recarregar estatísticas após envio
      await loadStats();
    } catch (err) {
      console.error('Erro ao enviar erro/bug:', err);
      setMsg('Falha ao enviar/registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-8 items-start">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-800 dark:text-gray-200">Enviando solicitação…</div>
            </div>
          </div>
        </div>
      )}

      {/* Card principal: altura de referência para a sidebar (ResizeObserver) */}
      <div
        ref={errosBugsMainCardRef}
        className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:-translate-y-0.5 transition-transform"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        {/* Cards de Estatísticas + Campo Agente + Botão Atualizar */}
        <div className="mb-6 flex items-center justify-between gap-3 relative">
          <div
            className="grid grid-cols-3 gap-3 w-full max-w-xl"
            aria-busy={statsLoading}
            aria-live="polite"
          >
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Hoje</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {statsLoading ? (
                  <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                ) : (
                  stats.today
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Pendentes</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {statsLoading ? (
                  <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                ) : (
                  stats.pending
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Feitas</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {statsLoading ? (
                  <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                ) : (
                  stats.done
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] text-gray-600 dark:text-gray-400 min-w-[120px] text-right">
              {lastUpdated
                ? `Atualizado às ${new Date(lastUpdated).toLocaleTimeString()}`
                : ''}
            </div>
            <button
              onClick={refreshNow}
              disabled={statsLoading}
              className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!statsLoading) {
                  e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                  e.target.style.color = '#F3F7FC';
                  e.target.style.borderColor = '#006AB9';
                }
              }}
              onMouseLeave={(e) => {
                if (!statsLoading) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#006AB9';
                  e.target.style.borderColor = '#006AB9';
                }
              }}
            >
              {statsLoading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                'Atualizar agora'
              )}
            </button>
          </div>
        </div>

        {/* Mensagem de erro ao carregar */}
        {loadError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400 text-sm">
                  ⚠️ Erro ao carregar dados: {loadError}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  loadStats();
                }}
                className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={enviar} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Tipo</label>
            <select
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option>App</option>
              <option>Crédito Pessoal</option>
              <option>Crédito do Trabalhador</option>
              <option>Antecipação</option>
              <option>Exclusão de Conta</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">CPF (opcional)</label>
            <input
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        {tipo === 'Exclusão de Conta' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={excluirVelotax}
                onChange={(e) => setExcluirVelotax(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Excluir conta Velotax</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={excluirCelcoin}
                onChange={(e) => setExcluirCelcoin(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Excluir conta Celcoin</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={saldoZerado}
                onChange={(e) => setSaldoZerado(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Conta zerada</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={portabilidadePendente}
                onChange={(e) => setPortabilidadePendente(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Portabilidade pendente</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={dividaIrpfQuitada}
                onChange={(e) => setDividaIrpfQuitada(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Dívida IRPF quitada</span>
            </label>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Descrição</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 h-32 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Explique o problema, passos para reproduzir, telas envolvidas...&#10;(Dica: você pode colar imagens aqui)"
            onPaste={async (e) => {
              const items = Array.from(e.clipboardData?.items || []);
              const imgs = items.filter((it) => it.type && it.type.startsWith('image/'));
              if (!imgs.length) return;
              e.preventDefault();
              setUploading(true);
              try {
                for (const it of imgs) {
                  const file = it.getAsFile();
                  if (!file) continue;
                  const item = await uploadToGcs(file, 'imagem');
                  setImagens((prev) => [...prev, item]);
                }
              } catch (err) {
                console.error('Erro ao processar imagem da área de transferência:', err);
                toast.error(err?.message || 'Erro ao enviar imagem');
              } finally {
                setUploading(false);
              }
            }}
          />
        </div>

        {/* Campos Marca e Modelo - mesma linha do grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Marca</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Ex: Samsung, Apple, etc."
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Modelo</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ex: Galaxy S21, iPhone 13, etc."
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Anexos (imagens e vídeos)</label>
          <div
            className={`mt-1 p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 border-solid'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            style={{ minHeight: '180px' }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Só desativa se realmente saiu da área (não apenas de um filho)
              if (e.currentTarget === e.target) {
                setIsDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                processFiles(files);
              }
            }}
          >
            <div className={`mb-2 transition-colors ${
              isDragging
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {isDragging
                ? 'Solte os arquivos aqui'
                : 'Arraste e solte aqui, clique para selecionar ou cole imagens no campo de descrição'}
            </div>
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
              Aceitamos imagens (JPG, PNG, GIF) e vídeos (MP4, WebM, MOV) - Máx 50MB por arquivo
            </div>
            <div className="flex gap-2 justify-center">
              <label className={`inline-block px-3 py-2 rounded bg-sky-600 text-white cursor-pointer hover:bg-sky-700 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {uploading ? 'Enviando...' : 'Selecionar imagens'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      await processFiles(files);
                    }
                    // Limpar o input para permitir selecionar o mesmo arquivo novamente
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
              <label className={`inline-block px-3 py-2 rounded bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {uploading ? 'Enviando...' : 'Selecionar vídeos'}
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  disabled={uploading}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      await processFiles(files);
                    }
                    // Limpar o input para permitir selecionar o mesmo arquivo novamente
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {(imagens?.length > 0 || videos?.length > 0) && (
            <>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {imagens?.length || 0} imagem(ns) e {videos?.length || 0} vídeo(s) anexado(s)
              </div>
              {imagens?.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">Imagens:</div>
                  <div className="flex gap-2 flex-wrap">
                    {imagens.map((im, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={im.imagemUrl || ''}
                          alt={im.nome || `anexo-${idx}`}
                          className="h-16 w-auto rounded border border-gray-300 dark:border-gray-600 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImagens((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videos?.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">Vídeos:</div>
                  <div className="flex gap-2 flex-wrap">
                    {videos.map((vid, idx) => (
                      <div key={idx} className="relative group">
                        <div className="relative">
                          <video
                            src={vid.videoUrl || ''}
                            className="h-16 w-auto rounded border border-gray-300 dark:border-gray-600 object-cover"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded pointer-events-none">
                            <span className="text-white text-xs">▶</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-32 truncate">{vid.nome}</div>
                        <button
                          type="button"
                          onClick={() => setVideos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-4">
          {msg && <span className="text-sm text-gray-700 dark:text-gray-300">{msg}</span>}
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </form>
      </div>

      {/* Sidebar única: altura = card principal; busca CPF + envios recentes (paridade Solicitações) */}
      <div
        className={`w-[400px] flex-shrink-0 self-start flex flex-col min-h-0 rounded-2xl hover:-translate-y-0.5 transition-transform ${
          sidebarConsultaUnread ? 'p-[2px]' : ''
        }`}
        style={{
          ...(sidebarConsultaUnread
            ? {
                background:
                  'linear-gradient(135deg, #006AB9 0%, #FACC15 42%, #1D4ED8 100%)',
              }
            : {}),
          ...(errosBugsSidebarHeightPx != null && errosBugsSidebarHeightPx > 0
            ? { height: errosBugsSidebarHeightPx }
            : {}),
        }}
        aria-label={
          sidebarConsultaUnread
            ? 'Busca e acompanhamento: há resposta do time Produtos não lida'
            : 'Busca e acompanhamento'
        }
      >
        <div
          className={`flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-800 shadow-lg p-4 ${
            sidebarConsultaUnread ? 'rounded-[14px]' : 'rounded-2xl'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">
              Busca e acompanhamento
            </h2>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex-shrink-0">
            Agente: {selectedAgent || 'Selecione um agente'}
          </div>

          <div
            className="flex flex-col gap-2 flex-shrink-0"
            aria-busy={searchLoading}
            aria-live="polite"
          >
            <div className="flex flex-wrap gap-2 items-stretch">
              <input
                className="min-w-0 flex-1 basis-[160px] border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Digite o CPF"
                aria-label="CPF para busca"
                value={searchCpf}
                onChange={(e) => setSearchCpf(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    buscarCpf();
                  }
                }}
              />
              <button
                type="button"
                onClick={buscarCpf}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-700 flex-shrink-0"
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
              <button
                type="button"
                onClick={() => refreshNow()}
                disabled={statsLoading}
                className="text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex-shrink-0 disabled:opacity-60"
              >
                {statsLoading ? 'Atualizando…' : 'Atualizar'}
              </button>
            </div>
          </div>

          <div className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2">
            {searchCpf && (
              <div className="text-sm text-gray-600 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 py-1 z-[1]">
                {searchResults.length} registro(s) nesta busca
              </div>
            )}
            {searchLoading && (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-between animate-pulse"
                  >
                    <div>
                      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
                      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded" />
                    </div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
                  </div>
                ))}
              </div>
            )}
            {searchResults && searchResults.length > 0 && !searchLoading && (
              <div className="space-y-2">
                {searchResults.map((r) => {
                  const imgCount = Array.isArray(r?.payload?.imagens)
                    ? r.payload.imagens.length
                    : Array.isArray(r?.payload?.previews)
                      ? r.payload.previews.length
                      : 0;
                  const videoCount = Array.isArray(r?.payload?.videos) ? r.payload.videos.length : 0;
                  const total = imgCount + videoCount;
                  const repliesList = Array.isArray(r.replies) ? r.replies : [];
                  const replyArr = Array.isArray(r.reply) ? r.reply : [];
                  const totalReplyEvents = replyArr.length + repliesList.length;
                  const tipoLimpo =
                    String(r.tipo || '')
                      .replace(/^Erro\/Bug\s*-\s*/i, '')
                      .trim() || r.tipo || '—';
                  const dataHora = r.createdAt ? new Date(r.createdAt) : null;
                  const dataFormatada = dataHora ? dataHora.toLocaleDateString('pt-BR') : '—';
                  const horaFormatada = dataHora
                    ? dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const handleCardClick = (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                      return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[ErrosBugsTab] Card clicado - SEMPRE abrir modal:', {
                      id: r._id || r.id,
                      tipo: r.tipo,
                      cpf: r.cpf,
                      waMessageId: r.waMessageId,
                      payloadMessageIds: r.payload?.messageIds,
                      hasReplies: Array.isArray(r.replies),
                      repliesCount: Array.isArray(r.replies) ? r.replies.length : 0,
                      replies: r.replies,
                      allKeys: Object.keys(r),
                    });
                    setSelectedRepliesRequest(r);
                  };
                  return (
                    <div
                      key={r._id || r.id}
                      role="button"
                      tabIndex={0}
                      onClick={handleCardClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(e);
                        }
                      }}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                          {tipoLimpo}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                          {r.cpf || '—'}
                        </span>
                        {totalReplyEvents > 0 && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {totalReplyEvents} resposta{totalReplyEvents !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {r.colaboradorNome || r.agente || '—'}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{dataFormatada}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{horaFormatada}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getStatusChamado(r)}
                        </span>
                      </div>
                      {total > 0 && (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            if (repliesList.length === 0) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Anexos: {imgCount > 0 ? `${imgCount} img` : ''}
                            {imgCount > 0 && videoCount > 0 ? ' + ' : ''}
                            {videoCount > 0 ? `${videoCount} vid` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (repliesList.length === 0) {
                                openAttachmentsModal(r);
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              repliesList.length > 0
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                            }`}
                            disabled={repliesList.length > 0}
                            title={
                              repliesList.length > 0
                                ? 'Clique no card para ver respostas'
                                : 'Ver anexos'
                            }
                          >
                            Ver anexos
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {localLogs && localLogs.length > 0 && (
              <div className="space-y-2">
                {localLogs.map((l, idx) => {
                  const s = String(l.status || '').toLowerCase();
                  const isCancelado = s === 'cancelado';
                  const isDoneFail = s === 'não feito' || s === 'nao feito';
                  const isDoneOk = s === 'feito';
                  const sentOnly =
                    !isDoneOk &&
                    !isDoneFail &&
                    !isCancelado &&
                    (s === 'enviado' || l.enviado === true);
                  const bar1 = isCancelado
                    ? 'bg-slate-400 dark:bg-slate-600'
                    : sentOnly || isDoneOk || isDoneFail
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600';
                  const bar2 = isCancelado
                    ? 'bg-slate-500 dark:bg-slate-500'
                    : isDoneOk
                      ? 'bg-emerald-500'
                      : isDoneFail
                        ? 'bg-red-500'
                        : 'bg-gray-300 dark:bg-gray-600';
                  const icon = isCancelado
                    ? '🛑'
                    : isDoneOk
                      ? '✅'
                      : isDoneFail
                        ? '❌'
                        : sentOnly
                          ? '📨'
                          : '⏳';
                  const logKey = l.requestId || l.waMessageId || `log-${idx}-${String(l.createdAt)}`;
                  const openFromLog = (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                    e.preventDefault();
                    abrirModalDesdeLogLocal(l);
                  };
                  return (
                    <div
                      key={`envio-${logKey}`}
                      role="button"
                      tabIndex={0}
                      onClick={openFromLog}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openFromLog(e);
                        }
                      }}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl flex-shrink-0">{icon}</span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                            {l.cpf || '—'} — {l.tipo}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 flex-shrink-0 text-right">
                          {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                        </div>
                      </div>
                      <div
                        className="mt-2 flex items-center gap-1.5"
                        aria-label={`progresso: ${s || 'em aberto'}`}
                      >
                        <span className={`h-1.5 w-8 rounded-full ${bar1}`} />
                        <span className={`h-1.5 w-8 rounded-full ${bar2}`} />
                        <span className="text-[11px] opacity-60 ml-2 text-gray-600 dark:text-gray-400">
                          {l.status || s || 'em aberto'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!searchLoading &&
              (!searchResults || searchResults.length === 0) &&
              (!localLogs || localLogs.length === 0) &&
              !String(searchCpf || '').trim() && (
                <div className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">
                  Busque por CPF ou envie um erro/bug; os itens aparecem aqui.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Modal de Anexos */}
      {showAttachmentsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Anexos - {selectedRequest.tipo}
              </h3>
              <button
                type="button"
                onClick={closeAttachmentsModal}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                {/* Informações básicas */}
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm space-y-1 text-gray-800 dark:text-gray-200">
                    <div>
                      <strong>CPF:</strong> {selectedRequest.cpf || '—'}
                    </div>
                    <div>
                      <strong>Agente:</strong> {selectedRequest.colaboradorNome || selectedRequest.agente || '—'}
                    </div>
                    <div>
                      <strong>Status:</strong> {getStatusChamado(selectedRequest)}
                    </div>
                    <div>
                      <strong>Descrição:</strong> {selectedRequest.payload?.descricao || '—'}
                    </div>
                  </div>
                </div>

                {/* Imagens - suporta formato novo (imagemUrl) e legado (previews) */}
                {(() => {
                  const imgs = selectedRequest.payload?.imagens || [];
                  const previews = selectedRequest.payload?.previews || [];
                  const hasNewFormat = imgs.some((im) => im?.imagemUrl);
                  const displayList = hasNewFormat
                    ? imgs.filter((im) => im?.imagemUrl).map((im) => ({ src: im.imagemUrl, name: im.nome || im.name }))
                    : previews.map((preview, idx) => ({ src: preview, name: imgs[idx]?.name || `imagem-${idx + 1}.png` }));
                  if (displayList.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                        Imagens ({displayList.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {displayList.map((item, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={item.src}
                              alt={item.name || `imagem-${idx}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImage(item.src)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openImage(item.src); }}
                                className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                              >
                                Ver
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); downloadImage(item.src, item.name); }}
                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Vídeos - suporta formato novo (videoUrl) e legado (videoData) */}
                {(() => {
                  const vids = selectedRequest.payload?.videos || [];
                  const thumbnails = selectedRequest.payload?.videoThumbnails || [];
                  const videoData = selectedRequest.payload?.videoData || [];
                  const hasNewFormat = vids.some((v) => v?.videoUrl);
                  if (vids.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Vídeos ({vids.length})</h4>
                      <div className="space-y-2">
                        {vids.map((video, idx) => {
                          const videoUrl = video?.videoUrl;
                          const videoDataItem = videoData[idx];
                          const hasVideoData = videoDataItem && videoDataItem.data && videoDataItem.type;
                          const hasVideo = !!videoUrl || hasVideoData;
                          const videoName = video?.nome || video?.name || `video-${idx + 1}.mp4`;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${
                                hasVideo ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (videoUrl) {
                                  window.open(videoUrl, '_blank');
                                } else if (hasVideoData) {
                                  openVideo({
                                    data: videoDataItem.data,
                                    type: videoDataItem.type,
                                    name: videoName
                                  });
                                }
                              }}
                            >
                              <div className="relative">
                                {videoUrl ? (
                                  <video src={videoUrl} className="w-20 h-14 object-cover rounded border border-gray-300 dark:border-gray-600" preload="metadata" />
                                ) : thumbnails[idx] ? (
                                  <img src={thumbnails[idx]} alt={`video-thumb-${idx}`} className="w-20 h-14 object-cover rounded border border-gray-300 dark:border-gray-600" />
                                ) : null}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                  <span className="text-white text-xs">▶</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{videoName}</div>
                                {video?.type && <div className="text-xs text-gray-600 dark:text-gray-400">{video.type}</div>}
                              </div>
                              {videoUrl ? (
                                <div className="flex gap-2">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); window.open(videoUrl, '_blank'); }} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                    Reproduzir
                                  </button>
                                  <a href={videoUrl} download={videoName} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors" onClick={(e) => e.stopPropagation()}>
                                    Download
                                  </a>
                                </div>
                              ) : hasVideoData ? (
                                <div className="flex gap-2">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); openVideo({ data: videoDataItem.data, type: videoDataItem.type, name: videoName }); }} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                    Reproduzir
                                  </button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); downloadVideo(`data:${videoDataItem.type};base64,${videoDataItem.data}`, videoName); }} className="text-xs px-3 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors">
                                    Download
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                                  Vídeo não disponível
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Mensagem se não houver anexos */}
                {(!selectedRequest.payload?.imagens?.length && !selectedRequest.payload?.videos?.length) && (
                  <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                    Nenhum anexo disponível para esta solicitação.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Imagem */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]"
          onClick={closeImage}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              type="button"
              onClick={closeImage}
              className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 transition-colors z-10"
              aria-label="Fechar"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Visualização ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(selectedImage, 'imagem.png');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(selectedImage, '_blank');
                }}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Abrir em nova aba
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Vídeo */}
      {selectedVideo && selectedVideo.data && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]"
          onClick={closeVideo}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              type="button"
              onClick={closeVideo}
              className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 transition-colors z-10"
              aria-label="Fechar"
            >
              ×
            </button>
            <video
              src={`data:${selectedVideo.type};base64,${selectedVideo.data}`}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              Seu navegador não suporta a reprodução de vídeo.
            </video>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const videoUrl = `data:${selectedVideo.type};base64,${selectedVideo.data}`;
                  downloadVideo(videoUrl, selectedVideo.name || 'video.mp4');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Respostas (paridade com aba Solicitações) */}
      {selectedRepliesRequest && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => {
            console.log('[ErrosBugsTab] Fechando modal de respostas');
            setSelectedRepliesRequest(null);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full min-h-[72vh] max-h-[96vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0 flex-1 pr-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                  Respostas — {selectedRepliesRequest.tipo || '—'} — {selectedRepliesRequest.cpf || '—'}
                </h3>
                <span className="text-gray-300 dark:text-gray-600 select-none hidden sm:inline" aria-hidden>|</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Status do chamado
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                      getStatusChamado(selectedRepliesRequest)
                    )}`}
                  >
                    {getStatusChamado(selectedRepliesRequest)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRepliesRequest(null)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none transition-colors flex-shrink-0"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="grid grid-cols-3 gap-x-3 gap-y-3">
                    <ModalInfoGridCell label="CPF" value={selectedRepliesRequest.cpf || '—'} />
                    <ModalInfoGridCell label="Tipo" value={selectedRepliesRequest.tipo || '—'} />
                    <ModalInfoGridCell
                      label="Data"
                      value={
                        selectedRepliesRequest.createdAt
                          ? new Date(selectedRepliesRequest.createdAt).toLocaleString('pt-BR')
                          : '—'
                      }
                    />
                    {buildModalExtraPayloadCells(selectedRepliesRequest).map((c) => (
                      <ModalInfoGridCell key={c.key} label={c.label} value={c.value} />
                    ))}
                  </div>
                </div>

                {/* Anexos - suporta formato novo (imagemUrl/videoUrl) e legado (previews/videoData) */}
                {(() => {
                  const p = selectedRepliesRequest?.payload || {};
                  const imgs = p.imagens || [];
                  const vids = p.videos || [];
                  const previews = p.previews || [];
                  const hasNewFormatImgs = imgs.some((im) => im?.imagemUrl);
                  const imgDisplayList = hasNewFormatImgs
                    ? imgs.filter((im) => im?.imagemUrl).map((im) => ({ src: im.imagemUrl, name: im.nome || im.name }))
                    : previews.map((src, idx) => ({ src, name: imgs[idx]?.name || `imagem-${idx + 1}.png` }));
                  const imgCount = imgDisplayList.length;
                  const videoCount = vids.length;
                  const totalAnexos = imgCount + videoCount;

                  if (totalAnexos > 0) {
                    return (
                      <div>
                        <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Anexos ({totalAnexos})</h4>
                        {imgCount > 0 && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Imagens ({imgCount}):</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {imgDisplayList.map((item, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={item.src}
                                    alt={item.name || `anexo-${idx}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(item.src, '_blank')}
                                  />
                                  <button type="button" onClick={() => window.open(item.src, '_blank')} className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    Abrir
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {videoCount > 0 && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vídeos ({videoCount}):</div>
                            <div className="space-y-2">
                              {vids.map((video, idx) => {
                                const videoUrl = video?.videoUrl;
                                const videoName = video?.nome || video?.name || `Vídeo ${idx + 1}`;
                                const thumb = p.videoThumbnails?.[idx];
                                return (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="relative">
                                      {videoUrl ? (
                                        <video src={videoUrl} className="w-20 h-14 object-cover rounded border" preload="metadata" />
                                      ) : thumb ? (
                                        <img src={thumb} alt={`video-thumb-${idx}`} className="w-20 h-14 object-cover rounded border" />
                                      ) : null}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                        <span className="text-white text-xs">▶</span>
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{videoName}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{video?.type || 'video/mp4'}</div>
                                    </div>
                                    {videoUrl ? (
                                      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800">
                                        Abrir
                                      </a>
                                    ) : (
                                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                                        Vídeo não disponível
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {(() => {
                  const replyArray = Array.isArray(selectedRepliesRequest.reply) ? selectedRepliesRequest.reply : [];
                  const replies = Array.isArray(selectedRepliesRequest.replies) ? selectedRepliesRequest.replies : [];
                  const hasReply = replyArray.length > 0;
                  const hasReplies = replies.length > 0;

                  if (hasReply) {
                    const dialogue = buildProdutosN1Dialogue(replyArray);
                    return (
                      <div>
                        <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                          Respostas do time
                          {dialogue.length > 0 && (
                            <span className="text-gray-500 dark:text-gray-400 font-normal text-sm ml-1">
                              ({dialogue.length}{' '}
                              {dialogue.length === 1 ? 'mensagem' : 'mensagens'})
                            </span>
                          )}
                        </h4>
                        {dialogue.length === 0 ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 py-4 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
                            Ainda não há mensagens de Produtos ou N1 registradas neste chamado (apenas eventos de status, se houver).
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dialogue.map((b) => {
                              if (b.role === 'produtos') {
                                return (
                                  <div key={b.key} className="flex justify-start">
                                    <div className="max-w-[min(100%,28rem)] rounded-xl px-3 py-2.5 border-l-4 border-[#006AB9] bg-sky-50 dark:bg-sky-950/35 dark:border-sky-500 shadow-sm">
                                      <div className="text-xs font-semibold text-[#006AB9] dark:text-sky-300 mb-1">
                                        Time Produtos
                                      </div>
                                      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                        {b.text}
                                      </div>
                                      {b.at ? (
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">{b.at}</div>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              }
                              if (b.role === 'n1') {
                                return (
                                  <div key={b.key} className="flex justify-end">
                                    <div className="max-w-[min(100%,28rem)] rounded-xl px-3 py-2.5 border-r-4 border-amber-500 bg-amber-50 dark:bg-amber-950/35 dark:border-amber-400 shadow-sm">
                                      <div className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1 text-right">
                                        N1
                                      </div>
                                      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words text-left">
                                        {b.text}
                                      </div>
                                      {b.at ? (
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-left">{b.at}</div>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={b.key} className="flex justify-center">
                                  <div className="text-xs text-center text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                    {b.text}
                                    {b.at ? <span className="block text-[10px] text-gray-500 mt-0.5">{b.at}</span> : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (hasReplies) return null;
                  return (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Nenhuma resposta disponível para este registro.
                    </div>
                  );
                })()}

                {(() => {
                  const replies = Array.isArray(selectedRepliesRequest.replies) ? selectedRepliesRequest.replies : [];
                  if (replies.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                        Menções / Respostas no grupo ({replies.length})
                      </h4>
                      <div className="space-y-3">
                        {[...replies].reverse().map((rep, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {rep.reactor || '—'}
                              </div>
                              {rep.at && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {new Date(rep.at).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words mb-3">
                              {(rep.text || '—').trim() || '—'}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {rep.replyMessageId ? (
                                  rep.confirmedAt ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      ✓ Confirmado{rep.confirmedBy ? ` por ${rep.confirmedBy}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Aguardando confirmação
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Check no WhatsApp disponível só para respostas novas
                                  </span>
                                )}
                              </span>
                              {rep.replyMessageId && !rep.confirmedAt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    confirmarResposta(
                                      selectedRepliesRequest._id || selectedRepliesRequest.id,
                                      rep.replyMessageId,
                                      selectedAgent || agente
                                    ).then(() => {
                                      const updatedReplies = (selectedRepliesRequest.replies || []).map((r) =>
                                        r.replyMessageId === rep.replyMessageId
                                          ? { ...r, confirmedAt: new Date(), confirmedBy: selectedAgent || agente }
                                          : r
                                      );
                                      setSelectedRepliesRequest({
                                        ...selectedRepliesRequest,
                                        replies: updatedReplies,
                                      });
                                      buscarCpf();
                                    }).catch(() => {
                                      toast.error('Falha ao confirmar');
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors text-sm"
                                >
                                  Confirmar visto (✓ no WhatsApp)
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            {(() => {
              const cancelada = getStatusChamado(selectedRepliesRequest) === 'Cancelado';
              const bloqueado = modalSalvarN1Loading || modalCancelarRegLoading;
              return (
                <div className="border-t border-gray-200 dark:border-gray-600 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
                  <label htmlFor="erros-modal-n1-resposta" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Resposta N1
                  </label>
                  <textarea
                    id="erros-modal-n1-resposta"
                    rows={2}
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[44px] disabled:opacity-60"
                    placeholder="Digite a mensagem do agente N1…"
                    value={modalN1Draft}
                    onChange={(e) => setModalN1Draft(e.target.value)}
                    disabled={cancelada || bloqueado}
                  />
                  {cancelada && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Este registro está cancelado; não é possível nova resposta ou novo cancelamento.
                    </p>
                  )}
                  <div className="flex justify-between items-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleModalCancelarRegistro}
                      disabled={cancelada || bloqueado}
                      className="text-sm px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {modalCancelarRegLoading ? 'Cancelando…' : 'Cancelar Solicitação'}
                    </button>
                    <button
                      type="button"
                      onClick={handleModalSalvarRespostaN1}
                      disabled={cancelada || bloqueado}
                      className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {modalSalvarN1Loading ? 'Salvando…' : 'Salvar'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrosBugsTab;


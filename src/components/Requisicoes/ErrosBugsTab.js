/**
 * VeloHub V3 - ErrosBugsTab Component
 * VERSION: v1.29.24 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.29.24: Cards da busca CPF agregada exibem selo «Origem» (Solicitações | Erros/Bugs | Liberação chave pix)
 * - v1.29.23: Busca CPF da sidebar passa a agregar Solicitações + Erros/Bugs + Liberação chave pix (todas as abas)
 * - v1.29.22: Agente formulário inicial — `getVelotaxAgentForLoggedUser()` / `setVelotaxAgentForLoggedUser()` (escopo por userMail; sem herdar nome de troca de login)
 * - v1.29.20: Import `getStatusChamadoAssignedAt` (modal respostas; corrige ReferenceError)
 * - v1.29.19: CPF com máscara 000.000.000-00, max 11 dígitos (formulário + busca sidebar; paridade Solicitações)
 * - v1.29.18: Checkbox «Cliente Recusou Evidencias» após os botões de anexo
 * - v1.29.17: Seção Anexos sem textos de ajuda (rótulos/checkbox apenas)
 * - v1.29.16: Checkbox «Cliente Recusou Evidencias» permite envio sem anexo (flag em payload)
 * - v1.29.15: Formulário — CPF antes de Tipo (ordem invertida)
 * - v1.29.14: Rótulo do campo CPF sem «(opcional)»
 * - v1.29.13: Imports atualizados para `requisicoesApi` / `requisicoesModalHelpers`
 * - v1.29.4: Sidebar «Busca e acompanhamento», busca CPF, stats e cache: só documentos da coleção erros_bugs (`tipo` prefixo «Erro/Bug»)
 * - v1.29.3: Após cancelar ou salvar N1 no modal: mescla GET por id em errosBugsRaw/searchResults para o card mostrar Cancelado (paridade Solicitações + getStatusChamado por `at`)
 */

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image, Video } from 'lucide-react';
import { FloatingLabelField } from '../shared/FloatingLabelField';
import SolicitacaoUrgenteBlock from './SolicitacaoUrgenteBlock';
import { errosBugsAPI, solicitacoesAPI } from '../../services/requisicoesApi';
import { getVelotaxAgentForLoggedUser, setVelotaxAgentForLoggedUser } from '../../services/auth';
import { API_BASE_URL } from '../../config/api-config';
import toast from 'react-hot-toast';
import {
  STORAGE_PROD_READ_ERROS_BUGS,
  normalizeMongoId,
  getStatusChamado,
  getStatusChamadoAssignedAt,
  isTerminalChamadoStatusForHeader,
  partitionRequisicoesAbertasResolvidasParaModal,
  lastProdutosReplyAtMs,
  setProdutosReadMs,
  hasUnreadProdutosInReplies,
  buildProdutosN1Dialogue,
  statusChamadoBadgeClass,
  buildModalExtraPayloadCells,
  ModalInfoGridCell,
  listUnreadProdutosDocs,
  produtosUnreadNotifySig,
  hasProdutosNotificationBeenSent,
  markProdutosNotificationSent,
} from '../../utils/requisicoesModalHelpers';

/**
 * Documento da coleção `erros_bugs` (tipo persistido como «Erro/Bug - …»).
 * @param {unknown} r
 * @returns {boolean}
 */
function isDocErrosBugsCollection(r) {
  return r != null && String(r.tipo || '').startsWith('Erro/Bug');
}

function isDocLiberacaoPixProdColecao(r) {
  if (!r) return false;
  const tipoOk = String(r.tipo || '').trim() === 'Exclusão de Chave PIX';
  const origem = String(r.origem || r?.payload?.origem || '').trim();
  return tipoOk && Boolean(origem);
}

function mergeBuscaCpfGlobal(solicitacoesList = [], errosBugsList = []) {
  const merged = [...(Array.isArray(solicitacoesList) ? solicitacoesList : []), ...(Array.isArray(errosBugsList) ? errosBugsList : [])];
  const byId = new Map();
  for (const item of merged) {
    const id = normalizeMongoId(item?._id ?? item?.id) || `${item?.tipo || 'sem-tipo'}-${item?.cpf || ''}-${item?.createdAt || ''}`;
    if (!byId.has(id)) byId.set(id, item);
  }
  return [...byId.values()].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
}

/** Máscara CPF 000.000.000-00; limita a 11 dígitos (paridade FormSolicitacao). */
function formatarCPF(valor) {
  const digits = String(valor || '').replace(/\D/g, '');
  const limited = digits.slice(0, 11);
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
}

function validarCPF(valor) {
  return String(valor || '').replace(/\D/g, '').length === 11;
}

/**
 * Componente de aba para Erros/Bugs
 */
const ErrosBugsTab = () => {
  const [agente, setAgente] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [cpf, setCpf] = useState('');
  const [tipo, setTipo] = useState('App');
  const [descricao, setDescricao] = useState('');
  const [ticketOctadesk, setTicketOctadesk] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [imagens, setImagens] = useState([]); // [{ nome, imagemUrl }] - upload via signed URL GCS
  const [videos, setVideos] = useState([]);   // [{ nome, videoUrl }] - upload via signed URL GCS
  /** Se true, não exige imagem/vídeo no envio (rótulo alinhado ao formulário). */
  const [clienteRecusouEvidencias, setClienteRecusouEvidencias] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Campos para Exclusão de Conta
  const [excluirVelotax, setExcluirVelotax] = useState(false);
  const [excluirCelcoin, setExcluirCelcoin] = useState(false);
  const [saldoZerado, setSaldoZerado] = useState(false);
  const [portabilidadePendente, setPortabilidadePendente] = useState(false);
  const [dividaIrpfQuitada, setDividaIrpfQuitada] = useState(false);
  const [painelUrgenteAberto, setPainelUrgenteAberto] = useState(false);
  const [urgenciaN2, setUrgenciaN2] = useState(false);
  const [urgenciaRa, setUrgenciaRa] = useState(false);
  const [urgenciaBacen, setUrgenciaBacen] = useState(false);
  const [urgenciaProcon, setUrgenciaProcon] = useState(false);
  const [loading, setLoading] = useState(false);
  /** GET por CPF antes do POST (coleção erros_bugs). */
  const [verificandoHistoricoCpf, setVerificandoHistoricoCpf] = useState(false);
  /** null | { cpfDigits, cpfDisplay, abertas, resolvidas, pending: { erroBugData } } */
  const [modalHistoricoCpfErrosBugs, setModalHistoricoCpfErrosBugs] = useState(null);
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
  const [modalAnexosUploading, setModalAnexosUploading] = useState(false);
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
   * Carregar nome do agente (cache escopado ao e-mail atual)
   */
  useEffect(() => {
    try {
      const raw = String(getVelotaxAgentForLoggedUser() || '').trim();
      if (raw) {
        const normalized = toTitleCase(raw);
        setSelectedAgent(normalized);
        setAgente(normalized);
        setVelotaxAgentForLoggedUser(normalized);
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
      const agentName = String(selectedAgent || agente || '').trim();
      const result = agentName
        ? await errosBugsAPI.getByColaborador(agentName)
        : await errosBugsAPI.getAll();
      
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
      const listFiltered = list.filter(isDocErrosBugsCollection);
      console.log('[ErrosBugsTab] Lista processada:', listFiltered.length, 'itens (coleção erros_bugs)');
      
      // Log detalhado de replies para debug (sempre, para identificar problemas)
      if (listFiltered.length > 0) {
        listFiltered.forEach(item => {
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
        
        const itemsWithReplies = listFiltered.filter(item => {
          const replies = Array.isArray(item.replies) ? item.replies : [];
          return replies.length > 0;
        });
        console.log(`[ErrosBugsTab] Itens com replies: ${itemsWithReplies.length}/${listFiltered.length}`);
        if (itemsWithReplies.length > 0) {
          itemsWithReplies.forEach(item => {
            const replies = Array.isArray(item.replies) ? item.replies : [];
            console.log(`  - ${item._id}: ${replies.length} replies`, replies);
          });
        }
      }
      
      setErrosBugsRaw(listFiltered);
      setLastUpdated(new Date());

      // Calcular estatísticas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = listFiltered.filter(item => {
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

      const pendingCount = listFiltered.filter((item) => {
        const status = String(getStatusChamado(item) || '').toLowerCase();
        return status === 'em aberto' || status === 'enviado';
      }).length;

      const doneCount = listFiltered.filter((item) => {
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
   * Upload GCS + merge em payload.imagens | payload.videos e PUT no registro aberto no modal.
   * @param {FileList|null} files
   * @param {'imagem'|'video'} tipo
   */
  const processModalAnexos = async (files, tipo) => {
    const fileArray = Array.from(files || []);
    if (!fileArray.length) return;
    const idRaw = selectedRepliesRequest?._id ?? selectedRepliesRequest?.id;
    if (idRaw == null || idRaw === '') {
      toast.error('ID do registro inválido.');
      return;
    }
    const id = String(idRaw);
    setModalAnexosUploading(true);
    try {
      const newItems = [];
      for (const file of fileArray) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`O arquivo "${file.name}" é muito grande. Máximo: 50MB`);
          continue;
        }
        if (tipo === 'imagem') {
          if (!file.type?.startsWith('image/')) {
            toast.error(`"${file.name}" não é uma imagem.`);
            continue;
          }
          newItems.push(await uploadToGcs(file, 'imagem'));
        } else {
          if (!file.type?.startsWith('video/')) {
            toast.error(`"${file.name}" não é um vídeo.`);
            continue;
          }
          newItems.push(await uploadToGcs(file, 'video'));
        }
      }
      if (newItems.length === 0) return;

      const got = await errosBugsAPI.getById(id);
      const fresh = got?.data;
      if (!fresh) throw new Error('Não foi possível recarregar o registro.');

      const payload = {
        ...(fresh.payload && typeof fresh.payload === 'object' ? fresh.payload : {}),
      };
      if (tipo === 'imagem') {
        const prev = Array.isArray(payload.imagens) ? payload.imagens : [];
        payload.imagens = [...prev, ...newItems];
      } else {
        const prev = Array.isArray(payload.videos) ? payload.videos : [];
        payload.videos = [...prev, ...newItems];
      }

      const put = await errosBugsAPI.update(id, { payload });
      if (!put?.success || !put?.data) {
        throw new Error(put?.message || 'Falha ao salvar anexos no registro.');
      }
      setSelectedRepliesRequest(put.data);
      toast.success(
        newItems.length === 1 ? 'Anexo adicionado ao registro.' : `${newItems.length} anexos adicionados ao registro.`
      );
      await loadStats();
      if (searchCpf) await buscarCpf();
    } catch (err) {
      console.error('[ErrosBugsTab] processModalAnexos:', err);
      toast.error(err?.message || 'Erro ao anexar arquivos');
    } finally {
      setModalAnexosUploading(false);
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
      const [resultSolic, resultErros] = await Promise.all([
        solicitacoesAPI.getByCpf(digits),
        errosBugsAPI.getByCpf(digits),
      ]);
      
      // Validação de resposta
      if (!resultSolic && !resultErros) {
        throw new Error('Resposta vazia da API');
      }

      if (resultErros && !resultErros.success && resultErros.success !== undefined) {
        throw new Error(resultErros.message || resultErros.error || 'Erro ao buscar CPF');
      }

      const listSolic = Array.isArray(resultSolic?.data) ? resultSolic.data : [];
      const listErros = Array.isArray(resultErros?.data) ? resultErros.data : [];
      setSearchResults(mergeBuscaCpfGlobal(listSolic, listErros));
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

  const mergeErroBugDocIntoCaches = useCallback((doc) => {
    if (!doc) return;
    const sid = normalizeMongoId(doc._id ?? doc.id);
    if (!sid) return;
    const patch = (list) => {
      if (!Array.isArray(list)) return list;
      const idx = list.findIndex((r) => normalizeMongoId(r._id ?? r.id) === sid);
      if (idx === -1) return list;
      const next = [...list];
      next[idx] = { ...list[idx], ...doc };
      return next;
    };
    setErrosBugsRaw((prev) => patch(prev));
    setSearchResults((prev) => patch(prev));
  }, []);

  const atualizarDocumentoNoModal = async (docId) => {
    const id = docId || selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return null;
    try {
      if (isDocErrosBugsCollection(selectedRepliesRequest)) {
        const res = await errosBugsAPI.getById(id);
        if (res?.success && res?.data) {
          setSelectedRepliesRequest(res.data);
          return res.data;
        }
      } else {
        const resSolic = await solicitacoesAPI.getById(id);
        if (resSolic?.data) {
          setSelectedRepliesRequest(resSolic.data);
          return resSolic.data;
        }
      }
    } catch (err) {
      console.error('[ErrosBugsTab] atualizarDocumentoNoModal:', err);
    }
    return null;
  };

  const abrirModalDesdeLogLocal = async (logItem) => {
    const lid = logItem?.requestId;
    try {
      if (lid) {
        const resultErro = await errosBugsAPI.getById(lid);
        if (resultErro?.success && resultErro?.data) {
          setSelectedRepliesRequest(resultErro.data);
          return;
        }
        const resultSolic = await solicitacoesAPI.getById(lid);
        if (resultSolic?.data) {
          setSelectedRepliesRequest(resultSolic.data);
          return;
        }
      }
      const arr = (Array.isArray(errosBugsRaw) ? errosBugsRaw : []).filter(isDocErrosBugsCollection);
      const match = logItem?.waMessageId
        ? arr.find((r) => r.waMessageId === logItem.waMessageId)
        : arr.find((r) => r.cpf === logItem.cpf && isDocErrosBugsCollection(r));
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
      if (isDocErrosBugsCollection(selectedRepliesRequest)) {
        await errosBugsAPI.addReply(id, {
          origem: 'n1',
          status: 'enviado',
          msgProdutos: null,
          msgN1: texto,
        });
      } else {
        await solicitacoesAPI.addReply(id, {
          origem: 'n1',
          status: 'enviado',
          msgProdutos: null,
          msgN1: texto,
        });
      }
      const docN1 = await atualizarDocumentoNoModal(id);
      if (docN1) mergeErroBugDocIntoCaches(docN1);
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
      if (isDocErrosBugsCollection(selectedRepliesRequest)) {
        await errosBugsAPI.cancelarRegistro(id);
      } else {
        await solicitacoesAPI.cancelarSolicitacao(id);
      }
      const docCancel = await atualizarDocumentoNoModal(id);
      if (docCancel) mergeErroBugDocIntoCaches(docCancel);
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

  const norm = (s = '') => String(s).toLowerCase().trim().replace(/\s+/g, ' ');

  useEffect(() => {
    const arr = (Array.isArray(errosBugsRaw) ? errosBugsRaw : []).filter(isDocErrosBugsCollection);
    const base = selectedAgent
      ? arr.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : arr;
    try {
      if (typeof document !== 'undefined' && document.hidden) {
        const unread = listUnreadProdutosDocs(base, STORAGE_PROD_READ_ERROS_BUGS);
        for (const it of unread) {
          const sig = produtosUnreadNotifySig('erros', it.id, it.lastAt);
          if (hasProdutosNotificationBeenSent(sig)) continue;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('VeloHub — Time Produtos (Erros/Bugs)', {
              body: `${it.tipo} — CPF ${it.cpf}\n${it.preview || 'Nova mensagem'}`,
            });
            markProdutosNotificationSent(sig);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao notificar Produtos (Erros/Bugs):', err);
    }
  }, [errosBugsRaw, selectedAgent]);

  /**
   * Mesma ideia da aba Solicitações: base no GET (filtrado por colaborador) + linhas do cache só para ids ainda não na lista.
   */
  const errosBugsSidebarDisplayLogs = useMemo(() => {
    const arr = (Array.isArray(errosBugsRaw) ? errosBugsRaw : []).filter(isDocErrosBugsCollection);
    const base = selectedAgent
      ? arr.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : arr;
    const sortedServer = [...base].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    const fromServer = sortedServer.slice(0, 100).map((r) => ({
      requestId: normalizeMongoId(r._id ?? r.id) || undefined,
      cpf: String(r.cpf || '').replace(/\D/g, ''),
      tipo: r.tipo,
      status: getStatusChamado(r),
      createdAt: r.createdAt,
      reply: Array.isArray(r.reply) ? r.reply : undefined,
      enviado: true,
      waMessageId: r.waMessageId,
    }));
    const seen = new Set(
      fromServer
        .map((x) => normalizeMongoId(x.requestId))
        .filter((id) => /^[a-f0-9]{24}$/.test(id))
    );
    const extras = [];
    for (const l of Array.isArray(localLogs) ? localLogs : []) {
      if (!isDocErrosBugsCollection({ tipo: l?.tipo })) continue;
      const rid = normalizeMongoId(l?.requestId);
      if (rid && /^[a-f0-9]{24}$/.test(rid)) {
        if (seen.has(rid)) continue;
        seen.add(rid);
      }
      extras.push(l);
    }
    const merged = [...fromServer, ...extras];
    merged.sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    return merged.slice(0, 100);
  }, [localLogs, errosBugsRaw, selectedAgent]);

  /**
   * Atualizar status dos logs locais e estatísticas
   */
  const refreshNow = async () => {
    await loadStats();
    if (!localLogs.length) return;
    try {
      const agentName = String(selectedAgent || agente || '').trim();
      const result = agentName
        ? await errosBugsAPI.getByColaborador(agentName)
        : await errosBugsAPI.getAll();
      const all = (Array.isArray(result.data) ? result.data : []).filter(isDocErrosBugsCollection);
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

  /** Pelo menos uma imagem ou vídeo com URL (GCS). */
  const temAnexoParaEnvio = useMemo(() => {
    const imgOk =
      Array.isArray(imagens) && imagens.some((im) => String(im?.imagemUrl || '').trim() !== '');
    const vidOk =
      Array.isArray(videos) && videos.some((v) => String(v?.videoUrl || '').trim() !== '');
    return imgOk || vidOk;
  }, [imagens, videos]);

  /** Envio permitido: anexo obrigatório, salvo se «Cliente Recusou Evidencias» estiver marcado. */
  const podeEnviarComRegraAnexos = useMemo(
    () => temAnexoParaEnvio || clienteRecusouEvidencias,
    [temAnexoParaEnvio, clienteRecusouEvidencias]
  );

  /**
   * Montar legenda para WhatsApp
   * @returns {string} Legenda formatada
   */
  const montarLegenda = () => {
    const agentName = selectedAgent || agente || '';
    const simNao = v => (v ? '✅ Sim' : '❌ Não');
    let m = `*Novo Erro/Bug - ${tipo}*\n\n`;
    m += `Agente: ${agentName}\n`;
    if (cpf) m += `CPF: ${formatarCPF(cpf)}\n`;
    
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
    
    if (clienteRecusouEvidencias) {
      m += `\n[Cliente Recusou Evidencias]\n`;
    }
    if (imagens?.length || videos?.length) {
      const totalAnexos = (imagens?.length || 0) + (videos?.length || 0);
      const tipos = [];
      if (imagens?.length) tipos.push(`${imagens.length} imagem(ns)`);
      if (videos?.length) tipos.push(`${videos.length} vídeo(s)`);
      m += `\n[Anexos: ${totalAnexos} - ${tipos.join(', ')}]\n`;
    }
    const urgTags = [];
    if (urgenciaN2) urgTags.push('N2');
    if (urgenciaRa) urgTags.push('RA');
    if (urgenciaBacen) urgTags.push('Bacen');
    if (urgenciaProcon) urgTags.push('ProCon');
    if (urgTags.length) {
      m += `\n*Solicitação urgente*: ${urgTags.join(', ')}\n`;
    }
    return m;
  };

  const formatDataAberturaHistoricoErrosModal = (iso) => {
    if (iso == null || iso === '') return '—';
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString('pt-BR') : '—';
  };

  const fecharModalHistoricoCpfErrosBugs = () => setModalHistoricoCpfErrosBugs(null);

  /**
   * POST erro/bug após validações e, se houver CPF, possível confirmação no modal.
   * @param {Object} erroBugData - corpo já montado para errosBugsAPI.create
   */
  const executarPostErroBug = async (erroBugData) => {
    setLoading(true);
    setMsg('');
    try {
      const result = await errosBugsAPI.create(erroBugData);

      const created = result?.data;
      const cpfNorm = String(erroBugData?.cpf || '').replace(/\D/g, '');
      const requestId =
        created?._id != null
          ? String(created._id)
          : created?.id != null
            ? String(created.id)
            : undefined;
      const newItem = {
        requestId,
        cpf: cpfNorm,
        tipo: `Erro/Bug - ${erroBugData?.tipo ?? tipo}`,
        waMessageId: null,
        status: getStatusChamado(created) || 'enviado',
        createdAt: new Date().toISOString(),
        reply: Array.isArray(created?.reply) ? created.reply : undefined,
      };
      saveCache([newItem, ...localLogs].slice(0, 50));

      setMsg('Registrado no painel com sucesso.');
      setCpf('');
      setDescricao('');
      setMarca('');
      setModelo('');
      setImagens([]);
      setVideos([]);
      setClienteRecusouEvidencias(false);
      setExcluirVelotax(false);
      setExcluirCelcoin(false);
      setSaldoZerado(false);
      setPortabilidadePendente(false);
      setDividaIrpfQuitada(false);
      setUrgenciaN2(false);
      setUrgenciaRa(false);
      setUrgenciaBacen(false);
      setUrgenciaProcon(false);
      setPainelUrgenteAberto(false);
      await loadStats();
    } catch (err) {
      console.error('Erro ao enviar erro/bug:', err);
      setMsg('Falha ao enviar/registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarModalHistoricoEEnviarErrosBugs = async () => {
    const m = modalHistoricoCpfErrosBugs;
    const data = m?.pending?.erroBugData;
    fecharModalHistoricoCpfErrosBugs();
    if (data) await executarPostErroBug(data);
  };

  /**
   * Enviar erro/bug
   * @param {Event} e - Evento do formulário
   */
  const enviar = async (e) => {
    e.preventDefault();
    if (!podeEnviarComRegraAnexos) {
      toast.error('Envio bloqueado.');
      return;
    }

    const agentName = selectedAgent || agente || '';
    const cpfApenasNumeros = String(cpf || '').replace(/\D/g, '');
    const ticketTrim = String(ticketOctadesk || '').trim();
    if (!ticketTrim) {
      toast.error('Informe o Ticket (número Octadesk).');
      return;
    }

    const erroBugData = {
      agente: agentName,
      cpf: cpfApenasNumeros,
      tipo,
      protocolosCentral: [ticketTrim],
      payload: {
        agente: agentName,
        cpf: cpfApenasNumeros,
        tipo,
        descricao,
        marca: marca || '',
        modelo: modelo || '',
        imagens: imagens?.map(({ nome, imagemUrl }) => ({ nome, imagemUrl })) || [],
        videos: videos?.map(({ nome, videoUrl }) => ({ nome, videoUrl })) || [],
        ...(clienteRecusouEvidencias ? { clienteRecusouEvidencias: true } : {}),
        exclusao:
          tipo === 'Exclusão de Conta'
            ? {
                excluirVelotax: !!excluirVelotax,
                excluirCelcoin: !!excluirCelcoin,
                saldoZerado: !!saldoZerado,
                portabilidadePendente: !!portabilidadePendente,
                dividaIrpfQuitada: !!dividaIrpfQuitada,
              }
            : undefined,
        ...(urgenciaN2 ? { urgenciaN2: true } : {}),
        ...(urgenciaRa ? { urgenciaRa: true } : {}),
        ...(urgenciaBacen ? { urgenciaBacen: true } : {}),
        ...(urgenciaProcon ? { urgenciaProcon: true } : {}),
      },
    };

    // Sem CPF digitado: não há histórico a cruzar nesta aba (mesma ideia do escopo da varredura).
    if (!cpfApenasNumeros) {
      await executarPostErroBug(erroBugData);
      return;
    }

    setVerificandoHistoricoCpf(true);
    try {
      let result;
      try {
        result = await errosBugsAPI.getByCpf(cpfApenasNumeros);
      } catch (scanErr) {
        console.error('[ErrosBugsTab] Erro ao verificar histórico por CPF:', scanErr);
        toast.error('Não foi possível verificar registros anteriores para este CPF.');
        return;
      }

      if (!result) {
        toast.error('Resposta vazia ao verificar histórico por CPF.');
        return;
      }
      if (!result.success && result.success !== undefined) {
        toast.error(result.message || result.error || 'Erro ao verificar histórico por CPF.');
        return;
      }

      const rawList = Array.isArray(result.data) ? result.data : [];
      const filtrado = rawList.filter((r) => {
        if (!isDocErrosBugsCollection(r)) return false;
        const dc = String(r.cpf || '').replace(/\D/g, '');
        return dc === cpfApenasNumeros;
      });
      const { abertas, resolvidas } = partitionRequisicoesAbertasResolvidasParaModal(filtrado);

      if (filtrado.length > 0) {
        setModalHistoricoCpfErrosBugs({
          cpfDigits: cpfApenasNumeros,
          cpfDisplay: formatarCPF(cpfApenasNumeros),
          abertas,
          resolvidas,
          pending: { erroBugData },
        });
        return;
      }

      await executarPostErroBug(erroBugData);
    } finally {
      setVerificandoHistoricoCpf(false);
    }
  };

  return (
    <>
      {modalHistoricoCpfErrosBugs && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 10060 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="erros-bugs-modal-historico-cpf-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/60"
              onClick={fecharModalHistoricoCpfErrosBugs}
              aria-label="Fechar sem enviar"
            />
            <div
              className="relative w-full max-w-lg max-h-[min(92vh,640px)] flex flex-col rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
              style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
            >
              <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-[#000058]/5 dark:bg-gray-900/40">
                <h2
                  id="erros-bugs-modal-historico-cpf-title"
                  className="text-base font-semibold text-gray-900 dark:text-gray-100"
                >
                  {modalHistoricoCpfErrosBugs.abertas.length > 0
                    ? `Registro em aberto (Erros/Bugs) para o CPF ${modalHistoricoCpfErrosBugs.cpfDisplay || '—'}`
                    : `Histórico de Erros/Bugs para o CPF ${modalHistoricoCpfErrosBugs.cpfDisplay || '—'}`}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Solicitações abertas
                  </h3>
                  <div
                    className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
                    style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                  >
                    {modalHistoricoCpfErrosBugs.abertas.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma encontrada nesta lista.</p>
                    ) : (
                      modalHistoricoCpfErrosBugs.abertas.map((row) => (
                        <div key={row.key} className="p-3 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{row.tipo}</div>
                          {row.origemLabel ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Origem: {row.origemLabel}
                            </div>
                          ) : null}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Status: {row.statusChamado === 'enviado' ? 'enviado' : row.statusChamado}
                            {' · '}
                            Data de abertura: {formatDataAberturaHistoricoErrosModal(row.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Solicitações resolvidas
                  </h3>
                  <div
                    className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
                    style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                  >
                    {modalHistoricoCpfErrosBugs.resolvidas.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma encontrada nesta lista.</p>
                    ) : (
                      modalHistoricoCpfErrosBugs.resolvidas.map((row) => (
                        <div key={row.key} className="p-3 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{row.tipo}</div>
                          {row.origemLabel ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Origem: {row.origemLabel}
                            </div>
                          ) : null}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Status: {row.statusChamado}
                            {' · '}
                            Data de abertura: {formatDataAberturaHistoricoErrosModal(row.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={fecharModalHistoricoCpfErrosBugs}
                  style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                  onClick={() => confirmarModalHistoricoEEnviarErrosBugs()}
                  disabled={loading}
                  style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                >
                  Confirmar envio
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {verificandoHistoricoCpf && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55]"
          style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.28))' }}
        >
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <svg
                className="animate-spin h-12 w-12 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-800 dark:text-gray-200 text-center">
                Verificando registros anteriores para este CPF…
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-vh-container">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-800 dark:text-gray-200">Enviando solicitação…</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8 items-start">
      <div
        ref={errosBugsMainCardRef}
        className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-vh-card shadow-lg p-6 hover:-translate-y-0.5 transition-transform"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        {/* Cards de Estatísticas + Campo Agente + Botão Atualizar */}
        <div className="mb-6 flex items-center justify-between gap-3 relative">
          <div
            className="grid grid-cols-3 gap-3 w-full max-w-xl"
            aria-busy={statsLoading}
            aria-live="polite"
          >
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-vh-card text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Hoje</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {statsLoading ? (
                  <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                ) : (
                  stats.today
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-vh-card text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Pendentes</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {statsLoading ? (
                  <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                ) : (
                  stats.pending
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-vh-card text-center border" style={{ borderColor: '#000058' }}>
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
        <div className="max-w-md">
          <FloatingLabelField label="Ticket" value={ticketOctadesk}>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
              placeholder="Número do ticket Octadesk"
              value={ticketOctadesk}
              onChange={(e) => setTicketOctadesk(e.target.value)}
              required
            />
          </FloatingLabelField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FloatingLabelField label="CPF" value={formatarCPF(cpf)}>
              <input
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 ${
                  validarCPF(cpf)
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-400 dark:border-gray-500 focus:ring-blue-500'
                }`}
                value={formatarCPF(cpf)}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
                autoComplete="off"
              />
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField label="Tipo" value={tipo}>
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
            </FloatingLabelField>
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
          <FloatingLabelField label="Descrição" value={descricao}>
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
          </FloatingLabelField>
        </div>

        {/* Campos Marca e Modelo - mesma linha do grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FloatingLabelField label="Marca" value={marca}>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Samsung, Apple, etc."
              />
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField label="Modelo" value={modelo}>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Galaxy S21, iPhone 13, etc."
              />
            </FloatingLabelField>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-300 shrink-0">Anexos</label>
            <div className="flex flex-wrap gap-2 items-center">
            <label className={`inline-flex items-center gap-2 px-3 py-2 rounded bg-sky-600 text-white cursor-pointer hover:bg-sky-700 transition-colors text-sm ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <Image className="w-4 h-4 shrink-0" aria-hidden />
              <span>{uploading ? 'Enviando...' : 'Selecionar imagens'}</span>
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
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
            <label className={`inline-flex items-center gap-2 px-3 py-2 rounded bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition-colors text-sm ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <Video className="w-4 h-4 shrink-0" aria-hidden />
              <span>{uploading ? 'Enviando...' : 'Selecionar vídeos'}</span>
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
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
            </div>
            <label className="inline-flex items-center gap-2 shrink-0 cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={clienteRecusouEvidencias}
                onChange={(e) => setClienteRecusouEvidencias(e.target.checked)}
                className="w-4 h-4 rounded border-gray-400 dark:border-gray-500"
              />
              <span>Cliente Recusou Evidencias</span>
            </label>
          </div>
          {(imagens?.length > 0 || videos?.length > 0) && (
            <>
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

        <SolicitacaoUrgenteBlock
          painelAberto={painelUrgenteAberto}
          onTogglePainel={() => setPainelUrgenteAberto((o) => !o)}
          values={{
            urgenciaN2,
            urgenciaRa,
            urgenciaBacen,
            urgenciaProcon,
          }}
          onCheckedChange={(chave, marcado) => {
            if (chave === 'urgenciaN2') setUrgenciaN2(marcado);
            else if (chave === 'urgenciaRa') setUrgenciaRa(marcado);
            else if (chave === 'urgenciaBacen') setUrgenciaBacen(marcado);
            else if (chave === 'urgenciaProcon') setUrgenciaProcon(marcado);
          }}
        />

        <div className="flex items-center justify-end gap-4 flex-wrap">
          {msg && <span className="text-sm text-gray-700 dark:text-gray-300">{msg}</span>}
          <button
            type="submit"
            disabled={loading || verificandoHistoricoCpf || !podeEnviarComRegraAnexos}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 ${
              loading || verificandoHistoricoCpf || !podeEnviarComRegraAnexos ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : verificandoHistoricoCpf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verificando…
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
        className="w-[400px] flex-shrink-0 self-start flex flex-col min-h-0 rounded-vh-card hover:-translate-y-0.5 transition-transform"
        style={{
          ...(errosBugsSidebarHeightPx != null && errosBugsSidebarHeightPx > 0
            ? { height: errosBugsSidebarHeightPx }
            : {}),
        }}
        aria-label="Busca e acompanhamento"
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-800 shadow-lg p-4 rounded-vh-card">
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
                className={`min-w-0 flex-1 basis-[160px] border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white focus:ring-2 ${
                  validarCPF(searchCpf)
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-400 dark:border-gray-500 focus:ring-blue-500'
                }`}
                placeholder="000.000.000-00"
                aria-label="CPF para busca"
                value={formatarCPF(searchCpf)}
                onChange={(e) => setSearchCpf(formatarCPF(e.target.value))}
                maxLength={14}
                inputMode="numeric"
                autoComplete="off"
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

          <div
            className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2"
            data-prod-read-epoch={prodReadEpoch}
          >
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
                  const origemLabel = isDocErrosBugsCollection(r)
                    ? 'Erros/Bugs'
                    : isDocLiberacaoPixProdColecao(r)
                    ? 'Liberação chave pix'
                    : 'Solicitações';
                  const buscaCancelada = getStatusChamado(r) === 'Cancelado';
                  const strikeCancel = buscaCancelada
                    ? 'line-through decoration-gray-500 dark:decoration-gray-400'
                    : '';
                  const buscaRid = r._id || r.id;
                  const buscaCardProdUnread =
                    buscaRid != null &&
                    buscaRid !== '' &&
                    hasUnreadProdutosInReplies(String(buscaRid), r.reply, STORAGE_PROD_READ_ERROS_BUGS);
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
                  const buscaCardBody = (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleCardClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(e);
                        }
                      }}
                      className={`p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer transition-colors ${
                        buscaCardProdUnread
                          ? 'rounded-[12px] border border-transparent hover:border-blue-300 dark:hover:border-blue-500'
                          : 'rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      aria-label={
                        buscaCardProdUnread
                          ? 'Há mensagem do time Produtos não lida neste chamado'
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-medium text-gray-800 dark:text-gray-200 text-sm ${strikeCancel}`}>
                          {tipoLimpo}
                        </span>
                        <span className={`font-bold text-gray-800 dark:text-gray-200 text-sm ${strikeCancel}`}>
                          {r.cpf || '—'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px]">
                          Origem: {origemLabel}
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
                  return (
                    <div key={String(buscaRid)} className="shrink-0">
                      {buscaCardProdUnread ? (
                        <div
                          className="p-[2px] rounded-[14px]"
                          style={{
                            background:
                              'linear-gradient(135deg, #006AB9 0%, #FACC15 42%, #1D4ED8 100%)',
                          }}
                        >
                          {buscaCardBody}
                        </div>
                      ) : (
                        buscaCardBody
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {errosBugsSidebarDisplayLogs && errosBugsSidebarDisplayLogs.length > 0 && (
              <div className="space-y-2">
                {errosBugsSidebarDisplayLogs.map((l, idx) => {
                  const statusChamado = getStatusChamado(l);
                  const isCancelado = statusChamado === 'Cancelado';
                  const strikeLogCancel = isCancelado
                    ? 'line-through decoration-gray-500 dark:decoration-gray-400'
                    : '';
                  const s = String(statusChamado || l.status || '').toLowerCase();
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
                  const logCardProdUnread =
                    l?.requestId &&
                    hasUnreadProdutosInReplies(
                      String(l.requestId),
                      l.reply,
                      STORAGE_PROD_READ_ERROS_BUGS
                    );
                  const openFromLog = (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                    e.preventDefault();
                    abrirModalDesdeLogLocal(l);
                  };
                  const logCardBody = (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={openFromLog}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openFromLog(e);
                        }
                      }}
                      className={`p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer transition-colors ${
                        logCardProdUnread
                          ? 'rounded-[12px] border border-transparent hover:border-blue-300 dark:hover:border-blue-500'
                          : 'rounded border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                      aria-label={
                        logCardProdUnread
                          ? 'Há mensagem do time Produtos não lida neste chamado'
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl flex-shrink-0">{icon}</span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                            <span className={strikeLogCancel}>{l.cpf || '—'}</span>
                            <span className="mx-0.5">—</span>
                            <span className={strikeLogCancel}>{l.tipo}</span>
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
                          {statusChamado || l.status || s || 'em aberto'}
                        </span>
                      </div>
                    </div>
                  );
                  return (
                    <div key={`envio-${logKey}`} className="shrink-0">
                      {logCardProdUnread ? (
                        <div
                          className="p-[2px] rounded-[14px]"
                          style={{
                            background:
                              'linear-gradient(135deg, #006AB9 0%, #FACC15 42%, #1D4ED8 100%)',
                          }}
                        >
                          {logCardBody}
                        </div>
                      ) : (
                        logCardBody
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!searchLoading &&
              (!searchResults || searchResults.length === 0) &&
              (!errosBugsSidebarDisplayLogs || errosBugsSidebarDisplayLogs.length === 0) &&
              !String(searchCpf || '').trim() && (
                <div className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">
                  Busque por CPF ou envie um erro/bug; os itens aparecem aqui.
                </div>
              )}
          </div>
        </div>
      </div>
      </div>

      {/* Modal de Anexos */}
      {showAttachmentsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-vh-container max-w-4xl max-h-[90vh] w-full overflow-hidden">
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
            className="bg-white dark:bg-gray-800 rounded-vh-container max-w-4xl w-full min-h-[72vh] max-h-[96vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0 flex-1 pr-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                  Respostas — {selectedRepliesRequest.tipo || '—'} — {selectedRepliesRequest.cpf || '—'}
                </h3>
                <span className="text-gray-300 dark:text-gray-600 select-none hidden sm:inline" aria-hidden>|</span>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Status do chamado
                  </span>
                  {(() => {
                    const chamadoStatus = getStatusChamado(selectedRepliesRequest);
                    const statusAt = getStatusChamadoAssignedAt(selectedRepliesRequest);
                    return (
                      <>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                            chamadoStatus
                          )}`}
                        >
                          {chamadoStatus}
                        </span>
                        {isTerminalChamadoStatusForHeader(chamadoStatus) && statusAt ? (
                          <span
                            className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            title="Status atribuído em"
                          >
                            {statusAt.toLocaleString('pt-BR')}
                          </span>
                        ) : null}
                      </>
                    );
                  })()}
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

                {/* Anexos: lista atual + adicionar (novo formato imagemUrl/videoUrl e legado previews/videoData) */}
                <div className="space-y-3">
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
                  return (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
                      Nenhum anexo neste registro.
                    </p>
                  );
                })()}
                  {getStatusChamado(selectedRepliesRequest) !== 'Cancelado' && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                        Adicionar anexos
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        <label
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded bg-sky-600 text-white cursor-pointer hover:bg-sky-700 transition-colors text-sm ${
                            modalAnexosUploading ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          <Image className="w-4 h-4 shrink-0" aria-hidden />
                          <span>{modalAnexosUploading ? 'Enviando...' : 'Selecionar imagens'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={modalAnexosUploading}
                            onChange={async (e) => {
                              const fl = e.target.files;
                              if (fl?.length) await processModalAnexos(fl, 'imagem');
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                        <label
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition-colors text-sm ${
                            modalAnexosUploading ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          <Video className="w-4 h-4 shrink-0" aria-hidden />
                          <span>{modalAnexosUploading ? 'Enviando...' : 'Selecionar vídeos'}</span>
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            disabled={modalAnexosUploading}
                            onChange={async (e) => {
                              const fl = e.target.files;
                              if (fl?.length) await processModalAnexos(fl, 'video');
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

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
                                    <div className="max-w-[min(100%,28rem)] rounded-vh-card px-3 py-2.5 border-l-4 border-[#006AB9] bg-sky-50 dark:bg-sky-950/35 dark:border-sky-500 shadow-sm">
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
                                    <div className="max-w-[min(100%,28rem)] rounded-vh-card px-3 py-2.5 border-r-4 border-amber-500 bg-amber-50 dark:bg-amber-950/35 dark:border-amber-400 shadow-sm">
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
              const bloqueado = modalSalvarN1Loading || modalCancelarRegLoading || modalAnexosUploading;
              return (
                <div className="border-t border-gray-200 dark:border-gray-600 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
                  <FloatingLabelField id="erros-modal-n1-resposta" label="Resposta N1" value={modalN1Draft}>
                    <textarea
                      rows={2}
                      className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[44px] disabled:opacity-60"
                      placeholder="Digite a mensagem do agente N1…"
                      value={modalN1Draft}
                      onChange={(e) => setModalN1Draft(e.target.value)}
                      disabled={cancelada || bloqueado}
                    />
                  </FloatingLabelField>
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
    </>
  );
};

export default ErrosBugsTab;


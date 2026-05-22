/**
 * VeloHub V3 - OuvidoriaPage (Módulo Ouvidoria/BACEN)
 * VERSION: v1.18.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.18.0: Fusão — marca Liberação Anterior no form quando grupo tem pixLiberado
 * - v1.17.0: Modal fusão — seleção clicável de tickets a fundir (múltiplos alvos na confirmação)
 * - v1.16.2: Modal Fundir ocorrências — largura moderada (max-w-4xl)
 * - v1.16.1: Modal Fundir ocorrências — largura ampliada (sem scroll horizontal)
 * - v1.16.0: Modal Fundir ocorrências — CPF no header; ocorrência atual + caixas abertas/fechadas em tabela
 * - v1.15.5: Removida instrumentação de debug NDJSON ingest `e53832` no fluxo de fusão
 * - v1.15.4: Instrumentação de debug do fluxo de fusão na aba Nova (contexto, cenario e pendência para create)
 * - v1.15.3: Sincronização de `userSession` com `auth.getUserSession()` + listeners `user-info-updated` / `storage` (evita «Minhas» com nome/email antigos quando veloacademy_user_session ainda existe)
 * - v1.15.2: Minhas / badge Req_Prod+fusão — getByColaborador com email da sessão; FormReclamacao repassa responsavelEmail
 * - v1.15.0: Aba «Chargeback» entre Lista de Reclamações e Dashboard (shell ChargebackOuvidoria)
 * - v1.14.0: Badge «Minhas» — fallback colaboradorNome; refresh ao velohub:ouvid-minhas-loaded
 * - v1.12.1: Modal fusão sem texto extra não solicitado (aba Nova)
 * - v1.12.0: Modal Fundir ocorrências: texto objetivo (tickets encontrados + regra hierárquia)
 * - v1.7.0: Removido bypass e bloqueio da aba "Análise Diária"
 * - v1.6.0: Adicionado bypass de acesso para aba "Análise Diária"
 */

import React, { useCallback, useEffect, useState } from 'react';
import { reclamacoesAPI, dashboardAPI, clientesAPI } from '../services/ouvidoriaApi';
import { API_BASE_URL } from '../config/api-config';
import DashboardOuvidoria from '../components/Ouvidoria/DashboardOuvidoria';
import FormReclamacao from '../components/Ouvidoria/FormReclamacao';
import ListaReclamacoes from '../components/Ouvidoria/ListaReclamacoes';
import ChargebackOuvidoria from '../components/Ouvidoria/ChargebackOuvidoria';
import MinhasReclamacoes from '../components/Ouvidoria/MinhasReclamacoes';
import RelatoriosOuvidoria from '../components/Ouvidoria/RelatoriosOuvidoria';
import HistoricoCliente from '../components/Ouvidoria/HistoricoCliente';
import AnaliseDiaria from '../components/Ouvidoria/AnaliseDiaria';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VeloChatWidget from '../components/VeloChatWidget';
import ChatStatusSelector from '../components/ChatStatusSelector';
import toast from 'react-hot-toast';
import { countUnreadFeitoOuvidReqProd } from '../utils/ouvidoriaReqProdNotif';
import { countUnreadFusaoAbsAlvo } from '../utils/ouvidoriaFusaoNotif';
import { getUserSession } from '../services/auth';
import ModalFusaoOcorrencias from '../components/Ouvidoria/ModalFusaoOcorrencias';
import {
  buildFusaoAlvosFromSelection,
  deveMarcarLiberacaoAnteriorNoAtual,
  getSelectedFusaoDocs,
} from '../utils/ouvidoriaFusaoModalDisplay';

/**
 * Página principal do módulo de Ouvidoria
 */
const OuvidoriaPage = () => {
  const [activeTab, setActiveTab] = useState('nova');
  const [searchCpf, setSearchCpf] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  /** Contexto da última consulta por CPF com cenário de fusão (aba nova ou lista/edit) */
  const [fusaoConsultaCtx, setFusaoConsultaCtx] = useState(null);
  const [modalFusaoAberto, setModalFusaoAberto] = useState(false);
  const [redundantePapel, setRedundantePapel] = useState('current_parent');
  const [fusaoSubmitting, setFusaoSubmitting] = useState(false);
  const [listaReloadSignal, setListaReloadSignal] = useState(0);
  const [minhasReloadSignal, setMinhasReloadSignal] = useState(0);
  /** Fusão confirmada na aba Nova antes de existir _id — enviada no POST create */
  const [fusaoPendenteParaCreate, setFusaoPendenteParaCreate] = useState(null);
  /** IDs Mongo (_id) dos tickets marcados no modal de fusão */
  const [selectedFusaoTicketIds, setSelectedFusaoTicketIds] = useState(() => new Set());
  /** Incrementado para marcar Liberação Anterior no formulário aberto (fusão + PIX) */
  const [fusaoLiberacaoAnteriorSignal, setFusaoLiberacaoAnteriorSignal] = useState(0);
  const [ouvidMinhasBadgeParts, setOuvidMinhasBadgeParts] = useState({ feito: 0, fusao: 0 });

  const ouvidMinhasBadgeSum =
    ouvidMinhasBadgeParts.feito + ouvidMinhasBadgeParts.fusao;
  const ouvidMinhasBadgeTitle =
    ouvidMinhasBadgeParts.feito > 0 || ouvidMinhasBadgeParts.fusao > 0
      ? [
          ouvidMinhasBadgeParts.feito > 0
            ? `${ouvidMinhasBadgeParts.feito} Req_Prod «Feito» não visualizado(s)`
            : null,
          ouvidMinhasBadgeParts.fusao > 0
            ? `${ouvidMinhasBadgeParts.fusao} fusão(ões) não reconhecida(s)`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  // Estados do sidebar direito com chat
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true); // Recolhido por padrão
  const [chatActiveTab, setChatActiveTab] = useState('conversations');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('velochat_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    try {
      localStorage.setItem('velochat_sound_enabled', newState.toString());
    } catch (error) {
      console.error('Erro ao salvar preferência de som:', error);
    }
  };
  
  // Função para calcular grid columns
  const getGridColumns = (rightCollapsed) => {
    if (rightCollapsed) {
      return '1fr 10px';
    } else {
      return 'minmax(0, 1fr) minmax(0, 35%)';
    }
  };

  // Sessão sempre alinhada a auth.js (SESSION_KEY VeloHub), não veloacademy_* órfão
  useEffect(() => {
    const syncFromAuth = () => {
      try {
        setUserSession(getUserSession());
      } catch (_e) {
        setUserSession(null);
      }
    };
    syncFromAuth();
    window.addEventListener('user-info-updated', syncFromAuth);
    window.addEventListener('storage', syncFromAuth);
    return () => {
      window.removeEventListener('user-info-updated', syncFromAuth);
      window.removeEventListener('storage', syncFromAuth);
    };
  }, []);

  const refreshOuvidReqProdUnread = useCallback(async () => {
    const nome = String(userSession?.user?.name || userSession?.colaboradorNome || '').trim();
    if (!nome) {
      setOuvidMinhasBadgeParts({ feito: 0, fusao: 0 });
      return;
    }
    const emailLc =
      userSession?.user?.email != null
        ? String(userSession.user.email).trim().toLowerCase()
        : '';
    try {
      const resultado = await reclamacoesAPI.getByColaborador(nome, {
        colaboradorEmail: emailLc || undefined,
      });
      const dados = resultado?.data ?? resultado ?? [];
      const list = Array.isArray(dados) ? dados : [];
      setOuvidMinhasBadgeParts({
        feito: countUnreadFeitoOuvidReqProd(list),
        fusao: countUnreadFusaoAbsAlvo(list),
      });
    } catch (e) {
      console.error('[OuvidoriaPage] badge Minhas (Req / fusão):', e);
    }
  }, [userSession?.user?.name, userSession?.colaboradorNome, userSession?.user?.email]);

  useEffect(() => {
    refreshOuvidReqProdUnread();
    const t = setInterval(refreshOuvidReqProdUnread, 90 * 1000);
    return () => clearInterval(t);
  }, [refreshOuvidReqProdUnread]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) refreshOuvidReqProdUnread();
    };
    const onRead = () => refreshOuvidReqProdUnread();
    const onFusRead = () => refreshOuvidReqProdUnread();
    const onMinhasLoaded = () => refreshOuvidReqProdUnread();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('velohub:ouvid-reqprod-read', onRead);
    window.addEventListener('velohub:ouvid-fusao-read', onFusRead);
    window.addEventListener('velohub:ouvid-minhas-loaded', onMinhasLoaded);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('velohub:ouvid-reqprod-read', onRead);
      window.removeEventListener('velohub:ouvid-fusao-read', onFusRead);
      window.removeEventListener('velohub:ouvid-minhas-loaded', onMinhasLoaded);
    };
  }, [refreshOuvidReqProdUnread]);

  const setFusaoCtxNova = useCallback((ctx) => {
    if (!ctx) {
      setFusaoConsultaCtx(null);
      return;
    }
    setFusaoConsultaCtx({ ...ctx, source: 'nova' });
  }, []);

  const setFusaoCtxLista = useCallback((ctx) => {
    if (!ctx) {
      setFusaoConsultaCtx(null);
      return;
    }
    setFusaoConsultaCtx({ ...ctx, source: 'lista' });
  }, []);

  const setFusaoCtxMinhas = useCallback((ctx) => {
    if (!ctx) {
      setFusaoConsultaCtx(null);
      return;
    }
    setFusaoConsultaCtx({ ...ctx, source: 'minhas' });
  }, []);

  useEffect(() => {
    setFusaoConsultaCtx((prev) => {
      if (!prev) return prev;
      if (!['nova', 'lista', 'minhas'].includes(activeTab)) return null;
      if (prev.source !== activeTab) return null;
      return prev;
    });
    if (!['nova', 'lista', 'minhas'].includes(activeTab)) {
      setModalFusaoAberto(false);
    }
  }, [activeTab]);

  // Carregar estatísticas do dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    }
  }, [activeTab]);

  /**
   * Carregar estatísticas do dashboard
   * @param {Object} filtros - Filtros opcionais (dataInicio, dataFim)
   */
  const loadDashboardStats = async (filtros = {}) => {
    setDashboardLoading(true);
    try {
      // Buscar estatísticas e métricas em paralelo com filtros
      const [statsResponse, metricasResponse] = await Promise.all([
        dashboardAPI.getStats(filtros),
        dashboardAPI.getMetricas(filtros)
      ]);
      
      // Combinar dados de stats e métricas
      const combinedData = {
        ...(statsResponse.data || statsResponse),
        ...(metricasResponse.data || metricasResponse)
      };
      
      setDashboardStats({ data: combinedData });
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do dashboard');
      // Definir valores padrão em caso de erro
      setDashboardStats({ 
        data: {
          total: 0,
          totalBacen: 0,
          totalOuvidoria: 0,
          emTratativa: 0,
          concluidas: 0,
          prazoVencendo: 0,
          taxaResolucao: 0,
          mediaPrazo: 0,
          comProcon: 0,
          liquidacaoAntecipada: 0,
          caEProtocolos: 0,
        }
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const podeExibirBotaoFundir =
    Boolean(fusaoConsultaCtx?.showButton) &&
    fusaoConsultaCtx?.source === activeTab &&
    (activeTab === 'nova' || activeTab === 'lista' || activeTab === 'minhas');

  const abrirModalFusao = () => {
    setRedundantePapel('current_parent');
    const initial = new Set();
    const tid = fusaoConsultaCtx?.targetDoc?._id;
    if (tid != null && String(tid).trim()) {
      initial.add(String(tid));
    }
    setSelectedFusaoTicketIds(initial);
    setModalFusaoAberto(true);
  };

  const toggleFusaoTicketId = useCallback((docId) => {
    const id = String(docId || '').trim();
    if (!id) return;
    setSelectedFusaoTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const aplicarLiberacaoAnteriorNoFormAberto = useCallback(() => {
    const ctx = fusaoConsultaCtx;
    if (!ctx) return;
    const selectedDocs = getSelectedFusaoDocs(ctx, selectedFusaoTicketIds);
    const currentTipo = ctx.currentTipo || ctx.currentSnapshot?.tipo;
    const currentPixLiberado = ctx.currentPixLiberado === true;
    if (
      deveMarcarLiberacaoAnteriorNoAtual({
        currentTipo,
        currentPixLiberado,
        selectedDocs,
      })
    ) {
      setFusaoLiberacaoAnteriorSignal((n) => n + 1);
    }
  }, [fusaoConsultaCtx, selectedFusaoTicketIds]);

  useEffect(() => {
    if (!modalFusaoAberto || !fusaoConsultaCtx) return;
    aplicarLiberacaoAnteriorNoFormAberto();
  }, [
    modalFusaoAberto,
    fusaoConsultaCtx,
    selectedFusaoTicketIds,
    aplicarLiberacaoAnteriorNoFormAberto,
  ]);

  const confirmarFusao = async () => {
    const ctx = fusaoConsultaCtx;
    if (!ctx?.cpf) {
      toast.error('Dados insuficientes para fundir.');
      return;
    }
    const alvos = buildFusaoAlvosFromSelection(ctx, selectedFusaoTicketIds);
    if (!alvos.length) {
      toast.error('Selecione ao menos um ticket para fundir.');
      return;
    }
    aplicarLiberacaoAnteriorNoFormAberto();
    if (!ctx.currentId) {
      if (ctx.source !== 'nova') {
        toast.error('Salve a ocorrência antes de fundir para obter o ID do registro atual.');
        return;
      }
      setFusaoPendenteParaCreate({
        targets: alvos.map((a) => ({
          targetId: a.targetId,
          targetTipo: a.targetTipo,
          cenario: a.cenario,
          ...(a.cenario === 'redundante' ? { redundantePapel } : {}),
        })),
      });
      toast.success('A fusão será aplicada ao gravar a ocorrência.');
      setModalFusaoAberto(false);
      return;
    }
    setFusaoSubmitting(true);
    try {
      let lastMessage = 'Fusão registrada com sucesso';
      for (const alvo of alvos) {
        const body = {
          cpf: ctx.cpf,
          currentId: ctx.currentId,
          currentTipo: ctx.currentTipo,
          targetId: alvo.targetId,
          targetTipo: alvo.targetTipo,
          cenario: alvo.cenario,
        };
        if (alvo.cenario === 'redundante') {
          body.redundantePapel = redundantePapel;
        }
        const res = await reclamacoesAPI.confirmFusao(body);
        if (res && res.success === false) {
          throw new Error(res.message || 'Fusão recusada');
        }
        if (res?.message) lastMessage = res.message;
      }
      toast.success(alvos.length > 1 ? `${alvos.length} fusões registradas.` : lastMessage);
      setModalFusaoAberto(false);
      setFusaoConsultaCtx(null);
      setSelectedFusaoTicketIds(new Set());
      loadDashboardStats();
      if (activeTab === 'lista') {
        setListaReloadSignal((n) => n + 1);
      }
      if (activeTab === 'minhas') {
        setMinhasReloadSignal((n) => n + 1);
      }
      refreshOuvidReqProdUnread();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Erro ao confirmar fusão');
    } finally {
      setFusaoSubmitting(false);
    }
  };

  /**
   * Buscar cliente por CPF
   */
  const buscarClientePorCPF = async () => {
    if (!searchCpf || searchCpf.replace(/\D/g, '').length < 11) {
      toast.error('CPF inválido. Digite os 11 dígitos.');
      return;
    }

    setSearchLoading(true);
    try {
      const cpfLimpo = searchCpf.replace(/\D/g, '');
      const historico = await clientesAPI.getHistorico(cpfLimpo);
      setSearchResults(historico.data || historico || []);
      if (historico.data && historico.data.length === 0) {
        toast('Nenhuma reclamação encontrada para este CPF.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      toast.error('Erro ao buscar histórico do cliente');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Função helper para renderizar sidebar direito com chat
  const renderRightSidebarChat = () => {
    if (isRightSidebarCollapsed) {
      return (
        <div 
          style={{
            position: 'relative',
            width: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12px'
          }}
          onClick={() => setIsRightSidebarCollapsed(false)}
        >
          <ChevronLeft 
            size={22} 
            style={{
              color: 'var(--blue-dark)',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue-opaque)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--blue-dark)'}
          />
        </div>
      );
    }

    return (
      <aside 
        className="rounded-lg shadow-sm flex flex-col velohub-container" 
        style={{
          borderRadius: 'var(--velohub-radius-container)', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
          padding: '19.0px', 
          position: 'relative', 
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '700px',
          maxHeight: '700px',
          overflow: 'hidden',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}
      >
        {/* Botão de retração */}
        <button
          onClick={() => setIsRightSidebarCollapsed(true)}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector('svg').style.color = 'var(--blue-opaque)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector('svg').style.color = 'rgba(128, 128, 128, 0.5)';
          }}
        >
          <ChevronRight 
            size={18} 
            style={{
              color: 'rgba(128, 128, 128, 0.5)',
              transition: 'color 0.3s ease'
            }}
          />
        </button>
        
        {/* Widget VeloChat */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="flex items-center mb-4" style={{ gap: '8px', position: 'relative', flexShrink: 0 }}>
            {isSearchExpanded ? (
              <>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className="flex-1 px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--blue-opaque)',
                    borderRadius: 'var(--velohub-radius-container)',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Poppins, sans-serif',
                    marginLeft: '40px'
                  }}
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                  className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  style={{ color: 'var(--blue-dark)', minWidth: '32px', height: '32px' }}
                  title="Fechar busca"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                  <ChatStatusSelector 
                    sessionId={localStorage.getItem('velohub_session_id')} 
                    onStatusChange={() => {}}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <h3 className="font-bold text-xl velohub-title" style={{ 
                    color: 'var(--blue-dark)', 
                    margin: 0,
                    textAlign: 'center',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}>
                    Chat
                  </h3>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    onClick={toggleSound}
                    className="flex items-center justify-center p-1 rounded transition-colors"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                  >
                    {soundEnabled ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(128, 128, 128, 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)' }}
                    title="Buscar contato"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Seletor de Abas */}
          <div className="flex border-b mb-2" style={{ borderColor: 'var(--blue-opaque)', flexShrink: 0 }}>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('conversations')}
              style={chatActiveTab === 'conversations' ? {
                color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Conversas
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('contacts')}
              style={chatActiveTab === 'contacts' ? {
                color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Contatos
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('salas')}
              style={chatActiveTab === 'salas' ? {
                color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Salas
            </button>
          </div>
              
          {/* Container scrollável */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {(() => {
              const isProduction = typeof window !== 'undefined' && 
                !window.location.hostname.includes('localhost') && 
                !window.location.hostname.includes('127.0.0.1');
              
              let userName = '';
              try {
                const sessionData = localStorage.getItem('velohub_user_session');
                if (sessionData) {
                  const session = JSON.parse(sessionData);
                  userName = session?.user?.name || '';
                }
              } catch (err) {
                console.error('Erro ao obter nome do usuário:', err);
              }
              
              // Removido bypass - todos os usuários têm acesso ao chat
              
              return (
                <VeloChatWidget activeTab={chatActiveTab} searchQuery={searchQuery} />
              );
            })()}
          </div>
        </div>
      </aside>
    );
  };

  /**
   * Renderizar conteúdo da aba ativa
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOuvidoria 
            stats={dashboardStats}
            loading={dashboardLoading}
            onRefresh={loadDashboardStats}
          />
        );
      case 'minhas':
        return (
          <MinhasReclamacoes 
            colaboradorNome={
              String(userSession?.user?.name || userSession?.colaboradorNome || '').trim() || undefined
            }
            userEmail={userSession?.user?.email}
            onFusaoConsultaChange={setFusaoCtxMinhas}
            minhasReloadSignal={minhasReloadSignal}
            fusaoConsultaCtx={fusaoConsultaCtx}
            onAbrirModalFusao={abrirModalFusao}
            fusaoLiberacaoAnteriorSignal={fusaoLiberacaoAnteriorSignal}
          />
        );
      case 'nova':
        return (
          <FormReclamacao 
            responsavel={userSession?.user?.name}
            responsavelEmail={userSession?.user?.email}
            onFusaoConsultaChange={setFusaoCtxNova}
            fundirInlineAtivo={podeExibirBotaoFundir}
            onAbrirModalFusao={abrirModalFusao}
            fusaoPendenteParaCreate={fusaoPendenteParaCreate}
            onConsumeFusaoPendenteParaCreate={() => setFusaoPendenteParaCreate(null)}
            fusaoLiberacaoAnteriorSignal={fusaoLiberacaoAnteriorSignal}
            onRefreshOuvidReqProdUnread={refreshOuvidReqProdUnread}
            onSuccess={() => {
              toast.success('Reclamação criada com sucesso!');
              setActiveTab('minhas');
              loadDashboardStats();
              refreshOuvidReqProdUnread();
            }}
          />
        );
      case 'lista':
        return (
          <ListaReclamacoes
            onFusaoConsultaChange={setFusaoCtxLista}
            listaReloadSignal={listaReloadSignal}
            fusaoConsultaCtx={fusaoConsultaCtx}
            onAbrirModalFusao={abrirModalFusao}
            fusaoLiberacaoAnteriorSignal={fusaoLiberacaoAnteriorSignal}
          />
        );
      case 'chargeback':
        return <ChargebackOuvidoria responsavel={userSession?.user?.name} />;
      case 'relatorios':
        return <RelatoriosOuvidoria />;
      case 'analise-diaria':
        return <AnaliseDiaria />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full py-12" style={{paddingLeft: '20px', paddingRight: '20px'}}>
        {/* Sistema de Abas */}
        <div className="mb-4" style={{marginTop: '-15px'}}>
          {/* Abas + Fundir (contexto consulta CPF; na aba Nova o botão fica no FormReclamacao, após o seletor de tipo) */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
          <div className="flex justify-start flex-wrap" style={{gap: '2rem'}}>
            <button
              onClick={() => setActiveTab('nova')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'nova' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'nova' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Nova Reclamação
            </button>
            <button
              onClick={() => setActiveTab('minhas')}
              className={`relative px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'minhas' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'minhas' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Minhas Reclamações
              {activeTab !== 'minhas' && ouvidMinhasBadgeSum > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full text-[9px] font-bold leading-none text-white shadow-md"
                  style={{ backgroundColor: '#ff0000' }}
                  title={ouvidMinhasBadgeTitle}
                >
                  {ouvidMinhasBadgeSum > 9 ? '9+' : ouvidMinhasBadgeSum}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab('lista')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'lista' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'lista' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Lista de Reclamações
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chargeback')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'chargeback' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'chargeback' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)',
              }}
            >
              Chargeback
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'dashboard' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'dashboard' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'relatorios' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'relatorios' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Relatórios
            </button>
            <button
              onClick={() => setActiveTab('analise-diaria')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'analise-diaria' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'analise-diaria' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Análise Diária
            </button>
          </div>
          {podeExibirBotaoFundir && activeTab !== 'nova' ? (
            <button
              type="button"
              onClick={abrirModalFusao}
              className="velohub-container shrink-0 whitespace-nowrap rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90"
              style={{
                borderColor: '#b91c1c',
                color: '#991b1b',
                backgroundColor: 'rgba(185, 28, 28, 0.1)',
              }}
            >
              Fundir Ocorrências
            </button>
          ) : null}
          </div>
          
          {/* Linha divisória */}
          <div className="w-full" style={{ height: '1px', backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>
        </div>

        {/* Layout Principal com Sidebar */}
        {activeTab === 'minhas' ? (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
              gap: '24px',
              transition: 'grid-template-columns 0.3s ease'
            }}
          >
            {/* Conteúdo Principal com Sidebar de Busca */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
              {/* Conteúdo Principal */}
              <div>
                {renderTabContent()}
              </div>

              {/* Sidebar Direita - Busca de Cliente (apenas em Minhas Reclamações) */}
              <div>
                <div className="velohub-container sticky top-4">
                  <HistoricoCliente
                    searchCpf={searchCpf}
                    setSearchCpf={setSearchCpf}
                    searchResults={searchResults}
                    searchLoading={searchLoading}
                    onSearch={buscarClientePorCPF}
                    onRefresh={loadDashboardStats}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Direita - Chat Widget */}
            {renderRightSidebarChat()}
          </div>
        ) : (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
              gap: '24px',
              transition: 'grid-template-columns 0.3s ease'
            }}
          >
            {/* Conteúdo Principal */}
            <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
              {renderTabContent()}
            </div>

            {/* Sidebar Direita - Chat Widget */}
            {renderRightSidebarChat()}
          </div>
        )}

      {modalFusaoAberto && fusaoConsultaCtx ? (() => {
        const alvosSelecionados = buildFusaoAlvosFromSelection(
          fusaoConsultaCtx,
          selectedFusaoTicketIds
        );
        const exibirPapelRedundante = alvosSelecionados.some((a) => a.cenario === 'redundante');
        return (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => {
            if (!fusaoSubmitting) setModalFusaoAberto(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-fusao-titulo"
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-vh-container border p-6 shadow-xl"
            style={{
              backgroundColor: 'var(--cor-container)',
              borderColor: 'var(--cor-borda)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalFusaoOcorrencias
              fusaoConsultaCtx={fusaoConsultaCtx}
              redundantePapel={redundantePapel}
              selectedTicketIds={selectedFusaoTicketIds}
              onToggleTicketId={toggleFusaoTicketId}
            >
            {exibirPapelRedundante ? (
              <fieldset className="mb-4 text-sm">
                <legend className="mb-2 font-medium text-gray-800 dark:text-gray-200">
                  Papel do registro atual na fusão
                </legend>
                <label className="mb-2 flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="redundantePapel"
                    checked={redundantePapel === 'current_parent'}
                    onChange={() => setRedundantePapel('current_parent')}
                  />
                  <span>Atual como pai (parent)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="redundantePapel"
                    checked={redundantePapel === 'current_child'}
                    onChange={() => setRedundantePapel('current_child')}
                  />
                  <span>Atual como filho (child)</span>
                </label>
              </fieldset>
            ) : null}
            </ModalFusaoOcorrencias>
            {!fusaoConsultaCtx.currentId && fusaoConsultaCtx.source !== 'nova' ? (
              <p className="mb-4 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
                Salve a ocorrência primeiro para obter o ID do registro atual e concluir a fusão a partir desta aba.
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={fusaoSubmitting}
                className="rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => setModalFusaoAberto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  fusaoSubmitting ||
                  selectedFusaoTicketIds.size === 0 ||
                  (!fusaoConsultaCtx.currentId && fusaoConsultaCtx.source !== 'nova')
                }
                className="rounded-lg border-2 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#b91c1c', borderColor: '#991b1b' }}
                onClick={confirmarFusao}
              >
                {fusaoSubmitting ? 'Confirmando…' : 'Confirmar fusão'}
              </button>
            </div>
          </div>
        </div>
        );
      })() : null}
    </div>
  );
};

export default OuvidoriaPage;

/**
 * VeloHub V3 — RequisicoesPage (módulo Requisições / Req_Prod)
 * VERSION: v1.20.9 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.20.9: Cards da busca CPF agregada exibem selo «Origem» (Solicitações | Erros/Bugs | Liberação chave pix)
 * - v1.20.8: Busca por CPF da sidebar agrega resultados entre Solicitações, Erros/Bugs e Liberação chave pix em qualquer aba
 * - v1.20.7: Agent default (sidebar/filtros) via `getVelotaxAgentForLoggedUser()` + `setVelotaxAgentForLoggedUser()` — não herda nome de `velotax_agent` sem userMail igual
 * - v1.20.5: Nova aba «Dev» restrita a lucas.gravina@velotax.com.br (listagem/busca CPF + modal de resposta produto com feito/não feito)
 * - v1.20.4: Ordem das abas — «Liberação chave pix» antes de «Calculadora de Restituição»
 * - v1.20.3: Rename de pacote frontend — pasta Requisicoes, serviço requisicoesApi, utils requisicoesModalHelpers (URLs /api/escalacoes inalteradas)
 * - v1.20.2: Dev marcação chamado — LAN por nome de host + e-mail igual ao header API; botões nos cards PIX (e Solicitações) fora do overflow
 * - v1.20.1: Dev — botões explícitos «Feito» / «Não feito» na sidebar e no cabeçalho do modal de respostas
 * - v1.20.0: Cards (Solicitações + Liberação PIX): menu dev — ver devMarcacaoChamadoLocal + backend VELOHUB_DEV_* + POST .../dev/marcar-chamado-status/:id
 * - v1.19.5: Sidebar e busca CPF da aba Solicitações: só `solicitacoes_tecnicas` (exclui entradas mescladas de `liberacao_pix_prod` no GET /solicitacoes)
 * - v1.18.0: Aba Liberação chave pix: sidebar «Busca e acompanhamento» + modais (paridade Solicitações; lista filtrada liberacao_pix_prod / origem)
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FormSolicitacao from '../components/Requisicoes/FormSolicitacao';
import ErrosBugsTab from '../components/Requisicoes/ErrosBugsTab';
import ApoioN1PanoramaTab from '../components/Requisicoes/ApoioN1PanoramaTab';
import DevChamadoOpcoesMenu from '../components/Requisicoes/DevChamadoOpcoesMenu';
import DevRequisicoesTab from '../components/Requisicoes/DevRequisicoesTab';
import VeloChatWidget from '../components/VeloChatWidget';
import { getUserSession, getVelotaxAgentForLoggedUser, setVelotaxAgentForLoggedUser } from '../services/auth';
import ChatStatusSelector from '../components/ChatStatusSelector';
import { errosBugsAPI, solicitacoesAPI } from '../services/requisicoesApi';
import { API_BASE_URL } from '../config/api-config';
import { usuarioPodeMarcacaoDevChamado } from '../config/devMarcacaoChamadoLocal';
import toast from 'react-hot-toast';
import {
  STORAGE_PROD_READ_SOLICITACOES,
  getStatusChamado,
  getStatusChamadoAssignedAt,
  isTerminalChamadoStatusForHeader,
  lastProdutosReplyAtMs,
  setProdutosReadMs,
  hasUnreadProdutosInReplies,
  buildProdutosN1Dialogue,
  statusChamadoBadgeClass,
  buildModalExtraPayloadCells,
  ModalInfoGridCell,
  normalizeMongoId,
  findSolicitacaoForLocalLogItem,
  listUnreadProdutosDocs,
  produtosUnreadNotifySig,
  hasProdutosNotificationBeenSent,
  markProdutosNotificationSent,
} from '../utils/requisicoesModalHelpers';

const DEV_TAB_EMAIL = 'lucas.gravina@velotax.com.br';

/**
 * Documento da coleção `liberacao_pix_prod` no payload mesclado de GET /escalacoes/solicitacoes
 * (tipo Exclusão de Chave PIX + `origem` no root ou em `payload`).
 * @param {Object|null|undefined} r
 * @returns {boolean}
 */
function isDocLiberacaoChavePixAba(r) {
  if (!r) return false;
  if (String(r.tipo || '').trim() !== 'Exclusão de Chave PIX') return false;
  const oTop = String(r.origem || '').trim();
  const pl = r.payload;
  const oPayload = pl && typeof pl === 'object' ? String(pl.origem || '').trim() : '';
  return Boolean(oTop || oPayload);
}

/**
 * Só entradas gravadas em `hub_escalacoes.liberacao_pix_prod` (desde a rota dedicada).
 * O GET /solicitacoes mescla `solicitacoes_tecnicas` + liberacao; PIX antigo pode existir só na primeira coleção — não deve aparecer nesta aba.
 * @param {Object|null|undefined} r
 * @returns {boolean}
 */
function isDocLiberacaoPixProdColecao(r) {
  return isDocLiberacaoChavePixAba(r) && Object.prototype.hasOwnProperty.call(r, 'pixLiberado');
}

function isDocErrosBugsCollection(r) {
  return r != null && String(r.tipo || '').startsWith('Erro/Bug');
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

/**
 * Página principal do módulo Requisições (Req_Prod)
 */
const RequisicoesPage = () => {
  const [activeTab, setActiveTab] = useState('solicitacoes');
  /** null = verificando; só usuários com acessos.apoioN1 veem a aba Visão geral */
  const [hasApoioN1, setHasApoioN1] = useState(null);
  /** null = verificando; só usuários com acessos.ChavePix veem a aba Liberação chave pix */
  const [hasChavePix, setHasChavePix] = useState(null);
  /** Aba Dev exclusiva para usuário autorizado */
  const [hasDevTab, setHasDevTab] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchCpfError, setSearchCpfError] = useState('');
  const [stats, setStats] = useState({ today: 0, pending: 0, done: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [requestsRaw, setRequestsRaw] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const formSolicitacaoRef = useRef(null);
  const formLiberacaoPixRef = useRef(null);
  /** Altura do card principal (aba Solicitações) para igualar base da sidebar sem flex stretch */
  const solicitacoesMainCardRef = useRef(null);
  const liberacaoPixMainCardRef = useRef(null);
  const [solicitacoesSidebarHeightPx, setSolicitacoesSidebarHeightPx] = useState(null);
  const [liberacaoPixSidebarHeightPx, setLiberacaoPixSidebarHeightPx] = useState(null);
  const [searchCpfPix, setSearchCpfPix] = useState('');
  const [searchLoadingPix, setSearchLoadingPix] = useState(false);
  const [searchResultsPix, setSearchResultsPix] = useState([]);
  const [searchCpfErrorPix, setSearchCpfErrorPix] = useState('');
  const prevRequestsRef = useRef([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [replies, setReplies] = useState([]);
  const [myAgent, setMyAgent] = useState('');
  // Estados para controlar expansão de cards com replies
  // Estado para modal de respostas
  const [selectedRepliesRequest, setSelectedRepliesRequest] = useState(null);
  // Estado para formulário de adicionar reply
  const [addReplyOrigem, setAddReplyOrigem] = useState('produtos');
  const [addReplyStatus, setAddReplyStatus] = useState('enviado');
  const [addReplyText, setAddReplyText] = useState('');
  const [addReplyLoading, setAddReplyLoading] = useState(false);
  const [modalN1Draft, setModalN1Draft] = useState('');
  const [modalSalvarN1Loading, setModalSalvarN1Loading] = useState(false);
  const [modalCancelarSolicLoading, setModalCancelarSolicLoading] = useState(false);
  /** Força recálculo do destaque da sidebar após marcar leitura de msgProdutos (localStorage) */
  const [prodReadEpoch, setProdReadEpoch] = useState(0);
  
  // Igualar altura da sidebar à do card do formulário (bases alinhadas; conteúdo extra rola dentro da sidebar)
  useLayoutEffect(() => {
    if (activeTab !== 'solicitacoes') {
      setSolicitacoesSidebarHeightPx(null);
      return;
    }
    const el = solicitacoesMainCardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const sync = () => {
      const h = el.offsetHeight;
      if (h > 0) setSolicitacoesSidebarHeightPx(h);
    };
    sync();
    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [activeTab]);

  useLayoutEffect(() => {
    if (activeTab !== 'liberacao-chave-pix') {
      setLiberacaoPixSidebarHeightPx(null);
      return;
    }
    const el = liberacaoPixMainCardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const sync = () => {
      const h = el.offsetHeight;
      if (h > 0) setLiberacaoPixSidebarHeightPx(h);
    };
    sync();
    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [activeTab]);

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
      setProdutosReadMs(String(id), t, STORAGE_PROD_READ_SOLICITACOES);
      setProdReadEpoch((e) => e + 1);
    }
  }, [selectedRepliesRequest]);
  
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

  // Função para confirmar visualização de resposta
  const confirmarResposta = async (requestId, replyMessageId, confirmedBy = null) => {
    try {
      const result = await solicitacoesAPI.confirmarResposta(requestId, replyMessageId, confirmedBy);
      if (result && result.ok) {
        toast.success('Confirmado! Reação ✓ enviada no WhatsApp.');
        // Recarregar dados após confirmação
        await loadStats();
        // Recarregar busca se houver CPF pesquisado
        if (searchCpf) {
          buscarCpf();
        }
        if (searchCpfPix) {
          buscarCpfPix();
        }
      } else {
        throw new Error(result?.error || 'Erro ao confirmar resposta');
      }
      return result;
    } catch (error) {
      console.error('[RequisicoesPage confirmarResposta] Erro:', error);
      toast.error(error.message || 'Erro ao confirmar resposta');
      throw error;
    }
  };
  
  // Função para calcular grid columns
  const getGridColumns = (rightCollapsed, chatColumnActive) => {
    if (chatColumnActive === false) {
      return '1fr';
    }
    if (rightCollapsed) {
      return '1fr 10px';
    }
    return 'minmax(0, 1fr) minmax(0, 35%)';
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
   * Normalizar string para comparação
   * @param {string} s - String a normalizar
   * @returns {string} String normalizada
   */
  const norm = (s = '') => String(s).toLowerCase().trim().replace(/\s+/g, ' ');

  /**
   * Cards do log na sidebar: base = só `solicitacoes_tecnicas` (GET mesclado exclui liberacao_pix_prod), ordenado por data;
   * acrescenta só itens do cache local cujo requestId ainda não está nessa lista (ex.: envio recém-criado antes do próximo loadStats).
   * Nunca substituir o histórico completo do GET por só o que couber no localStorage.
   */
  const solicitacoesSidebarDisplayLogs = useMemo(() => {
    const arr = (Array.isArray(requestsRaw) ? requestsRaw : []).filter((r) => !isDocLiberacaoChavePixAba(r));
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
    }));
    return fromServer;
  }, [requestsRaw, selectedAgent]);

  /** Lista GET /solicitacoes sem documentos de `liberacao_pix_prod` (reconcile do Form Solicitações). */
  const solicitacoesTecnicasServerListOnly = useMemo(
    () => (Array.isArray(requestsRaw) ? requestsRaw : []).filter((r) => !isDocLiberacaoChavePixAba(r)),
    [requestsRaw]
  );

  const liberacaoPixSidebarDisplayLogs = useMemo(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const onlyPix = arr.filter(isDocLiberacaoPixProdColecao);
    const base = selectedAgent
      ? onlyPix.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : onlyPix;
    const sortedServer = [...base].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    const fromServer = sortedServer.slice(0, 100).map((r) => ({
      requestId: normalizeMongoId(r._id ?? r.id) || undefined,
      cpf: String(r.cpf || '').replace(/\D/g, ''),
      tipo: r.tipo,
      origem: String(r.origem || r?.payload?.origem || '').trim() || undefined,
      status: getStatusChamado(r),
      createdAt: r.createdAt,
      reply: Array.isArray(r.reply) ? r.reply : undefined,
      enviado: true,
    }));
    return fromServer;
  }, [requestsRaw, selectedAgent]);

  const liberacaoPixStats = useMemo(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const onlyPix = arr.filter(isDocLiberacaoPixProdColecao);
    const base = selectedAgent
      ? onlyPix.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : onlyPix;
    const todayStr = new Date().toDateString();
    const today = base.filter(
      (r) => new Date(r?.createdAt || 0).toDateString() === todayStr
    ).length;
    const done = base.filter(
      (r) => String(getStatusChamado(r) || '').toLowerCase() === 'feito'
    ).length;
    const pending = base.length - done;
    return { today, pending, done };
  }, [requestsRaw, selectedAgent]);

  /**
   * Registrar log local
   * @param {string} msg - Mensagem do log
   */
  const registrarLog = (msg) => {
    setLogs((prev) => [{ msg, time: new Date().toLocaleString('pt-BR') }, ...prev]);
  };

  /**
   * Carregar estatísticas e solicitações (aba Solicitações; filtro por colaborador quando possível)
   */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setRequestsRaw([]);
    if (activeTab === 'liberacao-chave-pix') {
      setSearchResultsPix([]);
    }
    try {
      const agentName = String(selectedAgent || myAgent || '').trim();
      const result = agentName
        ? await solicitacoesAPI.getByColaborador(agentName)
        : await solicitacoesAPI.getAll();
      const list = Array.isArray(result.data) ? result.data : [];
      setRequestsRaw(list);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
    setStatsLoading(false);
  }, [selectedAgent, myAgent, activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onLiberacaoPix = () => {
      loadStats();
    };
    window.addEventListener('velohub:liberacao-pix-solicitada', onLiberacaoPix);
    return () => window.removeEventListener('velohub:liberacao-pix-solicitada', onLiberacaoPix);
  }, [loadStats]);

  /** Remove caches legados da sidebar (histórico passa a ser só GET). */
  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem('velotax_local_logs');
      localStorage.removeItem('velotax_local_logs_chave_pix');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão de notificação:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'solicitacoes' && activeTab !== 'liberacao-chave-pix') return undefined;
    loadStats();
    const refreshInterval = setInterval(loadStats, 3 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [activeTab, loadStats]);

  useEffect(() => {
    const checkApoioN1 = async () => {
      try {
        const session = getUserSession();
        const em = session?.user?.email;
        if (!em) {
          setHasApoioN1(false);
          return;
        }
        const sessionId = localStorage.getItem('velohub_session_id');
        const url = new URL(`${API_BASE_URL}/auth/check-module-access`);
        url.searchParams.append('email', em);
        url.searchParams.append('module', 'apoioN1');
        if (sessionId) url.searchParams.append('sessionId', sessionId);
        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(sessionId && { 'x-session-id': sessionId }),
            'x-user-email': em,
          },
        });
        if (!response.ok) {
          setHasApoioN1(false);
          return;
        }
        const data = await response.json();
        setHasApoioN1(Boolean(data.success && data.hasAccess));
      } catch {
        setHasApoioN1(false);
      }
    };
    checkApoioN1();
  }, []);

  useEffect(() => {
    const checkChavePix = async () => {
      try {
        const session = getUserSession();
        const em = session?.user?.email;
        if (!em) {
          setHasChavePix(false);
          return;
        }
        const sessionId = localStorage.getItem('velohub_session_id');
        const url = new URL(`${API_BASE_URL}/auth/check-module-access`);
        url.searchParams.append('email', em);
        url.searchParams.append('module', 'ChavePix');
        if (sessionId) url.searchParams.append('sessionId', sessionId);
        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(sessionId && { 'x-session-id': sessionId }),
            'x-user-email': em,
          },
        });
        if (!response.ok) {
          setHasChavePix(false);
          return;
        }
        const data = await response.json();
        setHasChavePix(Boolean(data.success && data.hasAccess));
      } catch {
        setHasChavePix(false);
      }
    };
    checkChavePix();
  }, []);

  useEffect(() => {
    try {
      const session = getUserSession();
      const email = String(session?.user?.email || session?.email || '')
        .trim()
        .toLowerCase();
      setHasDevTab(email === DEV_TAB_EMAIL);
    } catch {
      setHasDevTab(false);
    }
  }, []);

  useEffect(() => {
    if (hasApoioN1 === false && activeTab === 'apoio-n1-panorama') {
      setActiveTab('solicitacoes');
    }
  }, [hasApoioN1, activeTab]);

  useEffect(() => {
    if (hasChavePix === false && activeTab === 'liberacao-chave-pix') {
      setActiveTab('solicitacoes');
    }
  }, [hasChavePix, activeTab]);

  useEffect(() => {
    if (hasDevTab === false && activeTab === 'dev') {
      setActiveTab('solicitacoes');
    }
  }, [hasDevTab, activeTab]);

  // Carregar nome do agente (escopo userMail atual — não reutiliza cache de outro login)
  useEffect(() => {
    try {
      const agentName = String(getVelotaxAgentForLoggedUser() || '').trim();
      if (agentName) {
        setSelectedAgent(agentName);
        setMyAgent(agentName);
        setVelotaxAgentForLoggedUser(agentName);
      }
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
    }
  }, []);

  // Configurar URL do backend (será configurado via variáveis de ambiente)
  useEffect(() => {
    try {
      // A URL será obtida do backend via API_BASE_URL
      setBackendUrl(API_BASE_URL.replace('/api', ''));
    } catch (err) {
      console.error('Erro ao configurar backend URL:', err);
    }
  }, []);

  // EventSource para receber respostas em tempo real (quando implementado)
  useEffect(() => {
    if (!backendUrl) return;
    let es;
    try {
      const q = myAgent ? `?agent=${encodeURIComponent(myAgent)}` : '';
      // EventSource será implementado quando o backend suportar
      // es = new EventSource(`${backendUrl}/stream/replies${q}`);
      // Por enquanto, comentado até implementação do backend
    } catch (err) {
      console.error('Erro ao conectar EventSource:', err);
    }
    return () => {
      try {
        if (es) es.close();
      } catch (err) {
        console.error('Erro ao fechar EventSource:', err);
      }
    };
  }, [backendUrl, myAgent]);

  // Calcular estatísticas baseadas nas solicitações (só solicitacoes_tecnicas — sem liberacao_pix_prod mesclado)
  useEffect(() => {
    const arr = (Array.isArray(requestsRaw) ? requestsRaw : []).filter((r) => !isDocLiberacaoChavePixAba(r));
    const base = selectedAgent
      ? arr.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : arr;
    const todayStr = new Date().toDateString();
    const today = base.filter(
      (r) => new Date(r?.createdAt || 0).toDateString() === todayStr
    ).length;
    const done = base.filter(
      (r) => String(getStatusChamado(r) || '').toLowerCase() === 'feito'
    ).length;
    const pending = base.length - done;
    setStats({ today, pending, done });

    // Notificações de mudança de status (status derivado de reply[].status)
    try {
      const prev = Array.isArray(prevRequestsRef.current) ? prevRequestsRef.current : [];
      const mapPrev = new Map(prev.map((r) => [r.id, String(r.status || '')]));
      const changed = base.filter((r) => {
        const prevSt = mapPrev.get(r._id || r.id);
        const curSt = String(getStatusChamado(r) || '').toLowerCase();
        if (!prevSt) return false;
        return (
          prevSt.toLowerCase() !== curSt &&
          (curSt === 'feito' || curSt === 'não feito')
        );
      });
      if (changed.length) {
        const play = async () => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            o.start();
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            o.stop(ctx.currentTime + 0.4);
          } catch (err) {
            console.error('Erro ao tocar som:', err);
          }
        };
        const notify = (title, body) => {
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, { body });
            }
          } catch (err) {
            console.error('Erro ao exibir notificação:', err);
          }
        };
        changed.forEach((r) => {
          const st = String(getStatusChamado(r) || '').toLowerCase();
          notify(
            st === 'feito' ? 'Solicitação concluída' : 'Solicitação marcada como não feita',
            `${r.tipo} — ${r.cpf}`
          );
        });
        play();
      }
      prevRequestsRef.current = base.map((r) => ({
        id: r._id || r.id,
        status: getStatusChamado(r),
      }));
    } catch (err) {
      console.error('Erro ao processar mudanças:', err);
    }

    // Msg Produtos não lida: notificação quando a aba do navegador está em segundo plano (aba Solicitações ativa; dedup com Header)
    try {
      if (typeof document !== 'undefined' && document.hidden && activeTab === 'solicitacoes') {
        const unread = listUnreadProdutosDocs(base, STORAGE_PROD_READ_SOLICITACOES);
        for (const it of unread) {
          const sig = produtosUnreadNotifySig('sol', it.id, it.lastAt);
          if (hasProdutosNotificationBeenSent(sig)) continue;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('VeloHub — Time Produtos', {
              body: `${it.tipo} — CPF ${it.cpf}\n${it.preview || 'Nova mensagem'}`,
            });
            markProdutosNotificationSent(sig);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao notificar Produtos (Solicitações):', err);
    }
  }, [requestsRaw, selectedAgent, activeTab]);

  /**
   * Abrir modal de respostas a partir de um item do log de envio (sidebar)
   */
  const abrirModalDesdeLogLocal = async (logItem) => {
    const lid = normalizeMongoId(logItem?.requestId);
    try {
      const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
      if (lid && /^[a-f0-9]{24}$/.test(lid)) {
        const byId = arr.find((r) => normalizeMongoId(r._id ?? r.id) === lid);
        if (byId) {
          setSelectedRepliesRequest(byId);
          return;
        }
      }
      const fuzzy = findSolicitacaoForLocalLogItem(arr, logItem);
      if (fuzzy) {
        setSelectedRepliesRequest(fuzzy);
        return;
      }
      if (lid && /^[a-f0-9]{24}$/.test(lid)) {
        const result = await solicitacoesAPI.getById(lid);
        const doc = result?.data;
        if (doc) {
          setSelectedRepliesRequest(doc);
          return;
        }
      }
      toast.error('Não foi possível carregar esta solicitação. Use "Atualizar agora" nos logs ou busque por CPF.');
    } catch (err) {
      console.error('[RequisicoesPage] abrirModalDesdeLogLocal:', err);
      toast.error(err.message || 'Erro ao abrir detalhes da solicitação');
    }
  };

  /**
   * Buscar solicitações por CPF
   */
  const buscarCpf = async () => {
    const digits = String(searchCpf || '').replace(/\D/g, '');
    if (!digits) {
      setSearchResults([]);
      setSearchCpfError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    if (digits.length !== 11) {
      setSearchResults([]);
      setSearchCpfError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    setSearchCpfError('');
    setSearchLoading(true);
    try {
      const [resultSolic, resultErros] = await Promise.all([
        solicitacoesAPI.getByCpf(digits),
        errosBugsAPI.getByCpf(digits),
      ]);
      const listSolic = Array.isArray(resultSolic?.data) ? resultSolic.data : [];
      const listErros = Array.isArray(resultErros?.data) ? resultErros.data : [];
      setSearchResults(mergeBuscaCpfGlobal(listSolic, listErros));
    } catch (err) {
      console.error('Erro ao buscar CPF:', err);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  /**
   * Buscar por CPF apenas chamados Liberação chave pix (coleção liberacao_pix_prod / origem).
   */
  const buscarCpfPix = async () => {
    const digits = String(searchCpfPix || '').replace(/\D/g, '');
    if (!digits) {
      setSearchResultsPix([]);
      setSearchCpfErrorPix('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    if (digits.length !== 11) {
      setSearchResultsPix([]);
      setSearchCpfErrorPix('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    setSearchCpfErrorPix('');
    setSearchLoadingPix(true);
    try {
      const [resultSolic, resultErros] = await Promise.all([
        solicitacoesAPI.getByCpf(digits),
        errosBugsAPI.getByCpf(digits),
      ]);
      const listSolic = Array.isArray(resultSolic?.data) ? resultSolic.data : [];
      const listErros = Array.isArray(resultErros?.data) ? resultErros.data : [];
      setSearchResultsPix(mergeBuscaCpfGlobal(listSolic, listErros));
    } catch (err) {
      console.error('Erro ao buscar CPF (Liberação chave pix):', err);
      setSearchResultsPix([]);
    }
    setSearchLoadingPix(false);
  };

  const deveExibirMenusDevMarcarChamado = (() => {
    const sess = getUserSession();
    return usuarioPodeMarcacaoDevChamado(
      String(sess?.user?.email || sess?.email || '').trim(),
    );
  })();

  const recarregarDadosAposMarcacaoDevChamado = () => {
    void loadStats();
    const digSolic = String(searchCpf || '').replace(/\D/g, '');
    if (activeTab === 'solicitacoes' && digSolic.length === 11) {
      void buscarCpf();
    }
    const digPix = String(searchCpfPix || '').replace(/\D/g, '');
    if (activeTab === 'liberacao-chave-pix' && digPix.length === 11) {
      void buscarCpfPix();
    }
  };

  const recarregarMarcacaoDevEAtualizarModal = async () => {
    recarregarDadosAposMarcacaoDevChamado();
    const sr = selectedRepliesRequest;
    const midRaw = sr ? sr._id ?? sr.id : null;
    const mid =
      (midRaw != null && normalizeMongoId(midRaw)) || String(midRaw || '').trim() || '';
    if (!mid) return;
    try {
      const isErroBug = isDocErrosBugsCollection(sr);
      if (isErroBug) {
        const resErro = await errosBugsAPI.getById(mid);
        if (resErro?.success && resErro?.data) setSelectedRepliesRequest(resErro.data);
      } else {
        const res = await solicitacoesAPI.getById(mid);
        if (res?.data) setSelectedRepliesRequest(res.data);
      }
    } catch {
      /* ignore */
    }
  };

  const mergeSolicitacaoDocIntoCaches = useCallback((doc) => {
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
    setRequestsRaw((prev) => patch(prev));
    setSearchResults((prev) => patch(prev));
    setSearchResultsPix((prev) => patch(prev));
  }, []);

  const atualizarSolicitacaoNoModal = async (solicitacaoId) => {
    const id = solicitacaoId || selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return null;
    try {
      const isErroBug = isDocErrosBugsCollection(selectedRepliesRequest);
      if (isErroBug) {
        const resErro = await errosBugsAPI.getById(id);
        if (resErro?.success && resErro?.data) {
          setSelectedRepliesRequest(resErro.data);
          return resErro.data;
        }
      } else {
        const res = await solicitacoesAPI.getById(id);
        if (res?.data) {
          setSelectedRepliesRequest(res.data);
          return res.data;
        }
      }
    } catch (err) {
      console.error('[RequisicoesPage] atualizarSolicitacaoNoModal:', err);
    }
    return null;
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
      const docN1 = await atualizarSolicitacaoNoModal(id);
      if (docN1) mergeSolicitacaoDocIntoCaches(docN1);
      setModalN1Draft('');
      toast.success('Resposta N1 registrada.');
      await loadStats();
      if (searchCpf) await buscarCpf();
      if (searchCpfPix) await buscarCpfPix();
    } catch (err) {
      console.error('[RequisicoesPage] handleModalSalvarRespostaN1:', err);
      toast.error(err.message || 'Erro ao salvar resposta');
    } finally {
      setModalSalvarN1Loading(false);
    }
  };

  const handleModalCancelarSolicitacao = async () => {
    if (!window.confirm('Cancelar esta solicitação? O status será gravado como Cancelado no histórico.')) {
      return;
    }
    const id = selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return;
    setModalCancelarSolicLoading(true);
    try {
      if (isDocErrosBugsCollection(selectedRepliesRequest)) {
        await errosBugsAPI.cancelarRegistro(id);
      } else {
        await solicitacoesAPI.cancelarSolicitacao(id);
      }
      const docCancel = await atualizarSolicitacaoNoModal(id);
      if (docCancel) mergeSolicitacaoDocIntoCaches(docCancel);
      toast.success('Solicitação cancelada.');
      await loadStats();
      if (searchCpf) await buscarCpf();
      if (searchCpfPix) await buscarCpfPix();
    } catch (err) {
      console.error('[RequisicoesPage] handleModalCancelarSolicitacao:', err);
      toast.error(err.message || 'Erro ao cancelar solicitação');
    } finally {
      setModalCancelarSolicLoading(false);
    }
  };

  return (
    <div className="w-full py-12" style={{paddingLeft: '20px', paddingRight: '20px'}}>
        <div 
          className="grid gap-4" 
          style={{
            gridTemplateColumns: getGridColumns(
              isRightSidebarCollapsed,
              activeTab === 'solicitacoes'
            ),
            transition: 'grid-template-columns 0.3s ease'
          }}
        >
          {/* Conteúdo principal */}
          <div style={{ minWidth: 0 }}>
            {/* Sistema de Abas */}
            <div className="mb-8" style={{marginTop: '-15px'}}>
          {/* Abas */}
          <div className="flex justify-start flex-wrap mb-2" style={{ gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('solicitacoes')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'solicitacoes' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'solicitacoes' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Solicitações
            </button>
            <button
              onClick={() => setActiveTab('erros-bugs')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'erros-bugs' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'erros-bugs' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Erros/Bugs
            </button>
            {hasChavePix === true && (
              <button
                type="button"
                onClick={() => setActiveTab('liberacao-chave-pix')}
                className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'liberacao-chave-pix' ? '' : 'opacity-50'}`}
                style={{
                  color: activeTab === 'liberacao-chave-pix' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)',
                }}
              >
                Liberação chave pix
              </button>
            )}
            {hasApoioN1 === true && (
              <button
                onClick={() => setActiveTab('apoio-n1-panorama')}
                className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'apoio-n1-panorama' ? '' : 'opacity-50'}`}
                style={{
                  color: activeTab === 'apoio-n1-panorama' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)',
                }}
              >
                Visão geral
              </button>
            )}
            {hasDevTab === true && (
              <button
                onClick={() => setActiveTab('dev')}
                className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'dev' ? '' : 'opacity-50'}`}
                style={{
                  color: activeTab === 'dev' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
                }}
              >
                Dev
              </button>
            )}
          </div>
          
          {/* Linha divisória */}
          <div className="w-full" style={{ height: '1px', backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'solicitacoes' && (
          <div className="flex gap-8 items-start">
          {/* Card principal: define a altura de referência; sidebar copia via ResizeObserver (bases alinhadas) */}
          <div
            ref={solicitacoesMainCardRef}
            className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-vh-card shadow-lg pt-6 px-6 pb-4 hover:-translate-y-0.5 transition-transform"
          >
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
                  onClick={loadStats}
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

            <FormSolicitacao
              ref={formSolicitacaoRef}
              registrarLog={registrarLog}
              solicitacoesServerList={solicitacoesTecnicasServerListOnly}
              solicitacoesStatsLoading={statsLoading}
              onRefreshSolicitacoesForLogs={loadStats}
            />
          </div>

          {/* Sidebar: altura = card principal (rodapés alinhados); não aumenta o card */}
          <div
            className="w-[400px] flex-shrink-0 self-start flex flex-col min-h-0 rounded-vh-card hover:-translate-y-0.5 transition-transform"
            style={{
              ...(solicitacoesSidebarHeightPx != null && solicitacoesSidebarHeightPx > 0
                ? { height: solicitacoesSidebarHeightPx }
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
                    onChange={(e) => {
                      setSearchCpf(e.target.value);
                      if (searchCpfError) setSearchCpfError('');
                    }}
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
                    onClick={() => formSolicitacaoRef.current?.refreshLocalLogs?.()}
                    className="text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex-shrink-0"
                  >
                    Atualizar
                  </button>
                </div>
                {searchCpfError && (
                  <div className="text-xs text-red-600">{searchCpfError}</div>
                )}
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
                {statsLoading &&
                  !searchLoading &&
                  !String(searchCpf || '').trim() &&
                  (!solicitacoesSidebarDisplayLogs || solicitacoesSidebarDisplayLogs.length === 0) && (
                  <div className="space-y-2 py-3" aria-busy="true">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`hist-sol-${i}`}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse"
                      >
                        <div className="h-4 w-36 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
                        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-600 rounded" />
                      </div>
                    ))}
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Carregando requisições do servidor…
                    </p>
                  </div>
                )}
                {searchResults && searchResults.length > 0 && !searchLoading && (
                  <div className="space-y-2">
                    {searchResults.map((r) => {
                      const imgCount = Array.isArray(r?.payload?.previews)
                        ? r.payload.previews.length
                        : Array.isArray(r?.payload?.imagens)
                        ? r.payload.imagens.length
                        : 0;
                      const videoCount = Array.isArray(r?.payload?.videos)
                        ? r.payload.videos.length
                        : 0;
                      const total = imgCount + videoCount;
                      const replyArr = Array.isArray(r.reply) ? r.reply : [];
                      const repliesList = Array.isArray(r.replies) ? r.replies : [];
                      const totalReplies = replyArr.length + repliesList.length;
                      const requestId = r._id || r.id;
                      const origemLabel = isDocErrosBugsCollection(r)
                        ? 'Erros/Bugs'
                        : isDocLiberacaoPixProdColecao(r)
                        ? 'Liberação chave pix'
                        : 'Solicitações';
                      const buscaCancelada = getStatusChamado(r) === 'Cancelado';
                      const strikeCancel = buscaCancelada ? 'line-through decoration-gray-500 dark:decoration-gray-400' : '';
                      const buscaCardProdUnread =
                        requestId != null &&
                        requestId !== '' &&
                        hasUnreadProdutosInReplies(String(requestId), r.reply, STORAGE_PROD_READ_SOLICITACOES);
                      const handleCardClick = (e) => {
                        // Se o clique foi em um botão ou link, não fazer nada
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[RequisicoesPage] Card clicado - SEMPRE abrir modal:', r);
                        // SEMPRE abrir modal quando card é clicado
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
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                              <div>
                                <div className="font-medium flex items-center gap-2 flex-wrap text-gray-800 dark:text-gray-200 text-sm">
                                  <span>
                                    <span className={strikeCancel}>{r.tipo}</span>
                                    <span className="mx-0.5">—</span>
                                    <span className={strikeCancel}>{r.cpf}</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px]">
                                    Origem: {origemLabel}
                                  </span>
                                  {total > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-800 dark:text-fuchsia-200 text-xs">
                                      Anexos:{' '}
                                      {imgCount > 0 ? `${imgCount} img` : ''}
                                      {imgCount > 0 && videoCount > 0 ? ' + ' : ''}
                                      {videoCount > 0 ? `${videoCount} vid` : ''}
                                    </span>
                                  )}
                                  {totalReplies > 0 && (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {totalReplies} resposta{totalReplies !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Agente: {r.colaboradorNome || r.agente || '—'} • Status: {getStatusChamado(r)}
                                </div>
                              </div>
                            </div>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => {
                                if (totalReplies === 0) {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      return (
                        <div key={`cpf-${requestId}`} className="shrink-0 flex flex-col gap-1">
                          {deveExibirMenusDevMarcarChamado && requestId ? (
                            <div
                              className="flex justify-end shrink-0"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DevChamadoOpcoesMenu
                                compact
                                solicitacaoMongoId={String(normalizeMongoId(requestId) || requestId)}
                                onSuccess={recarregarDadosAposMarcacaoDevChamado}
                              />
                            </div>
                          ) : null}
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
                {solicitacoesSidebarDisplayLogs && solicitacoesSidebarDisplayLogs.length > 0 && (
                  <div className="space-y-2">
                    {solicitacoesSidebarDisplayLogs.map((l, idx) => {
                      const s = String(l.status || '').toLowerCase();
                      const isCanceladoLog = getStatusChamado(l) === 'Cancelado';
                      const strikeLogCancel = isCanceladoLog
                        ? 'line-through decoration-gray-500 dark:decoration-gray-400'
                        : '';
                      const isDoneFail = s === 'não feito' || s === 'nao feito';
                      const isDoneOk = s === 'feito';
                      const sentOnly = !isDoneOk && !isDoneFail && (s === 'enviado' || l.enviado === true);
                      const bar1 = (sentOnly || isDoneOk || isDoneFail) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600';
                      const bar2 = isDoneOk ? 'bg-emerald-500' : (isDoneFail ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600');
                      const icon = isDoneOk ? '✅' : (isDoneFail ? '❌' : (sentOnly ? '📨' : '⏳'));
                      const logKey = l.requestId || l.waMessageId || `log-${idx}-${String(l.createdAt)}`;
                      const logCardProdUnread =
                        l?.requestId &&
                        hasUnreadProdutosInReplies(
                          String(l.requestId),
                          l.reply,
                          STORAGE_PROD_READ_SOLICITACOES
                        );
                      const open = (e) => {
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                        e.preventDefault();
                        abrirModalDesdeLogLocal(l);
                      };
                      const logCardBody = (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={open}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              open(e);
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
                                <span className={strikeLogCancel}>{l.cpf}</span>
                                <span className="mx-0.5">—</span>
                                <span className={strikeLogCancel}>{l.tipo}</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400 flex-shrink-0 text-right">
                              {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5" aria-label={`progresso: ${s || 'em aberto'}`}>
                            <span className={`h-1.5 w-8 rounded-full ${bar1}`} />
                            <span className={`h-1.5 w-8 rounded-full ${bar2}`} />
                            <span className="text-[11px] opacity-60 ml-2 text-gray-600 dark:text-gray-400">
                              {s || 'em aberto'}
                            </span>
                          </div>
                        </div>
                      );
                      return (
                        <div key={`envio-${logKey}`} className="shrink-0 flex flex-col gap-1">
                          {deveExibirMenusDevMarcarChamado && l.requestId ? (
                            <div
                              className="flex justify-end shrink-0"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DevChamadoOpcoesMenu
                                compact
                                solicitacaoMongoId={String(
                                  normalizeMongoId(l.requestId) || l.requestId,
                                )}
                                onSuccess={recarregarDadosAposMarcacaoDevChamado}
                              />
                            </div>
                          ) : null}
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
                  !statsLoading &&
                  (!searchResults || searchResults.length === 0) &&
                  (!solicitacoesSidebarDisplayLogs || solicitacoesSidebarDisplayLogs.length === 0) &&
                  !String(searchCpf || '').trim() && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">
                    Busque por CPF ou envie uma solicitação; os itens aparecem aqui.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'erros-bugs' && (
          <ErrosBugsTab />
        )}

            {activeTab === 'dev' && hasDevTab === true && (
              <DevRequisicoesTab />
            )}

            {activeTab === 'liberacao-chave-pix' && hasChavePix === true && (
              <div className="flex gap-8 items-start">
                <div
                  ref={liberacaoPixMainCardRef}
                  className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-vh-card shadow-lg pt-6 px-6 pb-4 hover:-translate-y-0.5 transition-transform"
                >
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
                            liberacaoPixStats.today
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-vh-card text-center border" style={{ borderColor: '#000058' }}>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Pendentes</div>
                        <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                          {statsLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                          ) : (
                            liberacaoPixStats.pending
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-vh-card text-center border" style={{ borderColor: '#000058' }}>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Feitas</div>
                        <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                          {statsLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                          ) : (
                            liberacaoPixStats.done
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
                        type="button"
                        onClick={loadStats}
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
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          'Atualizar agora'
                        )}
                      </button>
                    </div>
                  </div>
                  <FormSolicitacao
                    ref={formLiberacaoPixRef}
                    liberacaoChavePixTab
                    liberacaoPixSelectedDoc={selectedRepliesRequest}
                    registrarLog={registrarLog}
                    solicitacoesServerList={requestsRaw}
                    solicitacoesStatsLoading={statsLoading}
                    onRefreshSolicitacoesForLogs={loadStats}
                  />
                </div>

                <div
                  className="w-[400px] flex-shrink-0 self-start flex flex-col min-h-0 rounded-vh-card hover:-translate-y-0.5 transition-transform"
                  style={{
                    ...(liberacaoPixSidebarHeightPx != null && liberacaoPixSidebarHeightPx > 0
                      ? { height: liberacaoPixSidebarHeightPx }
                      : {}),
                  }}
                  aria-label="Busca e acompanhamento — Liberação chave pix"
                >
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-800 shadow-lg p-4 rounded-vh-card">
                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                      <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500 flex-shrink-0" />
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        Busca e acompanhamento
                      </h2>
                    </div>

                    <div
                      className="flex flex-col gap-2 flex-shrink-0"
                      aria-busy={searchLoadingPix}
                      aria-live="polite"
                    >
                      <div className="flex flex-wrap gap-2 items-stretch">
                        <input
                          className="min-w-0 flex-1 basis-[160px] border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Digite o CPF"
                          aria-label="CPF para busca — Liberação chave pix"
                          value={searchCpfPix}
                          onChange={(e) => {
                            setSearchCpfPix(e.target.value);
                            if (searchCpfErrorPix) setSearchCpfErrorPix('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              buscarCpfPix();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={buscarCpfPix}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-700 flex-shrink-0"
                          disabled={searchLoadingPix}
                        >
                          {searchLoadingPix ? (
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
                          onClick={() => formLiberacaoPixRef.current?.refreshLocalLogs?.()}
                          className="text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex-shrink-0"
                        >
                          Atualizar
                        </button>
                      </div>
                      {searchCpfErrorPix && (
                        <div className="text-xs text-red-600">{searchCpfErrorPix}</div>
                      )}
                    </div>

                    <div
                      className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2"
                      data-prod-read-epoch={prodReadEpoch}
                    >
                      {searchCpfPix && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 py-1 z-[1]">
                          {searchResultsPix.length} registro(s) nesta busca
                        </div>
                      )}
                      {searchLoadingPix && (
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
                      {statsLoading &&
                        !searchLoadingPix &&
                        !String(searchCpfPix || '').trim() &&
                        (!liberacaoPixSidebarDisplayLogs || liberacaoPixSidebarDisplayLogs.length === 0) && (
                        <div className="space-y-2 py-3" aria-busy="true">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={`hist-pix-${i}`}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse"
                            >
                              <div className="h-4 w-36 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
                              <div className="h-3 w-28 bg-gray-200 dark:bg-gray-600 rounded" />
                            </div>
                          ))}
                          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Carregando liberações do servidor…
                          </p>
                        </div>
                      )}
                      {searchResultsPix && searchResultsPix.length > 0 && !searchLoadingPix && (
                        <div className="space-y-2">
                          {searchResultsPix.map((r) => {
                            const imgCount = Array.isArray(r?.payload?.previews)
                              ? r.payload.previews.length
                              : Array.isArray(r?.payload?.imagens)
                              ? r.payload.imagens.length
                              : 0;
                            const videoCount = Array.isArray(r?.payload?.videos)
                              ? r.payload.videos.length
                              : 0;
                            const total = imgCount + videoCount;
                            const replyArr = Array.isArray(r.reply) ? r.reply : [];
                            const repliesList = Array.isArray(r.replies) ? r.replies : [];
                            const totalReplies = replyArr.length + repliesList.length;
                            const requestId = r._id || r.id;
                            const origemLabel = isDocErrosBugsCollection(r)
                              ? 'Erros/Bugs'
                              : isDocLiberacaoPixProdColecao(r)
                              ? 'Liberação chave pix'
                              : 'Solicitações';
                            const buscaCancelada = getStatusChamado(r) === 'Cancelado';
                            const strikeCancel = buscaCancelada
                              ? 'line-through decoration-gray-500 dark:decoration-gray-400'
                              : '';
                            const buscaCardProdUnread =
                              requestId != null &&
                              requestId !== '' &&
                              hasUnreadProdutosInReplies(
                                String(requestId),
                                r.reply,
                                STORAGE_PROD_READ_SOLICITACOES
                              );
                            const handleCardClick = (e) => {
                              if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                                return;
                              }
                              e.preventDefault();
                              e.stopPropagation();
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
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                    <div>
                                      <div className="font-medium flex items-center gap-2 flex-wrap text-gray-800 dark:text-gray-200 text-sm">
                                        <span>
                                          <span className={strikeCancel}>{r.tipo}</span>
                                          <span className="mx-0.5">—</span>
                                          <span className={strikeCancel}>{r.cpf}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px]">
                                          Origem: {origemLabel}
                                        </span>
                                        {String(r.origem || r?.payload?.origem || '').trim() ? (
                                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            ({String(r.origem || r?.payload?.origem || '').trim()})
                                          </span>
                                        ) : null}
                                        {total > 0 && (
                                          <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-800 dark:text-fuchsia-200 text-xs">
                                            Anexos:{' '}
                                            {imgCount > 0 ? `${imgCount} img` : ''}
                                            {imgCount > 0 && videoCount > 0 ? ' + ' : ''}
                                            {videoCount > 0 ? `${videoCount} vid` : ''}
                                          </span>
                                        )}
                                        {totalReplies > 0 && (
                                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            {totalReplies} resposta{totalReplies !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        Agente: {r.colaboradorNome || r.agente || '—'} • Status:{' '}
                                        {getStatusChamado(r)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(r.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            );
                            return (
                              <div key={`cpf-pix-${requestId}`} className="shrink-0 flex flex-col gap-1">
                                {deveExibirMenusDevMarcarChamado && requestId ? (
                                  <div
                                    className="flex justify-end shrink-0"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DevChamadoOpcoesMenu
                                      compact
                                      solicitacaoMongoId={String(
                                        normalizeMongoId(requestId) || requestId,
                                      )}
                                      onSuccess={recarregarDadosAposMarcacaoDevChamado}
                                    />
                                  </div>
                                ) : null}
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
                      {liberacaoPixSidebarDisplayLogs && liberacaoPixSidebarDisplayLogs.length > 0 && (
                        <div className="space-y-2">
                          {liberacaoPixSidebarDisplayLogs.map((l, idx) => {
                            const s = String(l.status || '').toLowerCase();
                            const isCanceladoLog = getStatusChamado(l) === 'Cancelado';
                            const strikeLogCancel = isCanceladoLog
                              ? 'line-through decoration-gray-500 dark:decoration-gray-400'
                              : '';
                            const isDoneFail = s === 'não feito' || s === 'nao feito';
                            const isDoneOk = s === 'feito';
                            const sentOnly =
                              !isDoneOk && !isDoneFail && (s === 'enviado' || l.enviado === true);
                            const bar1 =
                              sentOnly || isDoneOk || isDoneFail ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600';
                            const bar2 = isDoneOk
                              ? 'bg-emerald-500'
                              : isDoneFail
                                ? 'bg-red-500'
                                : 'bg-gray-300 dark:bg-gray-600';
                            const icon = isDoneOk ? '✅' : isDoneFail ? '❌' : sentOnly ? '📨' : '⏳';
                            const logKey = l.requestId || l.waMessageId || `log-pix-${idx}-${String(l.createdAt)}`;
                            const logCardProdUnread =
                              l?.requestId &&
                              hasUnreadProdutosInReplies(
                                String(l.requestId),
                                l.reply,
                                STORAGE_PROD_READ_SOLICITACOES
                              );
                            const open = (e) => {
                              if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                              e.preventDefault();
                              abrirModalDesdeLogLocal(l);
                            };
                            const logCardBody = (
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={open}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    open(e);
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
                                      <span className={strikeLogCancel}>{l.cpf}</span>
                                      <span className="mx-0.5">—</span>
                                      <span className={strikeLogCancel}>{l.tipo}</span>
                                      {String(l.origem || '').trim() ? (
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1">
                                          ({String(l.origem || '').trim()})
                                        </span>
                                      ) : null}
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
                                    {s || 'em aberto'}
                                  </span>
                                </div>
                              </div>
                            );
                            return (
                              <div key={`envio-pix-${logKey}`} className="shrink-0 flex flex-col gap-1">
                                {deveExibirMenusDevMarcarChamado && l.requestId ? (
                                  <div
                                    className="flex justify-end shrink-0"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DevChamadoOpcoesMenu
                                      compact
                                      solicitacaoMongoId={String(
                                        normalizeMongoId(l.requestId) || l.requestId,
                                      )}
                                      onSuccess={recarregarDadosAposMarcacaoDevChamado}
                                    />
                                  </div>
                                ) : null}
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
                      {!searchLoadingPix &&
                        !statsLoading &&
                        (!searchResultsPix || searchResultsPix.length === 0) &&
                        (!liberacaoPixSidebarDisplayLogs || liberacaoPixSidebarDisplayLogs.length === 0) &&
                        !String(searchCpfPix || '').trim() && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">
                            Busque por CPF ou envie um pedido de liberação; os itens aparecem aqui.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'apoio-n1-panorama' && hasApoioN1 === true && <ApoioN1PanoramaTab />}
          </div>
          
          {/* Chat só na aba Solicitações — evita loadContacts / polling fora da aba */}
          {activeTab === 'solicitacoes' ? renderRightSidebarChat() : null}
        </div>

        {/* Modal de Visualização de Respostas */}
        {selectedRepliesRequest && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => {
              console.log('[RequisicoesPage] Fechando modal de respostas');
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
                  <span
                    className="text-gray-300 dark:text-gray-600 select-none hidden sm:inline"
                    aria-hidden
                  >
                    |
                  </span>
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
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  {deveExibirMenusDevMarcarChamado &&
                  (selectedRepliesRequest._id || selectedRepliesRequest.id) ? (
                    <DevChamadoOpcoesMenu
                      solicitacaoMongoId={String(
                        normalizeMongoId(selectedRepliesRequest._id ?? selectedRepliesRequest.id) ||
                          selectedRepliesRequest._id ||
                          selectedRepliesRequest.id,
                      )}
                      onSuccess={recarregarMarcacaoDevEAtualizarModal}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedRepliesRequest(null)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none transition-colors flex-shrink-0"
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Informações: 1ª linha fixa CPF | Tipo | Data; demais células = só chaves do payload com valor relevante (grid 3 colunas) */}
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

                  {/* Anexos */}
                  {(() => {
                    const imgCount = Array.isArray(selectedRepliesRequest?.payload?.previews) 
                      ? selectedRepliesRequest.payload.previews.length 
                      : Array.isArray(selectedRepliesRequest?.payload?.imagens) 
                      ? selectedRepliesRequest.payload.imagens.length 
                      : 0;
                    const videoCount = Array.isArray(selectedRepliesRequest?.payload?.videos) 
                      ? selectedRepliesRequest.payload.videos.length 
                      : 0;
                    const totalAnexos = imgCount + videoCount;
                    
                    if (totalAnexos > 0) {
                      return (
                        <div>
                          <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                            Anexos ({totalAnexos})
                          </h4>
                          {imgCount > 0 && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Imagens ({imgCount}):</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(selectedRepliesRequest.payload.previews || selectedRepliesRequest.payload.imagens || []).map((preview, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={preview}
                                      alt={`anexo-${idx}`}
                                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(preview, '_blank')}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => window.open(preview, '_blank')}
                                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
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
                                {(selectedRepliesRequest.payload.videos || []).map((video, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="relative">
                                      {selectedRepliesRequest.payload.videoThumbnails?.[idx] && (
                                        <img
                                          src={selectedRepliesRequest.payload.videoThumbnails[idx]}
                                          alt={`video-thumb-${idx}`}
                                          className="w-20 h-14 object-cover rounded border"
                                        />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                        <span className="text-white text-xs">▶</span>
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{video.name || `Vídeo ${idx + 1}`}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{video.type || 'video/mp4'}</div>
                                    </div>
                                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                                      Vídeo não disponível
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Lista de respostas - suporta reply (novo) e replies (legado) */}
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
                    if (hasReplies) {
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
                                      myAgent
                                    ).then(() => {
                                      // Atualizar o request no modal
                                      const updatedReplies = replies.map(r => 
                                        r.replyMessageId === rep.replyMessageId 
                                          ? { ...r, confirmedAt: new Date(), confirmedBy: myAgent }
                                          : r
                                      );
                                      setSelectedRepliesRequest({
                                        ...selectedRepliesRequest,
                                        replies: updatedReplies
                                      });
                                      // Recarregar dados
                                      buscarCpf();
                                      if (searchCpfPix) buscarCpfPix();
                                      loadStats();
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
                    }
                    return (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Nenhuma resposta disponível para esta solicitação.
                      </div>
                    );
                  })()}
                </div>
              </div>
              {(() => {
                const cancelada = getStatusChamado(selectedRepliesRequest) === 'Cancelado';
                const bloqueado = modalSalvarN1Loading || modalCancelarSolicLoading;
                return (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
                    <label htmlFor="modal-n1-resposta" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      Resposta N1
                    </label>
                    <textarea
                      id="modal-n1-resposta"
                      rows={2}
                      className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[44px] disabled:opacity-60"
                      placeholder="Digite a mensagem do agente N1…"
                      value={modalN1Draft}
                      onChange={(e) => setModalN1Draft(e.target.value)}
                      disabled={cancelada || bloqueado}
                    />
                    {cancelada && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Esta solicitação está cancelada; não é possível nova resposta ou novo cancelamento.</p>
                    )}
                    <div className="flex justify-between items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleModalCancelarSolicitacao}
                        disabled={cancelada || bloqueado}
                        className="text-sm px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {modalCancelarSolicLoading ? 'Cancelando…' : 'Cancelar Solicitação'}
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

export default RequisicoesPage;


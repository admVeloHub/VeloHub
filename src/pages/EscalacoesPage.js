/**
 * VeloHub V3 - EscalacoesPage (Escalações Module)
 * VERSION: v1.4.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.4.0:
 * - Adicionado sidebar direito com widget de chat (recolhido por padrão)
 * - Integrado VeloChatWidget com todas as funcionalidades (Conversas, Contatos, Salas)
 * - Implementado sistema de retração/expansão do sidebar direito
 * Branch: escalacoes
 * 
 * Esta página contém o módulo de Escalações completo (Painel de Serviços migrado).
 * Imports do código compartilhado devem vir da main.
 * 
 * Mudanças v1.3.2:
 * - Histórico do agente com altura fixa (70% da largura) e scrollável
 * 
 * Mudanças v1.3.1:
 * - Integrado ping de sessão no refresh automático (loadStats) para evitar sessões órfãs
 * 
 * Mudanças v1.3.0:
 * - Implementada Calculadora de Restituição completa com cálculo de lotes
 * - Adicionado componente CalculadoraRestituicao com persistência em localStorage
 * 
 * Mudanças v1.2.0:
 * - Reorganizado layout com duas sidebars no lado direito
 * - Sidebar superior: Consulta de CPF com campo Tipo de Solicitação (altura 400px)
 * - Sidebar inferior: Histórico do agente (largura 400px)
 * - Removida seção Consulta de CPF do container principal
 * - Adicionado filtro por tipo na busca de CPF
 * 
 * Mudanças v1.1.0:
 * - Adicionado sistema de abas (Solicitações e Erros/Bugs)
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FormSolicitacao from '../components/Escalacoes/FormSolicitacao';
import ErrosBugsTab from '../components/Escalacoes/ErrosBugsTab';
import VeloChatWidget from '../components/VeloChatWidget';
import ChatStatusSelector from '../components/ChatStatusSelector';
import { solicitacoesAPI } from '../services/escalacoesApi';
import { API_BASE_URL } from '../config/api-config';

/**
 * Componente Calculadora de Restituição
 * Calcula os valores dos lotes de restituição com acréscimos
 */
const CalculadoraRestituicao = () => {
  const [valorStr, setValorStr] = useState('');

  /**
   * Converter string para centavos (remove tudo exceto dígitos)
   * @param {string} s - String com valor
   * @returns {number} Valor em centavos
   */
  const parseCents = (s) => {
    const digits = String(s || '').replace(/[^0-9]/g, '');
    return Number(digits || 0);
  };

  /**
   * Formatar centavos para BRL
   * @param {number} c - Valor em centavos
   * @returns {string} Valor formatado em BRL
   */
  const formatBRLFromCents = (c) => (c/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const baseCents = useMemo(() => parseCents(valorStr), [valorStr]);
  const lotesCents = useMemo(() => {
    const base = Number.isFinite(baseCents) ? baseCents : 0;
    const l1 = base; // base
    const l2 = Math.round(base * 101 / 100); // +1%
    const l3 = Math.round(base * 10179 / 10000); // +1,79%
    return [l1, l2, l3];
  }, [baseCents]);

  /**
   * Formatar valor no blur do input
   */
  const onBlur = () => {
    try { 
      setValorStr(formatBRLFromCents(baseCents)); 
    } catch (err) {
      console.error('Erro ao formatar valor:', err);
    }
  };

  // Carregar valor do cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_restituicao_valor');
      if (cached) setValorStr(cached);
    } catch (err) {
      console.error('Erro ao carregar cache:', err);
    }
  }, []);

  // Salvar valor no cache
  useEffect(() => {
    try { 
      localStorage.setItem('velotax_restituicao_valor', valorStr); 
    } catch (err) {
      console.error('Erro ao salvar cache:', err);
    }
  }, [valorStr]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:-translate-y-0.5 transition-transform">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Calculadora de Restituição
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Informe o valor base e veja os lotes com acréscimos.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Valor base</label>
          <input
            className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            onBlur={onBlur}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">1º Lote (base)</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {formatBRLFromCents(lotesCents[0] || 0)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">2º Lote (+1%)</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {formatBRLFromCents(lotesCents[1] || 0)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">3º Lote (+1,79%)</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {formatBRLFromCents(lotesCents[2] || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Página principal do módulo de Escalações
 */
const EscalacoesPage = () => {
  const [activeTab, setActiveTab] = useState('solicitacoes');
  const [logs, setLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchCpfError, setSearchCpfError] = useState('');
  const [stats, setStats] = useState({ today: 0, pending: 0, done: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [requestsRaw, setRequestsRaw] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agentHistory, setAgentHistory] = useState([]);
  const [agentHistoryLoading, setAgentHistoryLoading] = useState(false);
  const [agentHistoryLimit, setAgentHistoryLimit] = useState(50);
  const prevRequestsRef = useRef([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [replies, setReplies] = useState([]);
  const [myAgent, setMyAgent] = useState('');
  
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
          borderRadius: '9.6px', 
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
                    borderRadius: '8px',
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    style={{ color: 'var(--blue-dark)' }}
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
                color: 'var(--blue-dark)',
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
                color: 'var(--blue-dark)',
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
                color: 'var(--blue-dark)',
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
              
              const isLucasGravina = userName && 
                userName.toLowerCase().includes('lucas') && 
                userName.toLowerCase().includes('gravina');
              
              const shouldShowChat = !isProduction || isLucasGravina;
              
              if (!shouldShowChat) {
                return (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    background: 'transparent',
                    border: '1.5px solid var(--blue-dark)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      zIndex: 10
                    }}>
                      <span style={{
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        fontFamily: 'Poppins, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '1.6px'
                      }}>
                        EM BREVE
                      </span>
                    </div>
                  </div>
                );
              }
              
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
   * Registrar log local
   * @param {string} msg - Mensagem do log
   */
  const registrarLog = (msg) => {
    setLogs((prev) => [{ msg, time: new Date().toLocaleString('pt-BR') }, ...prev]);
  };

  /**
   * Carregar estatísticas e solicitações
   */
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const result = await solicitacoesAPI.getAll();
      const list = Array.isArray(result.data) ? result.data : [];
      setRequestsRaw(list);
      setLastUpdated(new Date());
      // O agente já é carregado do useEffect baseado na sessão do usuário
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
    setStatsLoading(false);
  };

  // Carregar estatísticas ao montar componente
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão de notificação:', err);
    }
    // Carregar dados iniciais
    loadStats();
    
    // Atualização automática a cada 3 minutos (padrão VeloHub)
    const refreshInterval = setInterval(loadStats, 3 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Carregar nome do agente da sessão do usuário
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
        setSelectedAgent(agentName);
        setMyAgent(agentName);
        // Salvar também no localStorage para compatibilidade
        try {
          localStorage.setItem('velotax_agent', agentName);
        } catch (err) {
          console.error('Erro ao salvar agente:', err);
        }
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

  // Calcular estatísticas baseadas nas solicitações
  useEffect(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const base = selectedAgent
      ? arr.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : arr;
    const todayStr = new Date().toDateString();
    const today = base.filter(
      (r) => new Date(r?.createdAt || 0).toDateString() === todayStr
    ).length;
    const done = base.filter(
      (r) => String(r?.status || '').toLowerCase() === 'feito'
    ).length;
    const pending = base.length - done;
    setStats({ today, pending, done });

    // Notificações de mudança de status
    try {
      const prev = Array.isArray(prevRequestsRef.current) ? prevRequestsRef.current : [];
      const mapPrev = new Map(prev.map((r) => [r.id, String(r.status || '')]));
      const changed = base.filter((r) => {
        const prevSt = mapPrev.get(r._id || r.id);
        const curSt = String(r?.status || '').toLowerCase();
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
          const st = String(r.status || '').toLowerCase();
          notify(
            st === 'feito' ? 'Solicitação concluída' : 'Solicitação marcada como não feita',
            `${r.tipo} — ${r.cpf}`
          );
        });
        play();
      }
      prevRequestsRef.current = base.map((r) => ({
        id: r._id || r.id,
        status: r.status,
      }));
    } catch (err) {
      console.error('Erro ao processar mudanças:', err);
    }
  }, [requestsRaw, selectedAgent]);

  // Carregar histórico do agente
  useEffect(() => {
    const load = async () => {
      if (!selectedAgent) {
        setAgentHistory([]);
        return;
      }
      setAgentHistoryLoading(true);
      try {
        const result = await solicitacoesAPI.getByAgente(selectedAgent);
        const list = Array.isArray(result.data) ? result.data : [];
        const filtered = list
          .filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAgentHistory(filtered);
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        setAgentHistory([]);
      }
      setAgentHistoryLoading(false);
    };
    load();
    setAgentHistoryLimit(100);
  }, [selectedAgent]);

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
      const result = await solicitacoesAPI.getByCpf(digits);
      setSearchResults(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Erro ao buscar CPF:', err);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  return (
    <div className="w-full py-12" style={{paddingLeft: '20px', paddingRight: '20px'}}>
        <div 
          className="grid gap-4" 
          style={{
            gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
            transition: 'grid-template-columns 0.3s ease'
          }}
        >
          {/* Conteúdo principal */}
          <div style={{ minWidth: 0 }}>
            {/* Sistema de Abas */}
            <div className="mb-8" style={{marginTop: '-15px'}}>
          {/* Abas */}
          <div className="flex justify-start mb-2" style={{gap: '2rem'}}>
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
            <button
              onClick={() => setActiveTab('calculadora-restituicao')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'calculadora-restituicao' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'calculadora-restituicao' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Calculadora de Restituição
            </button>
          </div>
          
          {/* Linha divisória */}
          <div className="w-full" style={{ height: '1px', backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'solicitacoes' && (
          <div className="flex gap-8">
          {/* Conteúdo Principal */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:-translate-y-0.5 transition-transform">
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

            {/* Formulário de Solicitação */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Formulário de Solicitação
              </h2>
              <FormSolicitacao registrarLog={registrarLog} />
            </div>
          </div>

          {/* Container de Sidebars */}
          <div className="flex flex-col gap-4 w-[400px] flex-shrink-0">
            {/* Sidebar Superior - Consulta de CPF */}
            <div className="w-[400px] h-[400px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Consulta de CPF
                </h2>
              </div>
              <div
                className="flex flex-col gap-2"
                aria-busy={searchLoading}
                aria-live="polite"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">CPF</label>
                    <input
                      className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o CPF"
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
                    {searchCpfError && (
                      <div className="mt-1 text-xs text-red-600">{searchCpfError}</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="h-5"></div>
                    <button
                      type="button"
                      onClick={buscarCpf}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-700"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Buscando...
                    </>
                  ) : (
                    'Buscar'
                  )}
                    </button>
                  </div>
                </div>
              </div>
              {searchCpf && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {searchResults.length} registro(s) encontrado(s)
                </div>
              )}
              <div className="mt-3 flex-1 overflow-auto pr-1">
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
                    {searchResults.slice(0, 8).map((r) => {
                      const imgCount = Array.isArray(r?.payload?.previews)
                        ? r.payload.previews.length
                        : Array.isArray(r?.payload?.imagens)
                        ? r.payload.imagens.length
                        : 0;
                      const videoCount = Array.isArray(r?.payload?.videos)
                        ? r.payload.videos.length
                        : 0;
                      const total = imgCount + videoCount;
                      return (
                        <div
                          key={r._id || r.id}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm">
                                <span>
                                  {r.tipo} — {r.cpf}
                                </span>
                                {total > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-800 dark:text-fuchsia-200 text-xs">
                                    Anexos:{' '}
                                    {imgCount > 0 ? `${imgCount} img` : ''}
                                    {imgCount > 0 && videoCount > 0 ? ' + ' : ''}
                                    {videoCount > 0 ? `${videoCount} vid` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Agente: {r.colaboradorNome || r.agente || '—'} • Status: {r.status || '—'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Inferior - Histórico do Agente */}
            <div className="w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 hover:-translate-y-0.5 transition-transform flex flex-col" style={{ height: '280px' }}>
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Histórico do agente
                </h2>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAgent || 'Selecione um agente'}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {agentHistoryLoading && (
              <div className="space-y-2" aria-busy={true} aria-live="polite">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex flex-col gap-2 animate-pulse"
                  >
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded" />
                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" />
                  </div>
                ))}
              </div>
            )}
            {!agentHistoryLoading && agentHistory.length === 0 && (
              <div className="text-sm opacity-70 text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhum registro.
              </div>
            )}
            {!agentHistoryLoading && agentHistory.length > 0 && (
              <div className="space-y-2">
                {agentHistory.slice(0, agentHistoryLimit).map((r) => {
                  const s = String(r.status || '').toLowerCase();
                  const badge =
                    s === 'feito'
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
                      : s === 'não feito' || s === 'nao feito'
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                      : s === 'enviado'
                      ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
                  const created = r.createdAt
                    ? new Date(r.createdAt).toLocaleString()
                    : '—';
                  const concluded =
                    (s === 'feito' || s === 'não feito' || s === 'nao feito') && r.updatedAt
                      ? new Date(r.updatedAt).toLocaleString()
                      : null;
                  return (
                    <div
                      key={r._id || r.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">
                        {r.tipo} — {r.cpf}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                        <span>Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${badge}`}
                        >
                          {s || '—'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400">
                        <div>Aberto: {created}</div>
                        {concluded && <div>Concluído: {concluded}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
            {agentHistory.length > agentHistoryLimit && (
              <div className="mt-3 text-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAgentHistoryLimit((n) => n + 50)}
                  className="text-sm px-3 py-1 rounded border hover:opacity-90 transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  Carregar mais ({agentHistory.length - agentHistoryLimit} restantes)
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
        )}

        {activeTab === 'erros-bugs' && (
          <ErrosBugsTab />
        )}

            {activeTab === 'calculadora-restituicao' && (
              <CalculadoraRestituicao />
            )}
          </div>
          
          {/* Sidebar direito com chat */}
          {renderRightSidebarChat()}
        </div>
    </div>
  );
};

export default EscalacoesPage;


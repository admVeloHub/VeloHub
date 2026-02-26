/**
 * VeloHub V3 - OuvidoriaPage (Módulo Ouvidoria/BACEN)
 * VERSION: v1.4.2 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.4.2:
 * - Removido container "Buscar Cliente" da aba Lista de Reclamações
 * - Container "Buscar Cliente" mantido apenas na aba Minhas Reclamações
 * 
 * Mudanças v1.4.1:
 * - Removidos logs de debug do Dashboard
 * 
 * Mudanças v1.4.0:
 * - Adicionado sidebar direito com widget de chat (recolhido por padrão)
 * - Chat widget integrado com funcionalidades completas (Conversas, Contatos, Salas)
 * - Layout adaptado para incluir chat widget em todas as abas
 * 
 * Mudanças v1.3.0:
 * - Adicionado carregamento de ID da seção do usuário para filtro na aba Minhas Reclamações
 * 
 * Mudanças v1.2.0:
 * - Removido título e subtítulo do módulo
 * - Botão atualizar movido para sidebar junto ao botão buscar cliente
 * 
 * Mudanças v1.1.0:
 * - Atualizado seletor de abas para seguir padrão de EscalacoesPage (text-2xl, gap-2rem, var(--blue-light))
 * - Removido container extra do conteúdo principal
 * - Padronização visual conforme LAYOUT_GUIDELINES.md
 * 
 * Página principal do módulo de Ouvidoria (integração BACEN)
 */

import React, { useEffect, useState } from 'react';
import { reclamacoesAPI, dashboardAPI, clientesAPI } from '../services/ouvidoriaApi';
import { API_BASE_URL } from '../config/api-config';
import DashboardOuvidoria from '../components/Ouvidoria/DashboardOuvidoria';
import FormReclamacao from '../components/Ouvidoria/FormReclamacao';
import ListaReclamacoes from '../components/Ouvidoria/ListaReclamacoes';
import MinhasReclamacoes from '../components/Ouvidoria/MinhasReclamacoes';
import RelatoriosOuvidoria from '../components/Ouvidoria/RelatoriosOuvidoria';
import HistoricoCliente from '../components/Ouvidoria/HistoricoCliente';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VeloChatWidget from '../components/VeloChatWidget';
import ChatStatusSelector from '../components/ChatStatusSelector';
import toast from 'react-hot-toast';

/**
 * Função helper para obter sessão do usuário
 */
const getUserSession = () => {
  try {
    // Tentar múltiplas chaves de sessão
    const sessionData = 
      localStorage.getItem('veloacademy_user_session') ||
      localStorage.getItem('velohub_user_session') ||
      localStorage.getItem('user_session');
    
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
  }
  return null;
};

/**
 * Página principal do módulo de Ouvidoria
 */
const OuvidoriaPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchCpf, setSearchCpf] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
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

  // Carregar sessão do usuário
  useEffect(() => {
    const session = getUserSession();
    setUserSession(session);
  }, []);

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
            colaboradorNome={userSession?.user?.name}
            userEmail={userSession?.user?.email}
          />
        );
      case 'nova':
        return (
          <FormReclamacao 
            responsavel={userSession?.user?.name}
            onSuccess={() => {
              toast.success('Reclamação criada com sucesso!');
              setActiveTab('minhas');
              loadDashboardStats();
            }}
          />
        );
      case 'lista':
        return <ListaReclamacoes />;
      case 'relatorios':
        return <RelatoriosOuvidoria />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full py-12" style={{paddingLeft: '20px', paddingRight: '20px'}}>
        {/* Sistema de Abas */}
        <div className="mb-8" style={{marginTop: '-15px'}}>
          {/* Abas */}
          <div className="flex justify-start mb-2" style={{gap: '2rem'}}>
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
              onClick={() => setActiveTab('minhas')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'minhas' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'minhas' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Minhas Reclamações
            </button>
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
              onClick={() => setActiveTab('lista')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'lista' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'lista' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Lista de Reclamações
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
            <div>
              {renderTabContent()}
            </div>

            {/* Sidebar Direita - Chat Widget */}
            {renderRightSidebarChat()}
          </div>
        )}
    </div>
  );
};

export default OuvidoriaPage;

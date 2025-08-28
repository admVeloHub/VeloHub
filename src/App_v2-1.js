import React, { useState, useEffect, useRef } from 'react';
import { Home, FileText, MessageSquare, LifeBuoy, Book, Search, User, Sun, Moon, FilePlus, Bot, GraduationCap, Map, Puzzle, PlusSquare, Send, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';
import { mainAPI, veloNewsAPI, articlesAPI, faqAPI } from './services/api';
import './header-styles.css';

// Sistema de gerenciamento de estado para modal crítico
const CriticalModalManager = {
  // Chaves para localStorage
  ACKNOWLEDGED_KEY: 'velohub-critical-acknowledged',
  REMIND_LATER_KEY: 'velohub-remind-later',
  SHOW_REMIND_BUTTON_KEY: 'velohub-show-remind-button',
  LAST_CRITICAL_KEY: 'velohub-last-critical-news',
  
  // Verificar se o usuário já foi ciente de uma notícia específica
  isAcknowledged: (newsTitle = null) => {
    if (newsTitle) {
      // Se tem título específico, verificar por título
      const acknowledgedNews = localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY);
      return acknowledgedNews === newsTitle;
    }
    // Fallback para compatibilidade
    return localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY) === 'true';
  },
  
  // Marcar como ciente de uma notícia específica
  setAcknowledged: (newsTitle = null) => {
    if (newsTitle) {
      // Salvar o título da notícia como chave de reconhecimento
      localStorage.setItem(CriticalModalManager.ACKNOWLEDGED_KEY, newsTitle);
      console.log('✅ Usuário marcou como ciente da notícia:', newsTitle);
    } else {
      // Fallback para compatibilidade
      localStorage.setItem(CriticalModalManager.ACKNOWLEDGED_KEY, 'true');
      console.log('✅ Usuário marcou como ciente (modo compatibilidade)');
    }
  },
  
  // Verificar se deve lembrar mais tarde
  shouldRemindLater: () => {
    const remindLater = localStorage.getItem(CriticalModalManager.REMIND_LATER_KEY);
    if (!remindLater) return false;
    
    const remindTime = parseInt(remindLater);
    const now = Date.now();
    const threeMinutes = 3 * 60 * 1000; // 3 minutos em millisegundos
    
    return now >= remindTime;
  },
  
  // Definir lembrete para 3 minutos
  setRemindLater: () => {
    const threeMinutesFromNow = Date.now() + (3 * 60 * 1000);
    localStorage.setItem(CriticalModalManager.REMIND_LATER_KEY, threeMinutesFromNow.toString());
    // Marcar que o botão "Me lembre mais tarde" já foi usado
    localStorage.setItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY, 'false');
  },
  
  // Limpar lembrete
  clearRemindLater: () => {
    localStorage.removeItem(CriticalModalManager.REMIND_LATER_KEY);
  },
  
  // Verificar se deve mostrar o botão "Me lembre mais tarde"
  shouldShowRemindButton: () => {
    return localStorage.getItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY) !== 'false';
  },
  
  // Resetar o estado para uma nova notícia crítica
  resetForNewCriticalNews: () => {
    console.log('🔄 Resetando estado do modal crítico...');
    console.log('📝 Estado antes do reset:', {
      acknowledged: localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY),
      remindLater: localStorage.getItem(CriticalModalManager.REMIND_LATER_KEY),
      showRemindButton: localStorage.getItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY),
      lastCriticalNews: CriticalModalManager.getLastCriticalNews()
    });
    
    // RESETAR COMPLETAMENTE O ESTADO
    localStorage.removeItem(CriticalModalManager.ACKNOWLEDGED_KEY);
    localStorage.removeItem(CriticalModalManager.REMIND_LATER_KEY);
    localStorage.setItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY, 'true');
    
    console.log('✅ Estado resetado com sucesso');
    console.log('📝 Estado após reset:', {
      acknowledged: localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY),
      remindLater: localStorage.getItem(CriticalModalManager.REMIND_LATER_KEY),
      showRemindButton: localStorage.getItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY),
      lastCriticalNews: CriticalModalManager.getLastCriticalNews()
    });
  },
  
  // Verificar se deve mostrar o modal
  shouldShowModal: (criticalNews) => {
    if (!criticalNews) return false;
    
    console.log('🔍 Verificando se deve mostrar modal para:', criticalNews.title);
    console.log('📝 Status atual de ciente:', CriticalModalManager.isAcknowledged(criticalNews.title));
    console.log('🔑 Chave atual no localStorage:', localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY));
    
    // Se já foi ciente desta notícia específica, não mostrar
    if (CriticalModalManager.isAcknowledged(criticalNews.title)) {
      console.log('❌ Modal não será exibido - usuário já foi ciente desta notícia');
      return false;
    }
    
    // Se tem lembrete ativo, mostrar
    if (CriticalModalManager.shouldRemindLater()) {
      console.log('⏰ Modal será exibido devido a lembrete ativo');
      CriticalModalManager.clearRemindLater(); // Limpar após verificar
      return true;
    }
    
    // Se não tem lembrete, mostrar normalmente
    console.log('✅ Modal será exibido normalmente');
    return true;
  },
  
  // Função de debug para limpar manualmente o estado (útil para testes)
  debugClearState: () => {
    console.log('🧹 Limpando estado manualmente para debug...');
    localStorage.removeItem(CriticalModalManager.ACKNOWLEDGED_KEY);
    localStorage.removeItem(CriticalModalManager.REMIND_LATER_KEY);
    localStorage.setItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY, 'true');
    console.log('✅ Estado limpo manualmente');
  },
  
  // Gerenciar a última notícia crítica vista
  getLastCriticalNews: () => {
    return localStorage.getItem(CriticalModalManager.LAST_CRITICAL_KEY);
  },
  
  setLastCriticalNews: (criticalKey) => {
    localStorage.setItem(CriticalModalManager.LAST_CRITICAL_KEY, criticalKey);
    console.log('💾 Última notícia crítica salva:', criticalKey);
  },
  
  // Verificar se é uma notícia crítica nova
  isNewCriticalNews: (criticalKey) => {
    const lastCritical = CriticalModalManager.getLastCriticalNews();
    const isNew = lastCritical !== criticalKey;
    console.log('🔍 Verificando se é notícia nova:', {
      lastCritical,
      currentCritical: criticalKey,
      isNew
    });
    return isNew;
  }
};

// Função global para debug (disponível no console do navegador)
window.debugCriticalModal = () => {
  console.log('🔧 Debug do Modal Crítico');
  console.log('📝 Estado atual:', {
    acknowledged: localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY),
    remindLater: localStorage.getItem(CriticalModalManager.REMIND_LATER_KEY),
    showRemindButton: localStorage.getItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY),
    lastCriticalNews: CriticalModalManager.getLastCriticalNews()
  });
  console.log('🧹 Para limpar o estado, execute: CriticalModalManager.debugClearState()');
  console.log('🔄 Para forçar nova notícia, execute: CriticalModalManager.setLastCriticalNews("")');
};

// Componente do Cabeçalho
const Header = ({ activePage, setActivePage, isDarkMode, toggleDarkMode }) => {
  const navItems = ['Home', 'VeloBot', 'Artigos', 'Apoio', 'VeloAcademy'];

  const handleNavClick = (item) => {
    console.log('Clicou em:', item); // Debug
    
    if (item === 'VeloAcademy') {
      console.log('Redirecionando para VeloAcademy...'); // Debug
      window.open('https://veloacademy.vercel.app', '_blank');
      return; // Não muda a página ativa para VeloAcademy
    }
    
    console.log('Mudando para página:', item); // Debug
    setActivePage(item);
  };

  return (
    <header className="velohub-header">
      <div className="header-container">
        <div className="velohub-logo" id="logo-container">
          <img id="logo-image" className="logo-image" src="/VeloHubLogo 2.png" alt="VeloHub Logo" />
        </div>
        
        <nav className="nav-menu">
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className={`nav-link ${activePage === item ? 'active' : ''}`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="user-section">
          <div className="user-info">
            <img id="user-avatar" className="user-avatar" src="" alt="Avatar" />
            <span id="user-name" className="user-name">Usuário VeloHub</span>
            <button id="logout-btn" className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <div className="theme-switch-wrapper" id="theme-toggle" onClick={toggleDarkMode}>
          <i className='bx bx-sun theme-icon'></i>
          <i className='bx bx-moon theme-icon'></i>
        </div>
      </div>
    </header>
  );
};

// Componente do Modal de Notícia Crítica - VERSÃO MELHORADA
const CriticalNewsModal = ({ news, onClose }) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const handleClose = () => {
    if (isAcknowledged) {
      CriticalModalManager.setAcknowledged(news.title);
    }
    onClose();
  };

  const handleRemindLater = () => {
    CriticalModalManager.setRemindLater();
    onClose();
  };

  // Verificar se deve mostrar o botão "Me lembre mais tarde"
  const shouldShowRemindButton = CriticalModalManager.shouldShowRemindButton();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{news.title}</h2>
                 <div 
             className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
             dangerouslySetInnerHTML={{ __html: news.content || '' }}
         />
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={handleClose}
            disabled={!isAcknowledged}
            className={`px-6 py-2 rounded-md font-semibold text-white transition-colors duration-300 ${isAcknowledged ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-500 cursor-not-allowed'}`}
          >
            Fechar
          </button>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center">
              <input
                id="acknowledge"
                type="checkbox"
                checked={isAcknowledged}
                onChange={() => setIsAcknowledged(!isAcknowledged)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="acknowledge" className="ml-2 text-gray-700 dark:text-gray-300 font-medium">
                Ciente
              </label>
            </div>
            {shouldShowRemindButton && (
              <button
                onClick={handleRemindLater}
                className="text-[#272A30] hover:underline font-medium text-sm -mt-1"
              >
                Me lembre mais tarde
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente da Página Principal - VERSÃO MELHORADA
export default function App_v2() {
  const [activePage, setActivePage] = useState('Home');
  const [criticalNews, setCriticalNews] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRemindLater, setShowRemindLater] = useState(true);

  useEffect(() => {
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('velohub-theme') || 'light';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('velohub-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('velohub-theme', 'light');
    }
  }, [isDarkMode]);

  // Inicializar funcionalidades do header
  useEffect(() => {
    // Importar e inicializar o header dinamicamente
    const initHeader = async () => {
      try {
        const { VeloHubHeader } = await import('./header-theme.js');
        if (VeloHubHeader && VeloHubHeader.init) {
          VeloHubHeader.init();
        }
      } catch (error) {
        console.log('Header inicializado via DOM');
      }
    };
    
    initHeader();
  }, []);

  const renderContent = () => {
    switch (activePage) {
      case 'Home':
        return <HomePage setCriticalNews={setCriticalNews} />;
             case 'VeloBot':
        return <ProcessosPage />;
      case 'Artigos':
        return <ArtigosPage />;
      case 'Apoio':
        return <ApoioPage />;
      case 'VeloAcademy':
        return <div className="text-center p-10 text-gray-800 dark:text-gray-200"><h1 className="text-3xl">VeloAcademy</h1><p>Clique no botão VeloAcademy no header para acessar a plataforma.</p></div>;
      default:
        return <HomePage setCriticalNews={setCriticalNews} />;
    }
  };

  return (
    <div className="min-h-screen bg-blue-500 bg-opacity-15 dark:bg-gray-900 font-sans">
      <Header activePage={activePage} setActivePage={setActivePage} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      <main>
        {renderContent()}
      </main>
      {criticalNews && (
        <CriticalNewsModal news={criticalNews} onClose={() => setCriticalNews(null)} />
      )}
    </div>
  );
}

// Conteúdo da Página Home - VERSÃO MELHORADA
const HomePage = ({ setCriticalNews }) => {
    const [selectedNews, setSelectedNews] = useState(null);
    const [veloNews, setVeloNews] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [lastCriticalNewsId, setLastCriticalNewsId] = useState(null);
    const [showGoogleChat, setShowGoogleChat] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [agentStatus, setAgentStatus] = useState('online');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                console.log('🔄 Buscando dados do Velonews...');
                const velonewsResponse = await veloNewsAPI.getAll();
                console.log('✅ Velonews recebidos:', velonewsResponse.data);
                console.log('🔍 Estrutura detalhada dos velonews:');
                if (velonewsResponse.data && velonewsResponse.data.length > 0) {
                    velonewsResponse.data.forEach((item, index) => {
                        console.log(`Velonews ${index + 1}:`, {
                            _id: item._id,
                            title: item.title,
                            content: item.content ? item.content.substring(0, 100) + '...' : null,
                            is_critical: item.is_critical,
                            createdAt: item.createdAt
                        });
                    });
                }
                
                // ✅ Usar todos os velonews recebidos da API
                const sortedVeloNews = [...velonewsResponse.data].sort((a, b) => {
                    const da = new Date(a.createdAt || a.updatedAt || 0) || 0;
                    const db = new Date(b.createdAt || b.updatedAt || 0) || 0;
                    return db - da;
                });
                
                setVeloNews(sortedVeloNews);
                
                // Debug: mostrar todos os velonews
                console.log('📰 Todos os velonews:', velonewsResponse.data);
                console.log('📅 Velonews ordenados por data:', sortedVeloNews.map(n => ({ 
                    title: n.title, 
                    date: n.createdAt,
                    is_critical: n.is_critical 
                })));
                
                // Verificar notícias críticas com novo sistema
                const critical = sortedVeloNews.find(n => n.is_critical === 'Y');
                console.log('🔍 Procurando por is_critical === "Y"');
                console.log('🔍 Velonews com is_critical:', velonewsResponse.data.map(n => ({ id: n._id, title: n.title, is_critical: n.is_critical })));
                
                if (critical) {
                    console.log('🚨 Notícia crítica encontrada:', critical);
                    
                    // Criar uma chave única para a notícia crítica (ID + título)
                    const criticalKey = `${critical._id}-${critical.title}`;
                    
                    // Verificar se é uma notícia crítica nova usando localStorage
                    if (CriticalModalManager.isNewCriticalNews(criticalKey)) {
                        console.log('🔄 Nova notícia crítica detectada! Resetando estado...');
                        console.log('📝 Título anterior:', localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY));
                        CriticalModalManager.resetForNewCriticalNews();
                        CriticalModalManager.setLastCriticalNews(criticalKey);
                        setLastCriticalNewsId(criticalKey);
                        console.log('✅ Estado resetado para nova notícia crítica');
                    } else {
                        console.log('📰 Mesma notícia crítica - não resetando estado');
                    }
                    
                    if (CriticalModalManager.shouldShowModal(critical)) {
                        console.log('✅ Modal será exibido para notícia crítica');
                        setCriticalNews(critical);
                    } else {
                        console.log('❌ Modal não será exibido (já foi ciente)');
                    }
                } else {
                    console.log('❌ Nenhuma notícia crítica encontrada');
                }

                // Buscar velonews recentes (todos, críticos e não críticos)
                const fetchRecentItems = async () => {
                    try {
                        // Usar todos os velonews já carregados (críticos e não críticos)
                        const recentVeloNews = sortedVeloNews
                            .filter(news => news.createdAt)
                            .slice(0, 3);

                        console.log('🔍 DEBUG - Itens recentes que serão exibidos:', recentVeloNews);
                        console.log('🔍 DEBUG - Estrutura dos itens recentes:', recentVeloNews.map(item => ({
                            _id: item._id,
                            title: item.title,
                            content: item.content ? item.content.substring(0, 50) + '...' : null,
                            createdAt: item.createdAt,
                            is_critical: item.is_critical
                        })));

                        setRecentItems(recentVeloNews);
                    } catch (error) {
                        console.error('Erro ao buscar itens recentes:', error);
                        setRecentItems([]);
                    }
                };

                fetchRecentItems();
            } catch (error) {
                console.error('❌ Erro ao carregar dados da API:', error);
                console.log('📋 Usando dados mock como fallback...');
                
                // Em caso de erro, usar arrays vazios
                console.warn('⚠️ Usando arrays vazios como fallback');
                setVeloNews([]);
                setCriticalNews(null);
                 setRecentItems([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
        
        // Refresh invisível a cada 3 minutos
        const refreshInterval = setInterval(() => {
            console.log('🔄 Refresh invisível executado...');
            setLastRefresh(Date.now());
            fetchAllData();
        }, 3 * 60 * 1000); // 3 minutos
        
        return () => clearInterval(refreshInterval);
    }, [setCriticalNews, lastCriticalNewsId]);

    // Fechar dropdown de status quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusDropdown && !event.target.closest('.status-dropdown')) {
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStatusDropdown]);

    return (
        <div className="container mx-auto px-2 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                 <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600 text-center">Adicionado Recentemente</h3>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
                    </div>
                 ) : recentItems.length > 0 ? (
                    <div className="space-y-4">
                         {recentItems.map(item => (
                             <div key={item._id || item.id} className="border-b dark:border-gray-700 pb-3 last:border-b-0">
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                                         VeloNews
                                     </span>
                                     <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{item.title}</h4>
                                 </div>
                                 <div 
                                     className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 prose prose-xs dark:prose-invert max-w-none"
                                     dangerouslySetInnerHTML={{ __html: item.content || '' }}
                                 />
                                 <span className="text-xs text-blue-600 dark:text-blue-400">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                         <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum item recente</p>
                    </div>
                )}

                 {/* Divisor */}
                 <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                                           <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200 text-center">Software de Ponto</h3>
                     
                     {/* Quadro da API do Software de Ponto */}
                     <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                         <div className="text-center">
                             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                                 <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                             </div>
                             <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Status do Sistema</h4>
                             <div className="flex items-center justify-center gap-2 mb-3">
                                 <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                                 <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                             </div>
                             <p className="text-xs text-gray-600 dark:text-gray-400">
                                 API do software de ponto dos agentes
                             </p>
                         </div>
                     </div>
                 </div>
            </aside>
            <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h2 className="text-center font-bold text-3xl mb-6">
                    <span className="text-blue-600">Velo</span>
                    <span className="text-black dark:text-white">News</span>
                </h2>
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando dados do MongoDB...</p>
                        </div>
                    ) : veloNews.length > 0 ? (
                        veloNews.slice(0, 4).map(news => (
                            <div key={news._id} className={`${
                                news.is_critical === 'Y' ? 'critical-news-frame' : 'border-b dark:border-gray-700 pb-4 last:border-b-0'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{news.title}</h3>
                                    {news.is_critical === 'Y' && (
                                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">
                                            Crítica
                                        </span>
                                    )}
                                </div>
                                                                 <div 
                                     className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-2 prose prose-sm dark:prose-invert max-w-none"
                                     dangerouslySetInnerHTML={{ __html: news.content || '' }}
                                 />
                                <div className="flex justify-between items-center">
                                    <button onClick={() => setSelectedNews(news)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                        Ler mais
                                    </button>
                                    {news.createdAt && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(news.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma notícia encontrada</p>
                        </div>
                    )}
                </div>
            </section>
                                                   <aside className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col min-h-[calc(100vh-200px)]">
                                    <h3 className="font-bold text-xl p-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-center">VeloChat</h3>
                  
                                     {/* Status do Agente */}
                   <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                       <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                       <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                                   </svg>
                               </div>
                               <div>
                                   <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Meu Nome</h4>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de comunicação</p>
                               </div>
                           </div>
                           <div className="relative status-dropdown">
                               <button 
                                   onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                   className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                                       agentStatus === 'online' 
                                           ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                           : agentStatus === 'away'
                                           ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                           : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                   }`}
                               >
                                   <span className={`w-2 h-2 rounded-full ${
                                       agentStatus === 'online' 
                                           ? 'bg-green-500' 
                                           : agentStatus === 'away'
                                           ? 'bg-yellow-500'
                                           : 'bg-blue-500'
                                   }`}></span>
                                   {agentStatus === 'online' ? 'Online' : agentStatus === 'away' ? 'Ausente' : 'Reunião'}
                                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                   </svg>
                               </button>
                               
                               {/* Dropdown de Status */}
                               {showStatusDropdown && (
                                   <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[120px]">
                                       <div className="py-1">
                                           <button 
                                               onClick={() => {
                                                   setAgentStatus('online');
                                                   setShowStatusDropdown(false);
                                               }}
                                               className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                           >
                                               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                               <span className="text-green-600 dark:text-green-400">Online</span>
                                           </button>
                                           <button 
                                               onClick={() => {
                                                   setAgentStatus('away');
                                                   setShowStatusDropdown(false);
                                               }}
                                               className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                           >
                                               <span className="w-2 h-2 bg-yellow-500 rounded-full" style={{backgroundColor: '#FCC200', opacity: 0.4}}></span>
                                               <span className="text-yellow-600 dark:text-yellow-400">Ausente</span>
                                           </button>
                                           <button 
                                               onClick={() => {
                                                   setAgentStatus('meeting');
                                                   setShowStatusDropdown(false);
                                               }}
                                               className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                           >
                                               <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#1694FF', opacity: 0.4}}></span>
                                               <span className="text-blue-600 dark:text-blue-400">Reunião</span>
                                           </button>
                                       </div>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>

                  {/* Lista de Contatos */}
                  <div className="flex-1 overflow-y-auto">
                      <div className="p-2">
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">Contatos</h5>
                          <div className="space-y-1">
                              {[
                                  { name: 'Gerente', status: 'online', lastSeen: 'Agora' },
                                  { name: 'Supervisor', status: 'online', lastSeen: '2 min' },
                                  { name: 'Colega 1', status: 'away', lastSeen: '5 min' },
                                  { name: 'Colega 2', status: 'online', lastSeen: 'Agora' },
                                  { name: 'Colega 3', status: 'offline', lastSeen: '1 hora' },
                                  { name: 'Grupo de Gestão', status: 'online', lastSeen: 'Agora', isGroup: true }
                              ].map((contact, index) => (
                                  <div 
                                      key={index}
                                      onClick={() => {
                                          setSelectedContact(contact);
                                          setShowGoogleChat(true);
                                      }}
                                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                  >
                                      <div className="relative">
                                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                  {contact.isGroup ? '👥' : contact.name.charAt(0)}
                                              </span>
                                          </div>
                                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                                              contact.status === 'online' ? 'bg-green-500' : 
                                              contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                          }`}></span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                              {contact.name}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {contact.status === 'online' ? 'Online' : 
                                               contact.status === 'away' ? 'Ausente' : 
                                               `Visto por último ${contact.lastSeen}`}
                                          </p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Barra de Busca */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="relative">
                          <input
                              type="text"
                              placeholder="Buscar contato..."
                              className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg py-2 px-3 pr-10 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                      </div>
                  </div>
              </aside>
            {selectedNews && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedNews(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{selectedNews.title}</h2>
                           <button onClick={() => setSelectedNews(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
                        </div>
                                                 <div 
                             className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                             dangerouslySetInnerHTML={{ __html: selectedNews.content || '' }}
                         />
                    </div>
                </div>
            )}

                         {/* Modal do Google Chat PWA */}
             {showGoogleChat && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                                                   {/* Header do Modal */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                              {selectedContact?.isGroup ? '👥' : selectedContact?.name?.charAt(0) || 'U'}
                                          </span>
                                      </div>
                                      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                                          selectedContact?.status === 'online' ? 'bg-green-500' : 
                                          selectedContact?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                      }`}></span>
                                  </div>
                                  <div>
                                      <h3 className="font-semibold text-gray-800 dark:text-white">
                                          {selectedContact?.name || 'Conversa'}
                                      </h3>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {selectedContact?.status === 'online' ? 'Online' : 
                                           selectedContact?.status === 'away' ? 'Ausente' : 
                                           selectedContact?.status === 'offline' ? 'Offline' : 'Disponível'}
                                      </p>
                                  </div>
                              </div>
                             <button 
                                 onClick={() => setShowGoogleChat(false)}
                                 className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-2xl font-bold"
                             >
                                 ×
                             </button>
                         </div>
                         
                                                   {/* Conteúdo do Chat */}
                          <div className="flex-1 flex flex-col">
                              {/* Área de Mensagens */}
                              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                                  <div className="space-y-4">
                                      {/* Mensagem de boas-vindas */}
                                      <div className="flex justify-start">
                                          <div className="max-w-xs bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                                  Olá! Como posso ajudar você hoje?
                                              </p>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          </div>
                                      </div>
                                      
                                      {/* Mensagem do usuário */}
                                      <div className="flex justify-end">
                                          <div className="max-w-xs bg-blue-600 text-white rounded-lg p-3 shadow-sm">
                                              <p className="text-sm">
                                                  Oi! Preciso de ajuda com um processo.
                                              </p>
                                              <span className="text-xs text-blue-100 mt-1 block">
                                                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          </div>
                                      </div>
                                      
                                      {/* Resposta do contato */}
                                      <div className="flex justify-start">
                                          <div className="max-w-xs bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                                  Claro! Estou aqui para ajudar. Qual processo você precisa?
                                              </p>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Área de Input */}
                              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                  <div className="flex items-center gap-3">
                                      <input
                                          type="text"
                                          placeholder="Digite sua mensagem..."
                                          className="flex-1 bg-gray-100 dark:bg-gray-700 border-transparent rounded-full py-2 px-4 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                          </svg>
                                      </button>
                                  </div>
                              </div>
                          </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Conteúdo da Página de Apoio
const ApoioPage = () => {
    const supportItems = [
        { name: 'Artigo', icon: <FileText size={40} /> }, { name: 'Processo', icon: <Bot size={40} /> },
        { name: 'Treinamento', icon: <GraduationCap size={40} /> }, { name: 'Roteiro', icon: <Map size={40} /> },
        { name: 'Funcionalidade', icon: <Puzzle size={40} /> }, { name: 'Recurso Adicional', icon: <PlusSquare size={40} /> },
    ];
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-center text-4xl font-bold text-gray-800 dark:text-white mb-12">Precisa de Apoio?</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {supportItems.map(item => (
                    <button key={item.name} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 flex flex-col items-center justify-center">
                        <div className="text-blue-500 dark:text-blue-400 mb-4">{item.icon}</div>
                        <span className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{item.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Página de Artigos
const ArtigosPage = () => {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [categories, setCategories] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);

    // Função para renderizar HTML de forma segura
    const renderHTML = (htmlContent) => {
        if (!htmlContent) return '';
        return { __html: htmlContent };
    };

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const response = await articlesAPI.getAll();
                console.log('Artigos carregados:', response.data);
                
                if (response.data && response.data.length > 0) {
                    setArticles(response.data);
                } else {
                    console.warn('⚠️ Dados de artigos não encontrados ou vazios, usando mock...');
                    throw new Error('Dados vazios da API');
                }
            } catch (error) {
                console.error('Erro ao carregar artigos da API:', error);
                console.log('📋 Usando dados mock como fallback...');
                
                // Em caso de erro, usar arrays vazios
                console.warn('⚠️ Usando arrays vazios como fallback');
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchArticles();
    }, []);

    // Extrair categorias únicas dos artigos
    useEffect(() => {
        if (articles.length > 0) {
            const uniqueCategories = ['Todas', ...new Set(articles.map(article => article.category).filter(Boolean))];
            setCategories(uniqueCategories);
        }
    }, [articles]);

    // Filtrar artigos por categoria
    useEffect(() => {
        if (selectedCategory === 'Todas') {
            setFilteredArticles(articles);
        } else {
            const filtered = articles.filter(article => article.category === selectedCategory);
            setFilteredArticles(filtered);
        }
    }, [selectedCategory, articles]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleArticleClick = (article) => {
        setSelectedArticle(article);
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Artigos</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar de Categorias */}
                <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-fit">
                                         <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600 text-center">
                        Categorias
                    </h3>
                    
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((category, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 text-sm ${
                                        selectedCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {!loading && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </aside>

                {/* Lista de Artigos */}
                <div className="lg:col-span-3">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando artigos...</p>
                        </div>
                    )}
                    
                    {!loading && (
                        <>
                            {filteredArticles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredArticles.map(article => (
                                         <div 
                                             key={article._id || article.id} 
                                             className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                             onClick={() => handleArticleClick(article)}
                                         >
                                            <div className="mb-3 flex justify-between items-start">
                                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                                                    {article.category}
                                                </span>
                                                {article.createdAt && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(article.createdAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">{article.title}</h3>
                                            {article.content && (
                                                 <div 
                                                     className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                                                     dangerouslySetInnerHTML={renderHTML(article.content)}
                                                 />
                                            )}
                                            {article.keywords && article.keywords.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {article.keywords.slice(0, 5).map((keyword, index) => (
                                                        <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                    {article.keywords.length > 5 && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                                                            +{article.keywords.length - 5} mais
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        Nenhum artigo encontrado na categoria "{selectedCategory}"
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal do Artigo */}
            {selectedArticle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                                    {selectedArticle.category}
                                </span>
                                {selectedArticle.createdAt && (
                                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(selectedArticle.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setSelectedArticle(null)}
                                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                                {selectedArticle.title}
                            </h2>
                            
                            <div 
                                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                dangerouslySetInnerHTML={renderHTML(selectedArticle.content)}
                            />
                            
                            {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Palavras-chave:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedArticle.keywords.map((keyword, index) => (
                                            <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Página de Processos (Chatbot)
const ProcessosPage = () => {
    const [promptFromFaq, setPromptFromFaq] = useState(null);
    const [faq, setFaq] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQ = async () => {
            try {
                setLoading(true);
                const response = await faqAPI.getAll();
                console.log('FAQ carregado:', response.data);
                
                if (response.data && response.data.length > 0) {
                    setFaq(response.data);
                } else {
                    console.warn('⚠️ Dados de FAQ não encontrados ou vazios, usando mock...');
                    throw new Error('Dados vazios da API');
                }
            } catch (error) {
                console.error('Erro ao carregar FAQ da API:', error);
                console.log('📋 Usando dados mock como fallback...');
                
                // Em caso de erro, usar arrays vazios
                console.warn('⚠️ Usando arrays vazios como fallback');
                setFaq([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchFAQ();
    }, []);

    const handleFaqClick = (question) => {
        setPromptFromFaq({ text: question, id: Date.now() }); 
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <Chatbot prompt={promptFromFaq} />
                </div>
                <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-fit">
                                         <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600 text-center">Perguntas Frequentes</h3>
                    
                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando...</p>
                        </div>
                    )}
                    
                    {!loading && (
                        <>
                            <ul className="space-y-3">
                                {faq.slice(0, 10).map((item, index) => (
                                    <li key={index} onClick={() => handleFaqClick(item.question || item)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-sm">
                                        {item.question || item}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full mt-6 bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors">
                                Mais Perguntas
                            </button>
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
};

// Componente do Modal de Feedback
const FeedbackModal = ({ isOpen, onClose, onSubmit, comment, setComment }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (comment.trim()) {
            onSubmit(comment);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Melhorar esta Resposta</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Obrigado pelo seu feedback! Por favor, nos diga o que estava errado ou faltando na resposta.</p>
                <form onSubmit={handleSubmit} className="mt-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ex: A resposta está desatualizada, o link está quebrado..."
                        className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                            Enviar Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente do Chatbot
const Chatbot = ({ prompt }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatBoxRef = useRef(null);
    const [feedbackForMessage, setFeedbackForMessage] = useState(null);
    const [feedbackComment, setFeedbackComment] = useState('');

    useEffect(() => {
        if (prompt) {
            handleSendMessage(prompt.text);
        }
    }, [prompt]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const findSuggestedArticles = async (query) => {
        try {
            const response = await articlesAPI.getAll();
            const queryWords = query.toLowerCase().split(/\s+/);
            return response.data.filter(article => 
                article.keywords && article.keywords.some(keyword => queryWords.includes(keyword))
            );
        } catch (error) {
            console.error('Erro ao buscar artigos da API:', error);
            console.log('📋 Usando dados mock para sugestões...');
            
            // Em caso de erro, retornar array vazio
            console.warn('⚠️ Erro ao buscar artigos, retornando array vazio');
            return [];
        }
    };

    const findRelevantFAQ = async (query) => {
        try {
            const response = await faqAPI.getAll();
            const queryWords = query.toLowerCase().split(/\s+/);
            return response.data.find(faq => 
                faq.keywords && queryWords.some(word => 
                    faq.keywords.toLowerCase().includes(word)
                )
            );
        } catch (error) {
            console.error('Erro ao buscar FAQ da API:', error);
            console.log('📋 Usando dados mock para FAQ...');
            
            // Em caso de erro, retornar null
            console.warn('⚠️ Erro ao buscar FAQ, retornando null');
            return null;
        }
    };

    const handleSendMessage = async (text) => {
        const trimmedInput = text.trim();
        if (!trimmedInput || isTyping) return;

        const newMessages = [...messages, { id: Date.now(), text: trimmedInput, sender: 'user' }];
        setMessages(newMessages);
        setInputValue('');
        setIsTyping(true);

        // Buscar resposta relevante nos dados
        const relevantFAQ = await findRelevantFAQ(trimmedInput);
        const suggestedArticles = await findSuggestedArticles(trimmedInput);
        
        let botResponse;
        if (relevantFAQ) {
            botResponse = relevantFAQ.context;
        } else {
            // Se não encontrar FAQ específico, buscar em artigos
            const relevantArticle = suggestedArticles.find(article => 
                article.content && article.content.toLowerCase().includes(trimmedInput.toLowerCase())
            );
            if (relevantArticle) {
                botResponse = relevantArticle.content;
            } else {
                botResponse = `Desculpe, não encontrei informações específicas sobre "${trimmedInput}". Posso ajudá-lo com outras dúvidas sobre nossos serviços.`;
            }
        }
        
        let finalMessages = [...newMessages, { id: Date.now() + 1, text: botResponse, sender: 'bot', feedbackState: 'pending' }];

        if(suggestedArticles.length > 0) {
            finalMessages.push({ id: Date.now() + 2, type: 'articles', articles: suggestedArticles, sender: 'bot' });
        }
        
        setMessages(finalMessages);
        setIsTyping(false);
    };

    const handleFeedback = (messageId, feedbackType, comment = '') => {
        console.log({ messageId, feedbackType, comment, question: messages.find(m => m.id === messageId)?.text });
        setMessages(currentMessages =>
            currentMessages.map(msg =>
                msg.id === messageId ? { ...msg, feedbackState: 'given' } : msg
            )
        );
    };
    
    const openFeedbackModal = (message) => { setFeedbackForMessage(message); };
    const closeFeedbackModal = () => { setFeedbackForMessage(null); setFeedbackComment(''); };
    const submitFeedbackModal = (comment) => { handleFeedback(feedbackForMessage.id, 'negative', comment); closeFeedbackModal(); };

    return (
        <>
            <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0 flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                    <img src="https://github.com/VeloProcess/PDP-Portal-de-Processos-/blob/main/unnamed%20(2).png?raw=true" alt="Logo" className="w-10 h-10 rounded-full" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Veloprocess</h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 bg-green-500 rounded-full"></span>Online</span>
                            <span>v.4.0.1</span>
                        </div>
                    </div>
                </div>
                <div ref={chatBoxRef} className="flex-grow p-6 overflow-y-auto space-y-6">
                    {messages.length === 0 && !isTyping && (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto animate-pulse flex items-center justify-center">
                                    <Bot size={48} className="text-blue-500"/>
                                </div>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">Faça uma pergunta para começar.</p>
                            </div>
                        </div>
                    )}
                    {messages.map(msg => {
                        if (msg.type === 'articles') {
                            return (
                                <div key={msg.id} className="flex gap-3 justify-start">
                                    <img src="https://github.com/VeloProcess/PDP-Portal-de-Processos-/blob/main/unnamed%20(2).png?raw=true" alt="Bot" className="w-8 h-8 rounded-full" />
                                    <div className="max-w-md p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                                        <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">Artigos relacionados:</h4>
                                        <ul className="space-y-2">
                                            {msg.articles.map(article => (
                                                <li key={article.id} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-sm flex items-center gap-2">
                                                    <BookOpen size={14} /> {article.title}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )
                        }
                        return (
                            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && <img src="https://github.com/VeloProcess/PDP-Portal-de-Processos-/blob/main/unnamed%20(2).png?raw=true" alt="Bot" className="w-8 h-8 rounded-full" />}
                                <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                    <p>{msg.text}</p>
                                    {msg.feedbackState === 'pending' && (
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleFeedback(msg.id, 'positive')} className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500"><ThumbsUp size={16}/></button>
                                            <button onClick={() => openFeedbackModal(msg)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500"><ThumbsDown size={16}/></button>
                                        </div>
                                    )}
                                    {msg.feedbackState === 'given' && (
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-2 font-semibold">Obrigado pelo feedback!</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {isTyping && (
                        <div className="flex gap-3 justify-start">
                            <img src="https://github.com/VeloProcess/PDP-Portal-de-Processos-/blob/main/unnamed%20(2).png?raw=true" alt="Bot" className="w-8 h-8 rounded-full" />
                            <div className="max-w-md p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                            <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></span>
                            </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                            placeholder="Digite sua mensagem..."
                            className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-full py-3 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => handleSendMessage(inputValue)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors disabled:bg-blue-300" disabled={isTyping || !inputValue}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
            
            <FeedbackModal 
                isOpen={!!feedbackForMessage}
                onClose={closeFeedbackModal}
                onSubmit={submitFeedbackModal}
                comment={feedbackComment}
                setComment={setFeedbackComment}
            />
        </>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { Home, FileText, MessageSquare, LifeBuoy, Book, Search, User, Sun, Moon, FilePlus, Bot, GraduationCap, Map, Puzzle, PlusSquare, Send, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';
import { mainAPI, veloNewsAPI, articlesAPI, faqAPI } from './services/api';
import { getMockData } from './data/mockData';
import './header-styles.css';



// Componente do Cabeçalho
const Header = ({ activePage, setActivePage, isDarkMode, toggleDarkMode }) => {
  const navItems = ['Home', 'Processos', 'Artigos', 'Apoio', 'VeloAcademy'];

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

// Componente do Modal de Notícia Crítica
const CriticalNewsModal = ({ news, onClose }) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{news.title}</h2>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p>{news.content}</p>
        </div>
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={!isAcknowledged}
            className={`px-6 py-2 rounded-md font-semibold text-white transition-colors duration-300 ${isAcknowledged ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-500 cursor-not-allowed'}`}
          >
            Fechar
          </button>
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
        </div>
      </div>
    </div>
  );
};

// Componente da Página Principal
export default function App_v2() {
  const [activePage, setActivePage] = useState('Home');
  const [criticalNews, setCriticalNews] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      case 'Processos':
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

// Conteúdo da Página Home
const HomePage = ({ setCriticalNews }) => {
    const [selectedNews, setSelectedNews] = useState(null);
    const [veloNews, setVeloNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                console.log('🔄 Buscando todos os dados...');
                const response = await mainAPI.getAllData();
                console.log('✅ Dados recebidos:', response.data);
                
                if (response.data && response.data.velonews && response.data.velonews.length > 0) {
                    setVeloNews(response.data.velonews);
                    
                    // Verificar notícias críticas
                    const critical = response.data.velonews.find(n => n.is_critical === 'Y');
                    if (critical) {
                        setCriticalNews(critical);
                    }
                } else {
                    console.warn('⚠️ Dados de velonews não encontrados ou vazios, usando mock...');
                    throw new Error('Dados vazios da API');
                }
            } catch (error) {
                console.error('❌ Erro ao carregar dados da API:', error);
                console.log('📋 Usando dados mock como fallback...');
                
                // Usar dados mock como fallback
                const mockData = getMockData();
                setVeloNews(mockData.velonews);
                
                // Verificar notícias críticas nos dados mock
                const critical = mockData.velonews.find(n => n.is_critical === 'Y');
                if (critical) {
                    setCriticalNews(critical);
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [setCriticalNews]);

    return (
        <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600">Adicionado Recentemente</h3>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
                    </div>
                ) : veloNews.length > 0 ? (
                    <div className="space-y-4">
                        {veloNews.slice(0, 3).map(news => (
                            <div key={news._id} className="border-b dark:border-gray-700 pb-3 last:border-b-0">
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">{news.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{news.content}</p>
                                <span className="text-xs text-blue-600 dark:text-blue-400">{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma notícia recente</p>
                    </div>
                )}
            </aside>
            <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-center font-bold text-3xl mb-6">
                    <span className="text-blue-600">Velo</span>
                    <span className="text-black dark:text-white">News</span>
                </h2>
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando dados do MongoDB...</p>
                        </div>
                    ) : veloNews.length > 0 ? (
                        veloNews.slice(0, 4).map(news => (
                            <div key={news._id} className="border-b dark:border-gray-700 pb-4 last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{news.title}</h3>
                                    {news.is_critical === 'Y' && (
                                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">
                                            Crítica
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">{news.content}</p>
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
            <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600">Status</h3>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Notícias:</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{veloNews.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Críticas:</span>
                            <span className="text-sm font-semibold text-red-600">{veloNews.filter(n => n.is_critical === 'Y').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Sistema:</span>
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                                <span className="text-sm font-semibold text-green-600">Online</span>
                            </span>
                        </div>
                    </div>
                )}
            </aside>
            {selectedNews && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedNews(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{selectedNews.title}</h2>
                           <button onClick={() => setSelectedNews(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                            <p>{selectedNews.content}</p>
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
                
                // Usar dados mock como fallback
                const mockData = getMockData();
                setArticles(mockData.articles);
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

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Artigos</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar de Categorias */}
                <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-fit">
                    <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600">
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
                                        <div key={article._id || article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                                                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{article.content}</p>
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
                
                // Usar dados mock como fallback
                const mockData = getMockData();
                setFaq(mockData.faq);
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
                    <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600">Perguntas Frequentes</h3>
                    
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
            
            // Usar dados mock como fallback
            const mockData = getMockData();
            const queryWords = query.toLowerCase().split(/\s+/);
            return mockData.articles.filter(article => 
                article.keywords && article.keywords.some(keyword => queryWords.includes(keyword))
            );
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
            
            // Usar dados mock como fallback
            const mockData = getMockData();
            const queryWords = query.toLowerCase().split(/\s+/);
            return mockData.faq.find(faq => 
                faq.keywords && queryWords.some(word => 
                    faq.keywords.toLowerCase().includes(word)
                )
            );
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

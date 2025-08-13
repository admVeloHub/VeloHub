import React, { useState, useEffect, useRef } from 'react';
import { Home, FileText, MessageSquare, LifeBuoy, Book, Search, User, Sun, Moon, FilePlus, Bot, GraduationCap, Map, Puzzle, PlusSquare, Send, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';
import { veloNewsAPI, articlesAPI, faqAPI } from './services/api';

// Dados mock (serão substituídos por chamadas de API)
const mockVeloNews = [
  { _id: 1, title: 'Nova Integração com Sistema de Gestão', content: 'Expandimos nossas capacidades! Agora o VeloHub se integra perfeitamente com os principais sistemas de gestão do mercado, otimizando seu fluxo de trabalho e centralizando informações cruciais para o seu negócio. A atualização já está disponível para todos os usuários.' },
  { _id: 2, title: 'Atualização de Segurança Crítica', content: 'Implementamos novas camadas de segurança para proteger seus dados. Esta atualização reforça a criptografia e adiciona novos protocolos de autenticação. Recomendamos que todos os usuários revisem suas configurações de segurança.', is_critical: 'Y'},
  { _id: 3, title: 'VeloAcademy Lança Novo Curso de Processos', content: 'Aprenda a dominar a automação de processos com nosso novo curso exclusivo na VeloAcademy. O curso cobre desde os conceitos básicos até as estratégias avançadas para maximizar a eficiência da sua equipe. Inscreva-se já!' },
  { _id: 4, title: 'Dashboard de Análise de Dados Recebe Melhorias', content: 'Apresentamos um dashboard de análise totalmente remodelado. Com novos gráficos interativos e métricas personalizáveis, ficou mais fácil extrair insights valiosos e tomar decisões baseadas em dados com mais rapidez e precisão.' },
];

const mockRecentlyAdded = ['Novo Artigo: Otimização de API', 'Processo Atualizado: Onboarding', 'Funcionalidade: Exportar Relatório'];
const mockStatus = ['API Operacional', 'Banco de Dados Conectado', 'Chatbot Online'];
const mockFaq = [
    'Como resetar minha senha?', 'Onde encontro meus relatórios?', 'Como integrar com o sistema X?',
    'Qual o plano ideal para minha equipe?', 'Como funciona a exportação de dados?', 'Posso adicionar mais usuários?',
    'Como customizar meu dashboard?', 'Onde vejo o histórico de alterações?', 'Como entrar em contato com o suporte?',
    'Qual a política de segurança de dados?',
];

const mockArticles = [
    { id: 1, title: "Guia Completo para Resetar sua Senha", keywords: ["senha", "resetar", "esqueci", "acesso"] },
    { id: 2, title: "Entendendo os Relatórios Analíticos", keywords: ["relatórios", "dados", "análise"] },
    { id: 3, title: "Passo a passo para Integração de Sistemas", keywords: ["integrar", "integração", "api", "sistema"] },
    { id: 4, title: "Exportação de Dados em CSV e PDF", keywords: ["exportação", "exportar", "dados", "pdf", "csv"] },
];

// Componente de Logo
const VeloHubLogo = () => (
  <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="28" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold">
      <tspan fill="#007BFF">Velo</tspan>
      <tspan fill="#1a202c" className="dark:fill-white">Hub</tspan>
    </text>
  </svg>
);

// Componente do Cabeçalho
const Header = ({ activePage, setActivePage, isDarkMode, toggleDarkMode }) => {
  const navItems = ['Home', 'Processos', 'Artigos', 'Apoio', 'VeloAcademy'];

  return (
    <header className="bg-white dark:bg-gray-800 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <VeloHubLogo />
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(item => (
              <button
                key={item}
                onClick={() => setActivePage(item)}
                className={`text-lg font-medium transition-colors duration-300 ${activePage === item ? 'bg-blue-600 text-white px-4 py-2 rounded-md' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-full px-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <User className="text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            {isDarkMode ? <Sun className="text-yellow-500" /> : <Moon className="text-gray-600" />}
          </button>
        </div>
      </div>
      <div className="w-full h-[2px] bg-black dark:bg-gray-600"></div>
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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderContent = () => {
    switch (activePage) {
      case 'Home':
        return <HomePage setCriticalNews={setCriticalNews} />;
      case 'Processos':
        return <ProcessosPage />;
      case 'Artigos':
        return <div className="text-center p-10 text-gray-800 dark:text-gray-200"><h1 className="text-3xl">Página de Artigos</h1><p>As categorias e os artigos serão exibidos aqui.</p></div>;
      case 'Apoio':
        return <ApoioPage />;
      case 'VeloAcademy':
        if (typeof window !== 'undefined') {
            window.location.href = 'https://google.com'; // URL de exemplo
        }
        return <div className="text-center p-10 text-gray-800 dark:text-gray-200"><h1 className="text-3xl">Redirecionando...</h1></div>;
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

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await veloNewsAPI.getAll();
                setVeloNews(response.data);
                
                // Verificar notícias críticas
                const critical = response.data.find(n => n.is_critical === 'Y');
                if (critical) {
                    setCriticalNews(critical);
                }
            } catch (error) {
                console.error('Erro ao carregar notícias:', error);
                // Fallback para dados mock em caso de erro
                setVeloNews(mockVeloNews);
            }
        };
        
        fetchNews();
    }, [setCriticalNews]);

    return (
        <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600">Adicionado Recentemente</h3>
                <ul className="space-y-3">
                    {mockRecentlyAdded.map((item, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">{item}</li>
                    ))}
                </ul>
            </aside>
            <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-center font-bold text-3xl mb-6">
                    <span className="text-blue-600">Velo</span>
                    <span className="text-black dark:text-white">News</span>
                </h2>
                <div className="space-y-6">
                    {veloNews.slice(0, 4).map(news => (
                        <div key={news._id} className="border-b dark:border-gray-700 pb-4 last:border-b-0">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">{news.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{news.content}</p>
                            <button onClick={() => setSelectedNews(news)} className="text-blue-600 dark:text-blue-400 hover:underline mt-2 font-medium">
                                Ler mais
                            </button>
                        </div>
                    ))}
                </div>
            </section>
            <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 dark:border-gray-600">Status</h3>
                <ul className="space-y-3">
                    {mockStatus.map((item, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                            {item}
                        </li>
                    ))}
                </ul>
            </aside>
            {selectedNews && !selectedNews.is_critical && (
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

// Página de Processos (Chatbot)
const ProcessosPage = () => {
    const [promptFromFaq, setPromptFromFaq] = useState(null);
    const [faq, setFaq] = useState([]);

    useEffect(() => {
        const fetchFAQ = async () => {
            try {
                const response = await faqAPI.getAll();
                setFaq(response.data);
            } catch (error) {
                console.error('Erro ao carregar FAQ:', error);
                // Fallback para dados mock em caso de erro
                setFaq(mockFaq);
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
            console.error('Erro ao buscar artigos:', error);
            // Fallback para dados mock em caso de erro
            const queryWords = query.toLowerCase().split(/\s+/);
            return mockArticles.filter(article => 
                article.keywords.some(keyword => queryWords.includes(keyword))
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

        // fetch(`/api/chatbot?q=${trimmedInput}`).then(res => res.json()).then(data => { ... });
        const botResponse = `Esta é uma resposta para: "${trimmedInput}". Em um ambiente real, eu buscaria esta informação em uma base de dados.`;
        const suggestedArticles = await findSuggestedArticles(trimmedInput);
        
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

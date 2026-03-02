/**
 * LoadingPage - Página de Loading Intermediária
 * VERSION: v2.1.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.1.0:
 * - CORREÇÃO: Adicionada proteção contra criação duplicada de sessionId (React StrictMode)
 * - CORREÇÃO: Verificação se sessionId já existe antes de criar novo
 * - CORREÇÃO: Ref para evitar execução dupla do useEffect de criação de sessionId
 * - registerLoginSession agora verifica sessionId existente antes de criar
 * 
 * Mudanças v2.0.0:
 * - REFATORAÇÃO: Criação de sessionId movida do LoginPage para LoadingPage
 * - Implementado retry robusto com 5 tentativas para criação de sessionId
 * - Mensagens dinâmicas baseadas no estado real do processo:
 *   - "Criando sessionID" (durante criação)
 *   - "Tentando novamente (X/5)" (em caso de falha)
 *   - "Iniciando sessão" (após sucesso)
 *   - "Buscando contatos" (durante busca)
 *   - "Atualizando notícias" (durante atualização)
 * - Se todas as 5 tentativas falharem, chama onComplete(false) para retornar ao login
 * - Removidas mensagens genéricas/forçadas
 * 
 * Página de loading que aparece imediatamente ao carregar o app.
 * Executa verificação de autenticação e carregamento em background (oculto).
 * Reproduz áudio de abertura automaticamente (/Velotax Opening.mp3) sem esperar interação do usuário.
 * Carregamento prossegue mesmo se usuário sair da aba.
 * Redireciona para home após tempo mínimo, sem esperar áudio terminar.
 * 
 * Mudanças v1.4.0:
 * - CRÍTICO: Garantir que sessionId sempre existe durante inicialização
 * - Quando userData é fornecido, garantir sessionId antes de continuar
 * - initSession() agora garante sessionId antes de atualizar informações do usuário
 * - Adicionado tratamento de erros robusto para garantir que inicialização não falhe
 * 
 * Mudanças v1.3.0:
 * - Removido botão "Clique para iniciar" e avisos de clique
 * - Áudio executa automaticamente sem esperar interação
 * - Carregamento acontece em background (oculto)
 * - Prossegue para home após tempo mínimo sem esperar áudio
 * - Carregamento continua mesmo se usuário sair da aba (Page Visibility API)
 * 
 * Mudanças v1.2.0:
 * - Corrigido problema de autoplay bloqueado pelos navegadores
 * - Adicionado botão "Clique para iniciar" quando autoplay falha
 * - Adicionado timeout de fallback (15s) para prosseguir mesmo se áudio não tocar
 * - Listener de clique na página inteira para iniciar áudio quando usuário interagir
 */

import React, { useState, useEffect, useRef } from 'react';
import { updateUserInfo, checkAuthenticationState, getUserSession, registerLoginSession } from '../services/auth';
import * as velochatApi from '../services/velochatApi';
import { veloNewsAPI } from '../services/api';

const LoadingPage = ({ userData, onComplete, onAuthCheck }) => {
    const [currentMessage, setCurrentMessage] = useState('Criando sessionID');
    const [audioDuration, setAudioDuration] = useState(0);
    const [isInitializing, setIsInitializing] = useState(false);
    const audioRef = useRef(null);
    const messageIntervalRef = useRef(null);
    const completionTimeoutRef = useRef(null);
    const operationsStartedRef = useRef(false);

    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [resolvedUserData, setResolvedUserData] = useState(userData);
    const [sessionIdCreated, setSessionIdCreated] = useState(false);
    // Ref para evitar criação duplicada de sessionId (React StrictMode causa renderização dupla)
    const sessionCreationStartedRef = useRef(false);

    // Função para criar sessionId com retry de 5 tentativas
    const createSessionIdWithRetry = async (userData, maxRetries = 5) => {
        // Verificar se já existe sessionId válido antes de criar
        const existingSessionId = localStorage.getItem('velohub_session_id');
        if (existingSessionId && existingSessionId.trim().length > 0) {
            console.log('✅ sessionId já existe, usando existente:', existingSessionId.substring(0, 8) + '...');
            setSessionIdCreated(true);
            setCurrentMessage('Iniciando sessão');
            return existingSessionId;
        }
        
        setCurrentMessage('Criando sessionID');
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Verificar novamente antes de cada tentativa (pode ter sido criado por outro processo)
                const checkSessionId = localStorage.getItem('velohub_session_id');
                if (checkSessionId && checkSessionId.trim().length > 0) {
                    console.log('✅ sessionId criado por outro processo, usando existente:', checkSessionId.substring(0, 8) + '...');
                    setSessionIdCreated(true);
                    setCurrentMessage('Iniciando sessão');
                    return checkSessionId;
                }
                
                const sessionId = await registerLoginSession(userData, 1, 1000);
                if (sessionId) {
                    console.log(`✅ sessionId criado com sucesso na tentativa ${attempt}/${maxRetries}`);
                    setSessionIdCreated(true);
                    setCurrentMessage('Iniciando sessão');
                    return sessionId;
                }
            } catch (error) {
                console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou:`, error);
                
                if (attempt < maxRetries) {
                    setCurrentMessage(`Tentando novamente (${attempt}/${maxRetries})`);
                    // Aguardar antes da próxima tentativa (backoff exponencial)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                } else {
                    console.error('❌ Todas as tentativas de criar sessionId falharam');
                    setCurrentMessage('Erro ao criar sessão');
                    return null;
                }
            }
        }
        
        return null;
    };

    // Verificar autenticação primeiro se userData não foi fornecido
    useEffect(() => {
        if (userData) {
            // Proteção contra execução dupla (React StrictMode)
            if (sessionCreationStartedRef.current) {
                console.log('⚠️ LoadingPage: Criação de sessionId já iniciada, ignorando chamada duplicada');
                return;
            }
            sessionCreationStartedRef.current = true;
            
            // Se userData foi fornecido (login direto), criar sessionId com retry
            const createSession = async () => {
                try {
                    setCurrentMessage('Criando sessionID');
                    const sessionId = await createSessionIdWithRetry(userData, 5);
                    
                    // Se não conseguiu criar sessionId após 5 tentativas, autenticação FALHA
                    if (!sessionId) {
                        console.error('❌ LoadingPage: Não foi possível criar sessionId após 5 tentativas - autenticação falhou');
                        setIsAuthenticated(false);
                        setAuthChecked(true);
                        if (onAuthCheck) {
                            onAuthCheck(false);
                        }
                        // Retornar para login após um breve delay
                        setTimeout(() => {
                            if (onComplete) {
                                onComplete(false);
                            }
                        }, 2000);
                        return;
                    }
                    
                    console.log('✅ LoadingPage: sessionId criado com sucesso:', sessionId.substring(0, 8) + '...');
                    setResolvedUserData(userData);
                    setIsAuthenticated(true);
                    setAuthChecked(true);
                } catch (error) {
                    console.error('❌ LoadingPage: Erro ao criar sessionId para userData:', error);
                    // Autenticação FALHA se não conseguir criar sessionId
                    setIsAuthenticated(false);
                    setAuthChecked(true);
                    if (onAuthCheck) {
                        onAuthCheck(false);
                    }
                    // Retornar para login após um breve delay
                    setTimeout(() => {
                        if (onComplete) {
                            onComplete(false);
                        }
                    }, 2000);
                }
            };
            createSession();
            return;
        }

        // Se não tem userData, verificar autenticação
        const checkAuth = async () => {
            try {
                const isAuth = await checkAuthenticationState();
                setIsAuthenticated(isAuth);
                
                if (isAuth) {
                    const session = getUserSession();
                    if (session && session.user) {
                        setResolvedUserData(session.user);
                    }
                    // Se autenticado, sessionId já foi garantido por checkAuthenticationState
                    // Verificar se sessionId existe no localStorage
                    const existingSessionId = localStorage.getItem('velohub_session_id');
                    if (existingSessionId) {
                        setSessionIdCreated(true);
                        setCurrentMessage('Iniciando sessão');
                    }
                }
                
                setAuthChecked(true);
                
                // Notificar componente pai sobre resultado da autenticação
                if (onAuthCheck) {
                    onAuthCheck(isAuth);
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                setIsAuthenticated(false);
                setAuthChecked(true);
                if (onAuthCheck) {
                    onAuthCheck(false);
                }
            }
        };

        checkAuth();
    }, [userData, onAuthCheck]);

    // Inicializar sessão e executar operações em background (oculto)
    // Operações continuam mesmo se usuário sair da aba
    useEffect(() => {
        if (!authChecked || !isAuthenticated || !sessionIdCreated || operationsStartedRef.current) return;

        // Marcar que operações já foram iniciadas
        operationsStartedRef.current = true;
        setIsInitializing(true);

        // 1. Iniciar Sessão (executar imediatamente após verificação de autenticação)
        const initSession = async () => {
            try {
                if (isAuthenticated && resolvedUserData && sessionIdCreated) {
                    setCurrentMessage('Iniciando sessão');
                    
                    // Atualizar informações do usuário
                    updateUserInfo(resolvedUserData);
                    
                    // Disparar evento para atualizar header
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('user-info-updated', { detail: resolvedUserData }));
                    }, 200);
                }
            } catch (error) {
                console.error('Erro ao inicializar sessão:', error);
            }
        };

        // 2. Buscar Contatos (executar em background, não bloquear)
        const fetchContacts = async () => {
            try {
                if (isAuthenticated && sessionIdCreated) {
                    setCurrentMessage('Buscando contatos');
                    // Inicializar conexão com chat e carregar contatos em background
                    velochatApi.getContacts().catch(err => {
                        console.error('Erro ao buscar contatos:', err);
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            }
        };

        // 3. Atualizar Notícias (executar em background, não bloquear)
        const updateNews = async () => {
            try {
                if (isAuthenticated && sessionIdCreated) {
                    setCurrentMessage('Atualizando notícias');
                    // Iniciar carregamento de notícias em background (não precisa completar)
                    veloNewsAPI.getRecent(4).catch(err => {
                        console.error('Erro ao atualizar notícias:', err);
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar notícias:', error);
            }
        };

        // Executar operações sequencialmente
        initSession();
        // Aguardar um pouco antes de buscar contatos
        setTimeout(() => {
            fetchContacts();
        }, 500);
        // Aguardar um pouco antes de atualizar notícias
        setTimeout(() => {
            updateNews();
        }, 1000);

        // Usar Page Visibility API para continuar operações mesmo se usuário sair da aba
        const handleVisibilityChange = () => {
            // Se aba ficou visível novamente e ainda não completou, continuar operações
            if (!document.hidden && isInitializing) {
                // Operações já foram iniciadas, apenas garantir que continuam
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [authChecked, isAuthenticated, resolvedUserData, sessionIdCreated]);

    // Configurar áudio e completar após tempo mínimo (não esperar áudio terminar)
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Tentar reproduzir áudio imediatamente (sem esperar metadata carregar)
        const tryPlayAudio = async () => {
            try {
                audio.volume = 0.5;
                // Tentar reproduzir imediatamente
                await audio.play().catch(err => {
                    // Se falhar, tentar novamente quando metadata carregar
                    console.warn('Autoplay bloqueado, tentando quando metadata carregar:', err);
                });
            } catch (error) {
                // Ignorar erros, continuar normalmente
                console.warn('Áudio não pôde ser reproduzido:', error);
            }
        };

        // Tentar reproduzir imediatamente
        tryPlayAudio();

        // Capturar duração do áudio quando metadata carregar
        const handleLoadedMetadata = () => {
            const duration = audio.duration * 1000; // Converter para milissegundos
            setAudioDuration(duration);

            // Tentar reproduzir novamente quando metadata carregar (caso primeira tentativa falhou)
            tryPlayAudio();
        };

        // Completar após tempo mínimo (3 segundos) sem esperar áudio terminar
        const completeLoading = () => {
            if (messageIntervalRef.current) {
                clearInterval(messageIntervalRef.current);
            }
            setIsInitializing(false);
            if (onComplete) {
                onComplete(isAuthenticated && sessionIdCreated);
            }
        };

        // Não configurar timeout aqui - será configurado quando sessionId for criado

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        // Cleanup
        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            if (messageIntervalRef.current) {
                clearInterval(messageIntervalRef.current);
            }
            if (completionTimeoutRef.current) {
                clearTimeout(completionTimeoutRef.current);
            }
        };
    }, [onComplete, isAuthenticated, authChecked]);
    
    // Completar loading quando sessionId for criado com sucesso
    useEffect(() => {
        if (sessionIdCreated && isAuthenticated && authChecked) {
            // Limpar timeout anterior se existir
            if (completionTimeoutRef.current) {
                clearTimeout(completionTimeoutRef.current);
            }
            
            // Configurar timeout para completar após tempo mínimo fixo (3 segundos)
            completionTimeoutRef.current = setTimeout(() => {
                setIsInitializing(false);
                if (onComplete) {
                    onComplete(true);
                }
            }, 3000);
            
            return () => {
                if (completionTimeoutRef.current) {
                    clearTimeout(completionTimeoutRef.current);
                }
            };
        }
    }, [sessionIdCreated, isAuthenticated, authChecked, onComplete]);
    
    // Se não está autenticado e já verificou, completar após tempo mínimo
    useEffect(() => {
        if (!isAuthenticated && authChecked) {
            // Completar após tempo mínimo (3 segundos) sem esperar mensagens
            const quickTimeout = setTimeout(() => {
                setIsInitializing(false);
                if (onComplete) {
                    onComplete(false);
                }
            }, 3000);
            
            return () => {
                clearTimeout(quickTimeout);
            };
        }
    }, [isAuthenticated, authChecked, onComplete]);

    return (
        <div 
            className="fixed inset-0 w-full h-full"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(/loading page.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#f0f4f8',
                zIndex: 9999
            }}
        >
            {/* Imagem de fundo como fallback usando tag img */}
            <img 
                src="/loading page.jpg"
                alt="Loading background"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    zIndex: 1,
                    display: 'none'
                }}
                onLoad={(e) => {
                    // Se a imagem carregar, mostrar ela e esconder o background CSS
                    e.target.style.display = 'block';
                }}
                onError={(e) => {
                    console.error('Erro ao carregar imagem de fundo via img tag');
                    e.target.style.display = 'none';
                }}
            />
            
            {/* Overlay escuro opcional para melhorar legibilidade das mensagens */}
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    zIndex: 2
                }}
            />
            
            {/* Áudio */}
            <audio
                ref={audioRef}
                src="/Velotax Opening.mp3"
                preload="metadata"
                style={{ display: 'none' }}
            />

            {/* Mensagens na parte inferior */}
            <div 
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10,
                    minHeight: '100px',
                    gap: '1rem'
                }}
            >
                <div 
                    key={currentMessage}
                    style={{
                        color: '#ffffff',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        textAlign: 'center',
                        animation: 'fadeIn 0.5s ease-in',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                        opacity: 1,
                        visibility: 'visible',
                        display: 'block'
                    }}
                >
                    {currentMessage}
                </div>
                
            </div>

            {/* Estilos de animação */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingPage;


/**
 * LoadingPage - Página de Loading Intermediária
 * VERSION: v1.3.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Página de loading que aparece imediatamente ao carregar o app.
 * Executa verificação de autenticação e carregamento em background (oculto).
 * Reproduz áudio de abertura automaticamente (/Velotax Opening.mp3) sem esperar interação do usuário.
 * Carregamento prossegue mesmo se usuário sair da aba.
 * Redireciona para home após tempo mínimo, sem esperar áudio terminar.
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
import { updateUserInfo, checkAuthenticationState, getUserSession } from '../services/auth';
import * as velochatApi from '../services/velochatApi';
import { veloNewsAPI } from '../services/api';

const LoadingPage = ({ userData, onComplete, onAuthCheck }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isInitializing, setIsInitializing] = useState(false);
    const audioRef = useRef(null);
    const messageIntervalRef = useRef(null);
    const completionTimeoutRef = useRef(null);
    const operationsStartedRef = useRef(false);

    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [resolvedUserData, setResolvedUserData] = useState(userData);

    // Sempre mostrar as 3 mensagens originais no rodapé
    const messages = [
        "Iniciando Sessão",
        "Buscando Contatos",
        "Atualizando Notícias"
    ];

    // Garantir que a primeira mensagem apareça imediatamente
    useEffect(() => {
        setCurrentMessageIndex(0);
    }, []);

    // Verificar autenticação primeiro se userData não foi fornecido
    useEffect(() => {
        if (userData) {
            // Se userData foi fornecido (login direto), usar ele
            setResolvedUserData(userData);
            setIsAuthenticated(true);
            setAuthChecked(true);
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
        if (!authChecked || operationsStartedRef.current) return;

        // Marcar que operações já foram iniciadas
        operationsStartedRef.current = true;
        setIsInitializing(true);

        // 1. Iniciar Sessão (executar imediatamente após verificação de autenticação)
        const initSession = async () => {
            try {
                if (isAuthenticated && resolvedUserData) {
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
                if (isAuthenticated) {
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
                // Iniciar carregamento de notícias em background (não precisa completar)
                veloNewsAPI.getRecent(4).catch(err => {
                    console.error('Erro ao atualizar notícias:', err);
                });
            } catch (error) {
                console.error('Erro ao atualizar notícias:', error);
            }
        };

        // Executar todas as operações em paralelo (não sequencialmente)
        // Não aguardar conclusão, apenas iniciar em background
        initSession();
        fetchContacts();
        updateNews();

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
    }, [authChecked, isAuthenticated, resolvedUserData]);

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
            
            // Limpar intervalo anterior se existir
            if (messageIntervalRef.current) {
                clearInterval(messageIntervalRef.current);
            }
            
            // Configurar intervalo para trocar mensagens (mesmo se áudio não tocar)
            const messageInterval = duration / 3; // Dividir em 3 partes iguais (3 mensagens)
            
            // Garantir que a primeira mensagem está visível
            setCurrentMessageIndex(0);
            
            // Trocar mensagens em intervalos regulares
            messageIntervalRef.current = setInterval(() => {
                setCurrentMessageIndex(prev => {
                    const nextIndex = prev + 1;
                    if (nextIndex < messages.length) {
                        return nextIndex;
                    }
                    return prev;
                });
            }, messageInterval);

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
                onComplete(isAuthenticated);
            }
        };

        // Configurar timeout para completar após tempo mínimo fixo (3 segundos)
        // Não esperar áudio terminar, apenas tempo suficiente para mostrar mensagens
        completionTimeoutRef.current = setTimeout(completeLoading, 3000);

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
    }, [onComplete, messages.length, isAuthenticated, authChecked]);
    
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
                    key={currentMessageIndex}
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
                    {messages[currentMessageIndex] ?? messages[0]}
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


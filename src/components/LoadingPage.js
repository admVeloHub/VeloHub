/**
 * LoadingPage - Página de Loading Intermediária
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Página de loading que aparece após login bem-sucedido, antes de redirecionar para a home.
 * Exibe imagem de fundo (/loading page.jpg), reproduz áudio de abertura (/Velotax Opening.mp3),
 * mostra mensagens sequenciais na parte inferior durante período do áudio e executa operações
 * reais: iniciar sessão, buscar contatos, atualizar notícias.
 * Aguarda áudio terminar completamente antes de redirecionar para home.
 */

import React, { useState, useEffect, useRef } from 'react';
import { updateUserInfo } from '../services/auth';
import * as velochatApi from '../services/velochatApi';
import { veloNewsAPI } from '../services/api';

const LoadingPage = ({ userData, onComplete }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isInitializing, setIsInitializing] = useState(false);
    const audioRef = useRef(null);
    const messageIntervalRef = useRef(null);

    const messages = [
        "Iniciando Sessão",
        "Buscando Contatos",
        "Atualizando Notícias"
    ];

    // Garantir que a primeira mensagem apareça imediatamente
    useEffect(() => {
        setCurrentMessageIndex(0);
    }, []);

    // Inicializar sessão e executar operações
    useEffect(() => {
        if (!userData) return;

        setIsInitializing(true);

        // 1. Iniciar Sessão (mensagem 1) - executar imediatamente
        const initSession = async () => {
            try {
                // Atualizar informações do usuário
                updateUserInfo(userData);
                
                // Disparar evento para atualizar header
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('user-info-updated', { detail: userData }));
                }, 200);
            } catch (error) {
                console.error('Erro ao inicializar sessão:', error);
            }
        };

        // 2. Buscar Contatos (mensagem 2)
        const fetchContacts = async () => {
            try {
                // Inicializar conexão com chat e carregar contatos
                await velochatApi.getContacts();
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            }
        };

        // 3. Atualizar Notícias (mensagem 3)
        const updateNews = async () => {
            try {
                // Iniciar carregamento de notícias (não precisa completar)
                veloNewsAPI.getRecent(4).catch(err => {
                    console.error('Erro ao atualizar notícias:', err);
                });
            } catch (error) {
                console.error('Erro ao atualizar notícias:', error);
            }
        };

        // Executar operações sequencialmente conforme mensagens aparecem
        const executeOperations = async () => {
            // Mensagem 1: Iniciar Sessão (executar imediatamente)
            await initSession();
            
            // Aguardar primeira mensagem passar
            // Usar audioDuration se disponível, senão usar estimativa baseada no índice da mensagem
            const waitTime = audioDuration > 0 ? audioDuration / 3 : 3000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Mensagem 2: Buscar Contatos
            await fetchContacts();
            
            // Aguardar segunda mensagem passar
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Mensagem 3: Atualizar Notícias
            await updateNews();
        };

        // Executar operações após um pequeno delay para garantir que componente está montado
        const timeoutId = setTimeout(() => {
            executeOperations();
        }, 100);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [userData, audioDuration]);

    // Configurar áudio e mensagens
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Capturar duração do áudio quando metadata carregar
        const handleLoadedMetadata = () => {
            const duration = audio.duration * 1000; // Converter para milissegundos
            setAudioDuration(duration);
            
            // Limpar intervalo anterior se existir
            if (messageIntervalRef.current) {
                clearInterval(messageIntervalRef.current);
            }
            
            // Configurar intervalo para trocar mensagens
            const messageInterval = duration / 3; // Dividir em 3 partes iguais
            
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
        };

        // Detectar quando áudio termina
        const handleEnded = () => {
            if (messageIntervalRef.current) {
                clearInterval(messageIntervalRef.current);
            }
            // Aguardar um pouco antes de completar para garantir que última mensagem foi vista
            setTimeout(() => {
                setIsInitializing(false);
                if (onComplete) {
                    onComplete();
                }
            }, 500);
        };

        // Tentar reproduzir áudio
        const playAudio = async () => {
            try {
                await audio.play();
            } catch (error) {
                console.warn('Erro ao reproduzir áudio automaticamente:', error);
                // Se autoplay falhar, tentar reproduzir após interação do usuário
                document.addEventListener('click', () => {
                    audio.play().catch(err => console.error('Erro ao reproduzir áudio:', err));
                }, { once: true });
            }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        // Tentar reproduzir quando metadata carregar
        audio.addEventListener('loadedmetadata', playAudio, { once: true });

        // Cleanup
        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            if (messageIntervalRef.current) {
                clearInterval(messageIntervalRef.current);
            }
        };
    }, [onComplete, messages.length]);

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
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10,
                    minHeight: '100px'
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


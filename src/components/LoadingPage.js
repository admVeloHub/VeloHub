/**
 * LoadingPage - Página de Loading Intermediária
 * VERSION: v2.4.2 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v2.1.0: CORREÇÃO: Adicionada proteção contra criação duplicada de sessionId (React StrictMode)
 * - v2.0.0: REFATORAÇÃO: Criação de sessionId movida do LoginPage para LoadingPage
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { updateUserInfo, checkAuthenticationState, getUserSession, registerLoginSession } from '../services/auth';
import * as velochatApi from '../services/velochatApi';
import { veloNewsAPI } from '../services/api';

/** Mesmo fundo que LoginPage — evita “piscada” preta na troca Login → Loading */
const LOADING_STATIC_BG = '/V6BGcomLogo.png';

const LoadingPage = ({ userData, onComplete, onAuthCheck }) => {
    const [isInitializing, setIsInitializing] = useState(false);
    const videoRef = useRef(null);
    const videoEndFallbackTimerRef = useRef(null);
    const completionDispatchedRef = useRef(false);
    const operationsStartedRef = useRef(false);
    const [videoEnded, setVideoEnded] = useState(false);

    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [resolvedUserData, setResolvedUserData] = useState(userData);
    const [sessionIdCreated, setSessionIdCreated] = useState(false);
    const sessionCreationStartedRef = useRef(false);
    const [videoVisible, setVideoVisible] = useState(false);
    const videoRevealDoneRef = useRef(false);

    const tryRevealVideo = useCallback(() => {
        if (videoRevealDoneRef.current) return;
        const v = videoRef.current;
        if (!v || v.paused || v.readyState < 2) return;
        videoRevealDoneRef.current = true;
        setVideoVisible(true);
    }, []);

    const markVideoEnded = useCallback(() => {
        if (videoEndFallbackTimerRef.current) {
            clearTimeout(videoEndFallbackTimerRef.current);
            videoEndFallbackTimerRef.current = null;
        }
        setVideoEnded(true);
    }, []);

    const createSessionIdWithRetry = async (userData, maxRetries = 5) => {
        const existingSessionId = localStorage.getItem('velohub_session_id');
        if (existingSessionId && existingSessionId.trim().length > 0) {
            console.log('✅ sessionId já existe, usando existente:', existingSessionId.substring(0, 8) + '...');
            setSessionIdCreated(true);
            return existingSessionId;
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const checkSessionId = localStorage.getItem('velohub_session_id');
                if (checkSessionId && checkSessionId.trim().length > 0) {
                    console.log('✅ sessionId criado por outro processo, usando existente:', checkSessionId.substring(0, 8) + '...');
                    setSessionIdCreated(true);
                    return checkSessionId;
                }

                const sessionId = await registerLoginSession(userData, 1, 1000);
                if (sessionId) {
                    console.log(`✅ sessionId criado com sucesso na tentativa ${attempt}/${maxRetries}`);
                    setSessionIdCreated(true);
                    return sessionId;
                }
            } catch (error) {
                console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou:`, error);

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                } else {
                    console.error('❌ Todas as tentativas de criar sessionId falharam');
                    return null;
                }
            }
        }

        return null;
    };

    useEffect(() => {
        if (userData) {
            if (sessionCreationStartedRef.current) {
                console.log('⚠️ LoadingPage: Criação de sessionId já iniciada, ignorando chamada duplicada');
                return;
            }
            sessionCreationStartedRef.current = true;

            const createSession = async () => {
                try {
                    const sessionId = await createSessionIdWithRetry(userData, 5);

                    if (!sessionId) {
                        console.error('❌ LoadingPage: Não foi possível criar sessionId após 5 tentativas - autenticação falhou');
                        setIsAuthenticated(false);
                        setAuthChecked(true);
                        if (onAuthCheck) {
                            onAuthCheck(false);
                        }
                        return;
                    }

                    console.log('✅ LoadingPage: sessionId criado com sucesso:', sessionId.substring(0, 8) + '...');
                    setResolvedUserData(userData);
                    setIsAuthenticated(true);
                    setAuthChecked(true);
                } catch (error) {
                    console.error('❌ LoadingPage: Erro ao criar sessionId para userData:', error);
                    setIsAuthenticated(false);
                    setAuthChecked(true);
                    if (onAuthCheck) {
                        onAuthCheck(false);
                    }
                }
            };
            createSession();
            return;
        }

        const checkAuth = async () => {
            try {
                const isAuth = await checkAuthenticationState();
                setIsAuthenticated(isAuth);

                if (isAuth) {
                    const session = getUserSession();
                    if (session && session.user) {
                        setResolvedUserData(session.user);
                    }
                    const existingSessionId = localStorage.getItem('velohub_session_id');
                    if (existingSessionId) {
                        setSessionIdCreated(true);
                    }
                }

                setAuthChecked(true);

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

    useEffect(() => {
        if (!authChecked || !isAuthenticated || !sessionIdCreated || operationsStartedRef.current) return;

        operationsStartedRef.current = true;
        setIsInitializing(true);

        const initSession = async () => {
            try {
                if (isAuthenticated && resolvedUserData && sessionIdCreated) {
                    updateUserInfo(resolvedUserData);

                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('user-info-updated', { detail: resolvedUserData }));
                    }, 200);
                }
            } catch (error) {
                console.error('Erro ao inicializar sessão:', error);
            }
        };

        const fetchContacts = async () => {
            try {
                if (isAuthenticated && sessionIdCreated) {
                    velochatApi.getContacts().catch(err => {
                        console.error('Erro ao buscar contatos:', err);
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            }
        };

        const updateNews = async () => {
            try {
                if (isAuthenticated && sessionIdCreated) {
                    veloNewsAPI.getRecent(4).catch(err => {
                        console.error('Erro ao atualizar notícias:', err);
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar notícias:', error);
            }
        };

        initSession();
        setTimeout(() => {
            fetchContacts();
        }, 500);
        setTimeout(() => {
            updateNews();
        }, 1000);

        const handleVisibilityChange = () => {
            if (!document.hidden && isInitializing) {
                // operações já iniciadas
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [authChecked, isAuthenticated, resolvedUserData, sessionIdCreated]);

    useEffect(() => {
        const fallback = window.setTimeout(() => {
            if (videoRevealDoneRef.current) return;
            videoRevealDoneRef.current = true;
            setVideoVisible(true);
        }, 1200);
        return () => clearTimeout(fallback);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const tryPlay = () => {
            video.play().catch(() => {});
        };

        const onLoadedMetadata = () => {
            const sec = Number(video.duration);
            if (!Number.isFinite(sec) || sec <= 0) return;
            if (videoEndFallbackTimerRef.current) {
                clearTimeout(videoEndFallbackTimerRef.current);
            }
            videoEndFallbackTimerRef.current = window.setTimeout(() => {
                videoEndFallbackTimerRef.current = null;
                markVideoEnded();
            }, sec * 1000 + 750);
        };

        tryPlay();
        video.addEventListener('loadeddata', tryPlay);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('playing', tryRevealVideo);
        video.addEventListener('timeupdate', tryRevealVideo);
        return () => {
            video.removeEventListener('loadeddata', tryPlay);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('playing', tryRevealVideo);
            video.removeEventListener('timeupdate', tryRevealVideo);
            if (videoEndFallbackTimerRef.current) {
                clearTimeout(videoEndFallbackTimerRef.current);
                videoEndFallbackTimerRef.current = null;
            }
        };
    }, [markVideoEnded, tryRevealVideo]);

    useEffect(() => {
        if (!sessionIdCreated || !isAuthenticated || !authChecked || !videoEnded) return;
        if (completionDispatchedRef.current) return;
        completionDispatchedRef.current = true;
        setIsInitializing(false);
        if (onComplete) {
            onComplete(true);
        }
    }, [sessionIdCreated, isAuthenticated, authChecked, videoEnded, onComplete]);

    useEffect(() => {
        if (isAuthenticated || !authChecked || !videoEnded) return;
        if (completionDispatchedRef.current) return;
        completionDispatchedRef.current = true;
        setIsInitializing(false);
        if (onComplete) {
            onComplete(false);
        }
    }, [isAuthenticated, authChecked, videoEnded, onComplete]);

    return (
        <div
            className="velohub-loading-root fixed inset-0 w-full h-full min-h-[100dvh] max-h-[100dvh] overflow-hidden"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999
            }}
        >
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${LOADING_STATIC_BG})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />
            <video
                ref={videoRef}
                src="/loadingPage.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={markVideoEnded}
                onError={markVideoEnded}
                aria-label="Carregando VeloHub"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    opacity: videoVisible ? 1 : 0,
                    transition: 'opacity 0.55s ease-in-out',
                    willChange: 'opacity'
                }}
            />
        </div>
    );
};

export default LoadingPage;

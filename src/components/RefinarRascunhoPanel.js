/**
 * Painel Refinar Rascunho — página VeloBot (Processos), coluna ao lado do quadro principal
 * VERSION: v1.1.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.2: Resposta do refinamento exibida em modal (copiar / fechar)
 * - v1.0.1: Removido parágrafo explicativo sob o título do painel
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api-config';
import { getUserSession } from '../services/auth';

/** z-index acima de overlays comuns / toasts (ex.: react-hot-toast ~9999). */
const REFINAR_MODAL_Z = 11000;

function getSessionIdFromStorage() {
    try {
        return localStorage.getItem('velohub_session_id') || null;
    } catch {
        return null;
    }
}

/** PNG `public/titles and logos/refinamento.png` (encodeURI, mesmo padrão da Home). */
function refinamentoTitleImgSrc() {
    const root = process.env.PUBLIC_URL || '';
    return encodeURI(`${root}/titles and logos/refinamento.png`);
}

function mascoteThinkingImgSrc() {
    const root = process.env.PUBLIC_URL || '';
    return encodeURI(`${root}/mascote thinking.png`);
}

function mascoteEurekaImgSrc() {
    const root = process.env.PUBLIC_URL || '';
    return encodeURI(`${root}/mascote eureka.png`);
}

/** @typedef {'loading' | 'eureka' | 'result'} RefinarModalPhase */

const RefinarRascunhoPanel = () => {
    const [draft, setDraft] = useState('');
    const [result, setResult] = useState('');
    const [resultModalOpen, setResultModalOpen] = useState(false);
    /** @type {[RefinarModalPhase | null, function]} */
    const [modalPhase, setModalPhase] = useState(null);
    const [requestInFlight, setRequestInFlight] = useState(false);
    const [userId, setUserId] = useState('');
    const [colaboradorNome, setColaboradorNome] = useState('');
    /** Primeiro nome do operador — mesmo critério do botão «formatar e-mail» do VeloBot */
    const [nomeOperador, setNomeOperador] = useState('');
    const abortRef = useRef(null);
    const eurekaTimerRef = useRef(null);

    const clearEurekaTimer = useCallback(() => {
        if (eurekaTimerRef.current) {
            clearTimeout(eurekaTimerRef.current);
            eurekaTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        try {
            const session = getUserSession();
            if (session?.user?.email) {
                setUserId(session.user.email);
                const fullName = String(session?.user?.name || session?.colaboradorNome || '').trim();
                setColaboradorNome(fullName);
                setNomeOperador(fullName.split(/\s+/)[0] || '');
            } else {
                setUserId('anonymous');
                setColaboradorNome('');
                setNomeOperador('');
            }
        } catch {
            setUserId('anonymous');
            setColaboradorNome('');
            setNomeOperador('');
        }
    }, []);

    useEffect(() => () => {
        abortRef.current?.abort();
        clearEurekaTimer();
    }, [clearEurekaTimer]);

    const closeResultModal = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        clearEurekaTimer();
        setResultModalOpen(false);
        setModalPhase(null);
        setRequestInFlight(false);
    }, [clearEurekaTimer]);

    const handleRefinar = useCallback(async () => {
        const texto = draft.trim();
        if (!texto) {
            toast.error('Digite um rascunho antes de refinar.');
            return;
        }
        clearEurekaTimer();
        abortRef.current?.abort();

        const ac = new AbortController();
        abortRef.current = ac;

        setResult('');
        setModalPhase('loading');
        setResultModalOpen(true);
        setRequestInFlight(true);

        try {
            const payload = {
                rascunho: texto,
                userId,
                sessionId: getSessionIdFromStorage(),
                nomeOperador,
                ...(colaboradorNome ? { colaboradorNome } : {})
            };
            const response = await fetch(`${API_BASE_URL}/chatbot/refinar-rascunho`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: ac.signal
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                const msg = data.error || data.message || `Erro HTTP ${response.status}`;
                toast.error(msg);
                closeResultModal();
                return;
            }
            const text = typeof data.response === 'string' ? data.response : '';
            setResult(text);
            abortRef.current = null;
            setRequestInFlight(false);
            setModalPhase('eureka');
            eurekaTimerRef.current = setTimeout(() => {
                eurekaTimerRef.current = null;
                setModalPhase('result');
            }, 1000);
        } catch (e) {
            if (e.name === 'AbortError') {
                closeResultModal();
                return;
            }
            console.error('RefinarRascunhoPanel:', e);
            toast.error('Falha na comunicação com o servidor.');
            closeResultModal();
        }
    }, [draft, userId, nomeOperador, colaboradorNome, clearEurekaTimer, closeResultModal]);

    const handleCopyResult = useCallback(async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result);
            toast.success('Texto copiado.');
        } catch {
            toast.error('Não foi possível copiar.');
        }
    }, [result]);

    const showMascots = modalPhase === 'loading' || modalPhase === 'eureka';
    const showResultBody = modalPhase === 'result';
    const refinamentoBloqueiaPainel =
        requestInFlight || (resultModalOpen && modalPhase !== null && modalPhase !== 'result');

    const modalNode =
        resultModalOpen &&
        createPortal(
            <div
                className="fixed inset-0 flex items-center justify-center p-4"
                style={{
                    zIndex: REFINAR_MODAL_Z,
                    backgroundColor: 'rgba(0,0,0,0.55)'
                }}
                role="presentation"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeResultModal();
                }}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="refinar-rascunho-modal-titulo"
                    aria-busy={modalPhase === 'loading'}
                    className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl mx-4"
                    style={{
                        backgroundColor: 'var(--cor-container)',
                        border: '1px solid var(--cor-borda)',
                        borderRadius: 'var(--velohub-radius-container)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="flex-shrink-0 flex justify-between items-center gap-4 px-5 py-4 border-b"
                        style={{ borderColor: 'var(--cor-borda)' }}
                    >
                        <h3
                            id="refinar-rascunho-modal-titulo"
                            className="text-lg font-semibold velohub-title m-0"
                        >
                            Refinar rascunho
                        </h3>
                        <button
                            type="button"
                            onClick={closeResultModal}
                            className="text-2xl leading-none px-2 py-1 rounded hover:opacity-80"
                            style={{ color: 'var(--cor-texto-secundario)' }}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                    </div>
                    {showMascots && (
                        <div
                            className="flex-1 flex flex-col items-center justify-center px-5 py-10 min-h-[220px]"
                        >
                            <img
                                src={modalPhase === 'loading' ? mascoteThinkingImgSrc() : mascoteEurekaImgSrc()}
                                alt=""
                                aria-hidden="true"
                                className="w-48 h-48 sm:w-56 sm:h-56 object-contain select-none pointer-events-none"
                                draggable={false}
                            />
                        </div>
                    )}
                    {showResultBody && (
                        <>
                            <div
                                className="flex-1 overflow-y-auto px-5 py-4 min-h-0"
                                style={{ color: 'var(--cor-texto-principal)' }}
                            >
                                <pre className="m-0 text-sm whitespace-pre-wrap font-sans" style={{ lineHeight: 1.5 }}>
                                    {result}
                                </pre>
                            </div>
                            <div
                                className="flex-shrink-0 flex flex-wrap gap-3 justify-end px-5 py-4 border-t"
                                style={{ borderColor: 'var(--cor-borda)' }}
                            >
                                <button
                                    type="button"
                                    onClick={handleCopyResult}
                                    className="px-4 py-2 rounded-md text-sm font-medium"
                                    style={{
                                        color: 'var(--cor-texto-principal)',
                                        border: '1px solid var(--cor-borda)',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    Copiar texto
                                </button>
                                <button
                                    type="button"
                                    onClick={closeResultModal}
                                    className="px-4 py-2 rounded-md text-sm font-semibold"
                                    style={{
                                        backgroundColor: 'var(--blue-dark)',
                                        color: '#fff'
                                    }}
                                >
                                    Fechar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>,
            document.body
        );

    return (
        <>
            <aside
                className="min-w-0 p-6 rounded-lg shadow-sm velohub-container flex flex-col"
                style={{
                    borderRadius: 'var(--velohub-radius-container)',
                    boxShadow: '0 3.2px 16px rgba(0, 0, 0, 0.1)',
                    padding: '19.2px',
                    border: '1px solid var(--cor-borda)',
                    gap: '12px'
                }}
            >
                <div
                    className="border-b pb-2 flex justify-start items-center min-w-0"
                    style={{ borderColor: 'var(--blue-opaque)' }}
                >
                    <img
                        src={refinamentoTitleImgSrc()}
                        alt="Refinamento de texto"
                        className="h-8 sm:h-9 w-auto max-w-full object-contain object-left"
                        loading="lazy"
                    />
                </div>
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Digite seu rascunho interno..."
                    disabled={refinamentoBloqueiaPainel}
                    rows={8}
                    className="w-full rounded-md resize-y min-h-[120px] p-3 text-sm"
                    style={{
                        backgroundColor: 'var(--cor-fundo)',
                        color: 'var(--cor-texto-principal)',
                        border: '1px solid var(--cor-borda)'
                    }}
                />
                <button
                    type="button"
                    onClick={handleRefinar}
                    disabled={refinamentoBloqueiaPainel || !draft.trim()}
                    className="w-full py-2 px-4 rounded-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    style={{
                        backgroundColor: 'var(--blue-dark)',
                        color: '#fff'
                    }}
                >
                    {requestInFlight ? 'Gerando…' : 'Refinar Rascunho'}
                </button>
            </aside>
            {modalNode}
        </>
    );
};

export default RefinarRascunhoPanel;

// Sistema de Autenticação Centralizado para VeloHub
// VERSION: v1.7.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
// Mudanças v1.7.0:
// - CORREÇÃO: registerLoginSession() agora verifica se sessionId já existe antes de criar novo
// - CORREÇÃO: Proteção contra criação duplicada de sessionId (React StrictMode)
// - Verificação de sessionId existente antes de cada tentativa de criação
// Mudanças v1.6.0:
// - CRÍTICO: sessionId agora é OBRIGATÓRIO - checkAuthenticationState() não retorna true sem sessionId válido
// - Se não conseguir garantir sessionId, autenticação falha e faz logout automático
// - Removido comportamento de "continuar mesmo assim" quando sessionId não existe
// Mudanças v1.5.0:
// - ROBUSTEZ: Adicionado retry automático com backoff exponencial em registerLoginSession()
// - ROBUSTEZ: Criada função ensureSessionId() para garantir sessionId quando usuário está autenticado
// - ROBUSTEZ: checkAuthenticationState() agora garante que sessionId existe quando usuário está logado
// - MELHORIA: registerLoginSession() retorna sessionId criado para facilitar validação
// Mudanças v1.4.0:
// - CRÍTICO: Adicionada validação de resposta HTTP antes de fazer parse do JSON
// - CRÍTICO: Adicionada validação de sessionId antes de salvar no localStorage
// - Melhorado tratamento de erros com logs detalhados
// Mudanças v1.3.0:
// - Heartbeat continua funcionando mesmo quando aba está oculta
// - Intervalo dinâmico: 30s quando visível, 60s quando oculto
// - Usuários permanecem online mesmo com aba fora de visualização
import { GOOGLE_CONFIG } from '../config/google-config';
import { API_BASE_URL } from '../config/api-config';

console.log('=== auth.js carregado ===');

// Configurações
const USER_SESSION_KEY = GOOGLE_CONFIG.SESSION_KEY;
const DOMINIO_PERMITIDO = GOOGLE_CONFIG.AUTHORIZED_DOMAIN;
const SESSION_DURATION = GOOGLE_CONFIG.SESSION_DURATION;

/**
 * Salva os dados do usuário e o timestamp da sessão no localStorage.
 * @param {object} userData - Objeto com dados do usuário (name, email, picture).
 */
function saveUserSession(userData) {
    const sessionData = {
        user: userData,
        loginTimestamp: new Date().getTime()
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    console.log('Sessão salva:', sessionData);
}

/**
 * Registra login no backend para controle de sessões com retry automático
 * @param {object} userData - Objeto com dados do usuário (name, email, picture).
 * @param {number} maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} retryDelay - Delay entre tentativas em ms (padrão: 1000)
 * @returns {Promise<string>} sessionId criado
 */
async function registerLoginSession(userData, maxRetries = 3, retryDelay = 1000) {
    // Verificar se já existe sessionId válido antes de criar novo
    const existingSessionId = localStorage.getItem('velohub_session_id');
    if (existingSessionId && existingSessionId.trim().length > 0) {
        console.log('⚠️ registerLoginSession: sessionId já existe, retornando existente:', existingSessionId.substring(0, 8) + '...');
        return existingSessionId;
    }
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Verificar novamente antes de cada tentativa (pode ter sido criado por outro processo)
            const checkSessionId = localStorage.getItem('velohub_session_id');
            if (checkSessionId && checkSessionId.trim().length > 0) {
                console.log('⚠️ registerLoginSession: sessionId criado durante tentativa, retornando existente:', checkSessionId.substring(0, 8) + '...');
                return checkSessionId;
            }
            
            const response = await fetch(`${API_BASE_URL}/auth/session/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    colaboradorNome: userData.name,
                    userEmail: userData.email
                })
            });

            // Verificar se a resposta HTTP foi bem-sucedida antes de fazer parse
            if (!response.ok) {
                const errorText = await response.text();
                const error = new Error(`Erro ${response.status}: ${errorText || 'Erro desconhecido'}`);
                console.error(`❌ Erro HTTP ao registrar login (tentativa ${attempt}/${maxRetries}):`, response.status, errorText);
                
                // Se for erro 5xx, tentar novamente; se for 4xx, não tentar novamente
                if (response.status >= 500 && attempt < maxRetries) {
                    lastError = error;
                    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                    continue;
                }
                throw error;
            }

            const result = await response.json();
            
            // Validar se sessionId existe e é válido antes de salvar
            if (result.success && result.sessionId && typeof result.sessionId === 'string' && result.sessionId.trim().length > 0) {
                // Salvar sessionId no localStorage
                localStorage.setItem('velohub_session_id', result.sessionId);
                console.log(`✅ Login registrado no backend (tentativa ${attempt}):`, result.sessionId);
                
                // Iniciar heartbeat após login bem-sucedido
                startHeartbeat();
                
                return result.sessionId;
            } else {
                const errorMsg = result.error || 'sessionId não retornado pelo servidor';
                console.error(`❌ Erro ao registrar login (tentativa ${attempt}/${maxRetries}):`, errorMsg, {
                    success: result.success,
                    hasSessionId: !!result.sessionId,
                    sessionIdType: typeof result.sessionId,
                    sessionIdValue: result.sessionId
                });
                
                if (attempt < maxRetries) {
                    lastError = new Error(`Erro ao registrar sessão: ${errorMsg}`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                    continue;
                }
                throw new Error(`Erro ao registrar sessão: ${errorMsg}`);
            }
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em ${retryDelay * attempt}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            } else {
                console.error('❌ Erro ao registrar login após todas as tentativas:', error);
                throw error;
            }
        }
    }
    
    throw lastError || new Error('Erro desconhecido ao registrar sessão');
}

/**
 * Garante que sessionId existe quando usuário está autenticado
 * Tenta recuperar/criar sessionId se não existir mas usuário está logado
 * @returns {Promise<string|null>} sessionId ou null se não conseguir recuperar
 */
async function ensureSessionId() {
    // Verificar se já existe sessionId válido
    const existingSessionId = localStorage.getItem('velohub_session_id');
    if (existingSessionId && existingSessionId.trim().length > 0) {
        return existingSessionId;
    }
    
    // Se não existe sessionId mas usuário está logado, tentar recuperar
    const session = getUserSession();
    if (!session || !session.user || !session.user.email) {
        console.log('⚠️ ensureSessionId: Usuário não está logado, não é possível garantir sessionId');
        return null;
    }
    
    console.log('⚠️ ensureSessionId: sessionId não encontrado mas usuário está logado, tentando recuperar...');
    
    try {
        // Tentar reativar sessão existente primeiro
        const reactivated = await reactivateSession();
        if (reactivated) {
            const reactivatedSessionId = localStorage.getItem('velohub_session_id');
            if (reactivatedSessionId) {
                console.log('✅ ensureSessionId: sessionId recuperado via reactivateSession');
                return reactivatedSessionId;
            }
        }
        
        // Se reativação não funcionou, criar nova sessão
        console.log('⚠️ ensureSessionId: Reativação não retornou sessionId, criando nova sessão...');
        const newSessionId = await registerLoginSession(session.user, 2, 500);
        if (newSessionId) {
            console.log('✅ ensureSessionId: Nova sessão criada com sucesso');
            return newSessionId;
        }
    } catch (error) {
        console.error('❌ ensureSessionId: Erro ao garantir sessionId:', error);
        return null;
    }
    
    return null;
}

/**
 * Recupera os dados da sessão do localStorage.
 * @returns {object | null} - Objeto com os dados da sessão ou null se não houver.
 */
function getUserSession() {
    const sessionData = localStorage.getItem(USER_SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
}

/**
 * Verifica se a sessão do usuário é válida (existe e não expirou).
 * @returns {boolean}
 */
function isSessionValid() {
    const session = getUserSession();
    if (!session || !session.loginTimestamp) {
        return false;
    }

    const now = new Date().getTime();
    const elapsedTime = now - session.loginTimestamp;

    return elapsedTime < SESSION_DURATION;
}

/**
 * Realiza o logout do usuário.
 */
/**
 * Envia heartbeat para manter sessão ativa
 */
let heartbeatInterval = null;
let isHeartbeatActive = false;
const HEARTBEAT_INTERVAL_VISIBLE = 30000; // 30 segundos quando aba está visível
const HEARTBEAT_INTERVAL_HIDDEN = 60000; // 60 segundos quando aba está oculta

async function sendHeartbeat() {
    try {
        const sessionId = localStorage.getItem('velohub_session_id');
        
        if (!sessionId) {
            return;
        }

        // Heartbeat continua funcionando mesmo quando aba está oculta
        const url = `${API_BASE_URL}/auth/session/heartbeat`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId })
        });

        // Verificar se a resposta é JSON antes de parsear
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`❌ [Heartbeat] Resposta não é JSON. Status: ${response.status}, URL: ${url}`);
            console.error(`❌ [Heartbeat] Conteúdo recebido:`, text.substring(0, 200));
            return;
        }

        const result = await response.json();
        
        if (result.expired) {
            console.warn('⚠️ Sessão expirada - fazendo logout');
            stopHeartbeat();
            logout();
            return;
        }
        
        if (result.success) {
            // Heartbeat enviado com sucesso (log silencioso)
        } else {
            console.warn('⚠️ Erro ao enviar heartbeat:', result.error);
        }
    } catch (error) {
        // Log apenas se não for erro de rede comum (servidor não iniciado)
        if (error.message && !error.message.includes('Failed to fetch')) {
            console.error('❌ Erro ao enviar heartbeat:', error);
        }
    }
}

/**
 * Reinicia o intervalo do heartbeat com o intervalo apropriado baseado na visibilidade
 */
function restartHeartbeatInterval() {
    if (!isHeartbeatActive) {
        return;
    }
    
    // Limpar intervalo existente
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    // Determinar intervalo baseado na visibilidade atual
    const interval = document.hidden ? HEARTBEAT_INTERVAL_HIDDEN : HEARTBEAT_INTERVAL_VISIBLE;
    
    // Criar novo intervalo
    heartbeatInterval = setInterval(() => {
        if (isHeartbeatActive) {
            sendHeartbeat();
        }
    }, interval);
    
    console.log(`💓 Heartbeat ajustado para ${interval / 1000}s (aba ${document.hidden ? 'oculta' : 'visível'})`);
}

/**
 * Inicia sistema de heartbeat com intervalo dinâmico baseado na visibilidade
 */
function startHeartbeat() {
    if (heartbeatInterval) {
        // Se já está rodando, apenas ajustar intervalo se necessário
        restartHeartbeatInterval();
        return;
    }

    isHeartbeatActive = true;
    
    // Enviar heartbeat imediatamente
    sendHeartbeat();
    
    // Iniciar intervalo baseado na visibilidade atual
    restartHeartbeatInterval();
}

/**
 * Para sistema de heartbeat
 */
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    isHeartbeatActive = false;
    console.log('💓 Heartbeat parado');
}

/**
 * Reativa sessão existente quando usuário retorna
 */
async function reactivateSession() {
    try {
        const session = getUserSession();
        
        if (!session || !session.user || !session.user.email) {
            return false;
        }

        const response = await fetch(`${API_BASE_URL}/auth/session/reactivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userEmail: session.user.email })
        });

        const result = await response.json();
        
        if (result.expired) {
            console.warn('⚠️ Sessão expirada - novo login necessário');
            logout();
            return false;
        }
        
        if (result.success) {
            // Atualizar sessionId se necessário
            if (result.sessionId) {
                localStorage.setItem('velohub_session_id', result.sessionId);
            }
            console.log('✅ Sessão reativada:', result.sessionId);
            return true;
        } else {
            console.warn('⚠️ Erro ao reativar sessão:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao reativar sessão:', error);
        return false;
    }
}

/**
 * Registra logout no backend para controle de sessões
 */
async function registerLogoutSession() {
    try {
        const sessionId = localStorage.getItem('velohub_session_id');
        
        if (sessionId) {
            // Usar sendBeacon para garantir envio mesmo ao fechar janela
            const data = JSON.stringify({ sessionId });
            
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    `${API_BASE_URL}/auth/session/logout`,
                    new Blob([data], { type: 'application/json' })
                );
            } else {
                // Fallback para fetch síncrono
                const response = await fetch(`${API_BASE_URL}/auth/session/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: data,
                    keepalive: true
                });

                const result = await response.json();
                
                if (result.success) {
                    console.log('✅ Logout registrado:', result.duration + ' min');
                }
            }
            
            // Limpar sessionId
            localStorage.removeItem('velohub_session_id');
        }
    } catch (error) {
        console.error('❌ Erro ao registrar logout:', error);
    }
}

function logout() {
    console.log('Logout realizado');
    
    // Parar heartbeat
    stopHeartbeat();
    
    // Registrar logout no backend antes de limpar localStorage
    registerLogoutSession();
    
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem('velohub_session_id');
    // Limpar também os dados antigos para compatibilidade
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    
    // Recarregar a página para voltar ao login
    window.location.reload();
}

/**
 * Atualiza o cabeçalho da página para mostrar as informações do usuário logado.
 * @param {object} userData - Objeto com os dados do usuário (name, picture).
 */
function updateUserInfo(userData) {
    console.log('Atualizando informações do usuário:', userData);
    
    // Aguardar um pouco para garantir que o DOM esteja pronto
    setTimeout(() => {
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userData.name || 'Usuário';
            console.log('Nome do usuário atualizado:', userData.name);
        } else {
            console.warn('Elemento user-name não encontrado');
        }
        
        // Atualizar avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            if (userData.picture) {
                userAvatar.src = userData.picture;
                userAvatar.style.display = 'block';
                console.log('Avatar do usuário atualizado:', userData.picture);
            } else {
                userAvatar.style.display = 'none';
            }
        } else {
            console.warn('Elemento user-avatar não encontrado');
        }
        
        // Adicionar listener para logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            // Remove listeners existentes
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
            console.log('Botão de logout configurado');
        } else {
            console.warn('Elemento logout-btn não encontrado');
        }
        
        console.log('Informações do usuário atualizadas com sucesso');
    }, 100);
}

/**
 * Verifica o estado de autenticação e atualiza a UI.
 * Garante que sessionId existe quando usuário está autenticado.
 * @returns {Promise<boolean>} - true se usuário está logado, false caso contrário
 */
async function checkAuthenticationState() {
    console.log('=== Verificando estado de autenticação ===');
    
    // Verificar se há dados no localStorage (compatibilidade)
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    console.log('Dados do localStorage:', { userEmail, userName, userPicture });
    
    if (isSessionValid()) {
        const session = getUserSession();
        console.log('Sessão válida encontrada:', session);
        
        // CRÍTICO: sessionId é OBRIGATÓRIO - não retornar true sem ele
        const sessionId = await ensureSessionId();
        if (!sessionId) {
            console.error('❌ checkAuthenticationState: Não foi possível garantir sessionId obrigatório');
            console.error('❌ Usuário não pode estar autenticado sem sessionId válido - fazendo logout');
            
            // Parar heartbeat se estiver rodando
            stopHeartbeat();
            
            // Limpar dados de sessão já que não há sessionId válido
            localStorage.removeItem(USER_SESSION_KEY);
            localStorage.removeItem('velohub_session_id');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userPicture');
            
            return false;
        }
        
        console.log('✅ sessionId garantido:', sessionId.substring(0, 8) + '...');
        
        // Tentar reativar sessão se necessário (pode atualizar sessionId)
        const reactivated = await reactivateSession();
        
        if (reactivated) {
            console.log('✅ Sessão reativada com sucesso');
        }
        
        // Iniciar heartbeat
        startHeartbeat();
        
        updateUserInfo(session.user);
        return true;
    } else {
        console.log('Sessão inválida ou expirada - fazendo logout');
        
        // Parar heartbeat se estiver rodando
        stopHeartbeat();
        
        // Se a sessão for inválida ou não existir, limpa qualquer resquício
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem('velohub_session_id');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPicture');
        
        return false;
    }
}

/**
 * Verifica se o domínio do email é autorizado
 * @param {string} email - Email do usuário
 * @returns {boolean}
 */
function isAuthorizedDomain(email) {
    if (!email) return false;
    return email.endsWith(DOMINIO_PERMITIDO);
}

/**
 * Função para decodificar JWT (compatibilidade com código existente)
 * @param {string} token - JWT token
 * @returns {object|null} - Payload decodificado ou null se erro
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erro ao decodificar JWT:', error);
        return null;
    }
}

/**
 * Inicializa o Google Identity Services
 * @param {string} clientId - Client ID do Google (opcional, usa config se não fornecido)
 * @param {function} callback - Função de callback para o login
 */
function initializeGoogleSignIn(clientId = null, callback) {
    if (window.google && window.google.accounts) {
        const finalClientId = clientId || GOOGLE_CONFIG.CLIENT_ID;
        window.google.accounts.id.initialize({
            client_id: finalClientId,
            callback: callback,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        console.log('Google Sign-In inicializado com Client ID:', finalClientId);
    } else {
        console.error('Google Identity Services não está disponível');
    }
}

// Exportar funções para uso global
export {
    saveUserSession,
    getUserSession,
    isSessionValid,
    logout,
    updateUserInfo,
    checkAuthenticationState,
    isAuthorizedDomain,
    decodeJWT,
    initializeGoogleSignIn,
    registerLoginSession,
    registerLogoutSession,
    startHeartbeat,
    stopHeartbeat,
    reactivateSession,
    ensureSessionId
};

// Listener para logout automático ao fechar página/navegador
window.addEventListener('beforeunload', () => {
    stopHeartbeat();
    registerLogoutSession();
});

// Listener para quando página fica oculta (aba muda, minimiza, etc)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Ajustar intervalo do heartbeat quando aba está oculta (60s)
        // Mas manter heartbeat ativo - não marcar como logout
        if (isHeartbeatActive) {
            restartHeartbeatInterval();
            console.log('👁️ Aba oculta - heartbeat continua ativo com intervalo de 60s');
        }
    } else {
        // Ajustar intervalo do heartbeat quando aba fica visível novamente (30s)
        if (isSessionValid()) {
            if (isHeartbeatActive) {
                restartHeartbeatInterval();
                console.log('👁️ Aba visível - heartbeat ajustado para intervalo de 30s');
            } else {
                // Se heartbeat não estava rodando, iniciar
                startHeartbeat();
                console.log('👁️ Aba visível - heartbeat iniciado');
            }
        }
    }
});

// Listener adicional para pagehide (mais confiável que beforeunload)
window.addEventListener('pagehide', (event) => {
    // Se página está sendo descarregada permanentemente
    if (event.persisted === false) {
        stopHeartbeat();
        registerLogoutSession();
    }
});

// Também disponibilizar globalmente para compatibilidade
window.saveUserSession = saveUserSession;
window.getUserSession = getUserSession;
window.isSessionValid = isSessionValid;
window.logout = logout;
window.updateUserInfo = updateUserInfo;
window.checkAuthenticationState = checkAuthenticationState;
window.isAuthorizedDomain = isAuthorizedDomain;
window.decodeJWT = decodeJWT;
window.initializeGoogleSignIn = initializeGoogleSignIn;

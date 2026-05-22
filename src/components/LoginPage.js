// VERSION: v3.1.18 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
// Mudanças v3.1.18:
// - fix: largura do botão Google agora usa dimensão disponível real (container/pai/viewport), evitando overflow em cards estreitos
// Mudanças v3.1.17:
// - fix: fechamento correto do `handleCredentialResponse` como `useCallback(..., [onLoginSuccess])`
// - GSI: callback do `initialize` via ref sempre atualizado (mantém guard anti double-init)
// Mudanças v3.1.16:
// - prefetch do MP4 (sem rel=preload as=video que o Chrome marca como unsupported)
// - GSI: script Google não é removido no unmount do Strict Mode; guard evita segundo `initialize()`
// - renderButton: largura em px (Google rejeita "100%")
// - email/senha: autoComplete adequado ao dom
// Mudanças v3.1.15:
// Mudanças v3.1.14:
// - Viewport cheia: raiz da página fixed inset-0 + min-height 100dvh (qualquer resolução / apresentação)
// Mudanças v3.1.13:
// - Landing «Entrar»: glow branco suave ao redor (box-shadow em camadas; hover reforça um pouco)
// Mudanças v3.1.12:
// - Landing «Entrar»: +10px para a direita; altura (translate Y 8px) inalterada
// Mudanças v3.1.11:
// - Landing «Entrar»: +5px para baixo e +20px para a direita (sobre v3.1.10 → translate 8px Y, calc(-50%+26px) X)
// Mudanças v3.1.10:
// - Landing «Entrar»: +3px vertical, +6px horizontal (translate sobre o ancoramento -50%)
// Mudanças v3.1.9:
// - Landing «Entrar»: posição absoluta left % + -translate-x-1/2 (centro sob o wordmark no V6BG); justify-end + bloco estreito empurrava o centro do botão para a direita — efeito quase nulo
// Mudanças v3.1.8:
// - Landing «Entrar»: abaixo do wordmark no fundo, centralizado na faixa do logo (flex-col + largura ~wordmark; pr ajustado; sem translateX)
// Mudanças v3.1.7:
// - Landing «Entrar»: translateX(2px) para a direita (altura inalterada)
// Mudanças v3.1.6:
// - Landing «Entrar»: +0,5cm no offset vertical (2cm total em relação à base vh)
// Mudanças v3.1.5:
// - Landing «Entrar»: +1,5cm no offset vertical (calc vh+cm); pr um pouco maior (mais à esquerda)
// Mudanças v3.1.4:
// - Landing «Entrar»: microajuste vh + pr (um pouco mais baixo e à esquerda)
// Mudanças v3.1.3:
// - Landing «Entrar»: mais abaixo (vh) e mais à esquerda (pr + translateX menor que o card)
// Mudanças v3.1.2:
// - Landing «Entrar»: pt aumentado para ficar abaixo do logotipo «hub» no fundo (não acima)
// Mudanças v3.1.1:
// - Botão «Entrar» na landing: coluna direita (paridade com card), abaixo da área do logo no fundo — não mais centralizado na tela
// Mudanças v3.1.0:
// - Tela inicial: apenas fundo + botão «Entrar» (gradiente azul médio → azul opaco, LAYOUT_GUIDELINES); formulário após clique
// - Montagem do botão Google quando o painel de login é exibido
// Mudanças v3.0.1:
// - Fundo da tela de login: /V6BGcomLogo.png (substitui loginpage.jpg)
// Mudanças v3.0.0:
// - REFATORAÇÃO: Removida TODA lógica de criação de sessionId do LoginPage
// - LoginPage agora apenas valida credenciais (OAuth ou email/senha) e verifica acesso Velohub
// - Se credenciais válidas, chama onLoginSuccess(userData) para ir para LoadingPage
// - Criação de sessionId foi movida para LoadingPage com retry robusto
// Mudanças v2.5.0:
// - ROBUSTEZ: Login por email/senha agora usa sessionId retornado diretamente do endpoint quando disponível
// - ROBUSTEZ: Adicionado fallback com ensureSessionId() se registro de sessão falhar
// - MELHORIA: Melhor tratamento de erros com múltiplas tentativas de garantir sessionId
// Mudanças v2.4.0:
// - CRÍTICO: Adicionado await na chamada de registerLoginSession() para evitar race condition
// - Melhorado tratamento de erros ao registrar sessão (não bloqueia login se falhar)
// Mudanças v2.3.0:
// - Removida validação de domínio do OAuth Google - qualquer email Google é aceito
// - Validação de acesso agora é feita apenas no backend (acessos.Velohub === true)
// - Adicionados links para Termos de Uso e Política de Privacidade no rodapé
// Mudanças v2.2.0:
// - Adicionado alerta no rodapé quando CAPS LOCK está ativado
// - Detecção automática de CAPS LOCK usando getModifierState
// 
// Mudanças v2.1.0:
// - Adicionado botão para mostrar/ocultar senha no campo de senha
// - Ícone de olho que alterna entre mostrar e ocultar
// 
// Mudanças v2.0.0:
// - Adicionado login por email/senha com validação contra qualidade_funcionarios
// - Adicionada validação de acesso liberado para Google SSO
// - Verifica acessos.Velohub, desligado, afastado e suspenso
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveUserSession, decodeJWT } from '../services/auth';
import { getClientId } from '../config/google-config';
import { API_BASE_URL } from '../config/api-config';

// Componente de ícone do Google personalizado
const GoogleIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Largura em px aceita por `accounts.id.renderButton` (string % dispara warning). */
function getGoogleSignInButtonPixelWidth(containerEl) {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
  const viewportSafeWidth = Math.max(220, Math.min(viewportWidth - 48, 500));
  if (!containerEl || typeof containerEl.getBoundingClientRect !== 'function') {
    return viewportSafeWidth;
  }

  const ownWidth = Math.round(containerEl.getBoundingClientRect().width || 0);
  const parentWidth = Math.round(containerEl.parentElement?.getBoundingClientRect?.().width || 0);
  const availableWidth = Math.max(ownWidth, parentWidth);

  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return viewportSafeWidth;
  }

  return Math.max(220, Math.min(availableWidth, viewportSafeWidth));
}

/** Opções estáveis para o botão Google Identity (sem `width` aqui — injetamos em px no mount). */
const GOOGLE_SIGNIN_BUTTON_OPTS_BASE = {
  theme: 'outline',
  size: 'large',
  text: 'continue_with',
  shape: 'rectangular',
  logo_alignment: 'center',
};

/** LAYOUT_GUIDELINES: --blue-medium #1634FF → --blue-opaque #006AB9 */
const ENTRAR_BUTTON_GRADIENT =
  'linear-gradient(135deg, #1634FF 0%, #006AB9 100%)';

const LoginPage = ({ onLoginSuccess }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const showLoginFormRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    showLoginFormRef.current = showLoginForm;
  }, [showLoginForm]);

  useEffect(() => {
    const id = 'velohub-prefetch-loading-video';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'prefetch';
    link.href = '/loadingPage.mp4';
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

  // Detectar CAPS LOCK
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Verificar se a tecla pressionada é CAPS LOCK
      if (e.key === 'CapsLock' || e.code === 'CapsLock') {
        // Usar requestAnimationFrame para verificar o estado após o evento ser processado
        requestAnimationFrame(() => {
          // Verificar o estado atual do CAPS LOCK usando o input ativo
          const activeElement = document.activeElement;
          if (activeElement && activeElement.getModifierState) {
            const isCapsLockOn = activeElement.getModifierState('CapsLock');
            setCapsLockOn(isCapsLockOn);
          } else {
            // Fallback: verificar via evento
            setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock') || false);
          }
        });
        return;
      }

      // Verificar se CAPS LOCK está ativo usando getModifierState (mais preciso)
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockOn(true);
      } else {
        // Fallback: verificar se é uma letra e está em maiúscula sem Shift
        const key = e.key;
        // Verificar se key existe e é uma string antes de acessar .length
        if (key && typeof key === 'string' && key.length === 1) {
          if (key >= 'A' && key <= 'Z' && !e.shiftKey) {
            setCapsLockOn(true);
          } else if (key >= 'a' && key <= 'z' && !e.shiftKey) {
            setCapsLockOn(false);
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      // Verificar se a tecla solta é CAPS LOCK
      if (e.key === 'CapsLock' || e.code === 'CapsLock') {
        // Usar requestAnimationFrame para verificar o estado após o evento ser processado
        requestAnimationFrame(() => {
          // Verificar o estado atual do CAPS LOCK usando o input ativo
          const activeElement = document.activeElement;
          if (activeElement && activeElement.getModifierState) {
            const isCapsLockOn = activeElement.getModifierState('CapsLock');
            setCapsLockOn(isCapsLockOn);
          } else {
            // Fallback: verificar via evento
            setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock') || false);
          }
        });
        return;
      }

      // Verificar estado atual do CAPS LOCK em qualquer tecla solta
      const activeElement = document.activeElement;
      if (activeElement && activeElement.getModifierState) {
        const isCapsLockOn = activeElement.getModifierState('CapsLock');
        setCapsLockOn(isCapsLockOn);
      } else if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockOn(true);
      } else {
        // Se não está ativo, verificar se realmente está desativado
        const key = e.key;
        if (key && typeof key === 'string' && key.length === 1) {
          if (key >= 'a' && key <= 'z' && !e.shiftKey) {
            setCapsLockOn(false);
          }
        }
      }
    };

    // Adicionar listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Verificar estado inicial do CAPS LOCK (não há evento para isso, então verificamos ao focar no campo)
    const checkCapsLock = (e) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockOn(true);
      }
    };

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
      emailInput.addEventListener('keydown', checkCapsLock);
      emailInput.addEventListener('keyup', checkCapsLock);
    }
    if (passwordInput) {
      passwordInput.addEventListener('keydown', checkCapsLock);
      passwordInput.addEventListener('keyup', checkCapsLock);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (emailInput) {
        emailInput.removeEventListener('keydown', checkCapsLock);
        emailInput.removeEventListener('keyup', checkCapsLock);
      }
      if (passwordInput) {
        passwordInput.removeEventListener('keydown', checkCapsLock);
        passwordInput.removeEventListener('keyup', checkCapsLock);
      }
    };
  }, []);

  const mountGoogleButton = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    const buttonDiv = document.getElementById('google-signin-button');
    if (!buttonDiv) return;
    try {
      buttonDiv.innerHTML = '';
      const widthPx = getGoogleSignInButtonPixelWidth(buttonDiv);
      window.google.accounts.id.renderButton(buttonDiv, {
        ...GOOGLE_SIGNIN_BUTTON_OPTS_BASE,
        width: widthPx,
      });
    } catch (e) {
      console.warn('Google renderButton:', e);
    }
  }, []);

  useEffect(() => {
    if (!showLoginForm) return;
    const t = setTimeout(() => mountGoogleButton(), 120);
    return () => clearTimeout(t);
  }, [showLoginForm, mountGoogleButton]);


  const handleCredentialResponse = useCallback(async (response) => {
    setIsLoading(true);
    setError('');

    try {
      // Decodificar o JWT para obter dados do usuário
      const payload = decodeJWT(response.credential);
      console.log('Payload decodificado:', payload);

      // Removida validação de domínio - qualquer email Google é aceito
      // Validação de acesso será feita no backend (verificar qualidade_funcionarios e acessos.Velohub)
      if (payload && payload.email) {
        console.log('Validando acesso para:', payload.email);

        // Validar acesso do usuário no backend (verificar qualidade_funcionarios)
        // Enviar também picture do Google para sincronização automática
        const validateResponse = await fetch(`${API_BASE_URL}/auth/validate-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: payload.email,
            picture: payload.picture || null // Enviar picture do Google para sincronização
          })
        });

        const validateResult = await validateResponse.json().catch(() => ({
          success: false,
          error: 'Resposta inválida do servidor'
        }));

        if (!validateResponse.ok) {
          const errMsg = validateResult.error || validateResult.message || `Erro ${validateResponse.status}`;
          console.log('Acesso negado:', errMsg, '(status:', validateResponse.status, ')');
          setError(errMsg);
          setIsLoading(false);
          return;
        }

        if (!validateResult.success) {
          console.log('Acesso negado:', validateResult.error || validateResult.message);
          setError(validateResult.error || validateResult.message || 'Erro ao validar acesso');
          setIsLoading(false);
          return;
        }

        // Usar dados validados do backend (avatar já foi sincronizado se necessário)
        // Prioridade: profile_pic do MongoDB (já sincronizado do Google se necessário) > null
        const mongoPicture = validateResult.user?.picture || null;
        
        // Garantir que o nome seja o mesmo do MongoDB (priorizar nome do MongoDB)
        // Isso garante consistência entre backend e frontend para filtros de conversas
        const userData = {
          name: validateResult.user?.name || payload.name, // Priorizar nome do MongoDB
          email: validateResult.user?.email || payload.email,
          picture: mongoPicture || null  // Usar picture do MongoDB (já sincronizado se necessário)
        };
        
        // Log para debug de consistência de nomes
        if (validateResult.user?.name && validateResult.user.name !== payload.name) {
          console.log('⚠️ Diferença de nome detectada:', {
            mongoDB: validateResult.user.name,
            google: payload.name,
            usando: userData.name
          });
        }

        // Salvar sessão
        saveUserSession(userData);

        // Verificar acesso Velohub (acessos.Velohub === true)
        // Validação já foi feita no backend através de validate-access
        // Se chegou aqui, significa que acesso foi validado com sucesso
        
        console.log('✅ Login realizado com sucesso - credenciais validadas');
        // Chamar onLoginSuccess para ir para LoadingPage (que criará sessionId)
        onLoginSuccess(userData);
      } else {
        console.log('Email não encontrado no payload:', payload);
        setError('Erro ao processar dados do Google. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao processar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [onLoginSuccess]);

  /** Sempre despacha para o último handler sem forçar novo `initialize` (guard contra Strict Mode). */
  const gsiCredentialCbRef = useRef(handleCredentialResponse);
  gsiCredentialCbRef.current = handleCredentialResponse;

  useEffect(() => {
    const runAfterGsiLoads = () => {
      const g = window.google;
      if (!g?.accounts?.id) return;
      const clientId = getClientId();
      if (!clientId) {
        console.error('ERRO: Client ID não está definido!');
        return;
      }

      const wGlob = typeof window !== 'undefined' ? window : {};
      if (wGlob.__velohubGsiInitClientId !== clientId) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            gsiCredentialCbRef.current?.(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        wGlob.__velohubGsiInitClientId = clientId;
      }

      setTimeout(() => {
        if (showLoginFormRef.current) mountGoogleButton();
      }, 100);
    };

    let scriptEl = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.src = GSI_SCRIPT_SRC;
      scriptEl.async = true;
      scriptEl.defer = true;
      document.head.appendChild(scriptEl);
    }

    if (window.google?.accounts?.id) {
      runAfterGsiLoads();
    } else if (scriptEl) {
      scriptEl.addEventListener('load', runAfterGsiLoads, { once: true });
    }

    return () => {
      if (scriptEl) {
        scriptEl.removeEventListener('load', runAfterGsiLoads);
      }
    };
  }, [mountGoogleButton]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Email ou senha incorretos');
        setIsLoading(false);
        return;
      }

      // Login bem-sucedido
      const userData = result.user;

      // Salvar sessão
      saveUserSession(userData);

      // Verificar acesso Velohub (acessos.Velohub === true)
      // Validação já foi feita no backend através de /auth/login
      // Se chegou aqui, significa que acesso foi validado com sucesso
      
      console.log('✅ Login realizado com sucesso - credenciais validadas');
      // Chamar onLoginSuccess para ir para LoadingPage (que criará sessionId)
      onLoginSuccess(userData);
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao processar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        try {
          buttonDiv.innerHTML = '';
          const widthPx = getGoogleSignInButtonPixelWidth(buttonDiv);
          window.google.accounts.id.renderButton(buttonDiv, {
            ...GOOGLE_SIGNIN_BUTTON_OPTS_BASE,
            width: widthPx,
          });
        } catch (e) {
          console.warn('Google renderButton (fallback):', e);
          window.google.accounts.id.prompt();
        }
      } else {
        window.google.accounts.id.prompt();
      }
    } else {
      setError('Google Sign-In não está disponível. Tente recarregar a página.');
    }
  };

  return (
    <div 
      className="velohub-login-root fixed inset-0 z-0 flex flex-col overflow-x-hidden overflow-y-auto"
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        width: '100%',
        maxWidth: '100%',
        backgroundImage: 'url(/V6BGcomLogo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {!showLoginForm && (
        <div className="fixed inset-0 z-10 pointer-events-none">
          <div
            className="pointer-events-auto absolute top-[calc(45vh_+_2cm_+_0.75rem)] sm:top-[calc(47vh_+_2cm_+_0.75rem)] md:top-[calc(49vh_+_2cm_+_0.75rem)] lg:top-[calc(51vh_+_2cm_+_0.75rem)] left-1/2 sm:left-[71%] md:left-[72%] lg:left-[73%]"
            style={{ transform: 'translate(calc(-50% + 36px), 8px)' }}
          >
            <button
              type="button"
              onClick={() => setShowLoginForm(true)}
              className="min-w-[200px] px-10 py-3.5 rounded-lg font-semibold transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#1694FF] focus:ring-offset-2 focus:ring-offset-black/20 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.12),0_4px_6px_-2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.42),0_0_22px_rgba(255,255,255,0.16)] hover:shadow-[0_14px_20px_-4px_rgba(0,0,0,0.14),0_6px_8px_-4px_rgba(0,0,0,0.08),0_0_16px_rgba(255,255,255,0.52),0_0_28px_rgba(255,255,255,0.22)]"
              style={{
                background: ENTRAR_BUTTON_GRADIENT,
                color: '#F3F7FC',
                fontFamily: "'Poppins', sans-serif",
                borderRadius: 'var(--velohub-radius-btn-rect)',
                fontWeight: 600,
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {showLoginForm && (
      <div className="max-w-md w-full ml-auto pr-8 md:pr-16 lg:pr-24 flex flex-1 flex-col justify-center min-h-0 py-6" style={{ transform: 'translateX(30px)' }}>

        {/* Card de Login */}
        <div className="bg-white dark:bg-gray-800 rounded-vh-container shadow-xl p-8" style={{
          borderRadius: 'var(--velohub-radius-container)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              Bem-vindo de volta!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Faça login para acessar o VeloHub
            </p>
          </div>

          {/* Formulário de Email/Senha */}
          <form onSubmit={handleEmailPasswordLogin} className="mb-6">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-vh-container focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="seu.email@velotax.com.br"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-vh-container focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.07 3.07L12 12m-3.81-3.81L3 3m9 9l3.81 3.81M12 12l3.29 3.29M21 21l-3.29-3.29m0 0a9.97 9.97 0 01-2.12-2.12m-3.07-3.07L12 12m3.81 3.81L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-vh-btn transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                ou
              </span>
            </div>
          </div>

          {/* Botão do Google */}
          <div id="google-signin-button" className="w-full" style={{width: '100%', display: 'flex', justifyContent: 'center'}}></div>
          
          {/* Botão de fallback (caso o Google não carregue) */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-vh-btn hover:border-gray-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            style={{ display: 'none' }}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}
            <span className="text-gray-700 font-medium">
              {isLoading ? 'Entrando...' : 'Continuar com Google'}
            </span>
          </button>

          {/* Mensagem de erro */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </p>
            </div>
          )}

        </div>

        {/* Alerta CAPS LOCK */}
        {capsLockOn && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>CAPS LOCK está ativado</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            © 2025 VeloHub. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <a 
              href="/termos" 
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/termos';
              }}
            >
              Termos de Uso
            </a>
            <span>•</span>
            <a 
              href="/privacidade" 
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/privacidade';
              }}
            >
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default LoginPage;
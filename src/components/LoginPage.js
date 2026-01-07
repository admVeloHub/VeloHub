// VERSION: v2.3.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
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
import React, { useState, useEffect } from 'react';
import { 
  saveUserSession, 
  isAuthorizedDomain, 
  decodeJWT, 
  initializeGoogleSignIn,
  registerLoginSession
} from '../services/auth';
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

const LoginPage = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

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

  useEffect(() => {
    // Carregar o script do Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        const clientId = getClientId();
        console.log('=== DEBUG GOOGLE OAUTH ===');
        console.log('Client ID recebido:', clientId);
        console.log('Tipo do Client ID:', typeof clientId);
        console.log('Client ID é undefined?', clientId === undefined);
        console.log('Client ID é null?', clientId === null);
        console.log('Client ID é string vazia?', clientId === '');
        console.log('process.env.REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
        console.log('========================');
        
        if (!clientId) {
          console.error('ERRO: Client ID não está definido!');
          return;
        }
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        console.log('Google Sign-In inicializado com Client ID:', clientId);
        
        // Renderizar o botão do Google automaticamente
        setTimeout(() => {
          const buttonDiv = document.getElementById('google-signin-button');
          if (buttonDiv && window.google.accounts.id) {
            window.google.accounts.id.renderButton(buttonDiv, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'center'
            });
          }
        }, 100);
      }
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response) => {
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

        const validateResult = await validateResponse.json();

        if (!validateResult.success) {
          console.log('Acesso negado:', validateResult.error);
          setError(validateResult.error || 'Erro ao validar acesso');
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

        // Registrar login no backend para controle de sessões
        registerLoginSession(userData);

        console.log('Login realizado com sucesso');
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
  };

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

      // Registrar login no backend para controle de sessões
      registerLoginSession(userData);

      console.log('Login realizado com sucesso');
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
      // Usar o método renderButton para criar o botão do Google
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular'
        });
      } else {
        // Fallback: usar prompt se o botão não estiver disponível
        window.google.accounts.id.prompt();
      }
    } else {
      setError('Google Sign-In não está disponível. Tente recarregar a página.');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center relative"
      style={{
        backgroundImage: 'url(/loginpage.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Card de Login - Posicionado à direita */}
      <div className="max-w-md w-full ml-auto pr-8 md:pr-16 lg:pr-24" style={{ transform: 'translateX(30px)' }}>

        {/* Card de Login */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8" style={{
          borderRadius: '16px',
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
    </div>
  );
};

export default LoginPage;
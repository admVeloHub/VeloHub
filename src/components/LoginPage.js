import React, { useState, useEffect } from 'react';
import { 
  saveUserSession, 
  isAuthorizedDomain, 
  decodeJWT, 
  initializeGoogleSignIn 
} from '../services/auth';
import { getClientId } from '../config/google-config';

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

  useEffect(() => {
    // Carregar o script do Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        initializeGoogleSignIn(getClientId(), handleCredentialResponse);
      }
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = (response) => {
    setIsLoading(true);
    setError('');

    try {
      // Decodificar o JWT para obter dados do usuário
      const payload = decodeJWT(response.credential);
      console.log('Payload decodificado:', payload);

      if (payload && payload.email && isAuthorizedDomain(payload.email)) {
        console.log('Email autorizado:', payload.email);

        // Salvar dados do usuário
        const userData = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        };

        // Salvar sessão
        saveUserSession(userData);

        // Salvar dados do usuário (compatibilidade)
        localStorage.setItem('userEmail', payload.email);
        localStorage.setItem('userName', payload.name);
        localStorage.setItem('userPicture', payload.picture);

        console.log('Login realizado com sucesso');
        onLoginSuccess(userData);
      } else {
        console.log('Email não autorizado:', payload?.email);
        setError('Apenas emails do domínio autorizado são permitidos.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao processar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In não está disponível. Tente recarregar a página.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        {/* Logo VeloHub */}
        <div className="text-center mb-8">
          <img 
            src="/VeloHubLogo 2.png" 
            alt="VeloHub Logo" 
            className="h-32 w-auto mx-auto mb-4"
          />
        </div>

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

          {/* Botão do Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Informações adicionais */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ao fazer login, você concorda com nossos{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 VeloHub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

// Funções auxiliares agora importadas de auth.js

export default LoginPage;

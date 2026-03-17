/**
 * VeloHub V3 - SociaisAccessGuard Component
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 * 
 * Componente que verifica acesso ao módulo Sociais antes de renderizar conteúdo
 */

// Lista de emails com bypass de acesso (desenvolvedores/admin)
const BYPASS_EMAILS = [];

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api-config';
import { getUserSession } from '../../services/auth';

/**
 * Obtém email do usuário da sessão ativa (usa mesma fonte que auth.js - velohub_user_session)
 * Prioridade: velohub_user_session (auth atual) > veloacademy > user_session (legado)
 */
const getUserEmail = () => {
  try {
    const session = getUserSession();
    if (session?.user?.email) return session.user.email;
    const sessionData =
      localStorage.getItem('veloacademy_user_session') ||
      localStorage.getItem('user_session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      return parsed?.user?.email || parsed?.email;
    }
  } catch (error) {
    console.error('Erro ao obter email da sessão:', error);
  }
  return null;
};

/**
 * Componente de guard para verificar acesso ao módulo Sociais
 */
const SociaisAccessGuard = ({ children }) => {
  const [hasAccess, setHasAccess] = useState(null); // null = verificando, true = tem acesso, false = sem acesso
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  /**
   * Verificar acesso ao módulo Sociais
   */
  const checkAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      const email = getUserEmail();
      
      if (!email) {
        console.error('❌ [SociaisAccessGuard] Email do usuário não encontrado na sessão');
        setHasAccess(false);
        setError('Sessão não encontrada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Bypass para desenvolvedores/admin
      if (BYPASS_EMAILS.includes(normalizedEmail)) {
        console.log(`✅ [SociaisAccessGuard] Bypass ativado para: ${normalizedEmail}`);
        setHasAccess(true);
        setLoading(false);
        return;
      }

      console.log(`🔍 [SociaisAccessGuard] Verificando acesso ao módulo Sociais para: ${normalizedEmail}`);

      // Obter sessionId se disponível
      const sessionId = localStorage.getItem('velohub_session_id');
      
      // Construir URL com parâmetros
      const url = new URL(`${API_BASE_URL}/auth/check-module-access`);
      url.searchParams.append('email', email);
      url.searchParams.append('module', 'sociais');
      if (sessionId) {
        url.searchParams.append('sessionId', sessionId);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'x-session-id': sessionId }),
          ...(email && { 'x-user-email': email }),
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar acesso: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.hasAccess) {
        console.log('✅ [SociaisAccessGuard] Acesso autorizado ao módulo Sociais');
        setHasAccess(true);
      } else {
        console.log('❌ [SociaisAccessGuard] Acesso negado ao módulo Sociais');
        setHasAccess(false);
        setError(data.error || 'Acesso ao módulo Sociais não autorizado');
      }
    } catch (error) {
      console.error('❌ [SociaisAccessGuard] Erro ao verificar acesso:', error);
      setHasAccess(false);
      setError('Erro ao verificar acesso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)' }}>
        <div className="text-center">
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--blue-dark)' }}>
            Verificando acesso...
          </div>
          <div className="text-sm" style={{ color: 'var(--cor-texto-secundario)' }}>
            Aguarde enquanto verificamos suas permissões
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de acesso negado
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)' }}>
        <div className="velohub-container max-w-md text-center p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4 velohub-title" style={{ color: 'var(--blue-dark)' }}>
            Acesso Negado
          </h2>
          <p className="mb-6" style={{ color: 'var(--cor-texto-secundario)' }}>
            {error || 'Você não tem permissão para acessar o módulo Sociais.'}
          </p>
          <p className="text-sm" style={{ color: 'var(--cor-texto-secundario)' }}>
            Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo se tiver acesso
  return <>{children}</>;
};

export default SociaisAccessGuard;

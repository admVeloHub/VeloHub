/**
 * Utilitário para gerenciar avatares de usuários
 * VERSION: v1.0.2 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.0.2:
 * - Adicionada validação de Content-Type antes de fazer parse JSON
 * - Melhorado tratamento de erros ao buscar avatar do MongoDB
 * 
 * Mudanças v1.0.1:
 * - Corrigido para usar API_BASE_URL de api-config.js ao invés de variável de ambiente direta
 */

import { API_BASE_URL } from '../config/api-config';

/**
 * Obtém a inicial do último nome de um nome completo
 * @param {string} fullName - Nome completo do usuário
 * @returns {string} - Inicial do último nome em maiúscula
 */
export function getLastNameInitial(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 0) {
    return '';
  }

  const lastName = nameParts[nameParts.length - 1];
  return lastName.charAt(0).toUpperCase();
}

/**
 * Formata nome completo com inicial do último nome
 * Exemplo: "João Silva" -> "João S."
 * @param {string} fullName - Nome completo do usuário
 * @returns {string} - Nome formatado com inicial do último nome
 */
export function formatNameWithLastNameInitial(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 0) {
    return '';
  }

  if (nameParts.length === 1) {
    return nameParts[0];
  }

  const firstName = nameParts[0];
  const lastNameInitial = getLastNameInitial(fullName);
  
  return `${firstName} ${lastNameInitial}.`;
}

/**
 * Gera URL de avatar padrão com inicial do nome
 * @param {string} name - Nome do usuário
 * @param {string} initial - Inicial a ser exibida (opcional, será gerada se não fornecida)
 * @returns {string} - URL de avatar padrão
 */
export function generateDefaultAvatarUrl(name, initial = null) {
  const displayInitial = initial || getLastNameInitial(name) || 'U';
  const encodedName = encodeURIComponent(name || 'Usuário');
  
  // Usar serviço de avatar padrão (ex: UI Avatars ou similar)
  // Por enquanto, retornar null para usar CSS com inicial
  return null;
}

/**
 * Obtém avatar do usuário do MongoDB
 * @param {string} email - Email do usuário
 * @returns {Promise<string|null>} - URL do avatar ou null se não encontrado
 */
export async function getUserAvatarFromMongoDB(email) {
  if (!email) {
    return null;
  }

  try {
    const url = `${API_BASE_URL}/auth/profile?email=${encodeURIComponent(email)}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('Resposta não-JSON recebida ao buscar avatar:', text.substring(0, 100));
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.profile && data.profile.profile_pic) {
        let avatarUrl;
        // Se profile_pic é uma URL completa, retornar diretamente
        if (data.profile.profile_pic.startsWith('http')) {
          avatarUrl = data.profile.profile_pic;
        } else {
          // Se é um caminho relativo, construir URL completa do GCS
          const bucketName = 'mediabank_velohub';
          avatarUrl = `https://storage.googleapis.com/${bucketName}/${data.profile.profile_pic}`;
        }
        return avatarUrl;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar avatar do MongoDB:', error);
  }

  return null;
}

/**
 * Obtém avatar do usuário com fallback
 * Prioridade: MongoDB > Avatar padrão com inicial
 * @param {string} email - Email do usuário
 * @param {string} name - Nome do usuário (para fallback)
 * @returns {Promise<{url: string|null, initial: string, displayName: string}>}
 */
export async function getUserAvatar(email, name) {
  const displayName = formatNameWithLastNameInitial(name || '');
  const initial = getLastNameInitial(name || '');

  // Tentar obter do MongoDB
  const mongoAvatar = await getUserAvatarFromMongoDB(email);

  return {
    url: mongoAvatar,
    initial: initial || 'U',
    displayName: displayName || 'Usuário'
  };
}

/**
 * Componente de avatar (para uso em React)
 * Retorna objeto com dados do avatar
 * @param {string} email - Email do usuário
 * @param {string} name - Nome do usuário
 * @returns {Promise<{avatarUrl: string|null, initial: string, displayName: string}>}
 */
export async function getAvatarData(email, name) {
  const avatarData = await getUserAvatar(email, name);
  
  return {
    avatarUrl: avatarData.url,
    initial: avatarData.initial,
    displayName: avatarData.displayName
  };
}


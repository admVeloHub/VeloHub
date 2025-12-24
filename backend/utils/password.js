/**
 * Utilitários para manipulação de senhas
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Funções para comparação e validação de senhas
 */

/**
 * Compara uma senha em texto plano com um hash/valor armazenado
 * NOTA: Atualmente as senhas são armazenadas em texto plano no MongoDB
 * @param {string} plainPassword - Senha em texto plano fornecida pelo usuário
 * @param {string} storedPassword - Senha armazenada no banco de dados
 * @returns {boolean} - true se as senhas correspondem, false caso contrário
 */
const comparePassword = (plainPassword, storedPassword) => {
  if (!plainPassword || !storedPassword) {
    return false;
  }
  
  // Comparação simples (senhas são armazenadas em texto plano)
  return plainPassword === storedPassword;
};

/**
 * Valida se uma senha atende aos critérios mínimos
 * @param {string} password - Senha a ser validada
 * @returns {object} - { valid: boolean, error?: string }
 */
const validatePassword = (password) => {
  if (!password) {
    return {
      valid: false,
      error: 'Senha é obrigatória'
    };
  }

  // Mínimo de 6 caracteres (conforme usado no frontend)
  if (password.length < 6) {
    return {
      valid: false,
      error: 'A senha deve ter no mínimo 6 caracteres'
    };
  }

  return {
    valid: true
  };
};

/**
 * Valida se um usuário tem acesso ao sistema
 * @param {object} funcionario - Objeto do funcionário do MongoDB
 * @returns {object} - { hasAccess: boolean, error?: string }
 */
const validateUserAccess = (funcionario) => {
  if (!funcionario) {
    return {
      hasAccess: false,
      error: 'Usuário não encontrado'
    };
  }

  // Verificar se está desligado, afastado ou suspenso
  const acessos = funcionario.acessos || {};
  
  if (acessos.desligado === true) {
    return {
      hasAccess: false,
      error: 'Usuário desligado'
    };
  }

  if (acessos.afastado === true) {
    return {
      hasAccess: false,
      error: 'Usuário afastado'
    };
  }

  if (acessos.suspenso === true) {
    return {
      hasAccess: false,
      error: 'Usuário suspenso'
    };
  }

  // Verificar acesso ao VeloHub
  const acessoVelohub = acessos.Velohub || acessos.velohub || false;
  
  if (!acessoVelohub) {
    return {
      hasAccess: false,
      error: 'Acesso ao VeloHub não autorizado'
    };
  }

  return {
    hasAccess: true
  };
};

module.exports = {
  comparePassword,
  validatePassword,
  validateUserAccess
};


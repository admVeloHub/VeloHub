/**
 * Utilitários para manipulação de senhas
 * VERSION: v1.1.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.1.0:
 * - Adicionada função generateDefaultPassword para gerar senha padrão (nome.sobrenomeCPF)
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

/**
 * Remove acentos de uma string
 * @param {string} str - String a ser processada
 * @returns {string} - String sem acentos
 */
const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Gera senha padrão no formato: nome.sobrenomeCPF
 * @param {string} colaboradorNome - Nome completo do colaborador
 * @param {string} cpf - CPF do colaborador (11 dígitos, sem pontos ou traços)
 * @returns {string} - Senha padrão gerada (ex: joao.silva12345678901)
 */
const generateDefaultPassword = (colaboradorNome, cpf) => {
  if (!colaboradorNome) {
    return '';
  }

  // Remover acentos e converter para minúsculas
  const nomeSemAcentos = removeAccents(colaboradorNome).toLowerCase().trim();
  
  // Dividir nome em partes
  const partesNome = nomeSemAcentos.split(/\s+/).filter(p => p.length > 0);
  
  if (partesNome.length === 0) {
    return '';
  }

  // Primeiro nome (primeira parte)
  const primeiroNome = partesNome[0];
  
  // Sobrenome (última parte, ou segunda parte se houver apenas duas)
  let sobrenome = '';
  if (partesNome.length === 1) {
    sobrenome = primeiroNome; // Se só tem um nome, usar ele mesmo
  } else if (partesNome.length === 2) {
    sobrenome = partesNome[1]; // Se tem dois nomes, usar o segundo
  } else {
    sobrenome = partesNome[partesNome.length - 1]; // Se tem mais de dois, usar o último
  }

  // Limpar CPF (remover pontos, traços e espaços)
  const cpfLimpo = cpf ? cpf.replace(/[.\-\s]/g, '') : '';

  // Gerar senha padrão
  if (cpfLimpo && cpfLimpo.length >= 11) {
    return `${primeiroNome}.${sobrenome}${cpfLimpo}`;
  } else {
    // Fallback: apenas nome.sobrenome se não houver CPF
    return `${primeiroNome}.${sobrenome}`;
  }
};

module.exports = {
  comparePassword,
  validatePassword,
  validateUserAccess,
  generateDefaultPassword
};


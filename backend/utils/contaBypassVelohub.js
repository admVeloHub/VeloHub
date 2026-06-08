// VERSION: v1.2.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
// CHANGELOG: v1.2.0 - reclamacoesN1 + reclamacoesN2 no bypass total
// CHANGELOG: v1.1.0 - Chave velobot no bypass total
// Conta com bypass total no VeloHub — não depende de qualidade_funcoes.modulosVelohub nem acessos legados.

const BYPASS_VELOHUB_EMAIL = 'lucas.gravina@velotax.com.br';

function normalizarEmailBypassVelohub(email) {
  if (email == null || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function emailTemBypassVelohub(email) {
  return normalizarEmailBypassVelohub(email) === BYPASS_VELOHUB_EMAIL;
}

function permissoesVelohubBypassTotal() {
  return {
    corporativo: true,
    atendimento: true,
    velobot: true,
    liberacaoPix: true,
    acompanhamento: true,
    reclamacoesN1: true,
    reclamacoesN2: true,
    sociais: true,
  };
}

module.exports = {
  BYPASS_VELOHUB_EMAIL,
  normalizarEmailBypassVelohub,
  emailTemBypassVelohub,
  permissoesVelohubBypassTotal,
};

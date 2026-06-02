// VERSION: v1.0.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
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
    liberacaoPix: true,
    acompanhamento: true,
    reclamacoes: true,
    sociais: true,
  };
}

module.exports = {
  BYPASS_VELOHUB_EMAIL,
  normalizarEmailBypassVelohub,
  emailTemBypassVelohub,
  permissoesVelohubBypassTotal,
};

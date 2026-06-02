// VERSION: v1.0.1 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
const FUNCIONARIOS_DB_NAME = process.env.CONSOLE_FUNCIONARIOS_DB || 'console_funcionarios';

const FUNCIONARIOS_COLLECTIONS = {
  CADASTRO: 'funcionarios_cadastroColaboradores',
  ATUACOES: 'gerenciamento_atuacoes',
  HUB_SESSIONS: 'hub_sessions',
  OPCOES_CADASTRO: 'gerenciamento_opcoesCadastro',
};

module.exports = {
  FUNCIONARIOS_DB_NAME,
  FUNCIONARIOS_COLLECTIONS,
};

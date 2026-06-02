// VERSION: v1.0.2 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
const { FUNCIONARIOS_DB_NAME, FUNCIONARIOS_COLLECTIONS } = require('./funcionariosCollections');

function getFuncionariosDb(client) {
  return client.db(FUNCIONARIOS_DB_NAME);
}

function getCadastroCollection(client) {
  return getFuncionariosDb(client).collection(FUNCIONARIOS_COLLECTIONS.CADASTRO);
}

function getAtuacoesCollection(client) {
  return getFuncionariosDb(client).collection(FUNCIONARIOS_COLLECTIONS.ATUACOES);
}

function getHubSessionsCollection(client) {
  return getFuncionariosDb(client).collection(FUNCIONARIOS_COLLECTIONS.HUB_SESSIONS);
}

module.exports = {
  FUNCIONARIOS_DB_NAME,
  FUNCIONARIOS_COLLECTIONS,
  getFuncionariosDb,
  getCadastroCollection,
  getAtuacoesCollection,
  getHubSessionsCollection,
};

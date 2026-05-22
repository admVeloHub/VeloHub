/**
 * VeloHub V3 — Resolver coleção hub_ouvidoria.reclamacoes_* por tipo (espelho de reclamacoes.js getCollectionByType)
 * VERSION: v1.0.0 | DATE: 2026-04-16 | AUTHOR: VeloHub Development Team
 */

/**
 * @param {import('mongodb').Db} db — client.db('hub_ouvidoria')
 * @param {string} tipo
 * @returns {import('mongodb').Collection}
 */
function getHubOuvidoriaReclamacaoCollectionByTipo(db, tipo) {
  const tipoUpper = String(tipo || '').toUpperCase().trim();

  switch (tipoUpper) {
    case 'BACEN':
      return db.collection('reclamacoes_bacen');
    case 'N2':
    case 'N2 PIX':
    case 'N2 & PIX':
    case 'N2&PIX':
    case 'OUVIDORIA':
      return db.collection('reclamacoes_n2Pix');
    case 'RECLAME AQUI':
    case 'RECLAMEAQUI':
    case 'RECLAME_AQUI':
      return db.collection('reclamacoes_reclameAqui');
    case 'PROCON':
      return db.collection('reclamacoes_procon');
    case 'PROCESSOS':
    case 'JUDICIAL':
    case 'AÇÃO JUDICIAL':
    case 'ACAO JUDICIAL':
      return db.collection('reclamacoes_judicial');
    case 'TIME_PORTABILIDADE':
    case 'TIME PORTABILIDADE':
      return db.collection('reclamacoes_timePortabilidade');
    default:
      return db.collection('reclamacoes_bacen');
  }
}

module.exports = { getHubOuvidoriaReclamacaoCollectionByTipo };

// VERSION: v1.1.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
/**
 * hub_corporate — Ética e Conduta, LGPD, Termos de Uso (LISTA_SCHEMAS.rb)
 *
 * v1.1.0: corpo_etica&conduta + etica&conduta_acknowledgment (ex corpo_politicas&normas)
 */

const HUB_CORPORATE_DB_NAME = process.env.HUB_CORPORATE_DB || 'hub_corporate';

const HUB_CORPORATE_COLLECTIONS = {
  CORPO_ETICA_CONDUTA: 'corpo_etica&conduta',
  ETICA_CONDUTA_ACK: 'etica&conduta_acknowledgment',
  CORPO_LGPD: 'corpo_lgpd',
  LGPD_ACK: 'lgpd_acknowledgment',
  CORPO_TERMO_USUARIO: 'corpo_termoUsuario',
  TERMO_USUARIO_ACK: 'termoUsuario_acknowledgment',
};

function getHubCorporateDb(client) {
  return client.db(HUB_CORPORATE_DB_NAME);
}

function getCorpoEticaCondutaCollection(client) {
  return getHubCorporateDb(client).collection(HUB_CORPORATE_COLLECTIONS.CORPO_ETICA_CONDUTA);
}

function getEticaCondutaAckCollection(client) {
  return getHubCorporateDb(client).collection(HUB_CORPORATE_COLLECTIONS.ETICA_CONDUTA_ACK);
}

/** @deprecated use getCorpoEticaCondutaCollection */
function getCorpoPoliticasNormasCollection(client) {
  return getCorpoEticaCondutaCollection(client);
}

/** @deprecated use getEticaCondutaAckCollection */
function getPoliticasNormasAckCollection(client) {
  return getEticaCondutaAckCollection(client);
}

function getCorpoLgpdCollection(client) {
  return getHubCorporateDb(client).collection(HUB_CORPORATE_COLLECTIONS.CORPO_LGPD);
}

function getLgpdAckCollection(client) {
  return getHubCorporateDb(client).collection(HUB_CORPORATE_COLLECTIONS.LGPD_ACK);
}

function getCorpoTermoUsuarioCollection(client) {
  return getHubCorporateDb(client).collection(HUB_CORPORATE_COLLECTIONS.CORPO_TERMO_USUARIO);
}

function getTermoUsuarioAckCollection(client) {
  return getHubCorporateDb(client).collection(HUB_CORPORATE_COLLECTIONS.TERMO_USUARIO_ACK);
}

module.exports = {
  HUB_CORPORATE_DB_NAME,
  HUB_CORPORATE_COLLECTIONS,
  getHubCorporateDb,
  getCorpoEticaCondutaCollection,
  getEticaCondutaAckCollection,
  getCorpoPoliticasNormasCollection,
  getPoliticasNormasAckCollection,
  getCorpoLgpdCollection,
  getLgpdAckCollection,
  getCorpoTermoUsuarioCollection,
  getTermoUsuarioAckCollection,
};

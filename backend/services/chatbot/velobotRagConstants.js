/**
 * Constantes RAG do chat principal VeloBot (POST /api/chatbot/ask)
 * VERSION: v1.2.0 | DATE: 2026-05-18 | AUTHOR: VeloHub Development Team
 * v1.2.0: guardrail factual customizado (velobotGuardrails v2) — VELOBOT_GUARDRAIL_CONFIDENCE legado, não usado no verificador v2
 * v1.1.0: VELOBOT_GUARDRAIL_CONFIDENCE 0.7 → 0.8
 *
 * IDs das vector stores fixos em código — única fonte de verdade para file_search primário.
 */

/** Base pública: produtos, regras, contrato, aquisição, pagamento, cancelamento */
const VELOBOT_VECTOR_STORE_PUBLIC = 'vs_69fe281ef0f48191a5587521c18a18c1';

/** Base interna: SOP, protocolos e procedimentos do operador */
const VELOBOT_VECTOR_STORE_INTERNAL = 'vs_6a0b05c7fe34819186e4f6dab9f1bf56';

const VELOBOT_RESPONSES_MODEL_DEFAULT = 'gpt-5.4-mini';

const VELOBOT_RAG_HISTORY_LIMIT = 10;

const VELOBOT_GUARDRAIL_MODEL = 'gpt-4.1-mini';

const VELOBOT_GUARDRAIL_CONFIDENCE = 0.8;

/**
 * @returns {string[]} [pública, interna] para file_search
 */
function getPrimaryVelobotVectorStoreIds() {
  return [VELOBOT_VECTOR_STORE_PUBLIC, VELOBOT_VECTOR_STORE_INTERNAL];
}

/**
 * Modelo Responses do chat primário; env OPENAI_VELOBOT_RESPONSES_MODEL sobrescreve se definido.
 * @param {string|undefined|null} configOverride
 * @returns {string}
 */
function getVelobotResponsesModel(configOverride) {
  if (configOverride != null && String(configOverride).trim() !== '') {
    return String(configOverride).trim();
  }
  return VELOBOT_RESPONSES_MODEL_DEFAULT;
}

module.exports = {
  VELOBOT_VECTOR_STORE_PUBLIC,
  VELOBOT_VECTOR_STORE_INTERNAL,
  VELOBOT_RESPONSES_MODEL_DEFAULT,
  VELOBOT_RAG_HISTORY_LIMIT,
  VELOBOT_GUARDRAIL_MODEL,
  VELOBOT_GUARDRAIL_CONFIDENCE,
  getPrimaryVelobotVectorStoreIds,
  getVelobotResponsesModel
};

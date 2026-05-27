/**
 * Constantes RAG do chat principal VeloBot (POST /api/chatbot/ask)
 * VERSION: v1.3.1 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 * v1.3.1: VELOBOT_PRIMARY_RAG_FORCE_DISABLED — congela RAG novo; /ask usa só fluxo legado (Mongo/Gemini)
 * v1.3.0: VELOBOT_PRIMARY_RAG_ENABLED — pausa do RAG OpenAI (default false → só fallback legado)
 * v1.2.0: guardrail factual customizado (velobotGuardrails v2)
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

/** false = /api/chatbot/ask usa só fallback legado; true = tenta RAG OpenAI antes do legado */
const VELOBOT_PRIMARY_RAG_ENABLED_DEFAULT = false;

/** true = ignora env e mantém RAG OpenAI desligado (reativar: false + VELOBOT_PRIMARY_RAG_ENABLED=1) */
const VELOBOT_PRIMARY_RAG_FORCE_DISABLED = true;

/**
 * @param {string|undefined|null} envValue
 * @returns {boolean}
 */
function isPrimaryVelobotRagEnabled(envValue) {
  if (VELOBOT_PRIMARY_RAG_FORCE_DISABLED) {
    return false;
  }
  if (envValue == null || String(envValue).trim() === '') {
    return VELOBOT_PRIMARY_RAG_ENABLED_DEFAULT;
  }
  const v = String(envValue).trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') {
    return false;
  }
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') {
    return true;
  }
  return VELOBOT_PRIMARY_RAG_ENABLED_DEFAULT;
}

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
  VELOBOT_PRIMARY_RAG_ENABLED_DEFAULT,
  VELOBOT_PRIMARY_RAG_FORCE_DISABLED,
  isPrimaryVelobotRagEnabled,
  getPrimaryVelobotVectorStoreIds,
  getVelobotResponsesModel
};

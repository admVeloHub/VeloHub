/**
 * Verificador factual pós-RAG — chat principal VeloBot
 * VERSION: v2.0.0 | DATE: 2026-05-18 | AUTHOR: VeloHub Development Team
 * v2.0.0: substitui @openai/guardrails Hallucination Detection — tripwire SOMENTE em contradição factual com as vector stores
 * v1.3.0: guardrail só no bloco "Para o cliente"; Procedimento interno não verificado
 */

const config = require('../../config');
const {
  getPrimaryVelobotVectorStoreIds,
  VELOBOT_GUARDRAIL_MODEL
} = require('./velobotRagConstants');

const GUARDRAIL_DEBUG_PREVIEW_CHARS = 500;
const VELOBOT_NO_BASE_PHRASE = 'nao encontrei essa informacao na base de conhecimento disponivel';

function isVelohubAiDebug() {
  return String(process.env.VELOHUB_AI_DEBUG || '').trim() === '1';
}

function truncateForGuardrailDebug(text, maxChars = GUARDRAIL_DEBUG_PREVIEW_CHARS) {
  const s = text != null ? String(text) : '';
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `… (+${s.length - maxChars} chars)`;
}

function normalizeForCompare(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isVelobotNoBaseResponse(text) {
  const n = normalizeForCompare(text);
  return n === VELOBOT_NO_BASE_PHRASE || n.startsWith(VELOBOT_NO_BASE_PHRASE);
}

/**
 * @deprecated Mantido para testes/diagnóstico; o guardrail v2 valida o texto completo.
 * @param {string} responseText
 * @returns {{ mode: 'split'|'full', publicText: string|null, internalText: string|null }}
 */
function splitVelobotResponseForGuardrail(responseText) {
  const text = responseText != null ? String(responseText).trim() : '';
  if (!text) {
    return { mode: 'full', publicText: null, internalText: null };
  }

  const clienteMarker = /\*\*\s*para\s+o\s+cliente\s*\*\*/i;
  const procMarker = /\*\*\s*procedimento\s+interno\s*\*\*/i;
  const clienteMatch = text.match(clienteMarker);
  const procMatch = text.match(procMarker);

  if (clienteMatch && procMatch && clienteMatch.index < procMatch.index) {
    const publicText = text
      .slice(clienteMatch.index + clienteMatch[0].length, procMatch.index)
      .trim();
    const internalText = text.slice(procMatch.index + procMatch[0].length).trim();
    return { mode: 'split', publicText: publicText || null, internalText: internalText || null };
  }

  if (clienteMatch && !procMatch) {
    return {
      mode: 'split',
      publicText: text.slice(clienteMatch.index + clienteMatch[0].length).trim() || null,
      internalText: null
    };
  }

  if (procMatch && !clienteMatch) {
    return {
      mode: 'split',
      publicText: null,
      internalText: text.slice(procMatch.index + procMatch[0].length).trim() || null
    };
  }

  return { mode: 'full', publicText: null, internalText: null };
}

function getFactualDivergenceVerifierInstructions() {
  return `# VERIFICADOR FACTUAL VELOBOT

Use file_search nas duas bases indexadas (pública e SOP interna).

Compare o TEXTO DE SAÍDA do assistente com o conteúdo recuperado das bases.

Dispare divergência (diverges: true) **somente** se existir afirmação factual no texto que **contradiz** ou **difere factualmente** do que está documentado nas bases.

**Não** dispare divergência por:
- paráfrase, resumo ou síntese fiel ao conteúdo da base
- omissão de passos, setores ou escalações (não é escopo deste verificador)
- presença de times, contatos, macros ou setores que constam na SOP interna
- privacidade, confidencialidade ou “informação sensível”
- afirmação não localizada na busca (incerteza ou lacuna ≠ contradição)
- opinião, tom ou formato (ex.: blocos "Para o cliente" / "Procedimento interno")

Responda **somente** JSON válido, sem markdown:
{"diverges":false,"reason":null}
ou
{"diverges":true,"reason":"breve motivo da contradição factual"}`;
}

/**
 * @param {Object} data
 * @returns {string}
 */
function extractTextFromOpenAiResponsesBody(data) {
  if (!data) return '';
  if (typeof data.output_text === 'string' && data.output_text) {
    return data.output_text;
  }
  const out = data.output;
  if (!Array.isArray(out)) return '';
  let acc = '';
  for (const item of out) {
    if (item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c && c.type === 'output_text' && c.text) acc += c.text;
      }
    }
  }
  return acc;
}

/**
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
async function postOpenAiResponses(payload) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + config.OPENAI_API_KEY
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && data.error && data.error.message) || res.statusText || 'Erro OpenAI Responses';
    throw new Error(msg + ' (' + res.status + ')');
  }
  return data;
}

/**
 * @param {string} raw
 * @returns {{ diverges: boolean, reason: string|null, parseError?: boolean }}
 */
function parseDivergenceVerifierJson(raw) {
  const text = raw != null ? String(raw).trim() : '';
  if (!text) {
    return { diverges: false, reason: null, parseError: true };
  }
  try {
    const match = text.match(/\{[\s\S]*"diverges"[\s\S]*\}/);
    if (!match) {
      return { diverges: false, reason: null, parseError: true };
    }
    const parsed = JSON.parse(match[0]);
    return {
      diverges: parsed.diverges === true,
      reason: parsed.reason != null ? String(parsed.reason).slice(0, 300) : null
    };
  } catch (_) {
    return { diverges: false, reason: null, parseError: true };
  }
}

/**
 * Tripwire apenas se a orientação no output contradiz factualmente as vector stores.
 *
 * @param {string} responseText
 * @returns {Promise<{ pass: boolean, tripwire: boolean, failedStoreId?: string, skipped?: boolean, error?: string, reasoning?: string }>}
 */
async function checkVelobotHallucinationGuardrail(responseText) {
  const text = responseText != null ? String(responseText).trim() : '';
  if (!text || !config.OPENAI_API_KEY) {
    return { pass: true, tripwire: false, skipped: true };
  }

  if (isVelobotNoBaseResponse(text)) {
    return { pass: true, tripwire: false, skipped: true };
  }

  try {
    const vectorStoreIds = getPrimaryVelobotVectorStoreIds();
    const payload = {
      model: VELOBOT_GUARDRAIL_MODEL,
      instructions: getFactualDivergenceVerifierInstructions(),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'TEXTO DE SAÍDA a verificar:\n\n' + text
            }
          ]
        }
      ],
      tools: [
        {
          type: 'file_search',
          vector_store_ids: vectorStoreIds,
          max_num_results: 15
        }
      ],
      tool_choice: 'auto',
      temperature: 0,
      max_output_tokens: 256
    };

    const data = await postOpenAiResponses(payload);
    const verifierRaw = extractTextFromOpenAiResponsesBody(data);
    const verdict = parseDivergenceVerifierJson(verifierRaw);

    if (verdict.parseError) {
      console.warn(
        'VeloBot Guardrail: resposta do verificador inválida — resposta mantida:',
        truncateForGuardrailDebug(verifierRaw, 120)
      );
      return { pass: true, tripwire: false, skipped: true };
    }

    if (verdict.diverges) {
      console.warn(
        'VeloBot Guardrail: divergência factual detectada:',
        verdict.reason || '(sem motivo)'
      );
      if (isVelohubAiDebug()) {
        console.warn(
          'VeloBot Guardrail [DEBUG]: resposta bloqueada (preview):',
          truncateForGuardrailDebug(text)
        );
      }
      return {
        pass: false,
        tripwire: true,
        failedStoreId: null,
        failedStoreLabel: 'factual_divergence',
        reasoning: verdict.reason
      };
    }

    return { pass: true, tripwire: false };
  } catch (err) {
    console.warn('VeloBot Guardrail: erro na verificacao — resposta mantida:', err.message);
    return { pass: true, tripwire: false, skipped: true, error: err.message };
  }
}

module.exports = {
  checkVelobotHallucinationGuardrail,
  splitVelobotResponseForGuardrail
};

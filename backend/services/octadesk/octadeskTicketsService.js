/**
 * Cliente API Octadesk — tickets (create, update, comentário interno).
 * VERSION: v1.6.0 | DATE: 2026-05-22 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.6.0: PUT /tickets/{number} — comments.internal (spec update); octa-agent-email; number no path (api001: sem decode /1000)
 * - v1.5.0: api001 — POST com form{id}, group{id}, customField[] (TicketDTO); idForm/customFields ignorados pela API
 * - v1.4.6: rótulo exibição N2 Pix/Bacen…; idForm RA/Procon fallback; description sem e-mail duplicado no lead
 * - v1.4.5: customFields[] aceito no POST mas sem vínculo ao form; mapa customField{} rejeitado («valid key»)
 * - v1.4.4: customField sem canal_de_origem no form RA/Procon (api001 rejeita key); origem na description
 * - v1.4.3: description interna — Descrição = motivoDetalhado (UI); Observações = observacoes
 * - v1.4.2: POST alinhado octa-api-example — idForm, idGroupAssigned, tags (env FONTE DA VERDADE)
 * - v1.4.1: customField alinhado octa-api-example — nome, Interno/Octadesk/Reclamação, Casos Especiais, 1º motivo
 * - v1.4.0: requester fixo atendimento@velotax.com; e-mail do cliente na description; customField mapa (octa-api-example)
 * - v1.3.4: listCustomFields — GET /custom-fields (keys válidas para POST /tickets)
 * - v1.3.3: Removida instrumentação agentDebugLog (localhost:7635)
 * - v1.3.2: POST exige requester.email — fallback email/responsavelEmail/OCTADESK_API_EMAIL (evita null input)
 * - v1.3.1: ticketRegistro = number bruto da API (ex. 100148861); decode /1000 estava incorreto (GET 100148 vazio)
 * - v1.3.0: api001 — description na raiz no POST; sem PUT pós-create (rota PUT inexistente nesta instância)
 * - v1.2.8: decodifica number composto (ticket*1000+canal) quando numberChannel ausente na resposta
 * - v1.2.7: normaliza número do ticket (remove sufixo numberChannel ex. 100148859→100148) para PUT
 * - v1.2.6: corrige ReferenceError bodyObj no log de falha PUT
 * - v1.2.5: PUT pós-create — comentários + status Resolvido (POST da instância ignora idCurrentStatus/comments)
 * - v1.2.4: sem customField no POST (slug cpf_do_titular rejeitado pela API); CPF no comentário interno
 * - v1.2.3: customField só cpf_do_titular; categoria via idSubject (categoria_de_assunto é campo de sistema)
 * - v1.2.2: customField como mapa (API legada Octadesk); sem status OpenAPI duplicado no POST
 * - v1.2.1: Comentário interno inclui descrição e observações da reclamação
 * - v1.2.0: Abertura mínima — customField[] (cpf_do_titular, categoria_de_assunto), comentário interno estruturado, status Resolvido no POST
 * - v1.1.0: create, PUT, comentário interno, markTicketResolved
 */

const fetch = require('node-fetch');
const config = require('../../config');
const { getApiRoot, getBearerToken, isOctadeskConfigured } = require('./octadeskAuth');

const OCTADESK_FIELD_CPF = 'cpf_do_titular';
const OCTADESK_FIELD_NOME = 'nome';
const OCTADESK_FIELD_CATEGORIA = 'categoria_de_assunto';
const OCTADESK_FIELD_MOTIVOS_CASOS = 'motivos_casos_especiais';
const OCTADESK_FIELD_CANAL_CONTATO = 'canal_de_contato';
const OCTADESK_FIELD_CANAL_ORIGEM = 'canal_de_origem';
const OCTADESK_FIELD_CLASSIFICACAO = 'classificacao';
const OCTADESK_CATEGORIA_ASSUNTO_VALOR = 'Casos Especiais';
const OCTADESK_CANAL_CONTATO_VALOR = 'Interno';
const OCTADESK_CANAL_ORIGEM_VALOR = 'Octadesk';
const OCTADESK_CLASSIFICACAO_VALOR = 'Reclamação';
const OCTADESK_REQUESTER_EMAIL_PADRAO = 'atendimento@velotax.com';
const OCTADESK_AGENT_EMAIL_PADRAO = 'atendimento@velotax.com';
const OCTADESK_CREATE_TAGS_PADRAO = ['velohub-reclamacao'];
/** Form RA/Procon/Ouvidoria (api001) — fallback se OCTADESK_ID_FORM vazio no processo */
const OCTADESK_DEFAULT_ID_FORM_OUVIDORIA = '33f703a1-0a58-454f-a856-550464e1037c';
/** Fila Casos Especiais — fallback se OCTADESK_GROUP_CASOS_ESPECIAIS_ID vazio */
const OCTADESK_DEFAULT_GROUP_CASOS_ESPECIAIS = '9d4372d5-5039-470e-a15e-053a0971ff28';

/** Rótulo de exibição do tipo (API → UI VeloHub), alinhado a ouvidoriaTierHierarchy / ListaReclamacoes */
const TIPO_API_LABEL_EXIBICAO = Object.freeze({
  OUVIDORIA: 'N2 Pix',
  BACEN: 'Bacen',
  RECLAME_AQUI: 'Reclame Aqui',
  PROCON: 'Procon',
  PROCESSOS: 'Ação Judicial',
  TIME_PORTABILIDADE: 'Time Portabilidade',
});

/**
 * @param {string} tipoApi — ex. OUVIDORIA, BACEN (query/API)
 * @returns {string}
 */
function resolveTipoLabelExibicaoOctadesk(tipoApi) {
  const raw = String(tipoApi || '').trim();
  if (!raw) return 'Ocorrência';
  const up = raw.toUpperCase().replace(/\s+/g, '_');
  if (TIPO_API_LABEL_EXIBICAO[up]) return TIPO_API_LABEL_EXIBICAO[up];
  if (up === 'N2' || up === 'N2_PIX' || up === 'N2&PIX') return 'N2 Pix';
  if (up === 'RECLAMEAQUI') return 'Reclame Aqui';
  if (up === 'ACAO_JUDICIAL' || up === 'JUDICIAL') return 'Ação Judicial';
  return raw;
}

/**
 * @param {string} [tipoApi]
 * @returns {string}
 */
function resolveOctadeskFormId(tipoApi) {
  const fromEnv =
    config.OCTADESK_ID_FORM != null ? String(config.OCTADESK_ID_FORM).trim() : '';
  if (fromEnv) return fromEnv;
  const t = String(tipoApi || '').toUpperCase();
  if (t === 'TIME_PORTABILIDADE' || t === 'TIME PORTABILIDADE') return '';
  return OCTADESK_DEFAULT_ID_FORM_OUVIDORIA;
}

/**
 * @returns {string}
 */
function resolveOctadeskGroupAssignedId() {
  const fromEnv =
    config.OCTADESK_GROUP_CASOS_ESPECIAIS_ID != null
      ? String(config.OCTADESK_GROUP_CASOS_ESPECIAIS_ID).trim()
      : '';
  return fromEnv || OCTADESK_DEFAULT_GROUP_CASOS_ESPECIAIS;
}

/**
 * Base da API de tickets (ex.: https://api.octadesk.services/tickets).
 * @returns {string}
 */
function getTicketsBaseUrl() {
  const root = getApiRoot();
  if (/\/tickets$/i.test(root)) return root;
  return `${root}/tickets`;
}

/**
 * Instância api001 não expõe PUT/PATCH em /tickets/{number} (evidência runtime 404).
 * @returns {boolean}
 */
function isOctadeskApi001Instance() {
  const root = getApiRoot();
  return /api001\.octadesk\.services/i.test(root);
}

/**
 * ID do status Resolvido (env obrigatório na abertura de ticket).
 * @returns {string|null}
 */
function getResolvedStatusId() {
  const id =
    config.OCTADESK_STATUS_RESOLVIDO_ID != null
      ? String(config.OCTADESK_STATUS_RESOLVIDO_ID).trim()
      : '';
  return id || null;
}

/**
 * @param {Response} res
 * @returns {Promise<unknown>}
 */
async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * numberChannel da resposta do create (ou env) — Octadesk concatena ao number na resposta.
 * @param {Record<string, unknown>} o
 * @returns {string}
 */
function readNumberChannelFromResponse(o) {
  const inner =
    typeof o.data === 'object' && o.data != null
      ? /** @type {Record<string, unknown>} */ (o.data)
      : o;
  const ch = inner.numberChannel;
  if (ch != null && String(ch).trim() !== '' && String(ch).trim() !== '0') {
    return String(ch).trim();
  }
  const envCh =
    config.OCTADESK_NUMBER_CHANNEL != null ? String(config.OCTADESK_NUMBER_CHANNEL).trim() : '';
  return envCh && envCh !== '0' ? envCh : '';
}

/**
 * API PUT usa o número exibido no painel; a resposta do POST pode vir com sufixo do canal.
 * @param {string|number} rawNum
 * @param {string} channelSuffix
 * @returns {string}
 */
function normalizeTicketNumberForApi(rawNum, channelSuffix) {
  const numStr = String(rawNum).trim();
  const ch = String(channelSuffix || '').trim();
  if (!numStr || !ch || numStr.length <= ch.length) return numStr;
  if (numStr.endsWith(ch)) return numStr.slice(0, -ch.length);
  return numStr;
}

/**
 * Normalização opcional para PUT em hosts legados (não usar ao gravar ticketRegistro).
 * api001: número válido é o `number` inteiro da resposta (GET /tickets/100148861 OK; GET /tickets/100148 vazio).
 * @param {string|number} rawNum
 * @param {string} channelSuffix
 * @returns {string}
 */
function decodeTicketNumberForApiPath(rawNum, channelSuffix) {
  const numStr = String(rawNum).trim();
  if (!numStr) return numStr;

  const stripped = normalizeTicketNumberForApi(numStr, channelSuffix);
  if (stripped !== numStr) return stripped;

  if (/^\d+$/.test(numStr) && numStr.length >= 9) {
    const n = Number(numStr);
    if (Number.isSafeInteger(n) && n >= 100000000) {
      const decoded = Math.floor(n / 1000);
      if (decoded > 0 && String(decoded).length >= 5) {
        return String(decoded);
      }
    }
  }

  return numStr;
}

/**
 * @param {unknown} data
 * @returns {string|null}
 */
function extractTicketNumber(data) {
  if (data == null || typeof data !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (data);
  const candidates = [
    o.number,
    o.ticketNumber,
    typeof o.data === 'object' && o.data ? o.data.number : null,
    typeof o.data === 'object' && o.data ? o.data.ticketNumber : null,
  ];
  let raw = null;
  for (const c of candidates) {
    if (c != null && String(c).trim() !== '') {
      raw = c;
      break;
    }
  }
  if (raw == null) return null;
  return String(raw).trim();
}

/**
 * E-mail do agente para header octa-agent-email (PUT/PATCH — spec Tickets/update).
 * @param {string} [override]
 * @returns {string}
 */
function resolveOctadeskAgentEmail(override) {
  const o = override != null ? String(override).trim() : '';
  if (o && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o)) return o;
  const env =
    config.OCTADESK_AGENT_EMAIL != null ? String(config.OCTADESK_AGENT_EMAIL).trim() : '';
  if (env && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env)) return env;
  const apiMail =
    config.OCTADESK_API_EMAIL != null ? String(config.OCTADESK_API_EMAIL).trim() : '';
  if (apiMail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(apiMail)) return apiMail;
  return OCTADESK_AGENT_EMAIL_PADRAO;
}

/**
 * Número do ticket para PUT /tickets/{number} (path — spec; body não localiza o ticket).
 * @param {string|number} rawNum
 * @returns {string}
 */
function resolveTicketNumberForPutApi(rawNum) {
  const numStr = String(rawNum != null ? rawNum : '').trim();
  if (!numStr) return '';
  const channel = readNumberChannelFromResponse({});
  const stripped = normalizeTicketNumberForApi(numStr, channel);
  if (isOctadeskApi001Instance()) {
    return stripped || numStr;
  }
  return decodeTicketNumberForApiPath(stripped, channel) || stripped || numStr;
}

/**
 * @param {string} method
 * @param {string} path — relativo à base tickets (ex. '' ou '/123' ou '/status')
 * @param {Record<string, unknown>|null} [body]
 * @param {{ agentEmail?: string, includeAgentHeader?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, status: number, data: unknown, error?: string, url?: string }>}
 */
async function octadeskRequest(method, path, body = null, opts = {}) {
  if (!isOctadeskConfigured()) {
    return { ok: false, status: 0, data: null, error: 'Octadesk não configurado' };
  }

  try {
    const apiKey = config.OCTADESK_API_TOKEN != null ? String(config.OCTADESK_API_TOKEN).trim() : '';
    const base = getTicketsBaseUrl();
    const url = `${base}${path.startsWith('/') ? path : path ? `/${path}` : ''}`;
    /** @type {Record<string, string>} */
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else {
      const token = await getBearerToken();
      headers.Authorization = `Bearer ${token}`;
    }
    const m = String(method || '').toUpperCase();
    const sendAgent =
      opts.includeAgentHeader !== false &&
      (m === 'PUT' || m === 'PATCH' || opts.includeAgentHeader === true);
    if (sendAgent) {
      headers['octa-agent-email'] = resolveOctadeskAgentEmail(opts.agentEmail);
    }
    const init = { method, headers };
    if (body != null && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      const errMsg =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        res.statusText ||
        `HTTP ${res.status}`;
      return {
        ok: false,
        status: res.status,
        data,
        error: String(errMsg),
        url,
      };
    }
    return { ok: true, status: res.status, data, url };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.warn('[Octadesk]', method, path, msg);
    return { ok: false, status: 0, data: null, error: msg };
  }
}

/**
 * GET /tickets/status — lista { id, name } (ver developers.octadesk.com/reference/getstatus).
 * @returns {Promise<{ ok: boolean, statuses?: Array<{ id: string, name: string }>, error?: string }>}
 */
async function listTicketStatuses() {
  const res = await octadeskRequest('GET', '/status');
  if (!res.ok) {
    return { ok: false, error: res.error || 'Falha ao listar status' };
  }
  const raw = res.data;
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray(/** @type {{ data?: unknown }} */ (raw).data)
      ? /** @type {{ data: unknown[] }} */ (raw).data
      : [];
  const statuses = list
    .map((item) => {
      if (item == null || typeof item !== 'object') return null;
      const o = /** @type {Record<string, unknown>} */ (item);
      const id = o.id != null ? String(o.id).trim() : '';
      const name = o.name != null ? String(o.name).trim() : '';
      if (!id) return null;
      return { id, name: name || id };
    })
    .filter(Boolean);
  return { ok: true, statuses };
}

/**
 * @param {unknown} item
 * @returns {string}
 */
function pickStr(item, ...keys) {
  if (item == null || typeof item !== 'object') return '';
  const o = /** @type {Record<string, unknown>} */ (item);
  for (const k of keys) {
    const v = o[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Normaliza item de GET /custom-fields ou field de GET /tickets/forms/{id}.
 * @param {unknown} item
 * @param {{ formId?: string, formName?: string }} [meta]
 * @returns {{ id: string, key: string, name: string, domainType: string, fieldType: string, enabled: string, formId?: string, formName?: string }|null}
 */
function normalizeCustomFieldRow(item, meta = {}) {
  if (item == null || typeof item !== 'object') return null;
  const id = pickStr(item, 'id', 'fieldId', '_id') || meta.formId || '';
  const key = pickStr(item, 'name', 'key', 'fieldKey', 'slug', 'code');
  const name = pickStr(item, 'description', 'label', 'title', 'displayName') || key;
  if (!id && !key) return null;
  const o = /** @type {Record<string, unknown>} */ (item);
  const enabledRaw = o.isEnabled != null ? o.isEnabled : o.enabled;
  const hasValuesList = Array.isArray(o.valuesList) && o.valuesList.length > 0;
  return {
    id: id || '—',
    key: key || '—',
    name: name || key || id,
    domainType: meta.formId ? 'ticket-form' : pickStr(item, 'domainType', 'systemType', 'entityType', 'domain'),
    fieldType: pickStr(item, 'fieldType', 'type') || (hasValuesList ? 'list' : 'text'),
    enabled: enabledRaw == null ? '—' : String(enabledRaw),
    formId: meta.formId,
    formName: meta.formName,
  };
}

/**
 * Extrai array de campos de resposta heterogênea da API.
 * @param {unknown} raw
 * @returns {unknown[]}
 */
function extractCustomFieldList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw == null || typeof raw !== 'object') return [];
  const o = /** @type {Record<string, unknown>} */ (raw);
  for (const k of ['data', 'items', 'results', 'customFields', 'fields']) {
    if (Array.isArray(o[k])) return o[k];
  }
  return [];
}

/**
 * Campos de um formulário de ticket (GET /tickets/forms/{id}).
 * @param {unknown} formData
 * @returns {Array<Record<string, string>>}
 */
function extractFieldsFromTicketForm(formData) {
  if (formData == null || typeof formData !== 'object') return [];
  const form = /** @type {Record<string, unknown>} */ (formData);
  const formId = pickStr(form, 'id');
  const formName = pickStr(form, 'name');
  const fields = Array.isArray(form.fields) ? form.fields : [];
  return fields
    .map((f) => normalizeCustomFieldRow(f, { formId, formName }))
    .filter(Boolean);
}

/**
 * Lista formulários de ticket (GET /tickets/forms).
 * @returns {Promise<{ ok: boolean, forms?: Array<{ id: string, name: string }>, error?: string }>}
 */
async function listTicketForms() {
  const res = await octadeskRequest('GET', '/forms');
  if (!res.ok) {
    return { ok: false, error: res.error || 'Falha ao listar formulários de ticket' };
  }
  const list = extractCustomFieldList(res.data);
  const forms = list
    .map((item) => {
      if (item == null || typeof item !== 'object') return null;
      const id = pickStr(item, 'id');
      const name = pickStr(item, 'name');
      if (!id) return null;
      return { id, name: name || id };
    })
    .filter(Boolean);
  return { ok: true, forms };
}

/**
 * Campos de um formulário via GET /tickets/forms/{id}.
 * @param {string} formId
 * @returns {Promise<{ ok: boolean, fields?: Array<Record<string, string>>, form?: { id: string, name: string }, error?: string }>}
 */
async function listCustomFieldsFromTicketForm(formId) {
  const fid = String(formId || '').trim();
  if (!fid) return { ok: false, error: 'formId vazio' };
  const res = await octadeskRequest('GET', `/forms/${encodeURIComponent(fid)}`);
  if (!res.ok) {
    return { ok: false, error: res.error || 'Falha ao obter formulário' };
  }
  const form = res.data && typeof res.data === 'object' ? /** @type {Record<string, unknown>} */ (res.data) : {};
  const fields = extractFieldsFromTicketForm(res.data);
  return {
    ok: true,
    fields,
    form: { id: pickStr(form, 'id') || fid, name: pickStr(form, 'name') || fid },
  };
}

/**
 * GET na raiz da API (não /tickets).
 * @param {string} method
 * @param {string} pathSegment — ex. /custom-fields
 * @returns {Promise<{ ok: boolean, status: number, data: unknown, error?: string, url?: string }>}
 */
async function octadeskPlatformRequest(method, pathSegment) {
  if (!isOctadeskConfigured()) {
    return { ok: false, status: 0, data: null, error: 'Octadesk não configurado' };
  }
  try {
    const apiKey = config.OCTADESK_API_TOKEN != null ? String(config.OCTADESK_API_TOKEN).trim() : '';
    const root = getApiRoot();
    const url = `${root}${pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`}`;
    /** @type {Record<string, string>} */
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else {
      headers.Authorization = `Bearer ${await getBearerToken()}`;
    }
    const res = await fetch(url, { method, headers });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      const errMsg =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        res.statusText ||
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, data, error: String(errMsg), url };
    }
    return { ok: true, status: res.status, data, url };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    return { ok: false, status: 0, data: null, error: msg };
  }
}

/**
 * Lista definições de custom fields:
 * 1) GET /custom-fields (plataforma genérica)
 * 2) GET /tickets/forms + /tickets/forms/{id} (api001 — campo `name` é a key no POST)
 * @param {{ domainType?: string, formId?: string, allForms?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, fields?: Array<Record<string, string>>, sourcePath?: string, form?: { id: string, name: string }, error?: string, tried?: string[] }>}
 */
async function listCustomFields(opts = {}) {
  const envFormId =
    opts.formId != null && String(opts.formId).trim()
      ? String(opts.formId).trim()
      : config.OCTADESK_ID_FORM != null
        ? String(config.OCTADESK_ID_FORM).trim()
        : '';

  if (envFormId) {
    const fromForm = await listCustomFieldsFromTicketForm(envFormId);
    if (fromForm.ok && fromForm.fields && fromForm.fields.length > 0) {
      return {
        ok: true,
        fields: fromForm.fields,
        sourcePath: `/tickets/forms/${envFormId}`,
        form: fromForm.form,
      };
    }
  }

  const formsRes = await listTicketForms();
  if (formsRes.ok && formsRes.forms && formsRes.forms.length > 0) {
    /** @type {Array<Record<string, string>>} */
    const merged = [];
    /** @type {{ id: string, name: string } | undefined} */
    let primaryForm;
    const toFetch = opts.allForms
      ? formsRes.forms
      : formsRes.forms.filter((f) => /bot|app|ouvidoria|casos|reclama|procon|ra\//i.test(f.name)).slice(0, 5);
    const list = toFetch.length > 0 ? toFetch : formsRes.forms.slice(0, 3);

    for (const f of list) {
      const detail = await listCustomFieldsFromTicketForm(f.id);
      if (!detail.ok || !detail.fields) continue;
      if (!primaryForm && detail.form) primaryForm = detail.form;
      for (const row of detail.fields) {
        if (!merged.some((m) => m.key === row.key && m.formId === row.formId)) {
          merged.push(row);
        }
      }
    }

    if (merged.length > 0) {
      return {
        ok: true,
        fields: merged,
        sourcePath: primaryForm
          ? `/tickets/forms/${primaryForm.id}`
          : '/tickets/forms',
        form: primaryForm,
      };
    }
  }

  const domain = String(opts.domainType || 'ticket').trim();
  const domainVariants = domain
    ? [domain, domain.toLowerCase(), domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase(), 'Ticket']
    : ['ticket'];
  const uniqueDomains = [...new Set(domainVariants.filter(Boolean))];

  /** @type {string[]} */
  const paths = ['/custom-fields', '/customfields'];
  for (const d of uniqueDomains) {
    paths.push(`/custom-fields/system-type/${encodeURIComponent(d)}`);
    paths.push(`/custom-fields/system-type/${encodeURIComponent(d)}?showEnabledItems=true`);
  }

  /** @type {string[]} */
  const tried = [];
  for (const p of paths) {
    tried.push(p);
    const res = await octadeskPlatformRequest('GET', p);
    if (!res.ok) continue;
    const list = extractCustomFieldList(res.data);
    const fields = list.map(normalizeCustomFieldRow).filter(Boolean);
    if (fields.length > 0) {
      return { ok: true, fields, sourcePath: p };
    }
  }

  const last = await octadeskPlatformRequest('GET', '/custom-fields');
  if (last.ok) {
    const fields = extractCustomFieldList(last.data)
      .map(normalizeCustomFieldRow)
      .filter(Boolean);
    if (fields.length > 0) {
      return { ok: true, fields, sourcePath: '/custom-fields' };
    }
  }

  return {
    ok: false,
    error: last.error || 'Nenhum custom field retornado (rotas testadas sem lista)',
    tried,
  };
}

/**
 * Lista de motivos da ocorrência (motivoReduzido[] ou item único; fallback motivoDetalhado).
 * @param {Record<string, unknown>} reclamacao
 * @returns {string[]}
 */
function resolveMotivosLista(reclamacao) {
  const arr = Array.isArray(reclamacao.motivoReduzido)
    ? reclamacao.motivoReduzido
    : reclamacao.motivoReduzido != null && String(reclamacao.motivoReduzido).trim()
      ? [String(reclamacao.motivoReduzido).trim()]
      : [];
  const fromArray = arr.map((m) => String(m || '').trim()).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  const det = String(reclamacao.motivoDetalhado || '').trim();
  return det ? [det] : [];
}

/**
 * Primeiro motivo — valor de motivos_casos_especiais no customField.
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function resolvePrimeiroMotivoCasosEspeciais(reclamacao) {
  const lista = resolveMotivosLista(reclamacao);
  return lista[0] || '—';
}

/**
 * Todos os motivos para description / comentário interno.
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function formatMotivoParaComentario(reclamacao) {
  const lista = resolveMotivosLista(reclamacao);
  if (lista.length === 0) return '—';
  if (lista.length === 1) return lista[0];
  const [primeiro, ...demais] = lista;
  return `Motivo (principal): ${primeiro}\nDemais motivos: ${demais.join('; ')}`;
}

/**
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function formatDataCreatedAt(reclamacao) {
  const raw = reclamacao.createdAt;
  if (raw == null) return '—';
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/**
 * @param {Record<string, unknown>} reclamacao
 * @param {string} tipoLabel
 * @returns {string}
 */
/**
 * Bloco «rótulo + texto» para comentário interno (suporta conteúdo multilinha).
 * @param {string} label
 * @param {unknown} value
 * @returns {string}
 */
function formatBlocoComentarioInterno(label, value) {
  const t = String(value ?? '').trim();
  if (!t) return `${label}: —`;
  if (!t.includes('\n')) return `${label}: ${t}`;
  return `${label}:\n${t}`;
}

/**
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function formatCpfParaComentario(reclamacao) {
  const cpf = String(reclamacao.cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11) return '—';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * E-mail válido para requester Octadesk (obrigatório no POST api001).
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidEmailForOctadesk(value) {
  const email = String(value ?? '').trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(email);
}

/**
 * E-mail do cliente na reclamação (vai na description, não no requester).
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function formatEmailClienteParaComentario(reclamacao) {
  const email = String(reclamacao.email || '').trim();
  return email || '—';
}

/**
 * Solicitante do ticket — e-mail fixo da operação; nome = cliente na reclamação.
 * @param {Record<string, unknown>} reclamacao
 * @returns {{ email: string, name: string }|null}
 */
function resolveRequesterForCreate(reclamacao) {
  const name = String(reclamacao.nome || reclamacao.nomeCliente || '').trim();
  const envEmail =
    config.OCTADESK_REQUESTER_EMAIL != null
      ? String(config.OCTADESK_REQUESTER_EMAIL).trim()
      : '';
  const email = isValidEmailForOctadesk(envEmail)
    ? envEmail
    : OCTADESK_REQUESTER_EMAIL_PADRAO;
  if (!isValidEmailForOctadesk(email)) return null;
  return { email, name: name || 'Cliente' };
}

/**
 * @returns {boolean}
 */
function isCustomFieldsOnCreateEnabled() {
  const v = process.env.OCTADESK_INCLUDE_CUSTOM_FIELD_ON_CREATE;
  if (v == null || String(v).trim() === '') return true;
  const s = String(v).trim().toLowerCase();
  return s !== 'false' && s !== '0' && s !== 'no';
}

/**
 * Tags no POST /tickets (octa-api-example). OCTADESK_CREATE_TAGS = tag1,tag2
 * @returns {string[]}
 */
function resolveCreateTags() {
  const raw =
    config.OCTADESK_CREATE_TAGS != null ? String(config.OCTADESK_CREATE_TAGS).trim() : '';
  if (!raw) return [...OCTADESK_CREATE_TAGS_PADRAO];
  const list = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return list.length ? list : [...OCTADESK_CREATE_TAGS_PADRAO];
}

/**
 * Texto do campo «Descrição» no formulário Ouvidoria (= motivoDetalhado no MongoDB).
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function resolveTextoDescricaoOuvidoria(reclamacao) {
  const detalhado = String(reclamacao.motivoDetalhado ?? '').trim();
  if (detalhado) return detalhado;
  const legado = String(reclamacao.descricao ?? '').trim();
  return legado;
}

/**
 * Texto do campo «Observações» no formulário Ouvidoria.
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function resolveTextoObservacoesOuvidoria(reclamacao) {
  return String(reclamacao.observacoes ?? '').trim();
}

function buildInternalCommentContent(reclamacao, tipoLabel) {
  const protocolo = String(reclamacao.numeroProtocolo || '').trim() || '—';
  const tipoApi = String(tipoLabel || reclamacao.tipo || '').trim();
  const tipo = resolveTipoLabelExibicaoOctadesk(tipoApi) || '—';
  const responsavel = String(reclamacao.responsavel || '').trim() || '—';
  const cpf = formatCpfParaComentario(reclamacao);
  const motivo = formatMotivoParaComentario(reclamacao);
  const data = formatDataCreatedAt(reclamacao);
  const emailCliente = formatEmailClienteParaComentario(reclamacao);
  const textoDescricao = resolveTextoDescricaoOuvidoria(reclamacao);
  const textoObservacoes = resolveTextoObservacoesOuvidoria(reclamacao);
  return [
    `Protocolo: ${protocolo}`,
    `Tipo: ${tipo}`,
    `CPF: ${cpf}`,
    `E-mail do cliente: ${emailCliente}`,
    `Canal de origem: ${OCTADESK_CANAL_ORIGEM_VALOR}`,
    `Responsável: ${responsavel}`,
    `Motivo: ${motivo}`,
    `Data: ${data}`,
    formatBlocoComentarioInterno('Descrição', textoDescricao),
    formatBlocoComentarioInterno('Observações', textoObservacoes),
  ].join('\n');
}

/**
 * Mapa customField no POST (formato api001 / octa-api-example.json).
 * @param {Record<string, unknown>} reclamacao
 * @param {string} tipoLabel
 * @returns {Record<string, string>|undefined}
 */
function buildCustomFieldsMapForOpen(reclamacao) {
  if (!isCustomFieldsOnCreateEnabled()) return undefined;

  const cpf = String(reclamacao.cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11) return undefined;

  const cpfKey =
    config.OCTADESK_CUSTOM_FIELD_CPF_KEY != null
      ? String(config.OCTADESK_CUSTOM_FIELD_CPF_KEY).trim()
      : OCTADESK_FIELD_CPF;

  const nome = String(reclamacao.nome || reclamacao.nomeCliente || '').trim() || '—';
  let motivoPrincipal = resolvePrimeiroMotivoCasosEspeciais(reclamacao);
  if (motivoPrincipal.length > 500) {
    motivoPrincipal = `${motivoPrincipal.slice(0, 497)}...`;
  }

  /** Chaves válidas em GET /tickets/forms/33f703a1 (RA/Procon/Ouvidoria) — api001 rejeita keys fora do form. */
  /** @type {Record<string, string>} */
  const map = {
    [cpfKey || OCTADESK_FIELD_CPF]: cpf,
    [OCTADESK_FIELD_NOME]: nome,
    [OCTADESK_FIELD_CANAL_CONTATO]: OCTADESK_CANAL_CONTATO_VALOR,
    [OCTADESK_FIELD_CLASSIFICACAO]: OCTADESK_CLASSIFICACAO_VALOR,
    [OCTADESK_FIELD_CATEGORIA]: OCTADESK_CATEGORIA_ASSUNTO_VALOR,
    [OCTADESK_FIELD_MOTIVOS_CASOS]: motivoPrincipal,
  };

  const canalOrigemKey =
    config.OCTADESK_CUSTOM_FIELD_CANAL_ORIGEM_KEY != null
      ? String(config.OCTADESK_CUSTOM_FIELD_CANAL_ORIGEM_KEY).trim()
      : '';
  if (canalOrigemKey) {
    map[canalOrigemKey] = OCTADESK_CANAL_ORIGEM_VALOR;
  }

  return map;
}

/**
 * @param {Record<string, unknown>} reclamacao
 * @param {string} [tipoLabel]
 * @returns {Array<{ key: string, value: string }>|undefined}
 */
function buildCustomFieldsForOpen(reclamacao, tipoLabel = '') {
  const map = buildCustomFieldsMapForOpen(reclamacao);
  if (!map || Object.keys(map).length === 0) return undefined;
  return Object.entries(map).map(([key, value]) => ({ key, value: String(value) }));
}

/**
 * Monta payload de criação de ticket de reclamação VeloHub (abertura mínima).
 * @param {Record<string, unknown>} reclamacao
 * @param {string} tipoLabel
 * @returns {Record<string, unknown>}
 */
function buildCreateTicketFromReclamacao(reclamacao, tipoLabel) {
  const statusId = getResolvedStatusId();
  if (!statusId) {
    throw new Error(
      'OCTADESK_STATUS_RESOLVIDO_ID não configurado. Obtenha o id via GET /tickets/status e defina no .env.'
    );
  }

  const requester = resolveRequesterForCreate(reclamacao);
  if (!requester) {
    throw new Error(
      'Octadesk exige requester válido. Configure OCTADESK_REQUESTER_EMAIL ou use o padrão atendimento@velotax.com.'
    );
  }

  const protocolo = String(reclamacao.numeroProtocolo || '').trim();
  const tipoApi = String(tipoLabel || reclamacao.tipo || '').trim();
  const tipoExibicao = resolveTipoLabelExibicaoOctadesk(tipoApi);
  const descricaoPublica = `Reclamação registrada junto ao time competente. Protocolo da reclamação ${protocolo || '—'}`;
  const internalContent = buildInternalCommentContent(reclamacao, tipoLabel);
  const descriptionText = [descricaoPublica, '', internalContent].join('\n');
  const customFieldItems = buildCustomFieldsForOpen(reclamacao);

  /** @type {Record<string, unknown>} */
  const payload = {
    summary: `Registro de Reclamação: ${tipoExibicao}`,
    description: descriptionText,
    requester,
    idCurrentStatus: statusId,
  };

  const formId = resolveOctadeskFormId(tipoApi);
  if (formId) {
    payload.form = { id: formId };
  }

  const groupId = resolveOctadeskGroupAssignedId();
  if (groupId) {
    payload.group = { id: groupId };
  }

  if (Array.isArray(customFieldItems) && customFieldItems.length > 0) {
    payload.customField = customFieldItems;
  }

  const tags = resolveCreateTags();
  if (tags.length > 0) {
    payload.tags = tags;
  }

  const subjectId =
    config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID != null
      ? String(config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID).trim()
      : '';
  if (subjectId) {
    payload.idSubject = subjectId;
  }

  if (config.OCTADESK_NUMBER_CHANNEL != null && String(config.OCTADESK_NUMBER_CHANNEL).trim() !== '') {
    const ch = Number(config.OCTADESK_NUMBER_CHANNEL);
    if (Number.isFinite(ch)) {
      payload.numberChannel = ch;
    }
  }

  return payload;
}

/**
 * @param {Record<string, unknown>} createBody
 * @returns {Promise<{ ok: boolean, ticketNumber?: string|number, error?: string }>}
 */
async function createTicket(createBody) {
  if (!getResolvedStatusId()) {
    return {
      ok: false,
      error:
        'OCTADESK_STATUS_RESOLVIDO_ID não configurado. Obtenha o id via GET /tickets/status e defina no .env.',
    };
  }
  const res = await octadeskRequest('POST', '', createBody);
  if (!res.ok) {
    return { ok: false, error: res.error || 'Falha ao criar ticket Octadesk' };
  }
  const num = extractTicketNumber(res.data);
  if (num == null) {
    return { ok: false, error: 'Ticket criado sem número na resposta Octadesk' };
  }
  return { ok: true, ticketNumber: num };
}

/**
 * Pós-create: api001 não tem PUT /tickets/{number}; conteúdo vai no POST (description na raiz).
 * @param {string|number} ticketNumber
 * @param {Record<string, unknown>} reclamacao
 * @param {string} tipoLabel
 * @returns {Promise<{ ok: boolean, error?: string, skipped?: boolean }>}
 */
async function finalizeReclamacaoTicketAfterCreate(ticketNumber, reclamacao, tipoLabel) {
  if (isOctadeskApi001Instance()) {
    return { ok: true, skipped: true };
  }

  const statusId = getResolvedStatusId();
  if (!statusId) {
    return { ok: false, error: 'OCTADESK_STATUS_RESOLVIDO_ID não configurado' };
  }

  const protocolo = String(reclamacao.numeroProtocolo || '').trim();
  const descricaoPublica = `Reclamação registrada junto ao time competente. Protocolo da reclamação ${protocolo || '—'}`;
  const internalContent = buildInternalCommentContent(reclamacao, tipoLabel);

  /** @type {Record<string, unknown>} */
  const partial = {
    idCurrentStatus: statusId,
    description: [descricaoPublica, '', internalContent].join('\n'),
  };

  const subjectId =
    config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID != null
      ? String(config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID).trim()
      : '';
  if (subjectId) {
    partial.idSubject = subjectId;
  }

  const num = String(ticketNumber).trim();

  const res = await updateTicket(num, partial);
  return res;
}

/**
 * @param {string|number} ticketNumber
 * @param {Record<string, unknown>} partial
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
/**
 * PUT /tickets/{number} — atualização parcial (spec Tickets/update).
 * @param {string|number} ticketNumber
 * @param {Record<string, unknown>} partial
 * @param {{ agentEmail?: string }} [opts]
 * @returns {Promise<{ ok: boolean, error?: string, status?: number, ticketNumber?: string }>}
 */
async function updateTicket(ticketNumber, partial, opts = {}) {
  const num = resolveTicketNumberForPutApi(ticketNumber);
  if (!num) return { ok: false, error: 'Número de ticket inválido' };
  const res = await octadeskRequest('PUT', `/${encodeURIComponent(num)}`, partial, {
    agentEmail: opts.agentEmail,
    includeAgentHeader: true,
  });
  if (!res.ok) {
    return { ok: false, error: res.error, status: res.status, ticketNumber: num };
  }
  return { ok: true, ticketNumber: num };
}

/**
 * Comentário interno em ticket existente (Requisições / Erros-Bugs).
 * Path: PUT /tickets/{number}. Body: apenas comments.internal (number não vai no body).
 * @param {string|number} ticketNumber
 * @param {string} text
 * @param {{ agentEmail?: string }} [opts]
 * @returns {Promise<{ ok: boolean, error?: string, status?: number, ticketNumber?: string }>}
 */
async function addInternalComment(ticketNumber, text, opts = {}) {
  const content = String(text || '').trim();
  if (!content) return { ok: false, error: 'Comentário vazio' };
  return updateTicket(
    ticketNumber,
    {
      comments: {
        internal: {
          content,
        },
      },
    },
    opts
  );
}

/**
 * Marca ticket como resolvido no Octadesk.
 * @param {string|number} ticketNumber
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function markTicketResolved(ticketNumber) {
  const statusId = getResolvedStatusId();
  if (!statusId) {
    return { ok: false, error: 'OCTADESK_STATUS_RESOLVIDO_ID não configurado' };
  }
  return updateTicket(ticketNumber, { idCurrentStatus: statusId });
}

/**
 * Fire-and-forget: não propaga erro ao caller HTTP do VeloHub.
 * @param {() => Promise<{ ok: boolean, error?: string }>>} fn
 * @param {string} label
 */
function octadeskSyncFireAndForget(fn, label) {
  if (!isOctadeskConfigured()) return;
  Promise.resolve()
    .then(fn)
    .then((r) => {
      if (r && !r.ok) {
        const extra =
          r.ticketNumber != null
            ? ` ticket=${r.ticketNumber}`
            : r.status != null
              ? ` HTTP ${r.status}`
              : '';
        console.warn(`[Octadesk] ${label}:`, r.error || 'falha', extra);
      }
    })
    .catch((err) => {
      console.warn(`[Octadesk] ${label}:`, err?.message || err);
    });
}

module.exports = {
  isOctadeskConfigured,
  getTicketsBaseUrl,
  getResolvedStatusId,
  listTicketStatuses,
  listTicketForms,
  listCustomFieldsFromTicketForm,
  listCustomFields,
  buildCreateTicketFromReclamacao,
  buildInternalCommentContent,
  buildCustomFieldsForOpen,
  buildCustomFieldsMapForOpen,
  resolveRequesterForCreate,
  createTicket,
  finalizeReclamacaoTicketAfterCreate,
  updateTicket,
  addInternalComment,
  markTicketResolved,
  octadeskSyncFireAndForget,
  extractTicketNumber,
  resolveTicketNumberForPutApi,
  resolveOctadeskAgentEmail,
};

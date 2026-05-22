/**
 * Cliente API Octadesk — tickets (create, update, comentário interno).
 * VERSION: v1.3.3 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
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
const OCTADESK_FIELD_CATEGORIA = 'categoria_de_assunto';
const OCTADESK_CATEGORIA_ASSUNTO_VALOR = 'casos especiais';

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
 * @param {string} method
 * @param {string} path — relativo à base tickets (ex. '' ou '/123' ou '/status')
 * @param {Record<string, unknown>|null} [body]
 * @returns {Promise<{ ok: boolean, status: number, data: unknown, error?: string }>}
 */
async function octadeskRequest(method, path, body = null) {
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
      };
    }
    return { ok: true, status: res.status, data };
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
 * @param {Record<string, unknown>} reclamacao
 * @returns {string}
 */
function formatMotivoParaComentario(reclamacao) {
  const arr = Array.isArray(reclamacao.motivoReduzido)
    ? reclamacao.motivoReduzido
    : reclamacao.motivoReduzido != null && String(reclamacao.motivoReduzido).trim()
      ? [String(reclamacao.motivoReduzido).trim()]
      : [];
  const joined = arr
    .map((m) => String(m || '').trim())
    .filter(Boolean)
    .join('; ');
  if (joined) return joined;
  const det = String(reclamacao.motivoDetalhado || '').trim();
  return det || '—';
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
 * Solicitante do ticket — API retorna 400 «Value cannot be null» sem requester.email.
 * @param {Record<string, unknown>} reclamacao
 * @returns {{ email: string, name?: string }|null}
 */
function resolveRequesterForCreate(reclamacao) {
  const name = String(
    reclamacao.nome || reclamacao.nomeCliente || reclamacao.responsavel || ''
  ).trim();

  const candidates = [
    reclamacao.email,
    reclamacao.responsavelEmail,
    config.OCTADESK_API_EMAIL,
  ];
  for (const raw of candidates) {
    if (!isValidEmailForOctadesk(raw)) continue;
    const email = String(raw).trim();
    return name ? { email, name } : { email };
  }

  const protocolo = String(reclamacao.numeroProtocolo || '').trim();
  const cpf = String(reclamacao.cpf || '').replace(/\D/g, '');
  const suffix = (protocolo || (cpf.length === 11 ? cpf : ''))
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .slice(0, 48);
  if (suffix) {
    const email = `ouvidoria+${suffix}@velotax.com.br`;
    return name ? { email, name } : { email };
  }

  return null;
}

function buildInternalCommentContent(reclamacao, tipoLabel) {
  const protocolo = String(reclamacao.numeroProtocolo || '').trim() || '—';
  const tipo = String(tipoLabel || reclamacao.tipo || '').trim() || '—';
  const responsavel = String(reclamacao.responsavel || '').trim() || '—';
  const cpf = formatCpfParaComentario(reclamacao);
  const motivo = formatMotivoParaComentario(reclamacao);
  const data = formatDataCreatedAt(reclamacao);
  return [
    `Protocolo: ${protocolo}`,
    `Tipo: ${tipo}`,
    `CPF: ${cpf}`,
    `Responsável: ${responsavel}`,
    `Motivo: ${motivo}`,
    `Data: ${data}`,
    formatBlocoComentarioInterno('Descrição', reclamacao.descricao),
    formatBlocoComentarioInterno('Observações', reclamacao.observacoes),
  ].join('\n');
}

/**
 * Campos personalizados no POST — desativado até chave válida na instância Octadesk.
 * Slug cpf_do_titular retorna 400 «valid key»; CPF vai no comentário interno (v1.2.4).
 * Reativar com OCTADESK_INCLUDE_CUSTOM_FIELD_ON_CREATE=true e OCTADESK_CUSTOM_FIELD_CPF_KEY correto.
 * @param {Record<string, unknown>} reclamacao
 * @returns {Array<{ key: string, value: string }>|undefined}
 */
function buildCustomFieldsForOpen(reclamacao) {
  const enabled =
    process.env.OCTADESK_INCLUDE_CUSTOM_FIELD_ON_CREATE != null &&
    String(process.env.OCTADESK_INCLUDE_CUSTOM_FIELD_ON_CREATE).trim() === 'true';
  if (!enabled) return undefined;

  const cpf = String(reclamacao.cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11) return undefined;

  const key =
    config.OCTADESK_CUSTOM_FIELD_CPF_KEY != null
      ? String(config.OCTADESK_CUSTOM_FIELD_CPF_KEY).trim()
      : OCTADESK_FIELD_CPF;
  if (!key) return undefined;

  return [{ key, value: cpf }];
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
      'Octadesk exige e-mail do solicitante. Preencha o e-mail na reclamação ou configure OCTADESK_API_EMAIL no ambiente.'
    );
  }

  const protocolo = String(reclamacao.numeroProtocolo || '').trim();
  const tipo = String(tipoLabel || reclamacao.tipo || '').trim();
  const descricaoPublica = `Reclamação registrada junto ao time competente. Protocolo da reclamação ${protocolo || '—'}`;
  const internalContent = buildInternalCommentContent(reclamacao, tipoLabel);
  const descriptionText = [descricaoPublica, '', internalContent].join('\n');
  const customFields = buildCustomFieldsForOpen(reclamacao);

  /** @type {Record<string, unknown>} */
  const payload = {
    summary: `Registro de Reclamação: ${tipo || 'Ocorrência'}`,
    description: descriptionText,
    requester,
    idCurrentStatus: statusId,
  };

  if (Array.isArray(customFields) && customFields.length > 0) {
    payload.customField = customFields;
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
  if (config.OCTADESK_ID_FORM != null && String(config.OCTADESK_ID_FORM).trim() !== '') {
    payload.idForm = String(config.OCTADESK_ID_FORM).trim();
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
async function updateTicket(ticketNumber, partial) {
  const num = String(ticketNumber).trim();
  if (!num) return { ok: false, error: 'Número de ticket inválido' };
  const res = await octadeskRequest('PUT', `/${encodeURIComponent(num)}`, partial);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

/**
 * @param {string|number} ticketNumber
 * @param {string} text
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function addInternalComment(ticketNumber, text) {
  const content = String(text || '').trim();
  if (!content) return { ok: false, error: 'Comentário vazio' };
  return updateTicket(ticketNumber, {
    comments: {
      internal: {
        content,
      },
    },
  });
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
        console.warn(`[Octadesk] ${label}:`, r.error || 'falha');
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
  buildCreateTicketFromReclamacao,
  buildInternalCommentContent,
  buildCustomFieldsForOpen,
  createTicket,
  finalizeReclamacaoTicketAfterCreate,
  updateTicket,
  addInternalComment,
  markTicketResolved,
  octadeskSyncFireAndForget,
  extractTicketNumber,
};

/**
 * Descoberta de IDs Octadesk — forms, subjects, groups, status (roteamento POST /tickets).
 * VERSION: v1.0.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * Uso:
 *   node backend/scripts/list-octadesk-routing.js
 *   node backend/scripts/list-octadesk-routing.js --json
 *
 * Docs: https://api-docs.octadesk.services/docs/#/Forms/get_
 *       https://api-docs.octadesk.services/docs/#/groups/getAll
 *       https://api-docs.octadesk.services/docs/#/Subjects/get_
 */
'use strict';

const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

(function loadVelohubFonteEnv(here) {
  let d = here;
  for (let i = 0; i < 16; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(path.join(__dirname, '..'));

const config = require('../config');
const { getApiRoot, getBearerToken, isOctadeskConfigured } = require('../services/octadesk/octadeskAuth');
const {
  getTicketsBaseUrl,
  listTicketForms,
  listTicketStatuses,
} = require('../services/octadesk/octadeskTicketsService');

/**
 * @param {unknown} raw
 * @returns {unknown[]}
 */
function extractList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw == null || typeof raw !== 'object') return [];
  const o = /** @type {Record<string, unknown>} */ (raw);
  for (const k of ['data', 'items', 'results', 'groups', 'subjects', 'forms']) {
    if (Array.isArray(o[k])) return o[k];
  }
  return [];
}

/**
 * @param {unknown} item
 * @returns {{ id: string, name: string, isEnabled: string }|null}
 */
function normalizeRow(item) {
  if (item == null || typeof item !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (item);
  const id = o.id != null ? String(o.id).trim() : '';
  const name = o.name != null ? String(o.name).trim() : '';
  if (!id) return null;
  const enabledRaw = o.isEnabled != null ? o.isEnabled : o.enabled;
  return {
    id,
    name: name || id,
    isEnabled: enabledRaw == null ? '—' : String(enabledRaw),
  };
}

/**
 * @param {string} method
 * @param {string} url
 * @returns {Promise<{ ok: boolean, status: number, data: unknown, error?: string }>}
 */
async function httpJson(method, url) {
  const apiKey = config.OCTADESK_API_TOKEN != null ? String(config.OCTADESK_API_TOKEN).trim() : '';
  /** @type {Record<string, string>} */
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  } else {
    headers.Authorization = `Bearer ${await getBearerToken()}`;
  }
  const res = await fetch(url, { method, headers });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 500) };
    }
  }
  if (!res.ok) {
    const errMsg =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;
    return { ok: false, status: res.status, data, error: String(errMsg) };
  }
  return { ok: true, status: res.status, data };
}

/**
 * GET relativo à raiz da API (forms, groups, subjects).
 * @param {string} pathSegment
 */
async function platformGet(pathSegment) {
  const root = getApiRoot();
  const url = `${root}${pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`}`;
  return httpJson('GET', url);
}

/**
 * GET na base /tickets (ex. /tickets/groups se existir).
 * @param {string} pathAfterTickets
 */
async function ticketsGet(pathAfterTickets) {
  const base = getTicketsBaseUrl();
  const seg = pathAfterTickets.startsWith('/') ? pathAfterTickets : `/${pathAfterTickets}`;
  return httpJson('GET', `${base}${seg}`);
}

/**
 * @param {string} title
 * @param {Array<{ id: string, name: string, isEnabled: string }>} rows
 */
function printTable(title, rows) {
  console.log(`\n=== ${title} ===`);
  if (!rows.length) {
    console.log('(nenhum item)');
    return;
  }
  console.log('id\tname\tisEnabled');
  for (const r of rows) {
    console.log(`${r.id}\t${r.name}\t${r.isEnabled}`);
  }
}

/**
 * @param {string} label
 * @param {string[]} paths
 */
async function probePaths(label, fetcher, paths) {
  /** @type {Array<{ path: string, rows: Array<{ id: string, name: string, isEnabled: string }> }>} */
  const hits = [];
  /** @type {Array<{ path: string, status: number, error: string }>} */
  const misses = [];

  for (const p of paths) {
    const res = await fetcher(p);
    if (!res.ok) {
      misses.push({ path: p, status: res.status, error: res.error || 'falha' });
      continue;
    }
    const rows = extractList(res.data).map(normalizeRow).filter(Boolean);
    if (rows.length > 0) {
      hits.push({ path: p, rows });
    } else {
      misses.push({ path: p, status: res.status, error: '200 sem lista' });
    }
  }

  console.log(`\n--- ${label} ---`);
  if (hits.length === 0) {
    console.log('Nenhuma rota retornou lista utilizável.');
    for (const m of misses) {
      console.log(`  GET ${m.path} → ${m.status} ${m.error}`);
    }
    return hits;
  }
  for (const h of hits) {
    printTable(`${label} (${h.path})`, h.rows);
  }
  if (misses.length) {
    console.log('Rotas sem lista (referência):');
    for (const m of misses) {
      console.log(`  GET ${m.path} → ${m.status} ${m.error}`);
    }
  }
  return hits;
}

/**
 * @param {string} id
 * @param {Array<{ id: string, name: string }>} rows
 */
function findNameById(id, rows) {
  const want = String(id || '').trim().toLowerCase();
  if (!want) return null;
  const hit = rows.find((r) => r.id.toLowerCase() === want);
  return hit ? hit.name : null;
}

async function main() {
  if (!isOctadeskConfigured()) {
    console.error('Octadesk não configurado (OCTADESK_API_TOKEN ou OCTADESK_API_EMAIL + senha).');
    process.exit(1);
  }

  const asJson = process.argv.includes('--json');
  const envForm = config.OCTADESK_ID_FORM ? String(config.OCTADESK_ID_FORM).trim() : '';
  const envSubject = config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID
    ? String(config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID).trim()
    : '';
  const envGroup = config.OCTADESK_GROUP_CASOS_ESPECIAIS_ID
    ? String(config.OCTADESK_GROUP_CASOS_ESPECIAIS_ID).trim()
    : '';
  const envStatusRes = config.OCTADESK_STATUS_RESOLVIDO_ID
    ? String(config.OCTADESK_STATUS_RESOLVIDO_ID).trim()
    : '';
  const envStatusAnd = config.OCTADESK_STATUS_EM_ANDAMENTO_ID
    ? String(config.OCTADESK_STATUS_EM_ANDAMENTO_ID).trim()
    : '';
  const exampleForm = '33f703a1-0a58-454f-a856-550464e1037c';

  console.log('Descoberta Octadesk — roteamento');
  console.log('API base (config):', config.OCTADESK_API_BASE_URL || 'https://api.octadesk.services');
  console.log('Tickets base:', getTicketsBaseUrl());
  console.log('\n--- .env atual (VeloHub) ---');
  console.log('OCTADESK_ID_FORM=', envForm || '(vazio)');
  console.log('OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID=', envSubject || '(vazio)');
  console.log('OCTADESK_GROUP_CASOS_ESPECIAIS_ID=', envGroup || '(vazio)');
  console.log('OCTADESK_STATUS_RESOLVIDO_ID=', envStatusRes || '(vazio)');
  console.log('OCTADESK_STATUS_EM_ANDAMENTO_ID=', envStatusAnd || '(vazio)');
  console.log('octa-api-example idForm=', exampleForm);

  const statusRes = await listTicketStatuses();
  if (statusRes.ok && statusRes.statuses) {
    printTable('Status de ticket (GET /tickets/status)', statusRes.statuses.map((s) => ({
      id: s.id,
      name: s.name,
      isEnabled: '—',
    })));
    const resolvido = statusRes.statuses.find((s) => /resolv/i.test(s.name));
    const andamento = statusRes.statuses.find((s) => /andamento|aberto|open|progress/i.test(s.name));
    if (resolvido) console.log('\nSugestão OCTADESK_STATUS_RESOLVIDO_ID=' + resolvido.id);
    if (andamento) console.log('Sugestão OCTADESK_STATUS_EM_ANDAMENTO_ID=' + andamento.id);
  } else {
    console.error('\nStatus tickets:', statusRes.error || 'falha');
  }

  const ticketFormsRes = await listTicketForms();
  /** @type {Array<{ id: string, name: string, isEnabled: string }>} */
  let allTicketForms = [];
  if (ticketFormsRes.ok && ticketFormsRes.forms) {
    allTicketForms = ticketFormsRes.forms.map((f) => ({
      id: f.id,
      name: f.name,
      isEnabled: '—',
    }));
    printTable('Formulários de ticket (GET /tickets/forms)', allTicketForms);
  } else {
    console.error('\nFormulários ticket:', ticketFormsRes.error || 'falha');
  }

  const platformFormHits = await probePaths('Formulários plataforma', platformGet, [
    '/forms',
    '/forms?showEnabledItems=true',
  ]);

  const groupHits = await probePaths('Grupos', platformGet, [
    '/groups',
    '/groups/all',
    '/groups?showEnabledItems=true',
  ]);

  const subjectHits = await probePaths('Assuntos (Subjects)', platformGet, [
    '/subjects',
    '/subjects?showEnabledItems=true',
  ]);

  const subjectTicketHits = await probePaths('Assuntos (tickets API)', ticketsGet, [
    '/subjects',
    '/subject',
    '/categories',
    '/category',
  ]);

  const groupTicketHits = await probePaths('Grupos (tickets API)', ticketsGet, ['/groups', '/group']);

  /** @type {Array<{ id: string, name: string }>} */
  const flatForms = [
    ...allTicketForms,
    ...platformFormHits.flatMap((h) => h.rows),
  ];
  /** @type {Array<{ id: string, name: string }>} */
  const flatGroups = [
    ...groupHits.flatMap((h) => h.rows),
    ...groupTicketHits.flatMap((h) => h.rows),
  ];
  /** @type {Array<{ id: string, name: string }>} */
  const flatSubjects = [
    ...subjectHits.flatMap((h) => h.rows),
    ...subjectTicketHits.flatMap((h) => h.rows),
  ];

  const lookupIds = [envForm, exampleForm].filter(Boolean);
  console.log('\n=== Resolução de nomes para IDs conhecidos ===');
  for (const fid of lookupIds) {
    const name = findNameById(fid, flatForms);
    console.log(
      `idForm ${fid} → ${name ? `"${name}"` : '(não encontrado nas listas desta execução)'}`
    );
  }
  if (envSubject) {
    const n = findNameById(envSubject, flatSubjects);
    console.log(`idSubject ${envSubject} → ${n ? `"${n}"` : '(não encontrado)'}`);
  }
  if (envGroup) {
    const n = findNameById(envGroup, flatGroups);
    console.log(`idGroup ${envGroup} → ${n ? `"${n}"` : '(não encontrado)'}`);
  }

  const casosForm = flatForms.filter((f) => /casos|especial|ouvidoria|reclama|bot/i.test(f.name));
  const casosSubject = flatSubjects.filter((s) => /casos|especial|ouvidoria|reclama/i.test(s.name));
  const casosGroup = flatGroups.filter((g) => /casos|especial|ouvidoria|reclama|atendimento/i.test(g.name));

  console.log('\n=== Sugestões por nome (heurística Casos Especiais / Ouvidoria) ===');
  for (const f of casosForm.slice(0, 5)) {
    console.log(`OCTADESK_ID_FORM=${f.id}  # ${f.name}`);
  }
  for (const s of casosSubject.slice(0, 5)) {
    console.log(`OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID=${s.id}  # ${s.name}`);
  }
  for (const g of casosGroup.slice(0, 5)) {
    console.log(`OCTADESK_GROUP_CASOS_ESPECIAIS_ID=${g.id}  # ${g.name}`);
  }

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          env: {
            OCTADESK_ID_FORM: envForm || null,
            OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID: envSubject || null,
            OCTADESK_GROUP_CASOS_ESPECIAIS_ID: envGroup || null,
            OCTADESK_STATUS_RESOLVIDO_ID: envStatusRes || null,
            OCTADESK_STATUS_EM_ANDAMENTO_ID: envStatusAnd || null,
          },
          ticketForms: allTicketForms,
          statuses: statusRes.statuses || [],
          platformForms: platformFormHits,
          groups: groupHits,
          groupsTickets: groupTicketHits,
          subjects: subjectHits,
          subjectsTickets: subjectTicketHits,
          heuristica: { casosForm, casosSubject, casosGroup },
        },
        null,
        2
      )
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

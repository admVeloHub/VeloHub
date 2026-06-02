/**
 * Descobre qual chave/formato de customField a api001 aceita no POST /tickets.
 * VERSION: v1.0.0 | DATE: 2026-05-22
 * Uso: node backend/scripts/probe-octadesk-custom-field-keys.js
 */
'use strict';

const path = require('path');
const fs = require('fs');

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
const {
  isOctadeskConfigured,
  getResolvedStatusId,
  buildCreateTicketFromReclamacao,
  createTicket,
  listCustomFieldsFromTicketForm,
} = require('../services/octadesk/octadeskTicketsService');

const FORM_ID = '33f703a1-0a58-454f-a856-550464e1037c';

async function tryPost(label, body) {
  const res = await createTicket(body);
  const err = res.error ? String(res.error).slice(0, 200) : '';
  const ok = res.ok ? `OK #${res.ticketNumber}` : err;
  console.log(`${label}: ${ok}`);
  return res.ok;
}

function baseBody() {
  const sid = getResolvedStatusId();
  return {
    summary: 'Probe customField keys VeloHub',
    description: 'Teste automatizado — pode excluir',
    requester: { email: 'atendimento@velotax.com', name: 'Probe' },
    idCurrentStatus: sid,
    idForm: config.OCTADESK_ID_FORM || FORM_ID,
    idGroupAssigned: config.OCTADESK_GROUP_CASOS_ESPECIAIS_ID || undefined,
  };
}

async function main() {
  if (!isOctadeskConfigured()) {
    console.error('Octadesk não configurado.');
    process.exit(1);
  }

  const formRes = await listCustomFieldsFromTicketForm(FORM_ID);
  if (formRes.ok && formRes.fields) {
    console.log('\nCampos do form (key | type):');
    for (const f of formRes.fields) {
      console.log(`  ${f.key}\t${f.fieldType}`);
    }
  }

  console.log('\nENV OCTADESK_CUSTOM_FIELD_CANAL_ORIGEM_KEY=', config.OCTADESK_CUSTOM_FIELD_CANAL_ORIGEM_KEY || '(vazio)');

  const b = baseBody();
  await tryPost('sem customField', { ...b });

  const keys = [
    ['cpf_do_titular', '12345678901'],
    ['nome', 'Probe Nome'],
    ['canal_de_contato', 'Interno'],
    ['canal_de_contato', 'Interno '],
    ['classificacao', 'Reclamação'],
    ['categoria_de_assunto', 'Casos Especiais'],
    ['categoria_de_assunto', 'casos especiais'],
    ['motivos_casos_especiais', 'Portabilidade pix'],
    ['motivos_casos_especiais', 'Atraso na restituição'],
    ['canal_de_origem', 'Octadesk'],
  ];

  /** @type {Record<string, string>} */
  const acc = {};
  for (const [key, value] of keys) {
    acc[key] = value;
    await tryPost(`map + ${key}=${value}`, { ...b, customField: { ...acc } });
  }

  console.log('\n--- buildCreateTicketFromReclamacao (mapa atual) ---');
  const mock = {
    tipo: 'OUVIDORIA',
    numeroProtocolo: 'PROBE-OUV',
    cpf: '12345678901',
    nome: 'Probe',
    email: 'c@test.com',
    motivoReduzido: ['Portabilidade pix'],
    motivoDetalhado: 'desc probe',
    observacoes: 'obs probe',
    createdAt: new Date(),
  };
  const built = buildCreateTicketFromReclamacao(mock, 'OUVIDORIA');
  console.log('customField keys:', built.customField ? Object.keys(built.customField) : '(none)');
  console.log(JSON.stringify(built.customField, null, 2));
  await tryPost('buildCreate completo', built);

  if (built.customField && typeof built.customField === 'object') {
    const entries = Object.entries(built.customField);
    /** @type {Record<string, string>} */
    const solo = {};
    for (const [k, v] of entries) {
      solo[k] = v;
      await tryPost(`somente ${k}`, { ...b, customField: { [k]: v } });
      delete solo[k];
    }
  }

  const arr = [
    { key: 'cpf_do_titular', value: '12345678901' },
    { key: 'nome', value: 'Probe' },
    { key: 'canal_de_contato', value: 'Interno' },
    { key: 'classificacao', value: 'Reclamação' },
    { key: 'categoria_de_assunto', value: 'Casos Especiais' },
    { key: 'motivos_casos_especiais', value: 'Portabilidade pix' },
  ];
  await tryPost('customFields array (OpenAPI)', { ...b, customFields: arr });
  await tryPost('customFieldOpenAPI array', { ...b, customFieldOpenAPI: arr });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

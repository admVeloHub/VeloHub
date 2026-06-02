/**
 * Lista custom fields Octadesk — keys válidas para POST /tickets.
 * VERSION: v1.0.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * api001: GET /custom-fields não existe; campos vêm de GET /tickets/forms/{id} (propriedade `name`).
 *
 * Uso:
 *   node backend/scripts/list-octadesk-custom-fields.js
 *   node backend/scripts/list-octadesk-custom-fields.js --json
 *   node backend/scripts/list-octadesk-custom-fields.js --form 97052098-eee6-4078-a3eb-fbb593b1dd1f
 *   node backend/scripts/list-octadesk-custom-fields.js --all-forms
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
  listCustomFields,
  listTicketForms,
} = require('../services/octadesk/octadeskTicketsService');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return '';
  return String(process.argv[i + 1]).trim();
}

/**
 * @param {Array<Record<string, string>>} fields
 */
function buildExampleCustomFieldPayloads(fields) {
  /** @type {Record<string, string>} */
  const mapa = {};
  /** @type {Array<{ key: string, value: string }>} */
  const array = [];

  const byKey = (pattern) =>
    fields.find((f) => pattern.test(String(f.key || '')) || pattern.test(String(f.name || '')));

  const cpf = byKey(/^cpf_do_titular$/i);
  const categoria = byKey(/^categoria_de_assunto$/i);
  const motivo = byKey(/^motivos_casos_especiais$/i) || byKey(/motivo/i);
  const canal = byKey(/^canal_de_contato$/i);

  if (cpf && cpf.key !== '—') {
    mapa[cpf.key] = '12345678900';
    array.push({ key: cpf.key, value: '12345678900' });
  }
  if (categoria && categoria.key !== '—') {
    mapa[categoria.key] = 'casos especiais';
    array.push({ key: categoria.key, value: 'casos especiais' });
  }
  if (motivo && motivo.key !== '—') {
    mapa[motivo.key] = 'Atraso na restituição';
    array.push({ key: motivo.key, value: 'Atraso na restituição' });
  }
  if (canal && canal.key !== '—') {
    mapa[canal.key] = 'Interno ';
    array.push({ key: canal.key, value: 'Interno ' });
  }

  if (array.length === 0) {
    for (const f of fields.slice(0, 3)) {
      if (f.key && f.key !== '—') {
        mapa[f.key] = 'valor-exemplo';
        array.push({ key: f.key, value: 'valor-exemplo' });
      }
    }
  }

  return { mapa, array };
}

async function main() {
  if (!isOctadeskConfigured()) {
    console.error('Octadesk não configurado (OCTADESK_API_TOKEN ou email/senha).');
    process.exit(1);
  }

  const formId = argValue('--form');
  const allForms = process.argv.includes('--all-forms');
  const asJson = process.argv.includes('--json');

  console.log('API base:', config.OCTADESK_API_BASE_URL || '(default api.octadesk.services)');
  if (formId) console.log('Form ID:', formId);
  console.log('');

  const formsList = await listTicketForms();
  if (formsList.ok && formsList.forms && formsList.forms.length) {
    console.log('Formulários de ticket (GET /tickets/forms):');
    for (const f of formsList.forms) {
      console.log(`  ${f.id}\t${f.name}`);
    }
    console.log('');
  }

  const result = await listCustomFields({
    formId: formId || undefined,
    allForms,
  });

  if (!result.ok) {
    console.error('Erro:', result.error);
    if (result.tried && result.tried.length) {
      console.error('Rotas /custom-fields testadas (indisponíveis na api001):');
      for (const p of result.tried) console.error('  GET', p);
    }
    process.exit(1);
  }

  const fields = result.fields || [];
  console.log('Fonte:', result.sourcePath);
  if (result.form) {
    console.log('Formulário:', result.form.name, `(${result.form.id})`);
    console.log('\nSugestão OCTADESK_ID_FORM=' + result.form.id);
  }
  console.log('Total campos:', fields.length);
  console.log('');
  console.log('formId\tformName\tkey\tdescription\tfieldType');
  for (const f of fields) {
    console.log(
      [f.formId || '—', f.formName || '—', f.key, f.name, f.fieldType].join('\t')
    );
  }

  const cpfRow = fields.find((f) => f.key === 'cpf_do_titular');
  if (cpfRow) {
    console.log('\nSugestão OCTADESK_CUSTOM_FIELD_CPF_KEY=' + cpfRow.key);
  }

  const { mapa, array } = buildExampleCustomFieldPayloads(fields);
  console.log('\n--- customField mapa (api001 — usar `name` do form como chave) ---');
  console.log(JSON.stringify(mapa, null, 2));
  console.log('\n--- customField array (OpenAPI developers.octadesk.com) ---');
  console.log(JSON.stringify(array, null, 2));

  if (asJson) {
    console.log('\n--- JSON completo ---');
    console.log(
      JSON.stringify(
        { customFieldMapa: mapa, customFieldArray: array, fields, sourcePath: result.sourcePath, form: result.form },
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

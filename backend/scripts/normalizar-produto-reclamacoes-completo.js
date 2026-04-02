/**
 * Normaliza campo produto em todas as coleções de reclamações (ouvidoria)
 * VERSION: v1.0.2 | DATE: 2026-04-02 | AUTHOR: VeloHub Development Team
 *
 * v1.0.2: Carrega MONGO_ENV como server.js (backend/env, backend/.env, cwd)
 * v1.0.1: produto "EP" (e variações de casing / espaços) → Empréstimo Pessoal
 *
 * Canônicos alinhados a FormReclamacao / FormReclamacaoEdit (value persistido).
 * Cobre: Empréstimo Pessoal (grafias), Crédito Trabalhador (grafias), Veloprime (typos/casing),
 *        Credito/Crédito Pessoal → Empréstimo Pessoal.
 *
 * Collections: reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_procon,
 *             reclamacoes_reclameAqui, reclamacoes_judicial
 *
 * Uso (sempre dry-run antes):
 *   node backend/scripts/normalizar-produto-reclamacoes-completo.js --dry-run
 *   node backend/scripts/normalizar-produto-reclamacoes-completo.js
 *
 * Requer: MONGO_ENV em backend/env ou backend/.env (ou ambiente), igual ao server.js.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV;
const DATABASE_NAME = 'hub_ouvidoria';
const DRY_RUN = process.argv.includes('--dry-run');

const CANON_EMPRESTIMO = 'Empréstimo Pessoal';
const CANON_TRABALHADOR = 'Crédito Trabalhador';
const CANON_VELOPRIME = 'Veloprime';

const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_procon',
  'reclamacoes_reclameAqui',
  'reclamacoes_judicial',
];

/** Empréstimo/Crédito + pessoal (espaços nas bordas permitidos) */
const REGEX_PESSOAL = /^\s*(empr[eé]stimo|cr[eé]dito|emprestimo|credito)\s+pessoal\s*$/i;

/** Crédito/Credito + (ao) + trabalhador */
const REGEX_TRABALHADOR = /^\s*(cr[eé]dito|credito)\s+(ao\s+)?trabalhador\s*$/i;

/** Casing / espaços nas bordas — mesmo texto que Veloprime (após typos corrigidos na fase exata) */
const REGEX_VELOPRIME = /^\s*veloprime\s*$/i;

/** "Velo Prime", "VELO PRIME", etc. */
const REGEX_VELO_PRIME = /^\s*velo\s+prime\s*$/i;

/** Sigla legada em produto */
const REGEX_EP = /^\s*ep\s*$/i;

/**
 * Substituições exatas — ordem: typos específicos antes de formas gerais.
 * "de" deve bater byte a byte com o que está no Mongo.
 */
const SUBSTITUICOES_EXATAS = [
  { de: 'Velopriime', para: CANON_VELOPRIME },
  { de: 'VeloPrime', para: CANON_VELOPRIME },
  { de: 'VELOPRIME', para: CANON_VELOPRIME },
  { de: 'veloprime', para: CANON_VELOPRIME },
  { de: 'Velo Prime', para: CANON_VELOPRIME },
  { de: 'Empréstimo pessoal', para: CANON_EMPRESTIMO },
  { de: 'Emprestimo Pessoal', para: CANON_EMPRESTIMO },
  { de: 'EMPRESTIMO PESSOAL', para: CANON_EMPRESTIMO },
  { de: 'Credito pessoal', para: CANON_EMPRESTIMO },
  { de: 'Credito Pessoal', para: CANON_EMPRESTIMO },
  { de: 'Crédito pessoal', para: CANON_EMPRESTIMO },
  { de: 'Crédito Pessoal', para: CANON_EMPRESTIMO },
  { de: 'CREDITO PESSOAL', para: CANON_EMPRESTIMO },
  { de: 'EP', para: CANON_EMPRESTIMO },
  { de: 'ep', para: CANON_EMPRESTIMO },
  { de: 'Ep', para: CANON_EMPRESTIMO },
  { de: 'eP', para: CANON_EMPRESTIMO },
  { de: 'Credito Trabalhador', para: CANON_TRABALHADOR },
  { de: 'CREDITO TRABALHADOR', para: CANON_TRABALHADOR },
  { de: 'Crédito ao trabalhador', para: CANON_TRABALHADOR },
  { de: 'Crédito ao Trabalhador', para: CANON_TRABALHADOR },
];

/** produtoCond ex.: { $type: 'string', $regex: /.../ } — evita regravar valor já canônico (string exata) */
async function contarOuAtualizarRegex(col, name, label, produtoCond, valorCanonico, dryRun, acum) {
  const filtro = {
    $and: [{ produto: produtoCond }, { produto: { $ne: valorCanonico } }],
  };
  const n = await col.countDocuments(filtro);
  if (n === 0) {
    console.log(`📦 ${name} [${label}]: 0`);
    return;
  }
  if (dryRun) {
    const amostra = await col.find(filtro).project({ produto: 1 }).limit(8).toArray();
    console.log(`📦 ${name} [${label}]: ${n} doc(s) dry-run`);
    amostra.forEach((d) => console.log(`   ${JSON.stringify(d.produto)} → "${valorCanonico}"`));
    acum.matched += n;
    return;
  }
  const res = await col.updateMany(filtro, {
    $set: { produto: valorCanonico, updatedAt: new Date() },
  });
  console.log(`📦 ${name} [${label}]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  acum.matched += res.matchedCount;
  acum.modified += res.modifiedCount;
}

async function faseExatas(col, name, dryRun, acum) {
  for (const { de, para } of SUBSTITUICOES_EXATAS) {
    const filtro = { produto: de };
    const n = await col.countDocuments(filtro);
    if (n === 0) continue;
    if (dryRun) {
      console.log(`📦 ${name} exato "${de}": ${n} → "${para}" (dry-run)`);
      acum.matched += n;
      continue;
    }
    const res = await col.updateMany(filtro, {
      $set: { produto: para, updatedAt: new Date() },
    });
    console.log(`📦 ${name} exato "${de}": matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    acum.matched += res.matchedCount;
    acum.modified += res.modifiedCount;
  }
}

async function faseRegexVeloprimeRestante(col, name, dryRun, acum) {
  await contarOuAtualizarRegex(
    col,
    name,
    'regex velo+prime',
    { $type: 'string', $regex: REGEX_VELO_PRIME },
    CANON_VELOPRIME,
    dryRun,
    acum
  );
  await contarOuAtualizarRegex(
    col,
    name,
    'regex Veloprime (case)',
    { $type: 'string', $regex: REGEX_VELOPRIME },
    CANON_VELOPRIME,
    dryRun,
    acum
  );
}

async function executar() {
  console.log('🚀 normalizar-produto-reclamacoes-completo.js\n');
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN' : 'ATUALIZAÇÃO REAL'}\n`);

  if (!MONGODB_URI || !String(MONGODB_URI).trim()) {
    console.error('❌ Defina MONGO_ENV no .env do backend ou no ambiente.');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  const acum = { matched: 0, modified: 0 };

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    for (const name of COLLECTIONS) {
      const col = db.collection(name);
      console.log(`\n——— ${name} ———`);

      console.log('\n[1] Substituições exatas (typos + grafias legadas)');
      await faseExatas(col, name, DRY_RUN, acum);

      console.log('\n[2] Regex sigla EP → Empréstimo Pessoal');
      await contarOuAtualizarRegex(
        col,
        name,
        'regex EP',
        { $type: 'string', $regex: REGEX_EP },
        CANON_EMPRESTIMO,
        DRY_RUN,
        acum
      );

      console.log('\n[3] Regex empréstimo/crédito + pessoal → Empréstimo Pessoal');
      await contarOuAtualizarRegex(
        col,
        name,
        'regex pessoal',
        { $type: 'string', $regex: REGEX_PESSOAL },
        CANON_EMPRESTIMO,
        DRY_RUN,
        acum
      );

      console.log('\n[4] Regex crédito/credito + trabalhador → Crédito Trabalhador');
      await contarOuAtualizarRegex(
        col,
        name,
        'regex trabalhador',
        { $type: 'string', $regex: REGEX_TRABALHADOR },
        CANON_TRABALHADOR,
        DRY_RUN,
        acum
      );

      console.log('\n[5] Regex restante Veloprime (casing / variações)');
      await faseRegexVeloprimeRestante(col, name, DRY_RUN, acum);
    }

    console.log('\n============================================================');
    console.log(DRY_RUN ? `🔍 Dry-run: ~${acum.matched} documento(s) tocados (contagens por fase podem somar o mesmo doc várias vezes — rode sem dry-run para números reais).` : `✅ Concluído. matched acumulado (somas de fases): ${acum.matched} | modified: ${acum.modified}`);
    console.log('============================================================\n');
  } catch (e) {
    console.error('❌ Erro:', e);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB desconectado');
  }
}

executar();

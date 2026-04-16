/**
 * Script de Migração: pixStatus (String) → pixLiberado (Boolean)
 * VERSION: v1.0.0 | DATE: 2026-03-05 | AUTHOR: VeloHub Development Team
(function loadVelohubFonteEnv(here) {
  const path = require('path');
  const fs = require('fs');
  let d = here;
  for (let i = 0; i < 14; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(__dirname);

 *
 * Converte pixStatus para pixLiberado em reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_reclameAqui:
 * - Liberado, Excluído, Solicitada (case insensitive) → pixLiberado: true
 * - Não aplicável, vazio, null → pixLiberado: false
 * - Remove campo pixStatus após conversão
 *
 * Uso:
 *   node backend/scripts/migrate-pixStatus-to-pixLiberado.js [--dry-run]
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const DRY_RUN = process.argv.includes('--dry-run');

const COLLECTIONS = ['reclamacoes_bacen', 'reclamacoes_n2Pix', 'reclamacoes_reclameAqui'];

const VALORES_TRUE = ['liberado', 'excluído', 'excluido', 'solicitada', 'solicitado'];

function pixStatusParaBoolean(valor) {
  if (valor == null || valor === '') return false;
  const v = String(valor).toLowerCase().trim();
  return VALORES_TRUE.includes(v);
}

async function migrarCollection(db, collectionName) {
  const col = db.collection(collectionName);
  const docs = await col.find({}).toArray();
  const bulkOps = [];
  let comPixStatus = 0;
  let convertidosTrue = 0;
  let convertidosFalse = 0;
  let jaPixLiberado = 0;

  for (const doc of docs) {
    // Se já tem pixLiberado e não tem pixStatus, pular
    if (doc.pixLiberado !== undefined && doc.pixLiberado !== null && doc.pixStatus === undefined) {
      jaPixLiberado++;
      continue;
    }

    let pixLiberado;
    if (doc.pixStatus !== undefined && doc.pixStatus !== null) {
      comPixStatus++;
      pixLiberado = pixStatusParaBoolean(doc.pixStatus);
      if (pixLiberado) convertidosTrue++;
      else convertidosFalse++;
    } else {
      pixLiberado = false;
      convertidosFalse++;
    }

    const updateOp = {
      $set: { pixLiberado },
      $unset: { pixStatus: '' }
    };
    bulkOps.push({ updateOne: { filter: { _id: doc._id }, update: updateOp } });
  }

  if (bulkOps.length > 0 && !DRY_RUN) {
    const BATCH = 500;
    for (let i = 0; i < bulkOps.length; i += BATCH) {
      await col.bulkWrite(bulkOps.slice(i, i + BATCH), { ordered: false });
    }
  }

  return {
    total: docs.length,
    comPixStatus,
    convertidosTrue,
    convertidosFalse,
    jaPixLiberado,
    atualizados: bulkOps.length
  };
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log('=== MIGRAÇÃO pixStatus → pixLiberado ===\n');
  if (DRY_RUN) console.log('⚠️  Modo DRY-RUN\n');

  for (const collName of COLLECTIONS) {
    console.log(`\n--- ${collName} ---`);
    const stats = await migrarCollection(db, collName);
    console.log(`  Total docs: ${stats.total}`);
    console.log(`  Com pixStatus: ${stats.comPixStatus}`);
    console.log(`  → pixLiberado true: ${stats.convertidosTrue}`);
    console.log(`  → pixLiberado false: ${stats.convertidosFalse}`);
    console.log(`  Já com pixLiberado (sem pixStatus): ${stats.jaPixLiberado}`);
    console.log(`  Atualizados: ${stats.atualizados}`);
  }

  if (DRY_RUN) console.log('\n[DRY-RUN] Execute sem --dry-run para aplicar.');

  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

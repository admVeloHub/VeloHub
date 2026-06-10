/**
 * Backfill unificado de prazos SLA Ouvidoria (BACEN, N2, Procon, Reclame Aqui).
 * Recalcula prazo a partir de createdAt usando slaOuvidoriaPrazo.js (mesma regra da API).
 *
 * USO:
 *   node backend/scripts/backfill-sla-ouvidoria-prazos.js --dry-run
 *   node backend/scripts/backfill-sla-ouvidoria-prazos.js
 *
 * Requer MONGO_ENV ou MONGODB_URI (loadMongoUri.js).
 *
 * VERSION: v1.1.0 | DATE: 2026-06-10 | AUTHOR: VeloHub Development Team
 * - v1.1.0: bulkWrite em lotes (atualização em massa por coleção, muito mais rápido)
 */
'use strict';

const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('./loadMongoUri');
const { aplicarPrazoAutomaticoPorColecao } = require('../utils/slaOuvidoriaPrazo');

const DATABASE_NAME = 'hub_ouvidoria';
const BULK_CHUNK_SIZE = 1000;

/** @type {Array<{ collection: string, campo: string }>} */
const COLECOES_SLA = [
  { collection: 'reclamacoes_bacen', campo: 'prazoBacen' },
  { collection: 'reclamacoes_n2Pix', campo: 'prazoOuvidoria' },
  { collection: 'reclamacoes_procon', campo: 'prazoProcon' },
  { collection: 'reclamacoes_reclameAqui', campo: 'prazoReclameAqui' },
];

function argDryRun() {
  return process.argv.includes('--dry-run') || process.argv.includes('-n');
}

/** @param {unknown} value */
function createdAtValido(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * @param {import('mongodb').Collection} coll
 * @param {Array<import('mongodb').AnyBulkWriteOperation>} ops
 */
async function executarBulkEmLotes(coll, ops) {
  for (let i = 0; i < ops.length; i += BULK_CHUNK_SIZE) {
    const chunk = ops.slice(i, i + BULK_CHUNK_SIZE);
    const result = await coll.bulkWrite(chunk, { ordered: false });
    if (result.hasWriteErrors && result.hasWriteErrors()) {
      throw new Error(`bulkWrite falhou em ${coll.collectionName}: ${JSON.stringify(result.getWriteErrors())}`);
    }
  }
}

(async () => {
  const dry = argDryRun();
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log(dry ? '🔍 Modo dry-run — nenhuma alteração será gravada' : '✏️ Modo execução — bulkWrite por coleção');

  let totalScanned = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const { collection, campo } of COLECOES_SLA) {
    const coll = db.collection(collection);
    const docs = await coll.find({}, { projection: { createdAt: 1, [campo]: 1 } }).toArray();

    let scanned = docs.length;
    let skipped = 0;
    /** @type {Array<import('mongodb').AnyBulkWriteOperation>} */
    const bulkOps = [];
    /** @type {Array<{ _id: unknown, prazo: Date }>} */
    const amostras = [];

    for (const doc of docs) {
      const createdAt = createdAtValido(doc.createdAt);
      if (!createdAt) {
        skipped += 1;
        continue;
      }

      const alvo = {};
      aplicarPrazoAutomaticoPorColecao(alvo, collection, createdAt);
      const prazo = alvo[campo];
      if (!prazo || !(prazo instanceof Date) || Number.isNaN(prazo.getTime())) {
        skipped += 1;
        continue;
      }

      if (amostras.length < 3) {
        amostras.push({ _id: doc._id, prazo });
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { [campo]: prazo } },
        },
      });
    }

    const updated = bulkOps.length;

    if (!dry && bulkOps.length > 0) {
      await executarBulkEmLotes(coll, bulkOps);
    }

    totalScanned += scanned;
    totalUpdated += updated;
    totalSkipped += skipped;

    console.log(`\n📦 ${collection} (${campo})`);
    console.log(`   Escaneados: ${scanned} | Atualizados: ${updated} | Ignorados (sem createdAt): ${skipped}`);
    if (amostras.length > 0) {
      amostras.forEach((a, i) => {
        console.log(`   Amostra ${i + 1}: _id=${a._id} → ${a.prazo.toISOString()}`);
      });
    }
  }

  console.log('\n--- Resumo ---');
  console.log(`Total escaneados: ${totalScanned}`);
  console.log(`Total ${dry ? 'a atualizar' : 'atualizados'}: ${totalUpdated}`);
  console.log(`Total ignorados: ${totalSkipped}`);

  await client.close();
  console.log(dry ? '\n✅ Dry-run concluído. Execute sem --dry-run para gravar.' : '\n✅ Backfill SLA concluído.');
})().catch((err) => {
  console.error('❌ Erro no backfill SLA:', err);
  process.exit(1);
});

/**
 * Backfill opcional: espelha campos nativos → bloco 792-800 (protocolos* + boolean)
 * quando o array correspondente estiver vazio (syncNativoParaBloco792 — modo conservador).
 *
 * Coleções: reclamacoes_reclameAqui, reclamacoes_procon, reclamacoes_timePortabilidade
 *
 * USO:
 *   node backend/scripts/backfill-protocolos-bloco792.js           # dry-run (padrão)
 *   node backend/scripts/backfill-protocolos-bloco792.js --apply   # grava no MongoDB
 *
 * Requer MONGO_ENV ou MONGODB_URI (loadMongoUri.js).
 *
 * VERSION: v1.0.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 */
'use strict';

const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('./loadMongoUri');
const { syncNativoParaBloco792 } = require('../utils/ouvidoriaProtocolosCanon');

const DATABASE_NAME = 'hub_ouvidoria';

const TARGETS = [
  { collection: 'reclamacoes_reclameAqui', tipo: 'RECLAME_AQUI' },
  { collection: 'reclamacoes_procon', tipo: 'PROCON' },
  { collection: 'reclamacoes_timePortabilidade', tipo: 'TIME_PORTABILIDADE' },
];

const PROTOCOLO_FIELDS = [
  'acionouCentral',
  'protocolosCentral',
  'reclameAqui',
  'protocolosReclameAqui',
  'procon',
  'protocolosProcon',
  'n2SegundoNivel',
  'protocolosN2',
];

function argApply() {
  return process.argv.includes('--apply');
}

/** @param {Record<string, unknown>} before @param {Record<string, unknown>} after */
function buildPatch(before, after) {
  /** @type {Record<string, unknown>} */
  const patch = {};
  for (const key of PROTOCOLO_FIELDS) {
    const b = JSON.stringify(before[key] ?? null);
    const a = JSON.stringify(after[key] ?? null);
    if (b !== a) patch[key] = after[key];
  }
  return patch;
}

(async () => {
  const apply = argApply();
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`[backfill-protocolos-bloco792] modo=${mode}`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  let total = 0;
  let atualizados = 0;
  let ignorados = 0;

  for (const { collection, tipo } of TARGETS) {
    const coll = db.collection(collection);
    const cursor = coll.find({});
    let collTotal = 0;
    let collUpdated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;
      collTotal += 1;
      total += 1;

      const synced = syncNativoParaBloco792(doc, tipo);
      const patch = buildPatch(doc, synced);

      if (Object.keys(patch).length === 0) {
        ignorados += 1;
        continue;
      }

      collUpdated += 1;
      atualizados += 1;

      if (apply) {
        await coll.updateOne({ _id: doc._id }, { $set: patch });
      } else {
        console.log(
          `[dry-run] ${collection} _id=${String(doc._id)} patch=${JSON.stringify(patch)}`
        );
      }
    }

    console.log(`[${collection}] scanned=${collTotal} wouldUpdate=${collUpdated}`);
  }

  console.log(
    `[backfill-protocolos-bloco792] total=${total} atualizados=${atualizados} ignorados=${ignorados} modo=${mode}`
  );

  await client.close();
})().catch((err) => {
  console.error('[backfill-protocolos-bloco792] erro:', err);
  process.exit(1);
});

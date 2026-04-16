/**
 * Script de Correção: Alinhar reclamacoes_n2Pix ao schema LISTA_SCHEMAS.rb
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
 * - Remove dataEntradaAtendimento (redundante com dataEntradaN2)
 * - Garante dataEntradaN2 preenchido (copia de dataEntradaAtendimento se necessário)
 * - Remove telefones.principal (não está no schema - apenas telefones.lista)
 *
 * Uso:
 *   node backend/scripts/corrigir-schema-n2pix.js [--dry-run]
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const col = db.collection('reclamacoes_n2Pix');

  console.log('=== CORREÇÃO SCHEMA reclamacoes_n2Pix ===\n');
  if (DRY_RUN) console.log('⚠️  Modo DRY-RUN\n');

  const docs = await col.find({}).toArray();
  let comDataEntradaAtendimento = 0;
  let comTelefonesPrincipal = 0;
  const bulkOps = [];

  for (const doc of docs) {
    const setUpdates = {};
    const unsetFields = {};
    let precisaAtualizar = false;

    // 1. dataEntradaAtendimento → dataEntradaN2 (se dataEntradaN2 vazio), depois remover dataEntradaAtendimento
    if (doc.dataEntradaAtendimento != null) {
      comDataEntradaAtendimento++;
      if (!doc.dataEntradaN2) {
        setUpdates.dataEntradaN2 = doc.dataEntradaAtendimento instanceof Date
          ? doc.dataEntradaAtendimento
          : new Date(doc.dataEntradaAtendimento);
      }
      unsetFields.dataEntradaAtendimento = '';
      precisaAtualizar = true;
    }

    // 2. Remover telefones.principal
    if (doc.telefones?.principal != null) {
      comTelefonesPrincipal++;
      unsetFields['telefones.principal'] = '';
      precisaAtualizar = true;
    }

    if (precisaAtualizar) {
      const updateOp = {};
      if (Object.keys(setUpdates).length > 0) updateOp.$set = setUpdates;
      if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;
      bulkOps.push({ updateOne: { filter: { _id: doc._id }, update: updateOp } });
    }
  }

  if (bulkOps.length > 0 && !DRY_RUN) {
    const BATCH = 500;
    for (let i = 0; i < bulkOps.length; i += BATCH) {
      await col.bulkWrite(bulkOps.slice(i, i + BATCH), { ordered: false });
    }
  }
  const atualizados = bulkOps.length;

  console.log(`Docs com dataEntradaAtendimento: ${comDataEntradaAtendimento}`);
  console.log(`Docs com telefones.principal: ${comTelefonesPrincipal}`);
  console.log(`Docs atualizados: ${atualizados}`);
  if (DRY_RUN) console.log('\n[DRY-RUN] Execute sem --dry-run para aplicar.');

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Script de Verificação: Campos de data vazios nas collections
 * VERSION: v1.0.0 | DATE: 2026-03-05 | AUTHOR: VeloHub Development Team
 *
 * Conta quantos documentos não possuem dataEntrada (BACEN) e dataEntradaN2 (N2Pix)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const colBacen = db.collection('reclamacoes_bacen');
  const colN2Pix = db.collection('reclamacoes_n2Pix');

  // BACEN: docs sem dataEntrada (null, inexistente ou vazio)
  const totalBacen = await colBacen.countDocuments({});
  const bacenSemDataEntrada = await colBacen.countDocuments({
    $or: [
      { dataEntrada: { $exists: false } },
      { dataEntrada: null },
      { dataEntrada: '' }
    ]
  });
  const bacenComDataEntrada = totalBacen - bacenSemDataEntrada;

  // N2 Pix: docs sem dataEntradaN2 (null, inexistente ou vazio)
  const totalN2Pix = await colN2Pix.countDocuments({});
  const n2PixSemDataEntradaN2 = await colN2Pix.countDocuments({
    $or: [
      { dataEntradaN2: { $exists: false } },
      { dataEntradaN2: null },
      { dataEntradaN2: '' }
    ]
  });
  const n2PixComDataEntradaN2 = totalN2Pix - n2PixSemDataEntradaN2;

  console.log('=== CAMPOS DE DATA VAZIOS ===\n');
  console.log('--- reclamacoes_bacen ---');
  console.log(`Total: ${totalBacen}`);
  console.log(`Com dataEntrada preenchido: ${bacenComDataEntrada}`);
  console.log(`SEM dataEntrada (null/inexistente/vazio): ${bacenSemDataEntrada}`);
  console.log('');
  console.log('--- reclamacoes_n2Pix ---');
  console.log(`Total: ${totalN2Pix}`);
  console.log(`Com dataEntradaN2 preenchido: ${n2PixComDataEntradaN2}`);
  console.log(`SEM dataEntradaN2 (null/inexistente/vazio): ${n2PixSemDataEntradaN2}`);

  // N2: dos 65 sem dataEntradaN2, quantos têm dataEntradaAtendimento ou createdAt?
  const n2SemDataN2 = await colN2Pix.find({
    $or: [
      { dataEntradaN2: { $exists: false } },
      { dataEntradaN2: null },
      { dataEntradaN2: '' }
    ]
  }).toArray();

  const comDataAtendimento = n2SemDataN2.filter((d) => d.dataEntradaAtendimento).length;
  const comCreatedAt = n2SemDataN2.filter((d) => d.createdAt).length;
  const semNenhumFallback = n2SemDataN2.filter((d) => !d.dataEntradaAtendimento && !d.createdAt).length;

  console.log(`\n--- Dos 65 N2 Pix sem dataEntradaN2 ---`);
  console.log(`Com dataEntradaAtendimento (fallback): ${comDataAtendimento}`);
  console.log(`Com createdAt (fallback): ${comCreatedAt}`);
  console.log(`Sem nenhum fallback: ${semNenhumFallback}`);

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Script: Contagem de registros com/sem campo de data de entrada preenchido
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
 * Conta em cada collection:
 * - Total de documentos
 * - Com campo de data de entrada preenchido (exists + not null + not empty)
 * - Sem campo de data de entrada (inexistente, null ou vazio)
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || process.env.MONGODB_URI || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

const COLLECTIONS = [
  { name: 'reclamacoes_bacen', campo: 'dataEntrada' },
  { name: 'reclamacoes_n2Pix', campo: 'dataEntradaN2' },
  { name: 'reclamacoes_reclameAqui', campo: 'dataReclam' },
  { name: 'reclamacoes_procon', campo: 'dataProcon' },
  { name: 'reclamacoes_judicial', campo: 'dataEntrada' }
];

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log('=== CONTAGEM: DATA DE ENTRADA POR COLLECTION ===');
  console.log(`Database: ${DATABASE_NAME}`);
  console.log(`Data/hora: ${new Date().toISOString()}\n`);

  const resultados = [];

  for (const { name, campo } of COLLECTIONS) {
    const col = db.collection(name);

    const total = await col.countDocuments({});

    const comPreenchido = await col.countDocuments({
      [campo]: { $exists: true, $ne: null, $nin: ['', null] }
    });

    const semPreenchido = total - comPreenchido;

    resultados.push({
      collection: name,
      campo,
      total,
      comPreenchido,
      semPreenchido
    });

    console.log(`--- ${name} (campo: ${campo}) ---`);
    console.log(`  Total:              ${total}`);
    console.log(`  Com data preenchida: ${comPreenchido}`);
    console.log(`  Sem data preenchida: ${semPreenchido}`);
    if (total > 0) {
      const pct = ((comPreenchido / total) * 100).toFixed(1);
      console.log(`  % preenchido:        ${pct}%`);
    }
    console.log('');
  }

  // Resumo
  console.log('=== RESUMO ===');
  const totalGeral = resultados.reduce((s, r) => s + r.total, 0);
  const comGeral = resultados.reduce((s, r) => s + r.comPreenchido, 0);
  const semGeral = resultados.reduce((s, r) => s + r.semPreenchido, 0);
  console.log(`Total geral (todas collections): ${totalGeral}`);
  console.log(`Com data de entrada preenchida:   ${comGeral}`);
  console.log(`Sem data de entrada preenchida:  ${semGeral}`);
  if (totalGeral > 0) {
    console.log(`% preenchido geral:               ${((comGeral / totalGeral) * 100).toFixed(1)}%`);
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

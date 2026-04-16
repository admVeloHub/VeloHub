/**
 * Verificar motivos que precisam de normalização na collection reclamacoes_n2Pix
 */

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

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';

const PADROES_NORMALIZAR = [
  /^abatimento de juros$/i,
  /^liberação chave pix$/i,
  /^liberacao chave pix$/i,
  /^abatimento juros$/i
];

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('hub_ouvidoria');
  const collection = db.collection('reclamacoes_n2Pix');

  const docs = await collection.find({
    motivoReduzido: { $exists: true, $ne: null }
  }).toArray();

  const precisamNormalizar = [];
  for (const doc of docs) {
    const motivos = Array.isArray(doc.motivoReduzido) ? doc.motivoReduzido : [doc.motivoReduzido];
    for (const m of motivos) {
      if (typeof m === 'string' && PADROES_NORMALIZAR.some(p => p.test(m.trim()))) {
        precisamNormalizar.push({ cpf: doc.cpf, motivo: m });
      }
    }
  }

  console.log('📦 reclamacoes_n2Pix - Motivos que precisam de normalização:\n');
  console.log(`Total: ${precisamNormalizar.length} ocorrência(s)\n`);
  precisamNormalizar.forEach(({ cpf, motivo }) => {
    console.log(`  CPF ${cpf}: "${motivo}"`);
  });

  await client.close();
})();

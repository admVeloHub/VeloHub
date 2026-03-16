/**
 * Verificar motivos que precisam de normalização na collection reclamacoes_n2Pix
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';

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

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('hub_ouvidoria');
  const collection = db.collection('reclamacoes_reclameAqui');
  
  console.log('🔍 Verificando CPFs que começam com 0 na collection...\n');
  
  // Buscar todos os documentos
  const todosDocs = await collection.find({}).toArray();
  
  let totalRegistros = todosDocs.length;
  let cpfsComZero = 0;
  let cpfsSemZero = 0;
  const exemplosComZero = [];
  const exemplosSemZero = [];
  
  for (const doc of todosDocs) {
    if (doc.cpf && typeof doc.cpf === 'string') {
      if (doc.cpf.startsWith('0')) {
        cpfsComZero++;
        if (exemplosComZero.length < 10) {
          exemplosComZero.push(doc.cpf);
        }
      } else {
        cpfsSemZero++;
        if (exemplosSemZero.length < 10) {
          exemplosSemZero.push(doc.cpf);
        }
      }
    }
  }
  
  console.log('============================================================');
  console.log('📊 RESUMO');
  console.log('============================================================');
  console.log(`Total de registros: ${totalRegistros}`);
  console.log(`CPFs que começam com 0: ${cpfsComZero}`);
  console.log(`CPFs que NÃO começam com 0: ${cpfsSemZero}`);
  
  if (exemplosComZero.length > 0) {
    console.log(`\n✅ Exemplos de CPFs com zero à esquerda (primeiros ${exemplosComZero.length}):`);
    exemplosComZero.forEach(cpf => {
      console.log(`  - ${cpf}`);
    });
  }
  
  if (exemplosSemZero.length > 0) {
    console.log(`\n📋 Exemplos de CPFs sem zero à esquerda (primeiros ${exemplosSemZero.length}):`);
    exemplosSemZero.forEach(cpf => {
      console.log(`  - ${cpf}`);
    });
  }
  
  await client.close();
})();

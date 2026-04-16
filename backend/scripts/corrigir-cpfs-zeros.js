/**
 * Script para corrigir CPFs que perderam zeros à esquerda
 * Adiciona zero à esquerda para CPFs com 10 dígitos
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

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('hub_ouvidoria');
  const collection = db.collection('reclamacoes_reclameAqui');
  
  console.log('🔍 Buscando CPFs com 10 dígitos (devem ter 11)...\n');
  
  // Buscar todos os documentos
  const todosDocs = await collection.find({}).toArray();
  
  let corrigidos = 0;
  const cpfsCorrigidos = [];
  
  for (const doc of todosDocs) {
    if (doc.cpf && typeof doc.cpf === 'string' && doc.cpf.length === 10) {
      const cpfCorrigido = '0' + doc.cpf;
      console.log(`Corrigindo CPF: ${doc.cpf} → ${cpfCorrigido}`);
      
      await collection.updateOne(
        { _id: doc._id },
        { $set: { cpf: cpfCorrigido } }
      );
      
      corrigidos++;
      cpfsCorrigidos.push({ antigo: doc.cpf, novo: cpfCorrigido });
    }
  }
  
  console.log(`\n✅ Total de CPFs corrigidos: ${corrigidos}`);
  
  if (corrigidos > 0) {
    console.log('\nCPFs corrigidos:');
    cpfsCorrigidos.forEach(item => {
      console.log(`  ${item.antigo} → ${item.novo}`);
    });
  }
  
  await client.close();
})();

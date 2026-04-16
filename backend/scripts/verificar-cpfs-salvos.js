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
  
  // CPFs sem zero à esquerda (como podem estar salvos)
  const cpfsSemZero = ['3446919775', '7040092425', '9141442350', '6287962690', '2801298077'];
  
  console.log('Verificando CPFs salvos no MongoDB:\n');
  
  for (const cpfSemZero of cpfsSemZero) {
    const docs = await db.collection('reclamacoes_reclameAqui').find({ 
      cpf: { $regex: cpfSemZero } 
    }).limit(1).toArray();
    
    if (docs.length > 0) {
      console.log(`CPF ${cpfSemZero}: encontrado como "${docs[0].cpf}" (${docs[0].cpf.length} dígitos)`);
    } else {
      console.log(`CPF ${cpfSemZero}: NÃO encontrado`);
    }
  }
  
  // Verificar alguns registros aleatórios
  console.log('\n=== Primeiros 5 registros da collection ===');
  const algunsDocs = await db.collection('reclamacoes_reclameAqui').find({}).limit(5).toArray();
  algunsDocs.forEach((doc, idx) => {
    console.log(`Registro ${idx + 1}: CPF="${doc.cpf}" (${doc.cpf ? doc.cpf.length : 0} dígitos)`);
  });
  
  await client.close();
})();

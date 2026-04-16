/**
 * Listar todos os valores únicos de motivoReduzido na collection reclamacoes_n2Pix
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
  const collection = db.collection('reclamacoes_n2Pix');

  const docs = await collection.find({
    motivoReduzido: { $exists: true, $ne: null }
  }).toArray();

  const motivosUnicos = new Map(); // motivo -> count
  for (const doc of docs) {
    const motivos = Array.isArray(doc.motivoReduzido) ? doc.motivoReduzido : [doc.motivoReduzido];
    for (const m of motivos) {
      if (typeof m === 'string' && m.trim()) {
        const key = m.trim();
        motivosUnicos.set(key, (motivosUnicos.get(key) || 0) + 1);
      }
    }
  }

  // Filtrar os que podem precisar de normalização (abatimento, liberação, chave pix)
  const palavrasChave = ['abatimento', 'juros', 'liberação', 'liberacao', 'chave', 'pix'];
  const suspeitos = [...motivosUnicos.entries()].filter(([motivo]) => {
    const lower = motivo.toLowerCase();
    return palavrasChave.some(p => lower.includes(p));
  });

  console.log('📦 reclamacoes_n2Pix - Valores únicos de motivoReduzido (suspeitos de normalização):\n');
  suspeitos.sort((a, b) => b[1] - a[1]);
  suspeitos.forEach(([motivo, count]) => {
    const precisa = !['Abatimento de Juros', 'Liberação Chave Pix'].includes(motivo);
    console.log(`  "${motivo}" (${count}x)${precisa ? ' ← PRECISA NORMALIZAR' : ''}`);
  });

  console.log('\n--- Todos os motivos únicos (ordenados por frequência) ---');
  const todos = [...motivosUnicos.entries()].sort((a, b) => b[1] - a[1]);
  todos.forEach(([motivo, count]) => {
    console.log(`  "${motivo}" (${count}x)`);
  });

  await client.close();
})();

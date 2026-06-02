/**
 * One-shot: renomeia console_conteudo.hub_destaques → hub_avisos (se existir e hub_avisos ainda não existir).
 * VERSION: v1.0.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 *
 * Uso (na pasta backend): node scripts/rename-hub-destaques-to-hub-avisos.js
 */

const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('./loadMongoUri');

const DB_NAME = 'console_conteudo';
const FROM = 'hub_destaques';
const TO = 'hub_avisos';

async function main() {
  const uri = MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não configurada.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(DB_NAME);

  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);
  const hasFrom = names.includes(FROM);
  const hasTo = names.includes(TO);

  if (!hasFrom) {
    console.log(`Coleção ${FROM} não existe — nada a renomear.`);
    if (!hasTo) {
      await db.createCollection(TO);
      console.log(`Coleção vazia ${TO} criada.`);
    }
    await client.close();
    return;
  }

  if (hasTo) {
    const fromCount = await db.collection(FROM).countDocuments();
    const toCount = await db.collection(TO).countDocuments();
    console.log(`${TO} já existe (${toCount} docs). ${FROM} tem ${fromCount} docs.`);
    console.log('Renomeação ignorada — migre manualmente se necessário.');
    await client.close();
    return;
  }

  await db.collection(FROM).rename(TO);
  const count = await db.collection(TO).countDocuments();
  console.log(`OK: ${FROM} → ${TO} (${count} documentos).`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

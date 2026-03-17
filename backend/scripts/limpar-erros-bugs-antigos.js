/**
 * Limpeza: hub_escalacoes.erros_bugs
 * Apaga registros com createdAt anterior a 15/03/2026
 * 
 * Uso:
 *   node backend/scripts/limpar-erros-bugs-antigos.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || process.env.MONGODB_URI || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_escalacoes';
const COLLECTION_NAME = 'erros_bugs';
const DATA_LIMITE = new Date('2026-03-15T00:00:00.000Z');
const DRY_RUN = process.argv.includes('--dry-run');

(async () => {
  console.log('🚀 Limpeza: hub_escalacoes.erros_bugs\n');
  console.log(`📅 Apagar registros com createdAt < 15/03/2026`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (nenhum dado será apagado)' : 'EXECUÇÃO REAL'}\n`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const totalAntes = await collection.countDocuments({});
  const aApagar = await collection.countDocuments({ createdAt: { $lt: DATA_LIMITE } });

  console.log(`📊 Total de registros na collection: ${totalAntes}`);
  console.log(`📊 Registros a apagar (createdAt < 15/03/2026): ${aApagar}\n`);

  if (aApagar === 0) {
    console.log('✅ Nenhum registro a apagar.');
    await client.close();
    return;
  }

  if (!DRY_RUN) {
    const resultado = await collection.deleteMany({ createdAt: { $lt: DATA_LIMITE } });
    console.log(`✅ Documentos apagados: ${resultado.deletedCount}`);
  } else {
    console.log(`🔍 Dry-run: ${aApagar} documento(s) seriam apagados.`);
    console.log('   Execute sem --dry-run para aplicar.');
  }

  const totalDepois = DRY_RUN ? totalAntes : await collection.countDocuments({});
  console.log(`\n📊 Total após limpeza: ${totalDepois}`);

  await client.close();
  console.log('\n🔌 Conexão fechada.');
})();

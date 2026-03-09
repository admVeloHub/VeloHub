/**
 * Script de Verificação: reclamacoes_ouvidoria vs reclamacoes_n2Pix
 * VERSION: v1.0.0 | DATE: 2026-03-05 | AUTHOR: VeloHub Development Team
 *
 * Verifica se todos os documentos de reclamacoes_ouvidoria existem em reclamacoes_n2Pix
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const colOuvidoria = db.collection('reclamacoes_ouvidoria');
  const colN2Pix = db.collection('reclamacoes_n2Pix');

  // Verificar se collection ouvidoria existe
  const collections = await db.listCollections().toArray();
  const existeOuvidoria = collections.some((c) => c.name === 'reclamacoes_ouvidoria');

  const docsOuvidoria = existeOuvidoria ? await colOuvidoria.find({}).toArray() : [];
  const docsN2Pix = await colN2Pix.find({}).toArray();

  const idsOuvidoria = docsOuvidoria.map((d) => d._id.toString());
  const idsN2Pix = new Set(docsN2Pix.map((d) => d._id.toString()));

  const emAmbas = idsOuvidoria.filter((id) => idsN2Pix.has(id));
  const faltandoNoN2Pix = idsOuvidoria.filter((id) => !idsN2Pix.has(id));

  console.log('=== VERIFICAÇÃO reclamacoes_ouvidoria → reclamacoes_n2Pix ===\n');
  console.log(`reclamacoes_ouvidoria: ${docsOuvidoria.length} documentos`);
  console.log(`reclamacoes_n2Pix: ${docsN2Pix.length} documentos`);
  console.log(`\nDocumentos de _ouvidoria presentes em _n2Pix: ${emAmbas.length}/${idsOuvidoria.length}`);
  if (faltandoNoN2Pix.length > 0) {
    console.log(`\n❌ FALTANDO em _n2Pix (${faltandoNoN2Pix.length}):`);
    faltandoNoN2Pix.forEach((id) => console.log(`   - ${id}`));
  } else if (idsOuvidoria.length > 0) {
    console.log('\n✅ Todos os documentos de _ouvidoria estão em _n2Pix.');
  } else if (!existeOuvidoria) {
    console.log('\nℹ️  Collection reclamacoes_ouvidoria não existe.');
  } else {
    console.log('\nℹ️  reclamacoes_ouvidoria estava vazia.');
  }

  // Mostrar amostra de 3 docs de cada (cpf, nome, createdAt)
  if (docsOuvidoria.length > 0) {
    console.log('\n--- Amostra reclamacoes_ouvidoria (3 primeiros) ---');
    docsOuvidoria.slice(0, 3).forEach((d, i) => {
      console.log(`  ${i + 1}. _id: ${d._id}`);
      console.log(`     nome: ${d.nome || '-'}`);
      console.log(`     cpf: ${d.cpf ? d.cpf.substring(0, 3) + '***' + d.cpf.substring(9) : '-'}`);
      console.log(`     createdAt: ${d.createdAt}`);
    });
  }

  const idsOuvidoriaSet = new Set(idsOuvidoria);
  const docsN2PixQueEramOuvidoria = docsN2Pix.filter((d) => idsOuvidoriaSet.has(d._id.toString()));
  if (docsN2PixQueEramOuvidoria.length > 0) {
    console.log('\n--- Amostra em _n2Pix (docs que vieram de _ouvidoria, 3 primeiros) ---');
    docsN2PixQueEramOuvidoria.slice(0, 3).forEach((d, i) => {
      console.log(`  ${i + 1}. _id: ${d._id}`);
      console.log(`     nome: ${d.nome || '-'}`);
      console.log(`     cpf: ${d.cpf ? d.cpf.substring(0, 3) + '***' + d.cpf.substring(9) : '-'}`);
      console.log(`     createdAt: ${d.createdAt}`);
    });
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

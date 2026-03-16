/**
 * Lista documentos em reclamacoes_ouvidoria SEM correspondente em reclamacoes_n2Pix
 * Critério: cpf + nome + data (dataEntradaN2 ou dataEntrada ou createdAt)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

function dataStr(doc) {
  const d = doc.dataEntradaN2 || doc.dataEntrada || doc.createdAt;
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}

function chave(doc) {
  const cpf = (doc.cpf || '').toString().replace(/\D/g, '');
  const nome = (doc.nome || '').toString().trim().toLowerCase();
  const data = dataStr(doc) || '';
  return `${cpf}|${nome}|${data}`;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const collections = await db.listCollections().toArray();
  const existeOuvidoria = collections.some((c) => c.name === 'reclamacoes_ouvidoria');

  if (!existeOuvidoria) {
    console.log('Collection reclamacoes_ouvidoria não existe.');
    await client.close();
    return;
  }

  const docsOuvidoria = await db.collection('reclamacoes_ouvidoria').find({}).toArray();
  const docsN2Pix = await db.collection('reclamacoes_n2Pix').find({}).toArray();

  const chavesN2Pix = new Set(docsN2Pix.map((d) => chave(d)).filter((k) => k && k !== '||'));

  const faltaNoN2Pix = docsOuvidoria.filter((d) => {
    const k = chave(d);
    return k && k !== '||' && !chavesN2Pix.has(k);
  });

  console.log('\n=== DOCUMENTOS EM reclamacoes_ouvidoria SEM REFERÊNCIA EM reclamacoes_n2Pix ===\n');
  console.log(`Total: ${faltaNoN2Pix.length} documento(s)\n`);

  faltaNoN2Pix.forEach((d, i) => {
    console.log(`--- ${i + 1} ---`);
    console.log(`  _id: ${d._id}`);
    console.log(`  nome: ${d.nome || '-'}`);
    console.log(`  cpf: ${d.cpf ? d.cpf.substring(0, 3) + '***' + d.cpf.substring(9) : '-'}`);
    console.log(`  dataEntradaN2: ${d.dataEntradaN2 || '-'}`);
    console.log(`  dataEntrada: ${d.dataEntrada || '-'}`);
    console.log(`  createdAt: ${d.createdAt || '-'}`);
    console.log(`  responsavel: ${d.responsavel || '-'}`);
    console.log(`  produto: ${d.produto || '-'}`);
    console.log(`  motivoReduzido: ${Array.isArray(d.motivoReduzido) ? d.motivoReduzido.join(', ') : d.motivoReduzido || '-'}`);
    console.log('');
  });

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

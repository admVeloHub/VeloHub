/**
 * Listar CPFs dos casos contados como Retidos
 * 
 * Critério Retidos (conforme dashboard):
 * - motivoReduzido contém "Liberação Chave Pix"
 * - Finalizado.Resolvido === true
 * - pixLiberado === false
 * 
 * Uso:
 *   node backend/scripts/listar-retidos.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

function normalizarMotivoParaComparacao(motivoReduzido) {
  if (!motivoReduzido) return '';
  if (Array.isArray(motivoReduzido)) {
    return motivoReduzido.join(' ').toLowerCase();
  }
  if (typeof motivoReduzido === 'string') {
    return motivoReduzido.toLowerCase();
  }
  return '';
}

function isMotivoLiberacaoChavePix(motivoReduzido) {
  const norm = normalizarMotivoParaComparacao(motivoReduzido);
  return norm.includes('liberação chave pix') || norm.includes('liberacao chave pix');
}

function isRetido(doc) {
  return (
    isMotivoLiberacaoChavePix(doc.motivoReduzido) &&
    doc.Finalizado?.Resolvido === true &&
    doc.pixLiberado === false
  );
}

const COLLECTIONS = [
  { name: 'reclamacoes_bacen', tipo: 'BACEN' },
  { name: 'reclamacoes_n2Pix', tipo: 'N2 Pix' },
  { name: 'reclamacoes_reclameAqui', tipo: 'Reclame Aqui' },
  { name: 'reclamacoes_procon', tipo: 'Procon' },
  { name: 'reclamacoes_judicial', tipo: 'Ação Judicial' }
];

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log('📋 Casos contados como RETIDOS\n');
  console.log('Critério: motivo "Liberação Chave Pix" + Finalizado.Resolvido=true + pixLiberado=false\n');

  const todosCpfs = [];
  const cpfsPorTipo = {};

  for (const { name, tipo } of COLLECTIONS) {
    const collection = db.collection(name);
    const docs = await collection.find({}).toArray();
    const retidos = docs.filter(isRetido);

    cpfsPorTipo[tipo] = retidos.map(r => r.cpf).filter(Boolean);

    console.log(`\n📦 ${tipo} (${name}): ${retidos.length} caso(s)`);
    retidos.forEach(r => {
      const cpf = r.cpf || r.codigoProcon || '(sem CPF)';
      console.log(`  ${cpf}`);
      if (r.cpf) todosCpfs.push({ cpf: r.cpf, tipo });
    });
  }

  console.log('\n============================================================');
  console.log('📊 RESUMO - Lista de CPFs (Retidos)');
  console.log('============================================================\n');

  const cpfsUnicos = [...new Set(todosCpfs.map(r => r.cpf).filter(Boolean))];
  cpfsUnicos.sort();

  cpfsUnicos.forEach(cpf => {
    console.log(cpf);
  });

  console.log(`\nTotal: ${cpfsUnicos.length} CPF(s) únicos`);

  await client.close();
})();

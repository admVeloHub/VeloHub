/**
 * Investigar: quantos casos têm createdAt ANTES da data de entrada em cada collection
 * 
 * Regra de negócio: createdAt nunca deveria ser anterior à data de entrada.
 * Este script conta e lista os casos que violam essa regra.
 * 
 * Uso: node backend/scripts/investigar-createdAt-antes.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || process.env.MONGODB_URI;
const DATABASE_NAME = 'hub_ouvidoria';

function getDataEntrada(doc, collectionName) {
  if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial') {
    return doc.dataEntrada;
  }
  if (collectionName === 'reclamacoes_n2Pix') return doc.dataEntradaN2;
  if (collectionName === 'reclamacoes_reclameAqui') return doc.dataReclam;
  if (collectionName === 'reclamacoes_procon') return doc.dataProcon;
  return null;
}

const COLLECTIONS = [
  { name: 'reclamacoes_bacen', label: 'BACEN', dataCampo: 'dataEntrada' },
  { name: 'reclamacoes_n2Pix', label: 'N2 Pix', dataCampo: 'dataEntradaN2' },
  { name: 'reclamacoes_reclameAqui', label: 'Reclame Aqui', dataCampo: 'dataReclam' },
  { name: 'reclamacoes_procon', label: 'Procon', dataCampo: 'dataProcon' },
  { name: 'reclamacoes_judicial', label: 'Judicial', dataCampo: 'dataEntrada' }
];

(async () => {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_ENV não definido');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log('\n============================================================');
  console.log('📋 INVESTIGAÇÃO: createdAt ANTES da data de entrada');
  console.log('============================================================\n');
  console.log('Regra: createdAt nunca deveria ser anterior à data de entrada.');
  console.log('Contagem de violações por collection:\n');

  const resumo = [];

  for (const { name, label, dataCampo } of COLLECTIONS) {
    const collection = db.collection(name);
    const todos = await collection.find({}).toArray();

    const comAmbosCampos = todos.filter(r => {
      const dataEnt = getDataEntrada(r, name);
      return r.createdAt && dataEnt;
    });

    const violacoes = comAmbosCampos.filter(r => {
      const createdAt = new Date(r.createdAt);
      const dataEntrada = new Date(getDataEntrada(r, name));
      return createdAt < dataEntrada;
    });

    const total = comAmbosCampos.length;
    const qtdViolacoes = violacoes.length;
    const pct = total > 0 ? ((qtdViolacoes / total) * 100).toFixed(1) : 0;

    resumo.push({ label, name, total, qtdViolacoes, pct, violacoes });

    console.log(`📦 ${label} (${name})`);
    console.log(`   Total com createdAt e ${dataCampo}: ${total}`);
    console.log(`   Violações (createdAt < ${dataCampo}): ${qtdViolacoes} (${pct}%)`);
    if (violacoes.length > 0 && violacoes.length <= 10) {
      violacoes.forEach((v, i) => {
        const ct = new Date(v.createdAt);
        const de = new Date(getDataEntrada(v, name));
        const diffDias = ((de - ct) / (1000 * 60 * 60 * 24)).toFixed(0);
        console.log(`   ${i + 1}. _id: ${v._id} | createdAt: ${ct.toISOString().slice(0, 10)} | ${dataCampo}: ${de.toISOString().slice(0, 10)} | diferença: ${diffDias} dias`);
      });
    } else if (violacoes.length > 10) {
      console.log(`   Amostra (5 primeiras):`);
      violacoes.slice(0, 5).forEach((v, i) => {
        const ct = new Date(v.createdAt);
        const de = new Date(getDataEntrada(v, name));
        const diffDias = ((de - ct) / (1000 * 60 * 60 * 24)).toFixed(0);
        console.log(`   ${i + 1}. _id: ${v._id} | createdAt: ${ct.toISOString().slice(0, 10)} | ${dataCampo}: ${de.toISOString().slice(0, 10)} | diferença: ${diffDias} dias`);
      });
    }
    console.log('');
  }

  console.log('============================================================');
  console.log('📊 RESUMO CONSOLIDADO');
  console.log('============================================================\n');
  console.log('Collection'.padEnd(28) + 'Total'.padEnd(10) + 'Violações'.padEnd(12) + '%');
  console.log('-'.repeat(55));
  resumo.forEach(r => {
    console.log(r.label.padEnd(28) + String(r.total).padEnd(10) + String(r.qtdViolacoes).padEnd(12) + r.pct + '%');
  });
  const totalGeral = resumo.reduce((a, r) => a + r.total, 0);
  const violacoesGeral = resumo.reduce((a, r) => a + r.qtdViolacoes, 0);
  const pctGeral = totalGeral > 0 ? ((violacoesGeral / totalGeral) * 100).toFixed(1) : 0;
  console.log('-'.repeat(55));
  console.log('TOTAL'.padEnd(28) + String(totalGeral).padEnd(10) + String(violacoesGeral).padEnd(12) + pctGeral + '%');
  console.log('');

  await client.close();
})();

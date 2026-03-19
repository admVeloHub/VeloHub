/**
 * Diagnóstico: Prazo Médio - Comparar createdAt vs data de entrada
 * 
 * Verifica se a diferença entre createdAt e a data de entrada de cada collection
 * está inflando o cálculo do Prazo Médio.
 * 
 * Prazo correto = dataResolucao - dataDeEntrada (não createdAt)
 * 
 * Uso: node backend/scripts/diagnostico-prazo-medio.js
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
  return doc.createdAt;
}

function calcularDias(inicio, fim) {
  if (!inicio || !fim) return null;
  const i = new Date(inicio);
  const f = new Date(fim);
  if (isNaN(i.getTime()) || isNaN(f.getTime())) return null;
  return (f.getTime() - i.getTime()) / (1000 * 60 * 60 * 24);
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
  console.log('📋 DIAGNÓSTICO: Prazo Médio - createdAt vs data de entrada');
  console.log('============================================================\n');

  for (const { name, label, dataCampo } of COLLECTIONS) {
    const collection = db.collection(name);
    const docs = await collection.find({
      'Finalizado.Resolvido': true,
      'Finalizado.dataResolucao': { $exists: true, $ne: null },
      createdAt: { $exists: true, $ne: null }
    }).toArray();

    const comDataEntrada = docs.filter(r => {
      const dataEnt = getDataEntrada(r, name);
      return dataEnt && r.Finalizado?.dataResolucao;
    });

    const resultados = comDataEntrada.map(r => {
      const createdAt = new Date(r.createdAt);
      const dataEntrada = new Date(getDataEntrada(r, name));
      const dataResolucao = new Date(r.Finalizado.dataResolucao);

      const diasComCreatedAt = calcularDias(createdAt, dataResolucao);
      const diasComDataEntrada = calcularDias(dataEntrada, dataResolucao);

      const diffCreatedVsEntrada = (createdAt.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24);

      return {
        _id: r._id,
        cpf: r.cpf,
        createdAt: createdAt.toISOString().slice(0, 10),
        [dataCampo]: dataEntrada.toISOString().slice(0, 10),
        dataResolucao: dataResolucao.toISOString().slice(0, 10),
        diasComCreatedAt,
        diasComDataEntrada,
        diffCreatedVsEntrada,
        createdAtAntes: createdAt < dataEntrada
      };
    }).filter(r => r.diasComCreatedAt >= 0 && r.diasComCreatedAt <= 365 && r.diasComDataEntrada >= 0 && r.diasComDataEntrada <= 365);

    if (resultados.length === 0) {
      console.log(`\n📦 ${label} (${name}): Nenhum registro válido para comparação`);
      continue;
    }

    const somaCreatedAt = resultados.reduce((a, r) => a + r.diasComCreatedAt, 0);
    const somaDataEntrada = resultados.reduce((a, r) => a + r.diasComDataEntrada, 0);
    const mediaCreatedAt = somaCreatedAt / resultados.length;
    const mediaDataEntrada = somaDataEntrada / resultados.length;

    console.log(`\n📦 ${label} (${name})`);
    console.log('-'.repeat(60));
    console.log(`Registros válidos: ${resultados.length}`);
    console.log(`Média usando createdAt:     ${mediaCreatedAt.toFixed(1)} dias`);
    console.log(`Média usando ${dataCampo}:  ${mediaDataEntrada.toFixed(1)} dias`);
    console.log(`Diferença: ${(mediaCreatedAt - mediaDataEntrada).toFixed(1)} dias (createdAt infla em ${((mediaCreatedAt - mediaDataEntrada) / mediaDataEntrada * 100).toFixed(0)}%)`);

    const createdAtAntes = resultados.filter(r => r.createdAtAntes).length;
    if (createdAtAntes > 0) {
      console.log(`\n⚠️  ${createdAtAntes} registros com createdAt ANTES da data de entrada (inflaciona prazo)`);
    }

    console.log('\n  Amostra (5 primeiros):');
    resultados.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. createdAt ${r.createdAt} | ${dataCampo} ${r[dataCampo]} | resolução ${r.dataResolucao}`);
      console.log(`     → com createdAt: ${r.diasComCreatedAt.toFixed(1)} dias | com ${dataCampo}: ${r.diasComDataEntrada.toFixed(1)} dias`);
    });
  }

  console.log('\n============================================================');
  console.log('📊 CONCLUSÃO');
  console.log('============================================================');
  console.log('\nSe a média com createdAt for maior que com data de entrada,');
  console.log('o cálculo deve usar a data de entrada de cada collection.');
  console.log('');

  await client.close();
})();

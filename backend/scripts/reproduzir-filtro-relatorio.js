/**
 * Reproduz exatamente o filtro do Relatório para identificar o bug
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

// Mesmo período que o usuário usa: 2025-01 a 2026-03
const dataInicio = '2025-01-01';
const dataFim = '2026-03-31';

function criarFiltroDataRelatorio(collectionName) {
  const dataInicioDate = new Date(dataInicio);
  const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');

  if (collectionName === 'reclamacoes_n2Pix') {
    return {
      $or: [
        { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
        {
          $and: [
            { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
            { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
          ]
        },
        {
          $and: [
            { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
            { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
            { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
          ]
        }
      ]
    };
  }

  if (collectionName === 'reclamacoes_bacen') {
    return {
      dataEntrada: {
        $gte: dataInicioDate,
        $lte: dataFimDate
      }
    };
  }

  return {};
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const filtroBacen = criarFiltroDataRelatorio('reclamacoes_bacen');
  const filtroN2 = criarFiltroDataRelatorio('reclamacoes_n2Pix');

  const countBacen = await db.collection('reclamacoes_bacen').countDocuments(filtroBacen);
  const countN2 = await db.collection('reclamacoes_n2Pix').countDocuments(filtroN2);

  const totalBacen = await db.collection('reclamacoes_bacen').countDocuments({});
  const totalN2 = await db.collection('reclamacoes_n2Pix').countDocuments({});

  console.log('=== REPRODUÇÃO DO FILTRO RELATÓRIO (2025-01-01 a 2026-03-31) ===\n');
  console.log('BACEN:');
  console.log(`  Total na collection: ${totalBacen}`);
  console.log(`  Retornados pelo filtro: ${countBacen}`);
  console.log(`  Excluídos: ${totalBacen - countBacen}`);
  console.log('\nN2 Pix:');
  console.log(`  Total na collection: ${totalN2}`);
  console.log(`  Retornados pelo filtro: ${countN2}`);
  console.log(`  Excluídos: ${totalN2 - countN2}`);

  // Verificar se dataEntrada no BACEN pode ser tipo diferente (string vs Date)
  const bacenExemplo = await db.collection('reclamacoes_bacen').findOne({});
  console.log('\n--- Tipo do campo dataEntrada (amostra) ---');
  console.log('dataEntrada:', bacenExemplo?.dataEntrada, 'tipo:', typeof bacenExemplo?.dataEntrada);

  // Os 10 BACEN excluídos - qual o valor de dataEntrada?
  const bacenForaDoFiltro = await db.collection('reclamacoes_bacen').find({ $nor: [filtroBacen] }).toArray();
  console.log('\n--- BACEN que NÃO passam no filtro ---');
  console.log('Quantidade:', bacenForaDoFiltro.length);
  bacenForaDoFiltro.slice(0, 5).forEach((d, i) => {
    console.log(`  ${i + 1}. dataEntrada: ${d.dataEntrada} (${typeof d.dataEntrada})`);
  });

  // Os 65 N2 excluídos
  const n2ForaDoFiltro = await db.collection('reclamacoes_n2Pix').find({ $nor: [filtroN2] }).toArray();
  console.log('\n--- N2 Pix que NÃO passam no filtro ---');
  console.log('Quantidade:', n2ForaDoFiltro.length);
  n2ForaDoFiltro.slice(0, 5).forEach((d, i) => {
    console.log(`  ${i + 1}. dataEntradaN2: ${d.dataEntradaN2}, dataEntradaAtendimento: ${d.dataEntradaAtendimento}, createdAt: ${d.createdAt}`);
  });

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

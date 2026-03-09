/**
 * Verifica datas dos registros que podem estar sendo excluídos do Relatório
 * Período do relatório: 2025-01-01 a 2026-03-31
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

const PERIODO_INICIO = new Date('2025-01-01T00:00:00.000Z');
const PERIODO_FIM = new Date('2026-03-31T23:59:59.999Z');

function dentroDoPeriodo(d) {
  if (!d) return false;
  const dt = new Date(d);
  return dt >= PERIODO_INICIO && dt <= PERIODO_FIM;
}

function anoMes(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log('=== ANÁLISE DE DATAS - Período relatório: 2025-01 a 2026-03 ===\n');

  // BACEN: quais têm dataEntrada FORA do período?
  const todosBacen = await db.collection('reclamacoes_bacen').find({}).project({
    _id: 1,
    dataEntrada: 1,
    createdAt: 1
  }).toArray();

  const bacenForaPeriodo = todosBacen.filter((d) => !dentroDoPeriodo(d.dataEntrada));
  const bacenDentroPeriodo = todosBacen.filter((d) => dentroDoPeriodo(d.dataEntrada));

  console.log('--- BACEN (605 total) ---');
  console.log(`Com dataEntrada DENTRO do período: ${bacenDentroPeriodo.length}`);
  console.log(`Com dataEntrada FORA do período: ${bacenForaPeriodo.length}`);
  if (bacenForaPeriodo.length > 0) {
    const porAnoMes = {};
    bacenForaPeriodo.forEach((d) => {
      const am = anoMes(d.dataEntrada);
      porAnoMes[am] = (porAnoMes[am] || 0) + 1;
    });
    console.log('  Distribuição dos fora do período:', porAnoMes);
    console.log('  Amostra (3 primeiros):');
    bacenForaPeriodo.slice(0, 3).forEach((d, i) => {
      console.log(`    ${i + 1}. dataEntrada: ${d.dataEntrada} (${anoMes(d.dataEntrada)})`);
    });
  }

  // N2 Pix: os 65 sem dataEntradaN2 - quais têm dataEntradaAtendimento/createdAt FORA?
  const n2SemDataN2 = await db.collection('reclamacoes_n2Pix').find({
    $or: [
      { dataEntradaN2: { $exists: false } },
      { dataEntradaN2: null },
      { dataEntradaN2: '' }
    ]
  }).project({
    _id: 1,
    dataEntradaN2: 1,
    dataEntradaAtendimento: 1,
    createdAt: 1
  }).toArray();

  const n2DentroPeloAtendimento = n2SemDataN2.filter((d) => dentroDoPeriodo(d.dataEntradaAtendimento));
  const n2DentroPeloCreatedAt = n2SemDataN2.filter((d) => !dentroDoPeriodo(d.dataEntradaAtendimento) && dentroDoPeriodo(d.createdAt));
  const n2ForaPorAmbos = n2SemDataN2.filter((d) => !dentroDoPeriodo(d.dataEntradaAtendimento) && !dentroDoPeriodo(d.createdAt));

  console.log('\n--- N2 Pix - 65 sem dataEntradaN2 ---');
  console.log(`Dentro período via dataEntradaAtendimento: ${n2DentroPeloAtendimento.length}`);
  console.log(`Dentro período via createdAt (quando atendimento fora): ${n2DentroPeloCreatedAt.length}`);
  console.log(`FORA do período em AMBOS (atendimento e createdAt): ${n2ForaPorAmbos.length}`);

  if (n2ForaPorAmbos.length > 0) {
    const porAnoMesAtend = {};
    const porAnoMesCreated = {};
    n2ForaPorAmbos.forEach((d) => {
      const amA = anoMes(d.dataEntradaAtendimento);
      const amC = anoMes(d.createdAt);
      porAnoMesAtend[amA] = (porAnoMesAtend[amA] || 0) + 1;
      porAnoMesCreated[amC] = (porAnoMesCreated[amC] || 0) + 1;
    });
    console.log('  dataEntradaAtendimento dos excluídos:', porAnoMesAtend);
    console.log('  createdAt dos excluídos:', porAnoMesCreated);
  }

  // Verificar se o filtro do Relatório usa o mesmo dataFim (com T23:59:59.999Z)
  const dataFimRelatorio = new Date('2026-03-31' + 'T23:59:59.999Z');
  console.log('\n--- Verificação de timezone ---');
  console.log('dataFim usado no relatório:', dataFimRelatorio.toISOString());
  console.log('Período fim (UTC):', PERIODO_FIM.toISOString());

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

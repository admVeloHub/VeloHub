/**
 * Diagnóstico: Retidos no container Reclame Aqui do Dashboard
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

 * 
 * Lista os documentos que estão sendo contados como Retidos em reclamacoes_reclameAqui
 * e exibe os campos relevantes para entender por que cada um está sendo contado.
 * 
 * Critério Retidos (conforme dashboard):
 * - motivoReduzido contém "Liberação Chave Pix"
 * - Finalizado.Resolvido === true
 * - pixLiberado === false
 * 
 * Uso:
 *   node backend/scripts/diagnostico-retidos-reclame-aqui.js
 *   node backend/scripts/diagnostico-retidos-reclame-aqui.js 2025-01-01 2025-12-31  (com filtro de data)
 */

const path = require('path');

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || process.env.MONGODB_URI;
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

/**
 * Criar filtro de data para Reclame Aqui (dataReclam)
 */
function criarFiltroData(dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return {};
  const condicoes = {};
  if (dataInicio) condicoes.$gte = new Date(dataInicio + 'T00:00:00.000Z');
  if (dataFim) condicoes.$lte = new Date(dataFim + 'T23:59:59.999Z');
  return { dataReclam: { $exists: true, $ne: null, ...condicoes } };
}

(async () => {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_ENV ou MONGODB_URI não definido');
    process.exit(1);
  }

  const dataInicio = process.argv[2] || null;
  const dataFim = process.argv[3] || null;

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const filtroData = criarFiltroData(dataInicio, dataFim);
  const collection = db.collection('reclamacoes_reclameAqui');

  const docs = await collection.find(filtroData).toArray();
  const retidos = docs.filter(isRetido);

  console.log('\n============================================================');
  console.log('📋 DIAGNÓSTICO: Retidos - Reclame Aqui');
  console.log('============================================================\n');
  console.log('Critério: motivo "Liberação Chave Pix" + Finalizado.Resolvido=true + pixLiberado=false');
  if (dataInicio || dataFim) {
    console.log(`Filtro de data: ${dataInicio || 'início'} a ${dataFim || 'fim'}`);
  } else {
    console.log('Filtro de data: nenhum (todos os registros)');
  }
  console.log(`\nTotal na collection (com filtro): ${docs.length}`);
  console.log(`Retidos encontrados: ${retidos.length}\n`);

  if (retidos.length === 0) {
    console.log('Nenhum caso retido encontrado.');
    await client.close();
    return;
  }

  retidos.forEach((r, i) => {
    console.log('------------------------------------------------------------');
    console.log(`📌 CASO ${i + 1}`);
    console.log('------------------------------------------------------------');
    console.log('_id:', r._id?.toString());
    console.log('CPF:', r.cpf || '(vazio)');
    console.log('Nome:', r.nome || '(vazio)');
    console.log('idEntrada:', r.idEntrada || '(vazio)');
    console.log('dataReclam:', r.dataReclam);
    console.log('');
    console.log('--- Campos que determinam Retido ---');
    console.log('motivoReduzido:', JSON.stringify(r.motivoReduzido));
    console.log('  → isMotivoLiberacaoChavePix:', isMotivoLiberacaoChavePix(r.motivoReduzido));
    console.log('Finalizado:', JSON.stringify(r.Finalizado));
    console.log('  → Finalizado.Resolvido:', r.Finalizado?.Resolvido);
    console.log('pixLiberado:', r.pixLiberado, '(tipo:', typeof r.pixLiberado + ')');
    console.log('pixStatus (legado):', r.pixStatus ?? '(não definido)');
    console.log('');
  });

  console.log('============================================================');
  console.log('📊 RESUMO - IDs dos casos retidos');
  console.log('============================================================\n');
  retidos.forEach((r, i) => {
    console.log(`${i + 1}. _id: ${r._id} | CPF: ${r.cpf || '-'} | idEntrada: ${r.idEntrada || '-'}`);
  });

  await client.close();
})();

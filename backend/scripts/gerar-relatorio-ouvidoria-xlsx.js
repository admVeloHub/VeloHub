/**
 * Gera planilha XLSX do relatório de ouvidoria (aba Reclamações), alinhada ao GET /api/ouvidoria/relatorios
 * VERSION: v1.0.0 | DATE: 2026-04-10 | AUTHOR: VeloHub Development Team
 *
 * Uso:
 *   node backend/scripts/gerar-relatorio-ouvidoria-xlsx.js [dataInicio] [dataFim] [caminhoSaida.xlsx]
 * Exemplo:
 *   node backend/scripts/gerar-relatorio-ouvidoria-xlsx.js 2026-01-01 2026-04-10
 *
 * Período padrão (sem args): primeiro dia do mês atual até hoje (UTC date string local-ish).
 * Saída padrão: backend/relatorio_ouvidoria_YYYY-MM-DD_HHmm.xlsx
 *
 * Requer: MONGO_ENV (backend/env, backend/.env, FONTE DA VERDADE ou ambiente)
 */

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

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');

const MONGODB_URI = process.env.MONGO_ENV;
const DATABASE_NAME = 'hub_ouvidoria';

function extrairDataResolucaoRelatorio(r) {
  if (!r || r.Finalizado?.Resolvido !== true) return null;
  const dr = r.Finalizado?.dataResolucao;
  if (dr == null || dr === '') return null;
  const s = dr instanceof Date ? dr.toISOString() : String(dr);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function formatarDataResolvidoPlanilha(yyyyMmDd) {
  if (!yyyyMmDd) return '-';
  const m = String(yyyyMmDd).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return '-';
}

function motivoParaCelula(m) {
  if (m == null) return '-';
  if (Array.isArray(m)) return m.filter(Boolean).join(', ') || '-';
  return String(m);
}

function periodoPadrao() {
  const fim = new Date();
  const ini = new Date(fim.getFullYear(), fim.getMonth(), 1);
  const toY = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { dataInicio: toY(ini), dataFim: toY(fim) };
}

async function main() {
  const [, , argIni, argFim, argOut] = process.argv;
  const { dataInicio, dataFim } =
    argIni && argFim ? { dataInicio: argIni, dataFim: argFim } : periodoPadrao();

  if (!MONGODB_URI || !String(MONGODB_URI).trim()) {
    console.error('❌ MONGO_ENV não definido.');
    process.exit(1);
  }

  const criarFiltroData = (collectionName) => {
    const dataInicioDate = new Date(dataInicio);
    const dataFimDate = new Date(`${dataFim}T23:59:59.999Z`);
    if (collectionName === 'reclamacoes_n2Pix') {
      return {
        $or: [
          { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
          { dataEntradaN2: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } },
        ],
      };
    }
    if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial') {
      return {
        $or: [
          { dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
          { dataEntrada: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } },
        ],
      };
    }
    if (collectionName === 'reclamacoes_reclameAqui') {
      return {
        $or: [
          { dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
          { dataReclam: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } },
        ],
      };
    }
    if (collectionName === 'reclamacoes_procon') {
      return {
        $or: [
          { dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
          { dataProcon: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } },
        ],
      };
    }
    return { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } };
  };

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const [bacen, n2Pix, reclameAqui, procon, judicial] = await Promise.all([
    db.collection('reclamacoes_bacen').find(criarFiltroData('reclamacoes_bacen')).sort({ dataEntrada: -1 }).toArray(),
    db.collection('reclamacoes_n2Pix').find(criarFiltroData('reclamacoes_n2Pix')).sort({ dataEntradaN2: -1 }).toArray(),
    db.collection('reclamacoes_reclameAqui').find(criarFiltroData('reclamacoes_reclameAqui')).sort({ dataReclam: -1 }).toArray(),
    db.collection('reclamacoes_procon').find(criarFiltroData('reclamacoes_procon')).sort({ dataProcon: -1 }).toArray(),
    db.collection('reclamacoes_judicial').find(criarFiltroData('reclamacoes_judicial')).sort({ dataEntrada: -1 }).toArray(),
  ]);

  let reclamacoes = [
    ...bacen.map((r) => ({ ...r, tipo: 'BACEN' })),
    ...n2Pix.map((r) => ({ ...r, tipo: 'N2 Pix' })),
    ...reclameAqui.map((r) => ({ ...r, tipo: 'RECLAME AQUI' })),
    ...procon.map((r) => ({ ...r, tipo: 'PROCON' })),
    ...judicial.map((r) => ({ ...r, tipo: 'AÇÃO JUDICIAL' })),
  ].sort((a, b) => {
    const campoA =
      a.tipo === 'N2 Pix' ? 'dataEntradaN2' : a.tipo === 'RECLAME AQUI' ? 'dataReclam' : a.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
    const campoB =
      b.tipo === 'N2 Pix' ? 'dataEntradaN2' : b.tipo === 'RECLAME AQUI' ? 'dataReclam' : b.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
    return new Date(b[campoB]) - new Date(a[campoA]);
  });

  const rows = reclamacoes.map((r, index) => {
    const dataEntrada =
      r.tipo === 'N2 Pix' ? r.dataEntradaN2 : r.tipo === 'RECLAME AQUI' ? r.dataReclam : r.tipo === 'PROCON' ? r.dataProcon : r.dataEntrada;
    const cpf = r.cpf ? `${String(r.cpf).replace(/\D/g, '').slice(0, 3)}***${String(r.cpf).replace(/\D/g, '').slice(9)}` : '';
    const dr = extrairDataResolucaoRelatorio(r);
    return {
      '#': index + 1,
      Nome: r.nome || '-',
      CPF: cpf || '-',
      Tipo: r.tipo || '-',
      Status: r.Finalizado?.Resolvido === true ? 'Resolvido' : 'Em Andamento',
      'Data Entrada': dataEntrada ?? '-',
      'Data Resolvido': formatarDataResolvidoPlanilha(dr),
      Motivo: motivoParaCelula(r.motivoReduzido),
      Responsável: r.responsavel || '-',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Reclamações');

  const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '');
  const outPath =
    argOut ||
    path.join(__dirname, '..', `relatorio_ouvidoria_${dataInicio}_${dataFim}_${stamp}.xlsx`);
  XLSX.writeFile(wb, outPath);

  await client.close();
  console.log(`✅ ${reclamacoes.length} linhas → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

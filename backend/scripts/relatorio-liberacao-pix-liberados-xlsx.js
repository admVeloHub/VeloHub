/**
 * Relatório XLSX: casos com motivo «Liberação chave pix» e pixLiberado=true.
 * VERSION: v1.3.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 * - v1.3.0: data de entrada via formatarDataCalendarioSp (America/Sao_Paulo)
 * - v1.2.0: aba «todos» com todas as collections consolidadas
 * - v1.1.0: inclui reclamacoes_timePortabilidade (Time Portabilidade)
 *
 * hub_ouvidoria — uma aba por coleção `reclamacoes_*` + aba «todos».
 * Colunas: data de entrada, cpf, nome, motivo, pix liberado, descrição, observação.
 * Período padrão: a partir de 01/04/2026 até a ocorrência mais recente (sem limite superior).
 *
 * Uso:
 *   node backend/scripts/relatorio-liberacao-pix-liberados-xlsx.js [--dry-run] [--desde=YYYY-MM-DD] [caminhoSaida.xlsx]
 *
 * Saída padrão: backend/relatorio_liberacao_pix_liberados_YYYY-MM-DD_HHmm.xlsx
 */
'use strict';

const path = require('path');
const fs = require('fs');

(function carregarDotenvFonteDaVerdade() {
  let d = path.resolve(__dirname);
  for (let i = 0; i < 16; i++) {
    const envPath = path.join(d, 'FONTE DA VERDADE', '.env');
    if (fs.existsSync(envPath)) {
      try {
        const dotenv = require(require.resolve('dotenv', {
          paths: [path.resolve(__dirname, '..', '..')],
        }));
        dotenv.config({ path: envPath });
      } catch (_e) {
        /* Cloud Run / sem dotenv */
      }
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})();

const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');

const { MONGODB_URI } = require('./loadMongoUri');
const { formatarDataCalendarioSp } = require('../utils/formatarDataCalendarioSp');

const DB_OUVIDORIA = 'hub_ouvidoria';
const DATA_INICIO_PADRAO = '2026-04-01';

const COLUNAS = [
  'Data de entrada',
  'CPF',
  'Nome',
  'Motivo',
  'Pix liberado',
  'Descrição',
  'Observação',
];

const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_procon',
  'reclamacoes_judicial',
  'reclamacoes_timePortabilidade',
];

/** @param {string|Array<string>|undefined} motivoReduzido */
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

/** @param {string|Array<string>|undefined} motivoReduzido */
function isMotivoLiberacaoChavePix(motivoReduzido) {
  const norm = normalizarMotivoParaComparacao(motivoReduzido);
  return norm.includes('liberação chave pix') || norm.includes('liberacao chave pix');
}

/** @param {string|Array<string>|undefined} motivoReduzido */
function formatarMotivo(motivoReduzido) {
  if (!motivoReduzido) return '';
  if (Array.isArray(motivoReduzido)) {
    return motivoReduzido.map((m) => String(m ?? '').trim()).filter(Boolean).join('; ');
  }
  return String(motivoReduzido).trim();
}

/** @param {Record<string, unknown>} doc @param {string} collectionName */
function getCampoDataEntrada(doc, collectionName) {
  if (collectionName === 'reclamacoes_reclameAqui') return doc.dataReclam;
  if (collectionName === 'reclamacoes_n2Pix') return doc.dataEntradaN2;
  if (collectionName === 'reclamacoes_procon') return doc.dataProcon;
  if (
    collectionName === 'reclamacoes_bacen' ||
    collectionName === 'reclamacoes_judicial' ||
    collectionName === 'reclamacoes_timePortabilidade'
  ) {
    return doc.dataEntrada;
  }
  return doc.createdAt;
}

/** @param {string} collectionName @param {string} dataInicioIso */
function criarFiltroDataEntrada(collectionName, dataInicioIso) {
  const dataInicioDate = new Date(`${dataInicioIso}T00:00:00.000Z`);
  const condicao = { $exists: true, $ne: null, $gte: dataInicioDate };

  if (
    collectionName === 'reclamacoes_bacen' ||
    collectionName === 'reclamacoes_judicial' ||
    collectionName === 'reclamacoes_timePortabilidade'
  ) {
    return { dataEntrada: condicao };
  }
  if (collectionName === 'reclamacoes_n2Pix') {
    return { dataEntradaN2: condicao };
  }
  if (collectionName === 'reclamacoes_reclameAqui') {
    return { dataReclam: condicao };
  }
  if (collectionName === 'reclamacoes_procon') {
    return { dataProcon: condicao };
  }
  return { createdAt: { $gte: dataInicioDate } };
}

/** @param {string} collectionName @param {string} dataInicioIso */
function getSortCampoDataEntrada(collectionName) {
  if (collectionName === 'reclamacoes_reclameAqui') return { dataReclam: 1 };
  if (collectionName === 'reclamacoes_n2Pix') return { dataEntradaN2: 1 };
  if (collectionName === 'reclamacoes_procon') return { dataProcon: 1 };
  return { dataEntrada: 1 };
}

/** @param {string} nomeAba — máx. 31 caracteres (limite Excel) */
function truncarNomeAba(nomeAba) {
  const s = String(nomeAba || '').trim() || 'aba';
  return s.length <= 31 ? s : s.slice(0, 31);
}

/**
 * @param {Array<Record<string, string>>} rows
 * @param {string} tituloAba
 */
function sheetFromRows(rows, tituloAba) {
  const dataRows = rows.map((r) => COLUNAS.map((c) => r[c] ?? ''));
  const titulo = typeof tituloAba === 'string' && tituloAba.trim() ? tituloAba.trim() : '';
  const lastColIdx = COLUNAS.length - 1;

  /** @type {unknown[][]} */
  let aoa;
  let headerRowIdx;

  if (titulo) {
    aoa = [[titulo, ...Array(lastColIdx).fill('')], COLUNAS, ...dataRows];
    headerRowIdx = 1;
  } else {
    aoa = [COLUNAS, ...dataRows];
    headerRowIdx = 0;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const nRow = aoa.length;
  const endAddr = XLSX.utils.encode_cell({ r: nRow - 1, c: lastColIdx });
  const filtStartAddr = XLSX.utils.encode_cell({ r: headerRowIdx, c: 0 });

  ws['!ref'] = `A1:${endAddr}`;
  ws['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 12 },
    { wch: 40 },
    { wch: 40 },
  ];

  if (titulo) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } }];
  }

  ws['!autofilter'] = { ref: `${filtStartAddr}:${endAddr}` };
  return ws;
}

function defaultOutPath() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return path.join(
    __dirname,
    '..',
    `relatorio_liberacao_pix_liberados_${y}-${mo}-${d}_${h}${mi}.xlsx`
  );
}

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  let dataInicio = DATA_INICIO_PADRAO;
  let outPath = null;

  for (const arg of argv) {
    if (arg === '--dry-run') continue;
    if (arg.startsWith('--desde=')) {
      dataInicio = arg.slice('--desde='.length).trim();
      continue;
    }
    if (!outPath) {
      outPath = path.resolve(process.cwd(), arg);
    }
  }

  if (!outPath) {
    outPath = defaultOutPath();
  }

  return { dryRun, dataInicio, outPath };
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @param {string} dataInicioIso
 */
async function coletarPorCollection(db, collectionName, dataInicioIso) {
  const filtro = {
    pixLiberado: true,
    ...criarFiltroDataEntrada(collectionName, dataInicioIso),
  };

  const docs = await db
    .collection(collectionName)
    .find(filtro, {
      projection: {
        cpf: 1,
        nome: 1,
        motivoReduzido: 1,
        pixLiberado: 1,
        motivoDetalhado: 1,
        observacoes: 1,
        dataEntrada: 1,
        dataEntradaN2: 1,
        dataReclam: 1,
        dataProcon: 1,
        createdAt: 1,
      },
    })
    .sort(getSortCampoDataEntrada(collectionName))
    .toArray();

  const filtrados = docs.filter((doc) => isMotivoLiberacaoChavePix(doc.motivoReduzido));

  return filtrados.map((doc) => {
    const dataRaw = getCampoDataEntrada(doc, collectionName);
    return {
      'Data de entrada': formatarDataCalendarioSp(dataRaw),
      CPF: doc.cpf != null ? String(doc.cpf).trim() : '',
      Nome: doc.nome != null ? String(doc.nome).trim() : '',
      Motivo: formatarMotivo(doc.motivoReduzido),
      'Pix liberado': doc.pixLiberado === true ? 'TRUE' : 'FALSE',
      Descrição: doc.motivoDetalhado != null ? String(doc.motivoDetalhado).trim() : '',
      Observação: doc.observacoes != null ? String(doc.observacoes).trim() : '',
      _dataSort: dataRaw ? new Date(dataRaw).getTime() : 0,
    };
  });
}

async function main() {
  const { dryRun, dataInicio, outPath } = parseArgs(process.argv.slice(2));

  if (dryRun) {
    console.log('=== DRY-RUN (sem gravar XLSX) ===\n');
  }
  console.log(`Período: a partir de ${dataInicio} (sem limite superior)\n`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  try {
    const db = client.db(DB_OUVIDORIA);
    const wb = XLSX.utils.book_new();
    let totalGeral = 0;
    /** @type {Record<string, Array<Record<string, string|number>>>} */
    const porCollection = {};

    for (const collName of COLLECTIONS) {
      const rows = await coletarPorCollection(db, collName, dataInicio);
      porCollection[collName] = rows;
      totalGeral += rows.length;
      console.log(`  • ${collName}: ${rows.length} caso(s)`);
    }

    console.log(`\nTotal geral: ${totalGeral} caso(s)`);

    if (dryRun) {
      console.log('\n--- Fim do dry-run (nenhum arquivo escrito) ---');
      return;
    }

    const consolidado = COLLECTIONS.flatMap((collName) => porCollection[collName] || []).sort(
      (a, b) => Number(a._dataSort || 0) - Number(b._dataSort || 0)
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(
        consolidado,
        `Todas as collections — Liberação chave pix + pixLiberado=true (desde ${dataInicio})`
      ),
      truncarNomeAba('todos')
    );

    for (const collName of COLLECTIONS) {
      const titulo = `${collName} — Liberação chave pix + pixLiberado=true (desde ${dataInicio})`;
      XLSX.utils.book_append_sheet(
        wb,
        sheetFromRows(porCollection[collName] || [], titulo),
        truncarNomeAba(collName.replace(/^reclamacoes_/, ''))
      );
    }

    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    XLSX.writeFile(wb, outPath);
    console.log(`\nArquivo gerado: ${outPath}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

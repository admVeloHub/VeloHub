/**
 * Exportação XLSX: requisições de liberação PIX (hub_escalacoes).
 * VERSION: v1.1.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 * - v1.1.0: datas via formatarDataCalendarioSp (America/Sao_Paulo)
 *
 * Fontes:
 *  - hub_escalacoes.liberacao_pix_prod (todos os documentos)
 *  - hub_escalacoes.solicitacoes_tecnicas com tipo «Exclusão de Chave PIX» (legado Liberação chave pix)
 *
 * Colunas: CPF | colaborador nome | data de pedido (createdAt) | data feito (updatedAt)
 * Abas: total | liberação | solicitacoes
 *
 * Uso:
 *   node backend/scripts/export-liberacao-pix-requisicoes-xlsx.js [--dry-run] [caminhoSaida.xlsx]
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

const DB_ESCALACOES = 'hub_escalacoes';
const TIPO_LIBERACAO_CHAVE_PIX = 'Exclusão de Chave PIX';

const COLUNAS = ['CPF', 'colaborador nome', 'data de pedido', 'data feito'];

/** @param {unknown} v */
function normalizeCpf(v) {
  return String(v == null ? '' : v).replace(/\D/g, '');
}

/** @param {Record<string, unknown>} doc */
function extrairColaboradorNome(doc) {
  const direto = doc.colaboradorNome != null ? String(doc.colaboradorNome).trim() : '';
  if (direto) return direto;
  const payload = doc.payload && typeof doc.payload === 'object' ? doc.payload : null;
  const agente = payload && payload.agente != null ? String(payload.agente).trim() : '';
  return agente;
}

/** @param {Record<string, unknown>} doc */
function docParaLinha(doc) {
  return {
    CPF: normalizeCpf(doc.cpf),
    'colaborador nome': extrairColaboradorNome(doc),
    'data de pedido': formatarDataCalendarioSp(doc.createdAt),
    'data feito': formatarDataCalendarioSp(doc.updatedAt),
    _sortPedido: doc.createdAt ? new Date(doc.createdAt).getTime() : 0,
  };
}

/**
 * @param {import('mongodb').Db} dbEsc
 * @param {string} collectionName
 * @param {Record<string, unknown>|null} filtroExtra
 */
async function coletarCollection(dbEsc, collectionName, filtroExtra) {
  const filtro = filtroExtra || {};
  const docs = await dbEsc
    .collection(collectionName)
    .find(filtro, {
      projection: {
        cpf: 1,
        colaboradorNome: 1,
        payload: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map(docParaLinha);
}

/** @param {Array<Record<string, string|number>>} rows */
function ordenarLinhas(rows) {
  return [...rows].sort(
    (a, b) => Number(a._sortPedido || 0) - Number(b._sortPedido || 0) || String(a.CPF).localeCompare(String(b.CPF))
  );
}

/** @param {Array<Record<string, string|number>>} rows @param {string} tituloAba */
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
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 14 }];

  if (titulo) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } }];
  }

  ws['!autofilter'] = { ref: `${filtStartAddr}:${endAddr}` };
  return ws;
}

/** @param {string} nomeAba */
function truncarNomeAba(nomeAba) {
  const s = String(nomeAba || '').trim() || 'aba';
  return s.length <= 31 ? s : s.slice(0, 31);
}

function defaultOutPath() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return path.join(__dirname, '..', `export_liberacao_pix_requisicoes_${y}-${mo}-${d}_${h}${mi}.xlsx`);
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const outArg = argv.filter((a) => a !== '--dry-run')[0];
  const outPath = outArg ? path.resolve(process.cwd(), outArg) : defaultOutPath();

  if (dryRun) {
    console.log('=== DRY-RUN (sem gravar XLSX) ===\n');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  try {
    const dbEsc = client.db(DB_ESCALACOES);

    console.log('Coletando hub_escalacoes.liberacao_pix_prod...');
    const linhasLiberacao = ordenarLinhas(await coletarCollection(dbEsc, 'liberacao_pix_prod', null));
    console.log(`  → ${linhasLiberacao.length} documento(s)`);

    console.log(`Coletando hub_escalacoes.solicitacoes_tecnicas (tipo «${TIPO_LIBERACAO_CHAVE_PIX}»)...`);
    const linhasSolicitacoes = ordenarLinhas(
      await coletarCollection(dbEsc, 'solicitacoes_tecnicas', { tipo: TIPO_LIBERACAO_CHAVE_PIX })
    );
    console.log(`  → ${linhasSolicitacoes.length} documento(s)`);

    const linhasTotal = ordenarLinhas([...linhasLiberacao, ...linhasSolicitacoes]);
    console.log(`\nTotal consolidado: ${linhasTotal.length} linha(s)`);

    if (dryRun) {
      console.log('\n--- Fim do dry-run (nenhum arquivo escrito) ---');
      return;
    }

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(linhasTotal, 'Total — liberação PIX + solicitações legado'),
      truncarNomeAba('total')
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(linhasLiberacao, 'liberacao_pix_prod'),
      truncarNomeAba('liberação')
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(linhasSolicitacoes, `solicitacoes_tecnicas — ${TIPO_LIBERACAO_CHAVE_PIX}`),
      truncarNomeAba('solicitacoes')
    );

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

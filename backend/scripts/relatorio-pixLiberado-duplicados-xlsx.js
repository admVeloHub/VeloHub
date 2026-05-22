/**
 * Lista documentos com liberação PIX e marca CPFs duplicados; gera planilha XLSX.
 * VERSION: v1.3.0 | DATE: 2026-05-15 | AUTHOR: VeloHub Development Team
 * - v1.3.0: cada aba com região de tabela (cabeçalho + dados, AutoFiltro e larguras de coluna).
 * - v1.2.0: carrega primeiro `FONTE DA VERDADE/.env` (caminho do ecossistema) para garantir `MONGO_ENV`.
 * - v1.1.0: flag --dry-run (somente leitura + resumo no console, sem gerar planilha)
 *
 * 1) hub_ouvidoria: todas as coleções cujo nome começa com `reclamacoes_`, filtro `pixLiberado === true`.
 *    Colunas: cpf, pixLiberado, DUPLICADO (SIM se o mesmo CPF normalizado aparece em mais de um documento nesse conjunto).
 *
 * 2) hub_escalacoes:
 *    - Aba «solicitações legado»: `solicitacoes_tecnicas` com `tipo: 'Exclusão de Chave PIX'`.
 *    - Aba «Liberação Chave Pix»: `liberacao_pix_prod` (tipicamente mesmo tipo; filtro explícito no tipo).
 *    Mesmas colunas; DUPLICADO por CPF dentro de cada aba (independentemente da outra aba).
 *
 * Uso:
 *   node backend/scripts/relatorio-pixLiberado-duplicados-xlsx.js [--dry-run] [caminhoSaida.xlsx]
 *
 * `--dry-run`: consulta o MongoDB, imprime totais e linhas com DUPLICADO=SIM; **não** grava XLSX.
 *
 * Saída padrão: backend/relatorio_pixLiberado_duplicados_YYYY-MM-DD_HHmm.xlsx
 *
 * Requer: `MONGO_ENV` ou `MONGODB_URI`. O `.env` em **`FONTE DA VERDADE`** (do ecossistema,
 * ex.: `...\Ecosistema Velohub\FONTE DA VERDADE\.env`) é carregado automaticamente ao subir
 * pastas a partir deste script; na sequência vale `loadMongoUri.js`.
 */
'use strict';

const path = require('path');
const fs = require('fs');

/** Garante leitura de `FONTE DA VERDADE/.env` (ex.: onde está `MONGO_ENV`) antes de `loadMongoUri`. */
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

const DB_OUVIDORIA = 'hub_ouvidoria';
const DB_ESCALACOES = 'hub_escalacoes';
const TIPO_EXCLUSAO_PIX = 'Exclusão de Chave PIX';

function normalizeCpf(v) {
  return String(v == null ? '' : v).replace(/\D/g, '');
}

function duplicadoKey(cpfNorm) {
  return cpfNorm.length > 0 ? cpfNorm : '__CPF_VAZIO__';
}

/**
 * @param {Array<{ cpf: string, pixLiberado: boolean|string }>} rows
 */
function aplicarColunaDuplicado(rows) {
  const counts = new Map();
  for (const r of rows) {
    const k = duplicadoKey(normalizeCpf(r.cpf));
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  for (const r of rows) {
    const k = duplicadoKey(normalizeCpf(r.cpf));
    r.DUPLICADO = (counts.get(k) || 0) > 1 ? 'SIM' : 'NÃO';
  }
  return rows;
}

function boolParaCelula(v) {
  if (v === true) return 'TRUE';
  if (v === false) return 'FALSE';
  return '';
}

/**
 * @param {import('mongodb').Db} dbOuv
 * @param {{ dryRun?: boolean }} [opts]
 */
async function coletarOuvidoriaPixLiberado(dbOuv, opts = {}) {
  const { dryRun = false } = opts;
  const meta = await dbOuv.listCollections().toArray();
  const names = meta.map((m) => m.name).filter((n) => /^reclamacoes_/i.test(n));
  names.sort();

  const rows = [];
  for (const collName of names) {
    const cursor = dbOuv.collection(collName).find(
      { pixLiberado: true },
      { projection: { cpf: 1, pixLiberado: 1 } }
    );
    const docs = await cursor.toArray();
    if (dryRun && docs.length > 0) {
      console.log(`    • ${collName}: ${docs.length} documento(s)`);
    }
    for (const doc of docs) {
      rows.push({
        cpf: normalizeCpf(doc.cpf),
        pixLiberado: boolParaCelula(doc.pixLiberado === true),
      });
    }
  }
  aplicarColunaDuplicado(rows);
  return rows;
}

/**
 * @param {import('mongodb').Db} dbEsc
 * @param {string} collectionName
 */
async function coletarEscalacoesExclusaoPix(dbEsc, collectionName) {
  const filter = { tipo: TIPO_EXCLUSAO_PIX };
  const docs = await dbEsc
    .collection(collectionName)
    .find(filter, { projection: { cpf: 1, pixLiberado: 1 } })
    .toArray();

  const rows = docs.map((doc) => ({
    cpf: normalizeCpf(doc.cpf),
    pixLiberado: boolParaCelula(doc.pixLiberado === true),
  }));
  aplicarColunaDuplicado(rows);
  return rows;
}

/**
 * Uma tabela por aba: cabeçalho das colunas, dados, merge na linha de título (opcional),
 * AutoFiltro na região do cabeçalho+e dados e colunas dimensionadas.
 * OOXML «Tabela do Excel» (table style) não é suportado pelo SheetJS community.
 *
 * @param {Array<{ cpf: string, pixLiberado: string, DUPLICADO: string }>} rows
 * @param {string} [tituloAba=''] — se preenchido, linha 1 mesclada (A:C) como rótulo; linha seguinte é o cabeçalho.
 */
function sheetFromRows(rows, tituloAba = '') {
  const header = ['cpf', 'pixLiberado', 'DUPLICADO'];
  const dataRows = rows.map((r) => [r.cpf, r.pixLiberado, r.DUPLICADO]);

  /** @type {unknown[][]} */
  let aoa;
  /** @type {number} Índice 0-based da linha «cpf|pixLiberado|DUPLICADO» */
  let headerRowIdx;

  const titulo = typeof tituloAba === 'string' && tituloAba.trim() ? tituloAba.trim() : '';

  if (titulo) {
    aoa = [[titulo, '', ''], header, ...dataRows];
    headerRowIdx = 1;
  } else {
    aoa = [header, ...dataRows];
    headerRowIdx = 0;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const nRow = aoa.length;
  const lastColIdx = header.length - 1;
  const endAddr = XLSX.utils.encode_cell({ r: nRow - 1, c: lastColIdx });
  const filtStartAddr = XLSX.utils.encode_cell({ r: headerRowIdx, c: 0 });
  const fullRef = `A1:${endAddr}`;

  ws['!ref'] = fullRef;
  ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }];

  if (titulo) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } }];
  }

  ws['!autofilter'] = {
    ref: `${filtStartAddr}:${endAddr}`,
  };

  return ws;
}

function defaultOutPath() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return path.join(__dirname, '..', `relatorio_pixLiberado_duplicados_${y}-${mo}-${d}_${h}${mi}.xlsx`);
}

function contarDuplicadoSim(rows) {
  return rows.filter((r) => r.DUPLICADO === 'SIM').length;
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
    const dbOuv = client.db(DB_OUVIDORIA);
    const dbEsc = client.db(DB_ESCALACOES);

    console.log('Consultando hub_ouvidoria (reclamacoes_* com pixLiberado=true)...');
    if (dryRun) console.log('  Por coleção:');
    const ouvRows = await coletarOuvidoriaPixLiberado(dbOuv, { dryRun });
    console.log(`  → Total: ${ouvRows.length} linha(s), DUPLICADO=SIM: ${contarDuplicadoSim(ouvRows)}`);

    console.log('Consultando hub_escalacoes.solicitacoes_tecnicas (legado «Exclusão de Chave PIX»)...');
    const legadoRows = await coletarEscalacoesExclusaoPix(dbEsc, 'solicitacoes_tecnicas');
    console.log(
      `  → ${legadoRows.length} linha(s), DUPLICADO=SIM: ${contarDuplicadoSim(legadoRows)}`
    );

    console.log('Consultando hub_escalacoes.liberacao_pix_prod («Liberação Chave Pix»)...');
    const libRows = await coletarEscalacoesExclusaoPix(dbEsc, 'liberacao_pix_prod');
    console.log(`  → ${libRows.length} linha(s), DUPLICADO=SIM: ${contarDuplicadoSim(libRows)}`);

    if (dryRun) {
      console.log('\n--- Fim do dry-run (nenhum arquivo escrito) ---');
      return;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(ouvRows, 'hub_ouvidoria - reclamacoes_* com pixLiberado=true'),
      'hub_ouvidoria_pixLiberado'
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(
        legadoRows,
        'hub_escalacoes - solicitacoes_tecnicas (Exclusao de Chave PIX)'
      ),
      'solicitacoes_legado_pix'
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(
        libRows,
        'hub_escalacoes - liberacao_pix_prod (aba Liberacao chave PIX)'
      ),
      'liberacao_chave_pix'
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

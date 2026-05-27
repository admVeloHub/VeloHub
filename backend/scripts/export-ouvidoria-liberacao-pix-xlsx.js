/**

 * Exportação XLSX: hub_ouvidoria — motivoReduzido «Liberação chave pix» (todos os casos).

 * VERSION: v1.0.1 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 * - v1.0.1: colaboradorNome = responsavel (fallback colaboradorNome)

 *

 * Colunas: cpf | colaboradorNome | pixLiberado | data de entrada | createdAt

 * Datas em America/Sao_Paulo (evita off-by-one UTC em campos de calendário).

 *

 * Uso:

 *   node backend/scripts/export-ouvidoria-liberacao-pix-xlsx.js [--dry-run] [caminhoSaida.xlsx]

 *

 * Saída padrão: backend/export_ouvidoria_liberacao_pix_YYYY-MM-DD_HHmm.xlsx

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

const { formatarDataCalendarioSp, formatarDataHoraSp } = require('../utils/formatarDataCalendarioSp');



const DB_OUVIDORIA = 'hub_ouvidoria';



const COLUNAS = ['cpf', 'colaboradorNome', 'pixLiberado', 'data de entrada', 'createdAt'];



const FILTRO_MOTIVO_LIBERACAO_PIX = {

  $or: [

    { motivoReduzido: { $regex: 'liberação chave pix', $options: 'i' } },

    { motivoReduzido: { $regex: 'liberacao chave pix', $options: 'i' } },

  ],

};



/** @param {string|Array<string>|undefined} motivoReduzido */

function isMotivoLiberacaoChavePix(motivoReduzido) {

  if (!motivoReduzido) return false;

  const partes = Array.isArray(motivoReduzido) ? motivoReduzido : [motivoReduzido];

  return partes.some((m) => {

    const norm = String(m ?? '').toLowerCase();

    return norm.includes('liberação chave pix') || norm.includes('liberacao chave pix');

  });

}



/** @param {Record<string, unknown>} doc */

function extrairColaboradorNome(doc) {

  const resp = doc.responsavel != null ? String(doc.responsavel).trim() : '';

  if (resp) return resp;

  const colab = doc.colaboradorNome != null ? String(doc.colaboradorNome).trim() : '';

  return colab;

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



/** @param {string} collectionName */

function getSortCampoDataEntrada(collectionName) {

  if (collectionName === 'reclamacoes_reclameAqui') return { dataReclam: 1 };

  if (collectionName === 'reclamacoes_n2Pix') return { dataEntradaN2: 1 };

  if (collectionName === 'reclamacoes_procon') return { dataProcon: 1 };

  return { dataEntrada: 1 };

}



/** @param {string} nomeAba */

function truncarNomeAba(nomeAba) {

  const s = String(nomeAba || '').trim() || 'aba';

  return s.length <= 31 ? s : s.slice(0, 31);

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

  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 20 }];



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

  return path.join(__dirname, '..', `export_ouvidoria_liberacao_pix_${y}-${mo}-${d}_${h}${mi}.xlsx`);

}



/**

 * @param {import('mongodb').Db} db

 * @param {string} collectionName

 */

async function coletarPorCollection(db, collectionName) {

  const docs = await db

    .collection(collectionName)

    .find(FILTRO_MOTIVO_LIBERACAO_PIX, {

      projection: {

        cpf: 1,

        colaboradorNome: 1,

        responsavel: 1,

        pixLiberado: 1,

        motivoReduzido: 1,

        dataEntrada: 1,

        dataEntradaN2: 1,

        dataReclam: 1,

        dataProcon: 1,

        createdAt: 1,

      },

    })

    .sort(getSortCampoDataEntrada(collectionName))

    .toArray();



  return docs

    .filter((doc) => isMotivoLiberacaoChavePix(doc.motivoReduzido))

    .map((doc) => {

      const dataRaw = getCampoDataEntrada(doc, collectionName);

      return {

        cpf: doc.cpf != null ? String(doc.cpf).trim() : '',

        colaboradorNome: extrairColaboradorNome(doc),

        pixLiberado: doc.pixLiberado === true ? 'TRUE' : 'FALSE',

        'data de entrada': formatarDataCalendarioSp(dataRaw),

        createdAt: formatarDataHoraSp(doc.createdAt),

        _dataSort: dataRaw ? new Date(dataRaw).getTime() : doc.createdAt ? new Date(doc.createdAt).getTime() : 0,

        _collection: collectionName,

      };

    });

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

    const db = client.db(DB_OUVIDORIA);

    const meta = await db.listCollections().toArray();

    const collections = meta

      .map((m) => m.name)

      .filter((n) => /^reclamacoes_/i.test(n))

      .sort();



    const wb = XLSX.utils.book_new();

    let totalGeral = 0;

    /** @type {Record<string, Array<Record<string, string|number>>>} */

    const porCollection = {};



    for (const collName of collections) {

      const rows = await coletarPorCollection(db, collName);

      porCollection[collName] = rows;

      totalGeral += rows.length;

      console.log(`  • ${collName}: ${rows.length} caso(s)`);

    }



    console.log(`\nTotal geral: ${totalGeral} caso(s)`);



    if (dryRun) {

      console.log('\n--- Fim do dry-run (nenhum arquivo escrito) ---');

      return;

    }



    const consolidado = collections

      .flatMap((collName) => porCollection[collName] || [])

      .sort((a, b) => Number(a._dataSort || 0) - Number(b._dataSort || 0));



    XLSX.utils.book_append_sheet(

      wb,

      sheetFromRows(consolidado, 'Todas as collections — Liberação chave pix'),

      truncarNomeAba('todos')

    );



    for (const collName of collections) {

      const titulo = `${collName} — Liberação chave pix`;

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



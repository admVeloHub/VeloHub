/**
 * Auditoria XLSX: liberação PIX — requisições × reclamações.
 * VERSION: v2.3.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 * - v2.3.0: coluna Data via formatarDataCalendarioSp (America/Sao_Paulo)
 * - v2.2.0: escopo reclamações = motivo «Liberação chave pix» (não só pixLiberado=true); coluna pixLiberado; requisições sem «feito» incluídas
 * - v2.1.0: Data = reply[].at quando status «feito» (fallback updatedAt legado); coluna colaboradorNome
node backend *
 * Fontes:
 *  - hub_ouvidoria.reclamacoes_* com motivoReduzido «Liberação chave pix»
 *  - hub_escalacoes.liberacao_pix_prod + solicitacoes_tecnicas legado (Exclusão de Chave PIX)
 *
 * Colunas: CPF | Data | colaboradorNome | Requisição | Reclamação | pixLiberado | tipo de reclamação | Produto
 *
 * Uso:
 *   node backend/scripts/auditoria-liberacao-pix-xlsx.js [--dry-run] [caminhoSaida.xlsx]
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');

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
const DB_ESCALACOES = 'hub_escalacoes';
const TIPO_EXCLUSAO_PIX = 'Exclusão de Chave PIX';

const COLUNAS = [
  'CPF',
  'Data',
  'colaboradorNome',
  'Requisição',
  'Reclamação',
  'pixLiberado',
  'tipo de reclamação',
  'Produto',
];

const FILTRO_MOTIVO_LIBERACAO_PIX = {
  $or: [
    { motivoReduzido: { $regex: 'liberação chave pix', $options: 'i' } },
    { motivoReduzido: { $regex: 'liberacao chave pix', $options: 'i' } },
  ],
};

const TIPO_POR_COLECAO = {
  reclamacoes_bacen: 'BACEN',
  reclamacoes_n2Pix: 'OUVIDORIA',
  reclamacoes_reclameAqui: 'RECLAME_AQUI',
  reclamacoes_procon: 'PROCON',
  reclamacoes_judicial: 'JUDICIAL',
  reclamacoes_timePortabilidade: 'TIME_PORTABILIDADE',
};

/** @param {unknown} v */
function normalizeCpf(v) {
  return String(v == null ? '' : v).replace(/\D/g, '');
}

/** @param {string} collectionName @param {Record<string, unknown>} doc */
function tipoReclamacaoLabel(collectionName, doc) {
  const t = doc.tipo != null ? String(doc.tipo).trim() : '';
  if (t) return t;
  return TIPO_POR_COLECAO[collectionName] || collectionName.replace(/^reclamacoes_/, '');
}

/** @param {string|Array<string>|undefined} motivoReduzido */
function isMotivoLiberacaoChavePix(motivoReduzido) {
  if (!motivoReduzido) return false;
  const partes = Array.isArray(motivoReduzido) ? motivoReduzido : [motivoReduzido];
  return partes.some((m) => {
    const norm = String(m ?? '').toLowerCase();
    return norm.includes('liberação chave pix') || norm.includes('liberacao chave pix');
  });
}

/** @param {unknown} v */
function boolParaSimNao(v) {
  return v === true ? 'sim' : 'não';
}

/** @param {unknown} raw */
function normalizarProduto(raw) {
  const p = String(raw == null ? '' : raw).trim();
  if (!p) return '';
  const lower = p.toLowerCase();
  if (lower.includes('2026')) return 'Antecipação 2026';
  if (lower.includes('antecip')) return 'Antecipação';
  return p;
}

/** @param {unknown} status */
function isStatusFeito(status) {
  const s = String(status == null ? '' : status).trim().toLowerCase();
  return s === 'feito';
}

/**
 * Data de resolução: reply[].at do item com status «feito»; legado sem `at` → updatedAt.
 * @param {Record<string, unknown>} doc
 * @returns {unknown|null}
 */
function extrairDataResolucaoFeito(doc) {
  const reply = Array.isArray(doc.reply) ? doc.reply : [];
  /** @type {Array<{ at: unknown, idx: number }>} */
  const feitos = [];

  reply.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    if (!isStatusFeito(item.status)) return;
    feitos.push({ at: item.at, idx });
  });

  if (feitos.length === 0) return null;

  feitos.sort((a, b) => {
    const ta = a.at != null && a.at !== '' ? new Date(a.at).getTime() : 0;
    const tb = b.at != null && b.at !== '' ? new Date(b.at).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return a.idx - b.idx;
  });

  const ultimo = feitos[feitos.length - 1];
  if (ultimo.at != null && ultimo.at !== '') return ultimo.at;
  return doc.updatedAt || null;
}

/** @param {Record<string, unknown>} doc */
function extrairColaboradorNome(doc) {
  const direto = doc.colaboradorNome != null ? String(doc.colaboradorNome).trim() : '';
  if (direto) return direto;
  const payload = doc.payload && typeof doc.payload === 'object' ? doc.payload : null;
  const agente = payload && payload.agente != null ? String(payload.agente).trim() : '';
  return agente;
}

/**
 * @param {import('mongodb').Db} dbOuv
 */
async function coletarReclamacoesLiberacaoChavePix(dbOuv) {
  const meta = await dbOuv.listCollections().toArray();
  const names = meta.map((m) => m.name).filter((n) => /^reclamacoes_/i.test(n));
  names.sort();

  /** @type {Array<{ id: string, cpf: string, tipo: string, produto: string, pixLiberado: boolean }>} */
  const rows = [];

  for (const collName of names) {
    const docs = await dbOuv
      .collection(collName)
      .find(FILTRO_MOTIVO_LIBERACAO_PIX, {
        projection: { cpf: 1, tipo: 1, produto: 1, pixLiberado: 1, motivoReduzido: 1 },
      })
      .toArray();

    for (const doc of docs) {
      if (!isMotivoLiberacaoChavePix(doc.motivoReduzido)) continue;
      const id = doc._id != null ? String(doc._id) : '';
      if (!id) continue;
      rows.push({
        id,
        cpf: normalizeCpf(doc.cpf),
        tipo: tipoReclamacaoLabel(collName, doc),
        produto: normalizarProduto(doc.produto),
        pixLiberado: doc.pixLiberado === true,
      });
    }
  }

  return rows;
}

/**
 * @param {import('mongodb').Db} dbEsc
 */
async function coletarRequisicoesLiberacaoPix(dbEsc) {
  /** @type {Array<{ id: string, cpf: string, dataResolucao: unknown|null, colaboradorNome: string, pixLiberado: boolean, ouvidoriaReclamacaoId: string|null }>} */
  const rows = [];

  const proj = {
    cpf: 1,
    colaboradorNome: 1,
    payload: 1,
    reply: 1,
    updatedAt: 1,
    ouvidoriaReclamacaoId: 1,
    pixLiberado: 1,
  };

  for (const collName of ['liberacao_pix_prod', 'solicitacoes_tecnicas']) {
    const docs = await dbEsc
      .collection(collName)
      .find({ tipo: TIPO_EXCLUSAO_PIX }, { projection: proj })
      .toArray();

    for (const doc of docs) {
      const id = doc._id != null ? String(doc._id) : '';
      if (!id) continue;
      let ouvId = null;
      if (doc.ouvidoriaReclamacaoId != null) {
        const raw = doc.ouvidoriaReclamacaoId;
        ouvId = raw instanceof ObjectId ? String(raw) : String(raw).trim();
      }
      rows.push({
        id,
        cpf: normalizeCpf(doc.cpf),
        dataResolucao: extrairDataResolucaoFeito(doc),
        colaboradorNome: extrairColaboradorNome(doc),
        pixLiberado: doc.pixLiberado === true,
        ouvidoriaReclamacaoId: ouvId || null,
      });
    }
  }

  return rows;
}

/**
 * @typedef {{ cpf: string, data: string, colaboradorNome: string, requisicao: boolean, reclamacao: boolean, pixLiberado: boolean, tipo: string, produto: string, _sort: number, _recIds: Set<string> }} LinhaAgg
 */

/**
 * @param {Array<{ id: string, cpf: string, tipo: string, produto: string, pixLiberado: boolean }>} reclamacoes
 * @param {Array<{ id: string, cpf: string, dataResolucao: unknown|null, colaboradorNome: string, pixLiberado: boolean, ouvidoriaReclamacaoId: string|null }>} requisicoes
 */
function montarLinhasAuditoria(reclamacoes, requisicoes) {
  /** @type {Map<string, { id: string, cpf: string, tipo: string, produto: string, pixLiberado: boolean }>} */
  const recPorId = new Map(reclamacoes.map((r) => [r.id, r]));

  /** @type {Map<string, LinhaAgg>} */
  const linhasPorChave = new Map();

  /** @param {string} chave @param {Partial<LinhaAgg>} patch */
  function upsert(chave, patch) {
    const prev = linhasPorChave.get(chave);
    if (!prev) {
      linhasPorChave.set(chave, {
        cpf: patch.cpf || '',
        data: patch.data || '',
        colaboradorNome: patch.colaboradorNome || '',
        requisicao: patch.requisicao === true,
        reclamacao: patch.reclamacao === true,
        pixLiberado: patch.pixLiberado === true,
        tipo: patch.tipo || '',
        produto: patch.produto || '',
        _sort: patch._sort || 0,
        _recIds: patch._recIds || new Set(),
      });
      return;
    }
    if (patch.requisicao) prev.requisicao = true;
    if (patch.reclamacao) prev.reclamacao = true;
    if (patch.pixLiberado) prev.pixLiberado = true;
    if (patch.tipo && !prev.tipo) prev.tipo = patch.tipo;
    if (patch.produto && !prev.produto) prev.produto = patch.produto;
    if (patch.colaboradorNome) {
      if (!prev.colaboradorNome) {
        prev.colaboradorNome = patch.colaboradorNome;
      } else if (!prev.colaboradorNome.includes(patch.colaboradorNome)) {
        prev.colaboradorNome = `${prev.colaboradorNome}; ${patch.colaboradorNome}`;
      }
    }
    if (patch._recIds) {
      for (const rid of patch._recIds) prev._recIds.add(rid);
    }
  }

  const recConsumidas = new Set();

  /** @type {Map<string, Array<typeof requisicoes[0]>>} */
  const reqPorCpf = new Map();
  for (const req of requisicoes) {
    if (!req.cpf) continue;
    const arr = reqPorCpf.get(req.cpf) || [];
    arr.push(req);
    reqPorCpf.set(req.cpf, arr);
  }

  for (const req of requisicoes) {
    const data = req.dataResolucao ? formatarDataCalendarioSp(req.dataResolucao) : '';
    const chave = data ? `${req.cpf}|${data}` : `${req.cpf}|__sem_data__|req:${req.id}`;

    const patch = {
      cpf: req.cpf,
      data,
      colaboradorNome: req.colaboradorNome,
      requisicao: true,
      reclamacao: false,
      pixLiberado: req.pixLiberado,
      tipo: '',
      produto: '',
      _sort: req.dataResolucao ? new Date(req.dataResolucao).getTime() : 0,
      _recIds: new Set(),
    };

    if (req.ouvidoriaReclamacaoId && recPorId.has(req.ouvidoriaReclamacaoId)) {
      const rec = recPorId.get(req.ouvidoriaReclamacaoId);
      patch.reclamacao = true;
      patch.tipo = rec.tipo;
      patch.produto = rec.produto;
      patch.pixLiberado = patch.pixLiberado || rec.pixLiberado;
      patch._recIds.add(rec.id);
      recConsumidas.add(rec.id);
    }

    upsert(chave, patch);
  }

  for (const rec of reclamacoes) {
    if (recConsumidas.has(rec.id)) continue;

    const reqsDoCpf = rec.cpf ? reqPorCpf.get(rec.cpf) || [] : [];
    if (reqsDoCpf.length === 1) {
      const req = reqsDoCpf[0];
      const data = req.dataResolucao ? formatarDataCalendarioSp(req.dataResolucao) : '';
      const chave = data ? `${rec.cpf}|${data}` : `${rec.cpf}|__sem_data__|req:${req.id}`;
      upsert(chave, {
        cpf: rec.cpf,
        data,
        colaboradorNome: req.colaboradorNome,
        requisicao: true,
        reclamacao: true,
        pixLiberado: req.pixLiberado || rec.pixLiberado,
        tipo: rec.tipo,
        produto: rec.produto,
        _sort: req.dataResolucao ? new Date(req.dataResolucao).getTime() : 0,
        _recIds: new Set([rec.id]),
      });
      recConsumidas.add(rec.id);
      continue;
    }

    const chave = `${rec.cpf}|__sem_data__|rec:${rec.id}`;
    upsert(chave, {
      cpf: rec.cpf,
      data: '',
      colaboradorNome: '',
      requisicao: false,
      reclamacao: true,
      pixLiberado: rec.pixLiberado,
      tipo: rec.tipo,
      produto: rec.produto,
      _sort: 0,
      _recIds: new Set([rec.id]),
    });
  }

  /** @type {Array<Record<string, string>>} */
  const linhas = [];

  for (const agg of linhasPorChave.values()) {
    linhas.push({
      CPF: agg.cpf,
      Data: agg.data,
      colaboradorNome: agg.colaboradorNome,
      Requisição: agg.requisicao ? 'sim' : 'não',
      Reclamação: agg.reclamacao ? 'sim' : 'não',
      pixLiberado: boolParaSimNao(agg.pixLiberado),
      'tipo de reclamação': agg.reclamacao ? agg.tipo : '',
      Produto: agg.reclamacao ? agg.produto : '',
      _sort: agg._sort,
    });
  }

  linhas.sort((a, b) => (a._sort || 0) - (b._sort || 0) || a.CPF.localeCompare(b.CPF));
  return linhas.map(({ _sort, ...rest }) => rest);
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
    { wch: 12 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
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
  return path.join(__dirname, '..', `auditoria_liberacao_pix_${y}-${mo}-${d}_${h}${mi}.xlsx`);
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

    console.log('Coletando reclamações com motivo «Liberação chave pix»...');
    const reclamacoes = await coletarReclamacoesLiberacaoChavePix(dbOuv);
    const recPixSim = reclamacoes.filter((r) => r.pixLiberado).length;
    console.log(`  → ${reclamacoes.length} reclamação(ões) (${recPixSim} com pixLiberado=true)`);

    console.log('Coletando requisições (liberacao_pix_prod + legado)...');
    const requisicoes = await coletarRequisicoesLiberacaoPix(dbEsc);
    const reqPixSim = requisicoes.filter((r) => r.pixLiberado).length;
    const reqFeito = requisicoes.filter((r) => r.dataResolucao).length;
    console.log(
      `  → ${requisicoes.length} requisição(ões) (${reqFeito} com status «feito», ${reqPixSim} com pixLiberado=true)`
    );

    const linhas = montarLinhasAuditoria(reclamacoes, requisicoes);

    const ambos = linhas.filter((l) => l.Requisição === 'sim' && l.Reclamação === 'sim').length;
    const soReq = linhas.filter((l) => l.Requisição === 'sim' && l.Reclamação === 'não').length;
    const soRec = linhas.filter((l) => l.Requisição === 'não' && l.Reclamação === 'sim').length;
    const semData = linhas.filter((l) => !l.Data).length;
    const pixSim = linhas.filter((l) => l.pixLiberado === 'sim').length;

    console.log(`\nResumo auditoria (${linhas.length} linha(s)):`);
    console.log(`  • Requisição + Reclamação: ${ambos}`);
    console.log(`  • Só requisição: ${soReq}`);
    console.log(`  • Só reclamação: ${soRec}`);
    console.log(`  • Sem data (requisição pendente ou só reclamação): ${semData}`);
    console.log(`  • pixLiberado=sim: ${pixSim}`);

    if (dryRun) {
      console.log('\n--- Fim do dry-run (nenhum arquivo escrito) ---');
      return;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(linhas, 'Auditoria liberação PIX'),
      'auditoria_liberacao_pix'
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

/**
 * Verificação de Datas: Excel vs MongoDB
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
 * Compara datas dos arquivos Excel com os registros no MongoDB.
 * 
 * Estrutura dos arquivos:
 * - Bacen.xlsx: CPF (A), dataEntrada (B), finalização (C). createdAt = dataEntrada
 * - N2.xlsx: createdAt (A), dataEntrada (B), finalização (C), CPF (G)
 * - PROCON.xlsx: CPF (B), dataProcon (D). Sem finalização ainda
 * - RA.xlsx: CPF (A), dataReclam (C), createdAt (E), finalização (F)
 * 
 * Uso: node backend/scripts/verificar-datas-excel-vs-mongo.js
 */

const path = require('path');

const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');

const MONGODB_URI = process.env.MONGO_ENV || process.env.MONGODB_URI;
const DATABASE_NAME = 'hub_ouvidoria';
const DADOS_PATH = path.join(__dirname, '../../../dados procon');

function normalizarCPF(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 11);
}

function parseDataExcel(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number') {
    if (val > 44000 && val < 50000) {
      const d = XLSX.SSF.parse_date_code(val);
      if (d) return new Date(d.y, d.m - 1, d.d);
    }
    return null;
  }
  const str = String(val).trim();
  if (!str) return null;
  const m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatarData(d) {
  if (!d) return '-';
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? '-' : dt.toISOString().slice(0, 10);
}

function compararDatas(d1, d2, tolHoras = 24) {
  if (!d1 || !d2) return { iguais: false, diffHoras: null };
  const a = new Date(d1).getTime();
  const b = new Date(d2).getTime();
  const diffMs = Math.abs(a - b);
  const diffHoras = diffMs / (1000 * 60 * 60);
  return { iguais: diffHoras <= tolHoras, diffHoras };
}

async function lerExcel(nomeArquivo) {
  const filePath = path.join(DADOS_PATH, nomeArquivo);
  try {
    const wb = XLSX.readFile(filePath);
    const sh = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
  } catch (e) {
    console.error(`Erro ao ler ${nomeArquivo}:`, e.message);
    return [];
  }
}

async function verificarBacen(db, rows, docsPorCpf) {
  const resultados = { ok: 0, divergencia: [], naoEncontrado: [], erro: [] };
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cpf = normalizarCPF(row[0]);
    const dataEntradaExcel = parseDataExcel(row[1]);
    const finalizacaoExcel = parseDataExcel(row[2]);
    if (!cpf || cpf.length !== 11) continue;

    const docs = docsPorCpf.get(cpf) || [];
    if (docs.length === 0) {
      resultados.naoEncontrado.push({ linha: i + 1, cpf, dataEntrada: formatarData(dataEntradaExcel) });
      continue;
    }
    const doc = docs.find(d => {
      const de = d.dataEntrada ? new Date(d.dataEntrada) : null;
      return de && dataEntradaExcel && Math.abs(de - dataEntradaExcel) < 2 * 24 * 60 * 60 * 1000;
    }) || docs[0];

    const divs = [];
    if (dataEntradaExcel) {
      const r = compararDatas(dataEntradaExcel, doc.dataEntrada);
      if (!r.iguais) divs.push(`dataEntrada: Excel ${formatarData(dataEntradaExcel)} vs Mongo ${formatarData(doc.dataEntrada)}`);
    }
    if (finalizacaoExcel && doc.Finalizado?.dataResolucao) {
      const r = compararDatas(finalizacaoExcel, doc.Finalizado.dataResolucao);
      if (!r.iguais) divs.push(`finalização: Excel ${formatarData(finalizacaoExcel)} vs Mongo ${formatarData(doc.Finalizado.dataResolucao)}`);
    }
    if (divs.length > 0) {
      resultados.divergencia.push({ linha: i + 1, cpf, _id: doc._id, divergencias: divs });
    } else {
      resultados.ok++;
    }
  }
  return resultados;
}

async function verificarN2(db, rows, docsPorCpf) {
  const resultados = { ok: 0, divergencia: [], naoEncontrado: [], erro: [] };
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const createdAtExcel = parseDataExcel(row[0]);
    const dataEntradaExcel = parseDataExcel(row[1]);
    const finalizacaoExcel = parseDataExcel(row[2]);
    const cpf = normalizarCPF(row[6]);
    if (!cpf || cpf.length !== 11) continue;

    const docs = docsPorCpf.get(cpf) || [];
    if (docs.length === 0) {
      resultados.naoEncontrado.push({ linha: i + 1, cpf, dataEntrada: formatarData(dataEntradaExcel) });
      continue;
    }
    const doc = docs.find(d => {
      const de = d.dataEntradaN2 ? new Date(d.dataEntradaN2) : null;
      return de && dataEntradaExcel && Math.abs(de - dataEntradaExcel) < 2 * 24 * 60 * 60 * 1000;
    }) || docs[0];

    const divs = [];
    if (createdAtExcel) {
      const r = compararDatas(createdAtExcel, doc.createdAt);
      if (!r.iguais) divs.push(`createdAt: Excel ${formatarData(createdAtExcel)} vs Mongo ${formatarData(doc.createdAt)}`);
    }
    if (dataEntradaExcel) {
      const r = compararDatas(dataEntradaExcel, doc.dataEntradaN2);
      if (!r.iguais) divs.push(`dataEntradaN2: Excel ${formatarData(dataEntradaExcel)} vs Mongo ${formatarData(doc.dataEntradaN2)}`);
    }
    if (finalizacaoExcel && doc.Finalizado?.dataResolucao) {
      const r = compararDatas(finalizacaoExcel, doc.Finalizado.dataResolucao);
      if (!r.iguais) divs.push(`finalização: Excel ${formatarData(finalizacaoExcel)} vs Mongo ${formatarData(doc.Finalizado.dataResolucao)}`);
    }
    if (divs.length > 0) {
      resultados.divergencia.push({ linha: i + 1, cpf, _id: doc._id, divergencias: divs });
    } else {
      resultados.ok++;
    }
  }
  return resultados;
}

async function verificarProcon(db, rows, docsPorCpf) {
  const resultados = { ok: 0, divergencia: [], naoEncontrado: [], semFinalizacao: 0 };
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cpf = normalizarCPF(row[1]);
    const dataProconExcel = parseDataExcel(row[3]);
    if (!cpf || cpf.length !== 11) continue;

    const docs = docsPorCpf.get(cpf) || [];
    if (docs.length === 0) {
      resultados.naoEncontrado.push({ linha: i + 1, cpf, dataProcon: formatarData(dataProconExcel) });
      continue;
    }
    const doc = docs.find(d => {
      const dp = d.dataProcon ? new Date(d.dataProcon) : null;
      return dp && dataProconExcel && Math.abs(dp - dataProconExcel) < 2 * 24 * 60 * 60 * 1000;
    }) || docs[0];

    const divs = [];
    if (dataProconExcel) {
      const r = compararDatas(dataProconExcel, doc.dataProcon);
      if (!r.iguais) divs.push(`dataProcon: Excel ${formatarData(dataProconExcel)} vs Mongo ${formatarData(doc.dataProcon)}`);
    }
    if (!doc.Finalizado?.dataResolucao) resultados.semFinalizacao++;
    if (divs.length > 0) {
      resultados.divergencia.push({ linha: i + 1, cpf, _id: doc._id, divergencias: divs });
    } else {
      resultados.ok++;
    }
  }
  return resultados;
}

async function verificarRA(db, rows, docsPorCpf) {
  const resultados = { ok: 0, divergencia: [], naoEncontrado: [], erro: [] };
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cpf = normalizarCPF(row[0]);
    const dataReclamExcel = parseDataExcel(row[2]);
    const createdAtExcel = parseDataExcel(row[4]);
    const finalizacaoExcel = parseDataExcel(row[5]);
    if (!cpf || cpf.length !== 11) continue;

    const docs = docsPorCpf.get(cpf) || [];
    if (docs.length === 0) {
      resultados.naoEncontrado.push({ linha: i + 1, cpf, dataReclam: formatarData(dataReclamExcel) });
      continue;
    }
    const doc = docs.find(d => {
      const dr = d.dataReclam ? new Date(d.dataReclam) : null;
      return dr && dataReclamExcel && Math.abs(dr - dataReclamExcel) < 2 * 24 * 60 * 60 * 1000;
    }) || docs[0];

    const divs = [];
    if (dataReclamExcel) {
      const r = compararDatas(dataReclamExcel, doc.dataReclam);
      if (!r.iguais) divs.push(`dataReclam: Excel ${formatarData(dataReclamExcel)} vs Mongo ${formatarData(doc.dataReclam)}`);
    }
    if (createdAtExcel) {
      const r = compararDatas(createdAtExcel, doc.createdAt);
      if (!r.iguais) divs.push(`createdAt: Excel ${formatarData(createdAtExcel)} vs Mongo ${formatarData(doc.createdAt)}`);
    }
    if (finalizacaoExcel && doc.Finalizado?.dataResolucao) {
      const r = compararDatas(finalizacaoExcel, doc.Finalizado.dataResolucao);
      if (!r.iguais) divs.push(`finalização: Excel ${formatarData(finalizacaoExcel)} vs Mongo ${formatarData(doc.Finalizado.dataResolucao)}`);
    }
    if (divs.length > 0) {
      resultados.divergencia.push({ linha: i + 1, cpf, _id: doc._id, divergencias: divs });
    } else {
      resultados.ok++;
    }
  }
  return resultados;
}

(async () => {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_ENV não definido');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('📋 VERIFICAÇÃO DE DATAS: Excel vs MongoDB');
  console.log('============================================================\n');
  console.log('Pasta:', DADOS_PATH);
  console.log('');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  // Carregar todos os docs do Mongo uma vez (por collection)
  const buildDocsPorCpf = (colName) => {
    const map = new Map();
    return db.collection(colName).find({}).toArray().then(docs => {
      docs.forEach(d => {
        const cpf = normalizarCPF(d.cpf);
        if (cpf) {
          if (!map.has(cpf)) map.set(cpf, []);
          map.get(cpf).push(d);
        }
      });
      return map;
    });
  };

  const arquivos = [
    { nome: 'Bacen.xlsx', fn: verificarBacen, label: 'BACEN', col: 'reclamacoes_bacen' },
    { nome: 'N2.xlsx', fn: verificarN2, label: 'N2 Pix', col: 'reclamacoes_n2Pix' },
    { nome: 'PROCON.xlsx', fn: verificarProcon, label: 'Procon', col: 'reclamacoes_procon' },
    { nome: 'RA.xlsx', fn: verificarRA, label: 'Reclame Aqui', col: 'reclamacoes_reclameAqui' }
  ];

  for (const { nome, fn, label, col } of arquivos) {
    console.log(`\n📦 ${label} (${nome})`);
    console.log('-'.repeat(60));
    const rows = await lerExcel(nome);
    if (rows.length < 2) {
      console.log('   Arquivo vazio ou não encontrado.');
      continue;
    }
    console.log(`   Linhas no Excel: ${rows.length - 1} (excl. cabeçalho)`);
    
    const docsPorCpf = await buildDocsPorCpf(col);
    const res = await fn(db, rows, docsPorCpf);
    console.log(`   ✅ OK (datas conferem): ${res.ok}`);
    console.log(`   ⚠️  Divergências: ${res.divergencia.length}`);
    console.log(`   ❌ Não encontrado no Mongo: ${res.naoEncontrado.length}`);
    if (res.semFinalizacao !== undefined) {
      console.log(`   📌 Sem data finalização no Mongo: ${res.semFinalizacao}`);
    }
    
    if (res.divergencia.length > 0 && res.divergencia.length <= 15) {
      console.log('\n   Divergências:');
      res.divergencia.forEach(d => {
        console.log(`   Linha ${d.linha} | CPF ${d.cpf} | ${d.divergencias.join(' | ')}`);
      });
    } else if (res.divergencia.length > 15) {
      console.log('\n   Amostra (10 primeiras divergências):');
      res.divergencia.slice(0, 10).forEach(d => {
        console.log(`   Linha ${d.linha} | CPF ${d.cpf} | ${d.divergencias.join(' | ')}`);
      });
    }
  }

  console.log('\n============================================================');
  console.log('✅ Verificação concluída');
  console.log('============================================================\n');

  await client.close();
})();

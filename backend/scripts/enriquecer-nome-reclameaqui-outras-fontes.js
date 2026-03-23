/**
 * Enriquecer campo nome em reclamacoes_reclameAqui a partir de outras collections (mesmo CPF)
 * VERSION: v1.0.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 *
 * Contexto: import só com planilha (sem coluna nome) deixa nome vazio. Este script cruza CPF com:
 * reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_procon, reclamacoes_judicial.
 *
 * Prioridade do nome (primeira fonte com nome preenchido): Bacen → N2 Pix → Procon → Judicial
 *
 * --min-collections=N (padrão 1): só atualiza se o CPF existir em pelo menos N dessas quatro
 *   collections (com qualquer documento). Use N=2 para exigir cruzamento em 2+ bases.
 *
 * Uso:
 *   node backend/scripts/enriquecer-nome-reclameaqui-outras-fontes.js [--dry-run] [--min-collections=2] [--overwrite]
 *
 * --overwrite: também reescreve registros que já têm nome (útil após correção das fontes)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_RA = 'reclamacoes_reclameAqui';

const DRY_RUN = process.argv.includes('--dry-run');
const OVERWRITE = process.argv.includes('--overwrite');

const MIN_COLLECTIONS_ARG = process.argv.find((a) => a.startsWith('--min-collections='));
const MIN_COLLECTIONS = MIN_COLLECTIONS_ARG
  ? Math.max(1, parseInt(MIN_COLLECTIONS_ARG.split('=')[1], 10) || 1)
  : 1;

/** Ordem de leitura do nome (mesma lógica do import RA × Bacen/N2) */
const FONTES = [
  { coll: 'reclamacoes_bacen', key: 'bacen' },
  { coll: 'reclamacoes_n2Pix', key: 'n2' },
  { coll: 'reclamacoes_procon', key: 'procon' },
  { coll: 'reclamacoes_judicial', key: 'judicial' },
];

function normalizarCPF(cpf) {
  if (!cpf && cpf !== 0) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  if (apenasNumeros.length < 9) return '';
  if (apenasNumeros.length >= 9 && apenasNumeros.length < 11) {
    return apenasNumeros.padStart(11, '0');
  }
  return apenasNumeros.substring(0, 11);
}

function normalizarNome(nome) {
  if (!nome || typeof nome !== 'string') return '';
  const preposicoes = [
    'da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem',
    'sob', 'sobre', 'entre', 'ante', 'até', 'após', 'contra', 'desde', 'durante', 'mediante', 'perante',
    'salvo', 'segundo', 'conforme', 'consoante', 'exceto', 'menos', 'fora', 'através', 'a', 'o', 'as', 'os',
  ];
  const palavras = nome.trim().toLowerCase().split(/\s+/);
  const palavrasNormalizadas = palavras.map((palavra, index) => {
    if (index === 0 || !preposicoes.includes(palavra)) {
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }
    return palavra;
  });
  return palavrasNormalizadas.join(' ');
}

function nomeVazio(doc) {
  const n = doc.nome;
  if (n == null) return true;
  return String(n).trim() === '';
}

/**
 * Indexa por CPF: presença em cada collection + primeiro nome encontrado por fonte
 * @param {import('mongodb').Db} db
 * @returns {Promise<Map<string, Record<string, { has: boolean, nome?: string }>>>}
 */
async function construirIndiceCpf(db) {
  /** @type {Map<string, Record<string, { has: boolean, nome?: string }>>} */
  const porCpf = new Map();

  function ensure(cpf) {
    if (!porCpf.has(cpf)) {
      const o = {};
      for (const { key } of FONTES) {
        o[key] = { has: false, nome: undefined };
      }
      porCpf.set(cpf, o);
    }
    return porCpf.get(cpf);
  }

  for (const { coll, key } of FONTES) {
    const cursor = db.collection(coll).find(
      { cpf: { $exists: true, $ne: null, $ne: '' } },
      { projection: { cpf: 1, nome: 1 } }
    );

    for await (const doc of cursor) {
      const cpf = normalizarCPF(doc.cpf);
      if (!cpf) continue;
      const entry = ensure(cpf);
      entry[key].has = true;
      const raw = doc.nome != null ? String(doc.nome).trim() : '';
      if (raw && !entry[key].nome) {
        entry[key].nome = normalizarNome(raw);
      }
    }
    console.log(`  ✓ Indexado CPF em ${coll}`);
  }

  return porCpf;
}

/**
 * @param {Record<string, { has: boolean, nome?: string }>} entry
 * @returns {{ nome: string|null, fontesComCpf: number, fontesComNome: number, escolhida: string|null }}
 */
function resolverNome(entry) {
  let fontesComCpf = 0;
  let fontesComNome = 0;
  for (const { key } of FONTES) {
    if (entry[key].has) fontesComCpf++;
    if (entry[key].nome) fontesComNome++;
  }

  let escolhida = null;
  let nome = null;
  for (const { key } of FONTES) {
    if (entry[key].nome) {
      nome = entry[key].nome;
      escolhida = key;
      break;
    }
  }

  return { nome, fontesComCpf, fontesComNome, escolhida };
}

async function executar() {
  console.log('🚀 Enriquecer nome: reclamacoes_reclameAqui ← Bacen, N2, Procon, Judicial\n');
  console.log(`🔧 dry-run: ${DRY_RUN ? 'sim' : 'não'} | overwrite: ${OVERWRITE ? 'sim' : 'não'} | min-collections: ${MIN_COLLECTIONS}\n`);

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const ra = db.collection(COLLECTION_RA);

    console.log('📇 Construindo índice CPF × fontes...');
    const indice = await construirIndiceCpf(db);
    console.log(`   CPFs únicos nas fontes: ${indice.size}\n`);

    const filtroNome = OVERWRITE
      ? {}
      : {
          $or: [{ nome: { $exists: false } }, { nome: null }, { nome: '' }],
        };

    const docs = await ra.find(filtroNome).project({ cpf: 1, nome: 1 }).toArray();
    console.log(`📋 Reclame Aqui a processar: ${docs.length} documento(s)${OVERWRITE ? ' (todos)' : ' com nome vazio'}\n`);

    let atualizados = 0;
    let ignoradosSemCpf = 0;
    let ignoradosSemIndice = 0;
    let ignoradosMinCol = 0;
    let ignoradosSemNome = 0;

    for (const doc of docs) {
      const cpf = normalizarCPF(doc.cpf);
      if (!cpf) {
        ignoradosSemCpf++;
        continue;
      }

      const entry = indice.get(cpf);
      if (!entry) {
        ignoradosSemIndice++;
        continue;
      }

      const { nome, fontesComCpf, fontesComNome, escolhida } = resolverNome(entry);
      if (fontesComCpf < MIN_COLLECTIONS) {
        ignoradosMinCol++;
        continue;
      }
      if (!nome) {
        ignoradosSemNome++;
        continue;
      }

      if (!OVERWRITE && !nomeVazio(doc)) {
        continue;
      }

      if (OVERWRITE && doc.nome && String(doc.nome).trim() === nome) {
        continue;
      }

      console.log(
        `  CPF ${cpf}: nome ← ${escolhida} (${fontesComCpf} fonte(s) com CPF, ${fontesComNome} com nome) → "${nome}"`
      );

      if (!DRY_RUN) {
        await ra.updateOne(
          { _id: doc._id },
          { $set: { nome, updatedAt: new Date() } }
        );
      }
      atualizados++;
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    console.log(`${DRY_RUN ? '🔍' : '✅'} Atualizados: ${atualizados}`);
    console.log(`⏭️  Sem CPF válido: ${ignoradosSemCpf}`);
    console.log(`⏭️  CPF não encontrado nas 4 fontes: ${ignoradosSemIndice}`);
    console.log(`⏭️  CPF em menos de ${MIN_COLLECTIONS} collection(s): ${ignoradosMinCol}`);
    console.log(`⏭️  Nenhuma fonte com nome para o CPF: ${ignoradosSemNome}`);
    console.log(DRY_RUN ? '\n🔍 Dry-run — nenhuma alteração gravada.' : '\n✅ Concluído.');
  } catch (e) {
    console.error('❌ Erro:', e);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB desconectado');
  }
}

executar();

/**
 * Atualiza campo nome em reclamacoes_reclameAqui a partir de CSV (nome + CPF)
 * VERSION: v1.0.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
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
 * Arquivo: dados procon/Nomes RA - Com Nome XD.csv
 * Formato por linha: "Nome completo,""00000000000""" (aspas duplas escapadas como em Excel)
 * Coluna 1 = nome | Coluna 2 = CPF (11 dígitos)
 *
 * Uso:
 *   node backend/scripts/atualizar-nome-reclameaqui-desde-csv.js [--dry-run]
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_reclameAqui';

const CSV_PATH = path.join(__dirname, '../../../dados procon/Nomes RA - Com Nome XD.csv');

const DRY_RUN = process.argv.includes('--dry-run');

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

/**
 * Uma linha do arquivo: "Fulano de Tal,""12345678901"""
 * @param {string} line
 * @returns {{ nome: string, cpf: string } | null}
 */
function parseLinha(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return null;
  const inner = trimmed.slice(1, -1);
  const m = inner.match(/,""(\d{11})""$/);
  if (!m) return null;
  const cpf = m[1];
  const nome = inner.slice(0, m.index).trim();
  if (!nome) return null;
  return { nome, cpf };
}

/**
 * Lê CSV e retorna Map cpf → nome (última linha vence se CPF repetido)
 * @returns {Promise<Map<string, string>>}
 */
async function lerCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`Arquivo não encontrado: ${CSV_PATH}`);
  }

  const mapa = new Map();
  const stream = fs.createReadStream(CSV_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    let line = rawLine;
    if (line.charCodeAt(0) === 0xfeff) {
      line = line.slice(1);
    }
    const parsed = parseLinha(line);
    if (!parsed) continue;

    const cpfOk = normalizarCPF(parsed.cpf);
    if (!cpfOk || cpfOk.length !== 11) continue;

    mapa.set(cpfOk, normalizarNome(parsed.nome));
  }

  return mapa;
}

async function executar() {
  console.log('🚀 Atualizar nome Reclame Aqui ← CSV\n');
  console.log(`📁 ${CSV_PATH}`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN' : 'ATUALIZAÇÃO REAL'}\n`);

  const mapa = await lerCsv();
  console.log(`✅ ${mapa.size} par(es) nome+CPF únicos no CSV\n`);

  if (mapa.size === 0) {
    console.log('⚠️  Nada a processar.');
    return;
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const col = client.db(DATABASE_NAME).collection(COLLECTION_NAME);

    let atualizados = 0;
    let naoEncontrados = 0;

    for (const [cpf, nome] of mapa) {
      if (!DRY_RUN) {
        const res = await col.updateMany(
          { cpf },
          { $set: { nome, updatedAt: new Date() } }
        );
        if (res.matchedCount > 0) {
          atualizados += res.modifiedCount;
          console.log(`  ✓ CPF ${cpf}: "${nome}" (${res.matchedCount} doc(s), ${res.modifiedCount} modificado(s))`);
        } else {
          naoEncontrados++;
          console.log(`  ⚠ CPF ${cpf}: sem registro em ${COLLECTION_NAME}`);
        }
      } else {
        const count = await col.countDocuments({ cpf });
        if (count > 0) {
          console.log(`  [dry-run] CPF ${cpf}: "${nome}" → ${count} documento(s)`);
          atualizados += count;
        } else {
          naoEncontrados++;
          console.log(`  [dry-run] CPF ${cpf}: sem registro`);
        }
      }
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    if (DRY_RUN) {
      console.log(`🔍 Linhas com match no banco (simulação): ${atualizados}`);
    } else {
      console.log(`✅ Documentos modificados (total updateMany): ${atualizados}`);
    }
    console.log(`⏭️  CPFs do CSV sem match na collection: ${naoEncontrados}`);
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

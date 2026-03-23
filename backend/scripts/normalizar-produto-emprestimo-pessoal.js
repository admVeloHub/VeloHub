/**
 * Normaliza campo produto → "Empréstimo Pessoal" (ouvidoria)
 * VERSION: v1.0.1 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 *
 * v1.0.1: URI apenas via MONGO_ENV (sem fallback com credenciais no repositório)
 *
 * Alvos (case-insensitive, e/e ou é, espaços opcionais nas bordas):
 * - Emprestimo pessoal / Empréstimo pessoal (e variações)
 * - Credito Pessoal / Crédito Pessoal (e variações)
 *
 * Collections: reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_procon,
 *             reclamacoes_reclameAqui, reclamacoes_judicial
 *
 * Uso:
 *   node backend/scripts/normalizar-produto-emprestimo-pessoal.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV;
const DATABASE_NAME = 'hub_ouvidoria';

const DRY_RUN = process.argv.includes('--dry-run');

const CANONICO = 'Empréstimo Pessoal';

/** Empréstimo/Crédito + Pessoal (Mongo aceita PCRE) */
const REGEX_PRODUTO = /^\s*(empr[eé]stimo|cr[eé]dito)\s+pessoal\s*$/i;

const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_procon',
  'reclamacoes_reclameAqui',
  'reclamacoes_judicial',
];

async function executar() {
  console.log('🚀 Normalizar produto → Empréstimo Pessoal\n');
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN' : 'ATUALIZAÇÃO REAL'}\n`);

  if (!MONGODB_URI || !String(MONGODB_URI).trim()) {
    console.error('❌ Defina MONGO_ENV (connection string) no ambiente ou no .env do backend.');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  const filtro = {
    produto: { $type: 'string', $regex: REGEX_PRODUTO },
  };

  let totalMatched = 0;
  let totalModified = 0;

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    for (const name of COLLECTIONS) {
      const col = db.collection(name);
      const matched = await col.countDocuments(filtro);

      if (matched === 0) {
        console.log(`📦 ${name}: 0 documento(s)`);
        continue;
      }

      if (DRY_RUN) {
        const amostra = await col.find(filtro).project({ produto: 1, cpf: 1 }).limit(5).toArray();
        console.log(`📦 ${name}: ${matched} documento(s) (dry-run)`);
        amostra.forEach((d) => {
          console.log(`   ex.: ${JSON.stringify(d.produto)} → "${CANONICO}"`);
        });
        totalMatched += matched;
        continue;
      }

      const res = await col.updateMany(filtro, {
        $set: { produto: CANONICO, updatedAt: new Date() },
      });

      console.log(`📦 ${name}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
      totalMatched += res.matchedCount;
      totalModified += res.modifiedCount;
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    if (DRY_RUN) {
      console.log(`🔍 Total que seriam atualizados: ${totalMatched}`);
    } else {
      console.log(`✅ matched: ${totalMatched} | modified: ${totalModified}`);
    }
    console.log(DRY_RUN ? '\n🔍 Dry-run.' : '\n✅ Concluído.');
  } catch (e) {
    console.error('❌ Erro:', e);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB desconectado');
  }
}

executar();

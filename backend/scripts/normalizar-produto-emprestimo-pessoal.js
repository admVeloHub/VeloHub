/**
 * Normaliza campo produto na ouvidoria (Empréstimo Pessoal + Crédito Trabalhador)
 * VERSION: v1.1.0 | DATE: 2026-04-02 | AUTHOR: VeloHub Development Team
 *
 * ⚠️ Para typos (Velopriime, VeloPrime), casing e mais grafias, use:
 *    backend/scripts/normalizar-produto-reclamacoes-completo.js
 *
 * v1.1.0: Segunda fase — substituições exatas Credito Pessoal / trabalhador (várias grafias)
 * v1.0.1: URI apenas via MONGO_ENV (sem fallback com credenciais no repositório)
 *
 * Fase 1 (regex): Empréstimo/Crédito + pessoal (case-insensitive)
 * Fase 2 (exato): Credito Pessoal, Credito Trabalhador, Crédito ao trabalhador, Crédito ao Trabalhador
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

const CANONICO_EMPRESTIMO = 'Empréstimo Pessoal';
const CANONICO_TRABALHADOR = 'Crédito Trabalhador';

/** Empréstimo/Crédito + Pessoal (Mongo aceita PCRE) */
const REGEX_PRODUTO = /^\s*(empr[eé]stimo|cr[eé]dito)\s+pessoal\s*$/i;

const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_procon',
  'reclamacoes_reclameAqui',
  'reclamacoes_judicial',
];

/** Match exato no campo produto (valores legados do front antigo) */
const SUBSTITUICOES_EXATAS = [
  { de: 'Credito Pessoal', para: CANONICO_EMPRESTIMO },
  { de: 'Credito Trabalhador', para: CANONICO_TRABALHADOR },
  { de: 'Crédito ao trabalhador', para: CANONICO_TRABALHADOR },
  { de: 'Crédito ao Trabalhador', para: CANONICO_TRABALHADOR },
];

async function executar() {
  console.log('🚀 Normalizar produto (Empréstimo Pessoal + Crédito Trabalhador)\n');
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN' : 'ATUALIZAÇÃO REAL'}\n`);

  if (!MONGODB_URI || !String(MONGODB_URI).trim()) {
    console.error('❌ Defina MONGO_ENV (connection string) no ambiente ou no .env do backend.');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  const filtroRegex = {
    produto: { $type: 'string', $regex: REGEX_PRODUTO },
  };

  let totalMatched = 0;
  let totalModified = 0;

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    console.log('--- Fase 1: regex empréstimo/crédito pessoal ---\n');
    for (const name of COLLECTIONS) {
      const col = db.collection(name);
      const matched = await col.countDocuments(filtroRegex);

      if (matched === 0) {
        console.log(`📦 ${name}: 0 documento(s)`);
        continue;
      }

      if (DRY_RUN) {
        const amostra = await col.find(filtroRegex).project({ produto: 1, cpf: 1 }).limit(5).toArray();
        console.log(`📦 ${name}: ${matched} documento(s) (dry-run)`);
        amostra.forEach((d) => {
          console.log(`   ex.: ${JSON.stringify(d.produto)} → "${CANONICO_EMPRESTIMO}"`);
        });
        totalMatched += matched;
        continue;
      }

      const res = await col.updateMany(filtroRegex, {
        $set: { produto: CANONICO_EMPRESTIMO, updatedAt: new Date() },
      });

      console.log(`📦 ${name}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
      totalMatched += res.matchedCount;
      totalModified += res.modifiedCount;
    }

    console.log('\n--- Fase 2: substituições exatas (trabalhador + Credito Pessoal) ---\n');
    let fase2Matched = 0;
    let fase2Modified = 0;

    for (const name of COLLECTIONS) {
      const col = db.collection(name);
      for (const { de, para } of SUBSTITUICOES_EXATAS) {
        const filtro = { produto: de };
        const matched = await col.countDocuments(filtro);
        if (matched === 0) continue;

        if (DRY_RUN) {
          console.log(`📦 ${name} ["${de}"]: ${matched} documento(s) → "${para}" (dry-run)`);
          fase2Matched += matched;
          continue;
        }

        const res = await col.updateMany(filtro, {
          $set: { produto: para, updatedAt: new Date() },
        });
        console.log(`📦 ${name} ["${de}"]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
        fase2Matched += res.matchedCount;
        fase2Modified += res.modifiedCount;
      }
    }

    if (DRY_RUN) {
      totalMatched += fase2Matched;
    } else {
      totalMatched += fase2Matched;
      totalModified += fase2Modified;
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    if (DRY_RUN) {
      console.log(`🔍 Total que seriam atualizados (fases 1+2): ${totalMatched}`);
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

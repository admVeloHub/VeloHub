/**
 * Script de Migração: reclamacoes_ouvidoria → reclamacoes_n2Pix
 * VERSION: v1.0.0 | DATE: 2026-03-05 | AUTHOR: VeloHub Development Team
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
 * Transfere todos os registros da collection reclamacoes_ouvidoria (descontinuada)
 * para reclamacoes_n2Pix, preservando _id e demais campos.
 *
 * Uso:
 *   node backend/scripts/migrate-ouvidoria-to-n2pix.js [--dry-run] [--drop-source]
 *
 * Opções:
 *   --dry-run     Apenas simula, não insere nem remove dados
 *   --drop-source Remove a collection reclamacoes_ouvidoria após migração bem-sucedida
 *
 * Requer variáveis de ambiente:
 *   - MONGO_ENV (MongoDB connection string)
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_ORIGEM = 'reclamacoes_ouvidoria';
const COLLECTION_DESTINO = 'reclamacoes_n2Pix';

const DRY_RUN = process.argv.includes('--dry-run');
const DROP_SOURCE = process.argv.includes('--drop-source');

async function main() {
  let client;

  try {
    console.log('📦 Iniciando migração de reclamacoes_ouvidoria → reclamacoes_n2Pix');
    if (DRY_RUN) {
      console.log('⚠️  Modo DRY-RUN: nenhuma alteração será feita');
    }
    if (DROP_SOURCE && !DRY_RUN) {
      console.log('⚠️  Modo DROP-SOURCE: collection reclamacoes_ouvidoria será removida após migração');
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB');

    const db = client.db(DATABASE_NAME);
    const collectionOrigem = db.collection(COLLECTION_ORIGEM);
    const collectionDestino = db.collection(COLLECTION_DESTINO);

    // Verificar se collection origem existe
    const collections = await db.listCollections({ name: COLLECTION_ORIGEM }).toArray();
    if (collections.length === 0) {
      console.log(`ℹ️  Collection ${COLLECTION_ORIGEM} não existe. Nada a migrar.`);
      return;
    }

    // Ler todos os registros da origem
    const registrosOrigem = await collectionOrigem.find({}).toArray();
    const totalOrigem = registrosOrigem.length;

    console.log(`📊 Registros em ${COLLECTION_ORIGEM}: ${totalOrigem}`);

    if (totalOrigem === 0) {
      console.log('ℹ️  Nenhum registro para migrar.');
      if (DROP_SOURCE && !DRY_RUN) {
        await collectionOrigem.drop();
        console.log(`✅ Collection ${COLLECTION_ORIGEM} removida (estava vazia).`);
      }
      return;
    }

    // Obter _ids já existentes no destino para evitar duplicatas
    const idsOrigem = registrosOrigem.map((r) => r._id);
    const idsExistentes = await collectionDestino
      .find({ _id: { $in: idsOrigem } })
      .project({ _id: 1 })
      .toArray();
    const setIdsExistentes = new Set(idsExistentes.map((d) => d._id.toString()));

    const registrosParaInserir = registrosOrigem.filter(
      (r) => !setIdsExistentes.has(r._id.toString())
    );
    const duplicatas = totalOrigem - registrosParaInserir.length;

    console.log(`📊 Registros já existentes em ${COLLECTION_DESTINO}: ${duplicatas}`);
    console.log(`📊 Registros a inserir: ${registrosParaInserir.length}`);

    if (registrosParaInserir.length === 0) {
      console.log('ℹ️  Todos os registros já existem no destino. Nada a inserir.');
      if (DROP_SOURCE && !DRY_RUN) {
        await collectionOrigem.drop();
        console.log(`✅ Collection ${COLLECTION_ORIGEM} removida.`);
      }
      return;
    }

    if (!DRY_RUN) {
      // Inserir em lotes de 500 para evitar timeout
      const BATCH_SIZE = 500;
      let inseridos = 0;

      for (let i = 0; i < registrosParaInserir.length; i += BATCH_SIZE) {
        const lote = registrosParaInserir.slice(i, i + BATCH_SIZE);
        const resultado = await collectionDestino.insertMany(lote, { ordered: false });
        inseridos += resultado.insertedCount;
        console.log(`   Inseridos: ${inseridos}/${registrosParaInserir.length}`);
      }

      console.log(`✅ Migração concluída: ${inseridos} registros inseridos em ${COLLECTION_DESTINO}`);

      if (DROP_SOURCE) {
        await collectionOrigem.drop();
        console.log(`✅ Collection ${COLLECTION_ORIGEM} removida.`);
      } else {
        console.log(`ℹ️  Collection ${COLLECTION_ORIGEM} mantida. Use --drop-source para removê-la após conferir.`);
      }
    } else {
      console.log(`[DRY-RUN] Seriam inseridos ${registrosParaInserir.length} registros.`);
    }
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexão fechada.');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

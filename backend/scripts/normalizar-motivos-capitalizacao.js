/**
 * Script de Normalização: motivoReduzido nas collections de ouvidoria (padrão 2026-03)
 * VERSION: v2.0.1 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 *
 * v2.0.1: util v1.0.2 — Portabilidade chave pix → Portabilidade pix
 *
 * Collections: reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_procon,
 *             reclamacoes_reclameAqui, reclamacoes_judicial
 *
 * Regras (utils/motivoReduzidoNormalize.js):
 * - Renomeações: Cobrança→Em cobrança, Fraude→Alega fraude, Erro→Erro App,
 *   Encerramento de conta Celcoin→Encerramento cta Celcoin, LGPD→Encerramento cta App
 * - Outros: primeira letra maiúscula, restante minúsculo (pt-BR)
 * - Campo gravado como array [String]; strings legadas são convertidas
 *
 * Uso:
 *   node backend/scripts/normalizar-motivos-capitalizacao.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const { normalizarCampoMotivoReduzido } = require(path.join(__dirname, '../utils/motivoReduzidoNormalize'));

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

const DRY_RUN = process.argv.includes('--dry-run');

const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_procon',
  'reclamacoes_reclameAqui',
  'reclamacoes_judicial',
];

async function processarCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  const documentos = await collection
    .find({
      motivoReduzido: { $exists: true, $ne: null },
    })
    .toArray();

  const docsParaAtualizar = [];
  for (const doc of documentos) {
    const { motivos, mudou } = normalizarCampoMotivoReduzido(doc.motivoReduzido);
    if (mudou) {
      docsParaAtualizar.push({ doc, novoValor: motivos });
    }
  }

  return docsParaAtualizar;
}

async function executar() {
  console.log('🚀 Normalização motivoReduzido (v2) — BACEN, N2, Procon, Reclame Aqui, Judicial\n');
  console.log('Regras: renomeações fixas + sentence case (pt-BR); saída sempre array.\n');
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (validação apenas)' : 'ATUALIZAÇÃO REAL'}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    let totalPendentes = 0;

    for (const collectionName of COLLECTIONS) {
      const docsParaAtualizar = await processarCollection(db, collectionName);
      totalPendentes += docsParaAtualizar.length;

      if (docsParaAtualizar.length > 0) {
        console.log(`\n📦 ${collectionName}: ${docsParaAtualizar.length} documento(s) a atualizar`);
        const collection = db.collection(collectionName);

        for (const { doc, novoValor } of docsParaAtualizar) {
          const motivoAntes = JSON.stringify(doc.motivoReduzido);
          const motivoDepois = JSON.stringify(novoValor);
          const id =
            doc.cpf ||
            doc.codigoProcon ||
            doc.idEntrada ||
            doc.nroProcesso ||
            doc._id;
          console.log(`  ${id}: ${motivoAntes} → ${motivoDepois}`);

          if (!DRY_RUN) {
            await collection.updateOne(
              { _id: doc._id },
              {
                $set: {
                  motivoReduzido: novoValor,
                  updatedAt: new Date(),
                },
              }
            );
          }
        }
      } else {
        console.log(`\n📦 ${collectionName}: Nenhum documento a atualizar`);
      }
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    console.log(
      `${DRY_RUN ? '🔍' : '✅'} Total ${DRY_RUN ? 'que seriam atualizados' : 'atualizados'}: ${totalPendentes}`
    );
    console.log(DRY_RUN ? '\n🔍 Dry-run concluído. Execute sem --dry-run para aplicar.' : '\n✅ Normalização concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

executar();

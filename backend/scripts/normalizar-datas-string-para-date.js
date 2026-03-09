/**
 * Script de Migração: Converter campos de data STRING → Date
 * VERSION: v1.1.0 | DATE: 2026-03-05 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.1.0:
 * - reclamacoes_n2Pix: removidos dataEntrada e dataEntradaAtendimento (schema: apenas dataEntradaN2)
 *
 * Converte campos de data armazenados como string (YYYY-MM-DD) para Date
 * em todas as collections de reclamações do hub_ouvidoria.
 *
 * Uso:
 *   node backend/scripts/normalizar-datas-string-para-date.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

const DRY_RUN = process.argv.includes('--dry-run');

const CAMPOS_DATA_POR_COLLECTION = {
  reclamacoes_bacen: ['dataEntrada', 'prazoBacen', 'Finalizado.dataResolucao'],
  reclamacoes_n2Pix: ['dataEntradaN2', 'prazoOuvidoria', 'Finalizado.dataResolucao'],
  reclamacoes_reclameAqui: ['dataReclam', 'Finalizado.dataResolucao'],
  reclamacoes_procon: ['dataProcon', 'processoEncaminhadoData', 'dataProcessoEncerrado', 'Finalizado.dataResolucao'],
  reclamacoes_judicial: ['dataEntrada', 'dataAudiencia', 'Finalizado.dataResolucao']
};

function parsearDataParaDate(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor !== 'string') return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function setNestedDotNotation(obj, path, value) {
  obj[path] = value;
}

function getNested(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const key of parts) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  console.log('=== NORMALIZAÇÃO: String → Date ===\n');
  if (DRY_RUN) console.log('⚠️  Modo DRY-RUN\n');

  let totalConvertidos = 0;

  for (const [collectionName, campos] of Object.entries(CAMPOS_DATA_POR_COLLECTION)) {
    const col = db.collection(collectionName);
    const docs = await col.find({}).toArray();
    let convertidos = 0;

    for (const doc of docs) {
      const updates = {};
      let precisaAtualizar = false;

      for (const campo of campos) {
        const valor = getNested(doc, campo);
        if (valor == null) continue;
        if (typeof valor === 'string') {
          const dataDate = parsearDataParaDate(valor);
          if (dataDate) {
            setNestedDotNotation(updates, campo, dataDate);
            precisaAtualizar = true;
            convertidos++;
          }
        }
      }

      if (precisaAtualizar && !DRY_RUN) {
        await col.updateOne(
          { _id: doc._id },
          { $set: updates }
        );
      } else if (precisaAtualizar && DRY_RUN) {
        convertidos++;
      }
    }

    totalConvertidos += convertidos;
    console.log(`${collectionName}: ${convertidos} campos convertidos`);
  }

  console.log(`\nTotal: ${totalConvertidos} conversões`);
  if (DRY_RUN) console.log('\n[DRY-RUN] Execute sem --dry-run para aplicar.');
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

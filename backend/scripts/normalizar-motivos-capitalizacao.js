/**
 * Script de Normalização: Capitalização de motivos nas collections BACEN, N2 Pix e Procon
 * VERSION: v1.0.0 | DATE: 2026-03-13 | AUTHOR: VeloHub Development Team
 * 
 * Normaliza motivoReduzido nas collections reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_procon:
 * - "Abatimento de juros" → "Abatimento de Juros"
 * - "Liberação chave pix" → "Liberação Chave Pix"
 * 
 * Uso:
 *   node backend/scripts/normalizar-motivos-capitalizacao.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

const DRY_RUN = process.argv.includes('--dry-run');

const NORMALIZACOES = [
  // Abatimento
  { de: /^abatimento de juros$/i, para: 'Abatimento de Juros' },
  { de: /^abatimento juros$/i, para: 'Abatimento de Juros' },
  // Liberação Chave Pix
  { de: /^chave pix$/i, para: 'Liberação Chave Pix' },
  { de: /^liberação chave pix$/i, para: 'Liberação Chave Pix' },
  { de: /^liberacao chave pix$/i, para: 'Liberação Chave Pix' },
  // Contestação
  { de: /^contestação de valores$/i, para: 'Contestação de Valores' },
  // Encerramento
  { de: /^encerramento de conta$/i, para: 'Encerramento de Conta' },
  { de: /^encerramento da conta$/i, para: 'Encerramento de Conta' },
  // Exclusão
  { de: /^exclusão de conta$/i, para: 'Exclusão de Conta' },
  { de: /^exclusao de conta$/i, para: 'Exclusão de Conta' },
  // Outros
  { de: /^não recebeu restituição$/i, para: 'Não Recebeu Restituição' },
  { de: /^nao recebeu restituicao$/i, para: 'Não Recebeu Restituição' },
  { de: /^bloqueio de conta$/i, para: 'Bloqueio de Conta' },
  { de: /^fraude$/i, para: 'Fraude' }
];

/**
 * Normaliza um motivo individual
 */
function normalizarMotivo(motivo) {
  if (!motivo || typeof motivo !== 'string') return motivo;
  const trim = motivo.trim();
  if (!trim) return motivo;

  for (const { de, para } of NORMALIZACOES) {
    if (de.test(trim)) {
      return para;
    }
  }
  return motivo;
}

/**
 * Processar motivoReduzido (pode ser string ou array)
 * Retorna { novoValor, mudou }
 */
function processarMotivoReduzido(motivoReduzido) {
  if (!motivoReduzido) return { novoValor: null, mudou: false };

  if (Array.isArray(motivoReduzido)) {
    const normalizados = motivoReduzido.map(motivo => normalizarMotivo(motivo));
    const mudou = normalizados.some((n, i) => n !== motivoReduzido[i]);
    return { novoValor: normalizados, mudou };
  }

  if (typeof motivoReduzido === 'string') {
    const normalizado = normalizarMotivo(motivoReduzido);
    return { novoValor: normalizado, mudou: normalizado !== motivoReduzido };
  }

  return { novoValor: motivoReduzido, mudou: false };
}

async function processarCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  const documentos = await collection.find({
    motivoReduzido: { $exists: true, $ne: null }
  }).toArray();

  const docsParaAtualizar = [];
  for (const doc of documentos) {
    const { novoValor, mudou } = processarMotivoReduzido(doc.motivoReduzido);
    if (mudou) {
      docsParaAtualizar.push({ doc, novoValor });
    }
  }

  return docsParaAtualizar;
}

async function executar() {
  console.log('🚀 Script de Normalização: Capitalização de motivos (BACEN, N2 Pix, Procon)\n');
  console.log('Regras:');
  console.log('  - "Abatimento de juros" / "Abatimento juros" → "Abatimento de Juros"');
  console.log('  - "Chave Pix" / "Liberação chave pix" → "Liberação Chave Pix"');
  console.log('  - "Contestação de valores" → "Contestação de Valores"');
  console.log('  - "Encerramento de/da conta" → "Encerramento de Conta"');
  console.log('  - "Exclusão de conta" → "Exclusão de Conta"');
  console.log('  - "Não recebeu restituição" → "Não Recebeu Restituição"');
  console.log('  - "Bloqueio de conta" / "Fraude" → title case');
  console.log(`\n🔧 Modo: ${DRY_RUN ? 'DRY-RUN (validação apenas)' : 'ATUALIZAÇÃO REAL'}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    const collections = ['reclamacoes_bacen', 'reclamacoes_n2Pix', 'reclamacoes_procon'];
    let totalAtualizados = 0;

    for (const collectionName of collections) {
      const docsParaAtualizar = await processarCollection(db, collectionName);

      if (docsParaAtualizar.length > 0) {
        console.log(`\n📦 ${collectionName}: ${docsParaAtualizar.length} documento(s) a atualizar`);
        const collection = db.collection(collectionName);

        for (const { doc, novoValor } of docsParaAtualizar) {
          const motivoAntes = Array.isArray(doc.motivoReduzido)
            ? doc.motivoReduzido.join(', ')
            : doc.motivoReduzido;
          const motivoDepois = Array.isArray(novoValor)
            ? novoValor.join(', ')
            : novoValor;
          console.log(`  CPF ${doc.cpf || doc.codigoProcon || '(sem identificador)'}: "${motivoAntes}" → "${motivoDepois}"`);

          if (!DRY_RUN) {
            await collection.updateOne(
              { _id: doc._id },
              { $set: { motivoReduzido: novoValor } }
            );
            totalAtualizados++;
          }
        }
      } else {
        console.log(`\n📦 ${collectionName}: Nenhum documento a atualizar`);
      }
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    console.log(`${DRY_RUN ? '🔍' : '✅'} Total ${DRY_RUN ? 'que seriam atualizados' : 'atualizados'}: ${totalAtualizados}`);
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

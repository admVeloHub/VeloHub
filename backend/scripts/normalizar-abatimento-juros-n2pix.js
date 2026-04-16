/**
 * Script de Normalização: "Abatimento Juros" → "Abatimento de Juros" na collection reclamacoes_n2Pix
 * VERSION: v1.0.0 | DATE: 2026-03-13 | AUTHOR: VeloHub Development Team
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
 * Normaliza o motivoReduzido na collection reclamacoes_n2Pix:
 * - "Abatimento Juros" → "Abatimento de Juros"
 * - Variações (abatimento juros, ABATIMENTO JUROS, etc.) → "Abatimento de Juros"
 * 
 * Uso:
 *   node backend/scripts/normalizar-abatimento-juros-n2pix.js [--dry-run]
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_n2Pix';

const DRY_RUN = process.argv.includes('--dry-run');

const VALOR_CORRETO = 'Abatimento de Juros';

/**
 * Verifica se o motivo deve ser normalizado para "Abatimento de Juros"
 */
function deveNormalizar(motivo) {
  if (!motivo || typeof motivo !== 'string') return false;
  const trim = motivo.trim();
  if (!trim) return false;
  // "Abatimento Juros" (sem "de") em qualquer capitalização
  const lower = trim.toLowerCase();
  return lower === 'abatimento juros' || lower === 'abatimento juro';
}

/**
 * Processar motivoReduzido (pode ser string ou array)
 * Retorna { novoValor, mudou }
 */
function processarMotivoReduzido(motivoReduzido) {
  if (!motivoReduzido) return { novoValor: null, mudou: false };

  if (Array.isArray(motivoReduzido)) {
    const normalizados = motivoReduzido.map(motivo => {
      if (deveNormalizar(motivo)) {
        return VALOR_CORRETO;
      }
      return motivo;
    });
    const mudou = normalizados.some((n, i) => n !== motivoReduzido[i]);
    return { novoValor: normalizados, mudou };
  }

  if (typeof motivoReduzido === 'string') {
    if (deveNormalizar(motivoReduzido)) {
      return { novoValor: VALOR_CORRETO, mudou: true };
    }
    return { novoValor: motivoReduzido, mudou: false };
  }

  return { novoValor: motivoReduzido, mudou: false };
}

async function executar() {
  console.log('🚀 Script de Normalização: Abatimento Juros → Abatimento de Juros (reclamacoes_n2Pix)\n');
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (validação apenas)' : 'ATUALIZAÇÃO REAL'}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Buscar todos os documentos com motivoReduzido
    const todosComMotivo = await collection.find({
      motivoReduzido: { $exists: true, $ne: null }
    }).toArray();

    const docsParaAtualizar = [];
    for (const doc of todosComMotivo) {
      const { novoValor, mudou } = processarMotivoReduzido(doc.motivoReduzido);
      if (mudou) {
        docsParaAtualizar.push({ doc, novoValor });
      }
    }

    console.log(`📊 Documentos que serão atualizados: ${docsParaAtualizar.length}\n`);

    if (docsParaAtualizar.length === 0) {
      console.log('✅ Nenhum documento precisa de atualização.');
      return;
    }

    let atualizados = 0;
    for (const { doc, novoValor } of docsParaAtualizar) {
      const motivoAntes = Array.isArray(doc.motivoReduzido)
        ? doc.motivoReduzido.join(', ')
        : doc.motivoReduzido;
      const motivoDepois = Array.isArray(novoValor)
        ? novoValor.join(', ')
        : novoValor;
      console.log(`  CPF ${doc.cpf || '(sem CPF)'}: "${motivoAntes}" → "${motivoDepois}"`);

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { motivoReduzido: novoValor } }
        );
        atualizados++;
      }
    }

    console.log('\n============================================================');
    console.log('📊 RESUMO');
    console.log('============================================================');
    console.log(`${DRY_RUN ? '🔍' : '✅'} Documentos ${DRY_RUN ? 'que seriam atualizados' : 'atualizados'}: ${docsParaAtualizar.length}`);
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

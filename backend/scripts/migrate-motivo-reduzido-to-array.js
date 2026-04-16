/**
 * Script de Migração: motivoReduzido de String para Array
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
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
 * Migra o campo motivoReduzido de String para [String] em todas as collections:
 * - reclamacoes_bacen
 * - reclamacoes_reclameAqui
 * - reclamacoes_procon
 * - reclamacoes_judicial
 * 
 * Nota: reclamacoes_n2Pix já está como array, não precisa migração
 * 
 * Uso:
 *   node backend/scripts/migrate-motivo-reduzido-to-array.js [--dry-run]
 */

const { MongoClient } = require('mongodb');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

// Modo dry-run (apenas validação, sem atualizar)
const DRY_RUN = process.argv.includes('--dry-run');

// Collections para migrar
const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_reclameAqui',
  'reclamacoes_procon',
  'reclamacoes_judicial'
];

/**
 * Converter motivoReduzido de String para Array
 * Se já for array, retorna como está
 * Se for string vazia ou null, retorna array vazio
 * Se for string com valores separados, divide em array
 */
function converterParaArray(motivoReduzido) {
  // Se já for array, retornar como está
  if (Array.isArray(motivoReduzido)) {
    return motivoReduzido.filter(m => m && typeof m === 'string' && m.trim().length > 0);
  }
  
  // Se for null ou undefined, retornar array vazio
  if (!motivoReduzido) {
    return [];
  }
  
  // Se for string, processar
  if (typeof motivoReduzido === 'string') {
    const str = motivoReduzido.trim();
    
    // Se string vazia, retornar array vazio
    if (str === '') {
      return [];
    }
    
    // Tentar dividir por separadores comuns (vírgula, ponto e vírgula, barra)
    const separadores = /[,;\/]/;
    if (separadores.test(str)) {
      return str
        .split(separadores)
        .map(m => m.trim())
        .filter(m => m.length > 0);
    }
    
    // Se não tiver separadores, retornar como array com um único elemento
    return [str];
  }
  
  // Se for outro tipo, retornar array vazio
  return [];
}

/**
 * Migrar uma collection específica
 */
async function migrarCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  
  console.log(`\n📦 Processando collection: ${collectionName}`);
  
  // Buscar todos os documentos que têm motivoReduzido como string
  const documentos = await collection.find({
    motivoReduzido: { $exists: true, $type: 'string' }
  }).toArray();
  
  console.log(`   📊 Encontrados ${documentos.length} documentos com motivoReduzido como String`);
  
  if (documentos.length === 0) {
    console.log(`   ✅ Nenhum documento para migrar`);
    return { atualizados: 0, erros: 0 };
  }
  
  let atualizados = 0;
  let erros = 0;
  const errosDetalhes = [];
  
  for (const doc of documentos) {
    try {
      const motivoArray = converterParaArray(doc.motivoReduzido);
      
      // Verificar se realmente precisa atualizar (se já for array igual, não precisa)
      const precisaAtualizar = !Array.isArray(doc.motivoReduzido) || 
                               JSON.stringify(doc.motivoReduzido.sort()) !== JSON.stringify(motivoArray.sort());
      
      if (precisaAtualizar) {
        if (!DRY_RUN) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { motivoReduzido: motivoArray } }
          );
        }
        atualizados++;
        
        if (atualizados % 100 === 0) {
          console.log(`   📊 Processados: ${atualizados}/${documentos.length}`);
        }
      }
    } catch (error) {
      erros++;
      errosDetalhes.push({
        _id: doc._id,
        cpf: doc.cpf,
        erro: error.message
      });
      console.error(`   ❌ Erro ao processar documento ${doc._id} (CPF: ${doc.cpf}):`, error.message);
    }
  }
  
  return { atualizados, erros, errosDetalhes };
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Script de Migração: motivoReduzido de String para Array\n');
  console.log(`📋 Collections: ${COLLECTIONS.join(', ')}`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'MIGRAÇÃO REAL'}\n`);
  
  let client;
  
  try {
    // Conectar ao MongoDB
    console.log('🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    
    // Estatísticas totais
    let totalAtualizados = 0;
    let totalErros = 0;
    const todosErrosDetalhes = [];
    
    // Migrar cada collection
    for (const collectionName of COLLECTIONS) {
      const resultado = await migrarCollection(db, collectionName);
      totalAtualizados += resultado.atualizados;
      totalErros += resultado.erros;
      todosErrosDetalhes.push(...resultado.errosDetalhes);
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Documentos atualizados: ${totalAtualizados}`);
    console.log(`❌ Erros: ${totalErros}`);
    
    if (todosErrosDetalhes.length > 0) {
      console.log('\n⚠️  Detalhes dos erros:');
      todosErrosDetalhes.slice(0, 10).forEach(erro => {
        console.log(`   CPF: ${erro.cpf} - ${erro.erro}`);
      });
      if (todosErrosDetalhes.length > 10) {
        console.log(`   ... e mais ${todosErrosDetalhes.length - 10} erros`);
      }
    }
    
    if (DRY_RUN) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi feita no banco de dados');
    } else {
      console.log('\n✅ Migração concluída!');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão com MongoDB fechada');
    }
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, converterParaArray };

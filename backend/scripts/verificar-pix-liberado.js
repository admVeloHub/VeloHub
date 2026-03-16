/**
 * Script de Verificação: pixLiberado em todas as collections
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Verifica:
 * - Quantidade de registros com pixLiberado = true
 * - Quantidade de registros com pixLiberado = false
 * - Registros com valores divergentes (null, undefined, strings, números, etc.)
 * 
 * Collections verificadas:
 * - reclamacoes_bacen
 * - reclamacoes_n2Pix
 * - reclamacoes_reclameAqui
 * - reclamacoes_procon
 * - reclamacoes_judicial
 * 
 * Uso:
 *   node backend/scripts/verificar-pix-liberado.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

// Collections para verificar
const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_procon',
  'reclamacoes_judicial'
];

/**
 * Verificar uma collection específica
 */
async function verificarCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  
  console.log(`\n📦 Collection: ${collectionName}`);
  console.log('='.repeat(60));
  
  // Contar total de documentos
  const total = await collection.countDocuments({});
  console.log(`   📊 Total de documentos: ${total}`);
  
  // Contar pixLiberado = true
  const pixLiberadoTrue = await collection.countDocuments({ pixLiberado: true });
  console.log(`   ✅ pixLiberado = true: ${pixLiberadoTrue}`);
  
  // Contar pixLiberado = false
  const pixLiberadoFalse = await collection.countDocuments({ pixLiberado: false });
  console.log(`   ❌ pixLiberado = false: ${pixLiberadoFalse}`);
  
  // Contar pixLiberado = null ou não existe
  const pixLiberadoNull = await collection.countDocuments({
    $or: [
      { pixLiberado: null },
      { pixLiberado: { $exists: false } }
    ]
  });
  console.log(`   ⚠️  pixLiberado = null/undefined: ${pixLiberadoNull}`);
  
  // Buscar documentos com valores divergentes (não booleanos)
  const documentosDivergentes = await collection.find({
    pixLiberado: { 
      $exists: true,
      $nin: [true, false, null]
    }
  }).limit(20).toArray();
  
  if (documentosDivergentes.length > 0) {
    console.log(`\n   ⚠️  ATENÇÃO: Encontrados ${documentosDivergentes.length} documentos com valores divergentes:`);
    
    // Agrupar por tipo de valor
    const valoresPorTipo = {};
    documentosDivergentes.forEach(doc => {
      const valor = doc.pixLiberado;
      const tipo = typeof valor;
      const valorStr = String(valor);
      
      if (!valoresPorTipo[tipo]) {
        valoresPorTipo[tipo] = {};
      }
      if (!valoresPorTipo[tipo][valorStr]) {
        valoresPorTipo[tipo][valorStr] = [];
      }
      valoresPorTipo[tipo][valorStr].push({
        _id: doc._id,
        cpf: doc.cpf || 'N/A',
        valor: valor
      });
    });
    
    // Mostrar valores divergentes
    Object.keys(valoresPorTipo).forEach(tipo => {
      console.log(`\n      Tipo: ${tipo}`);
      Object.keys(valoresPorTipo[tipo]).forEach(valorStr => {
        const docs = valoresPorTipo[tipo][valorStr];
        console.log(`         Valor "${valorStr}": ${docs.length} documento(s)`);
        docs.slice(0, 5).forEach(doc => {
          console.log(`            - CPF: ${doc.cpf}, _id: ${doc._id}`);
        });
        if (docs.length > 5) {
          console.log(`            ... e mais ${docs.length - 5} documento(s)`);
        }
      });
    });
    
    // Contar total de divergentes
    const totalDivergentes = await collection.countDocuments({
      pixLiberado: { 
        $exists: true,
        $nin: [true, false, null]
      }
    });
    console.log(`\n   📊 Total de documentos com valores divergentes: ${totalDivergentes}`);
  } else {
    console.log(`   ✅ Nenhum documento com valores divergentes encontrado`);
  }
  
  // Verificar strings que podem ser convertidas para boolean
  const documentosComString = await collection.find({
    pixLiberado: { $type: 'string' }
  }).limit(10).toArray();
  
  if (documentosComString.length > 0) {
    console.log(`\n   📝 Documentos com pixLiberado como String (primeiros 10):`);
    documentosComString.forEach(doc => {
      console.log(`      CPF: ${doc.cpf || 'N/A'}, Valor: "${doc.pixLiberado}"`);
    });
    
    const totalStrings = await collection.countDocuments({
      pixLiberado: { $type: 'string' }
    });
    if (totalStrings > 10) {
      console.log(`      ... e mais ${totalStrings - 10} documento(s) com String`);
    }
  }
  
  // Resumo
  const totalComPixLiberado = pixLiberadoTrue + pixLiberadoFalse + pixLiberadoNull;
  const semPixLiberado = total - totalComPixLiberado;
  
  console.log(`\n   📊 Resumo:`);
  console.log(`      Total: ${total}`);
  console.log(`      Com pixLiberado (true/false/null): ${totalComPixLiberado}`);
  console.log(`      Sem pixLiberado: ${semPixLiberado}`);
  
  return {
    collection: collectionName,
    total,
    pixLiberadoTrue,
    pixLiberadoFalse,
    pixLiberadoNull,
    divergentes: documentosDivergentes.length,
    totalDivergentes: documentosDivergentes.length > 0 ? await collection.countDocuments({
      pixLiberado: { 
        $exists: true,
        $nin: [true, false, null]
      }
    }) : 0
  };
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Script de Verificação: pixLiberado em todas as collections\n');
  console.log(`📋 Collections: ${COLLECTIONS.join(', ')}\n`);
  
  let client;
  
  try {
    // Conectar ao MongoDB
    console.log('🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    
    // Estatísticas totais
    const resultados = [];
    
    // Verificar cada collection
    for (const collectionName of COLLECTIONS) {
      const resultado = await verificarCollection(db, collectionName);
      resultados.push(resultado);
    }
    
    // Resumo geral
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO GERAL');
    console.log('='.repeat(60));
    
    const totalGeral = resultados.reduce((sum, r) => sum + r.total, 0);
    const totalTrue = resultados.reduce((sum, r) => sum + r.pixLiberadoTrue, 0);
    const totalFalse = resultados.reduce((sum, r) => sum + r.pixLiberadoFalse, 0);
    const totalNull = resultados.reduce((sum, r) => sum + r.pixLiberadoNull, 0);
    const totalDivergentes = resultados.reduce((sum, r) => sum + r.totalDivergentes, 0);
    
    console.log(`\n📊 Totais em todas as collections:`);
    console.log(`   Total de documentos: ${totalGeral}`);
    console.log(`   ✅ pixLiberado = true: ${totalTrue}`);
    console.log(`   ❌ pixLiberado = false: ${totalFalse}`);
    console.log(`   ⚠️  pixLiberado = null/undefined: ${totalNull}`);
    console.log(`   🔴 pixLiberado com valores divergentes: ${totalDivergentes}`);
    
    console.log(`\n📋 Por collection:`);
    resultados.forEach(r => {
      console.log(`\n   ${r.collection}:`);
      console.log(`      Total: ${r.total}`);
      console.log(`      True: ${r.pixLiberadoTrue}`);
      console.log(`      False: ${r.pixLiberadoFalse}`);
      console.log(`      Null/Undefined: ${r.pixLiberadoNull}`);
      console.log(`      Divergentes: ${r.totalDivergentes}`);
    });
    
    if (totalDivergentes > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${totalDivergentes} documento(s) com valores divergentes encontrados!`);
      console.log(`   Recomenda-se normalizar esses valores para true ou false.`);
    } else {
      console.log(`\n✅ Todos os valores de pixLiberado estão corretos (true, false ou null/undefined)`);
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

module.exports = { main, verificarCollection };

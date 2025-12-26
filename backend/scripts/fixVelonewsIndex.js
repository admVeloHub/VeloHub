/**
 * Script para corrigir índice da Velonews
 * VERSION: v1.0.1 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * SEGURANÇA: Usa variável de ambiente MONGO_ENV para conexão MongoDB.
 * NUNCA exponha credenciais hardcoded no código.
 */

const { MongoClient } = require('mongodb');

// ATENÇÃO: Credenciais removidas por segurança. Use variável de ambiente MONGO_ENV
const MONGODB_URI = process.env.MONGO_ENV || process.env.MONGODB_ENV;

if (!MONGODB_URI) {
  console.error('❌ ERRO CRÍTICO: Variável de ambiente MONGO_ENV não configurada!');
  console.error('Configure a variável MONGO_ENV com a string de conexão MongoDB.');
  process.exit(1);
}

const fixVelonewsIndex = async () => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('console_conteudo');
    
    console.log('🔧 CORRIGINDO ÍNDICE DA VELONEWS...\n');
    
    const velonewsCollection = db.collection('Velonews');
    
    // 1. Remover índice antigo
    console.log('🗑️ REMOVENDO ÍNDICE ANTIGO...');
    try {
      await velonewsCollection.dropIndex('title_text_content_text');
      console.log('✅ Índice antigo removido');
    } catch (error) {
      console.log('ℹ️ Índice antigo não encontrado');
    }
    
    // 2. Criar novo índice
    console.log('\n🚀 CRIANDO NOVO ÍNDICE...');
    await velonewsCollection.createIndex({
      "titulo": "text",
      "conteudo": "text"
    }, {
      name: "velonews_text",
      weights: {
        "titulo": 10,
        "conteudo": 1
      },
      default_language: "portuguese"
    });
    console.log('✅ Novo índice criado');
    
    // 3. Testar novo índice
    console.log('\n🧪 TESTANDO NOVO ÍNDICE...');
    const testResults = await velonewsCollection.find({
      $text: { $search: "prêmio" }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(3)
    .toArray();
    
    console.log(`✅ Novo índice funcionando: ${testResults.length} resultados`);
    testResults.forEach((doc, i) => {
      console.log(`   ${i+1}. Score: ${doc.score?.toFixed(2)} - ${doc.titulo?.substring(0, 50)}...`);
    });
    
    // 4. Listar índices atualizados
    console.log('\n📋 ÍNDICES ATUALIZADOS:');
    const indexes = await velonewsCollection.listIndexes().toArray();
    indexes.forEach((idx, i) => {
      console.log(`${i+1}. ${idx.name}`);
      console.log(`   Campos: ${JSON.stringify(idx.key)}`);
      if (idx.weights) console.log(`   Pesos: ${JSON.stringify(idx.weights)}`);
      if (idx.default_language) console.log(`   Idioma: ${idx.default_language}`);
      console.log('');
    });
    
    console.log('🎉 VELONEWS CORRIGIDA COM SUCESSO!');
    console.log('✅ Índice atualizado para campos corretos');
    console.log('✅ Funcionando com português');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (client) await client.close();
  }
};

fixVelonewsIndex();

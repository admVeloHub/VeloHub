/**
 * Script para criar índices simples para campos existentes
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

const createSimpleIndexes = async () => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('console_conteudo');
    
    console.log('🚀 CRIANDO ÍNDICES SIMPLES PARA CAMPOS EXISTENTES...\n');
    
    // 1. Remover índices antigos que não funcionam
    console.log('🗑️ REMOVENDO ÍNDICES ANTIGOS...');
    
    try {
      await db.collection('Bot_perguntas').dropIndex('question_text_context_text');
      console.log('✅ Índice Bot_perguntas antigo removido');
    } catch (error) {
      console.log('ℹ️ Índice Bot_perguntas antigo não encontrado');
    }
    
    try {
      await db.collection('Artigos').dropIndex('title_text_content_text');
      console.log('✅ Índice Artigos antigo removido');
    } catch (error) {
      console.log('ℹ️ Índice Artigos antigo não encontrado');
    }
    
    // 2. Criar índice para Bot_perguntas
    console.log('\n📚 CRIANDO ÍNDICE BOT_PERGUNTAS...');
    await db.collection('Bot_perguntas').createIndex({
      "palavrasChave": "text",
      "pergunta": "text"
    }, {
      name: "bot_perguntas_text",
      weights: {
        "palavrasChave": 10,
        "pergunta": 1
      },
      default_language: "portuguese"
    });
    console.log('✅ Índice Bot_perguntas criado');
    
    // 3. Criar índice para Artigos
    console.log('\n📄 CRIANDO ÍNDICE ARTIGOS...');
    await db.collection('Artigos').createIndex({
      "artigo_titulo": "text",
      "artigo_conteudo": "text"
    }, {
      name: "artigos_text",
      weights: {
        "artigo_titulo": 10,
        "artigo_conteudo": 1
      },
      default_language: "portuguese"
    });
    console.log('✅ Índice Artigos criado');
    
    // 4. Testar os novos índices
    console.log('\n🧪 TESTANDO NOVOS ÍNDICES...');
    
    // Teste Bot_perguntas
    const botTest = await db.collection('Bot_perguntas').find({
      $text: { $search: "crédito" }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(3)
    .toArray();
    
    console.log(`📚 Bot_perguntas: ${botTest.length} resultados`);
    botTest.forEach((doc, i) => {
      console.log(`   ${i+1}. Score: ${doc.score?.toFixed(2)} - ${doc.pergunta?.substring(0, 50)}...`);
    });
    
    // Teste Artigos
    const artTest = await db.collection('Artigos').find({
      $text: { $search: "antecipação" }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(3)
    .toArray();
    
    console.log(`📄 Artigos: ${artTest.length} resultados`);
    artTest.forEach((doc, i) => {
      console.log(`   ${i+1}. Score: ${doc.score?.toFixed(2)} - ${doc.artigo_titulo?.substring(0, 50)}...`);
    });
    
    console.log('\n🎉 ÍNDICES CRIADOS E TESTADOS COM SUCESSO!');
    console.log('✅ Pronto para implementar filtro com $text search');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (client) await client.close();
  }
};

createSimpleIndexes();

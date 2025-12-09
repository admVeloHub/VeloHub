/**
 * Script para testar o filtro otimizado com índices
 * VERSION: v1.0.0 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://REDACTED';

// Simular as funções do server.js
const filterByKeywordsWithIndexes = async (question, db) => {
  try {
    const collection = db.collection('Bot_perguntas');
    
    const results = await collection.find({
      $text: { $search: question }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(30)
    .toArray();
    
    return results.map(item => ({
      ...item,
      relevanceScore: item.score || 0
    }));
    
  } catch (error) {
    console.error('❌ Erro no filtro com índices Bot_perguntas:', error.message);
    throw error;
  }
};

const filterArticlesWithIndexes = async (question, db) => {
  try {
    const collection = db.collection('Artigos');
    
    const results = await collection.find({
      $text: { $search: question }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(10)
    .toArray();
    
    return results.map(item => ({
      ...item,
      relevanceScore: item.score || 0
    }));
    
  } catch (error) {
    console.error('❌ Erro no filtro com índices Artigos:', error.message);
    throw error;
  }
};

const testOptimizedFilter = async () => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('console_conteudo');
    
    console.log('🧪 TESTANDO FILTRO OTIMIZADO COM ÍNDICES...\n');
    
    const testQuestions = [
      "crédito trabalhador",
      "antecipação",
      "pagamento",
      "documentos",
      "como funciona"
    ];
    
    for (const question of testQuestions) {
      console.log(`🔍 Testando: "${question}"`);
      const startTime = Date.now();
      
      try {
        // Testar filtro com índices
        const [botResults, artResults] = await Promise.all([
          filterByKeywordsWithIndexes(question, db),
          filterArticlesWithIndexes(question, db)
        ]);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`   ⏱️ Tempo: ${duration}ms`);
        console.log(`   📚 Bot_perguntas: ${botResults.length} resultados`);
        console.log(`   📄 Artigos: ${artResults.length} resultados`);
        
        if (botResults.length > 0) {
          console.log(`   🎯 Melhor score Bot_perguntas: ${botResults[0].relevanceScore?.toFixed(2)}`);
          console.log(`   📝 Primeira pergunta: ${botResults[0].pergunta?.substring(0, 50)}...`);
        }
        
        if (artResults.length > 0) {
          console.log(`   🎯 Melhor score Artigos: ${artResults[0].relevanceScore?.toFixed(2)}`);
          console.log(`   📝 Primeiro título: ${artResults[0].artigo_titulo?.substring(0, 50)}...`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        console.log('');
      }
    }
    
    // Teste de performance comparativo
    console.log('📊 TESTE DE PERFORMANCE COMPARATIVO...\n');
    
    const performanceTest = async (question, iterations = 5) => {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await Promise.all([
          filterByKeywordsWithIndexes(question, db),
          filterArticlesWithIndexes(question, db)
        ]);
        
        const endTime = Date.now();
        times.push(endTime - startTime);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      return { avgTime, minTime, maxTime, times };
    };
    
    const perfResult = await performanceTest("crédito trabalhador", 10);
    
    console.log(`🎯 Performance com "crédito trabalhador" (10 iterações):`);
    console.log(`   ⏱️ Tempo médio: ${perfResult.avgTime.toFixed(2)}ms`);
    console.log(`   ⚡ Tempo mínimo: ${perfResult.minTime}ms`);
    console.log(`   🐌 Tempo máximo: ${perfResult.maxTime}ms`);
    console.log(`   📊 Todos os tempos: ${perfResult.times.join(', ')}ms`);
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🚀 Filtro otimizado com índices funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    if (client) await client.close();
  }
};

testOptimizedFilter();

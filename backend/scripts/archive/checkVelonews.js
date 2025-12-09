/**
 * Script para verificar a coleção Velonews
 * VERSION: v1.0.0 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
 */

const { MongoClient } = require('mongodb');

// ATENÇÃO: Credenciais removidas por segurança. Use variável de ambiente MONGO_ENV
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb://REDACTED';

const checkVelonews = async () => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('console_conteudo');
    
    console.log('🔍 VERIFICANDO COLEÇÃO VELONEWS...\n');
    
    const velonewsCollection = db.collection('Velonews');
    
    // 1. Verificar estrutura dos dados
    const sample = await velonewsCollection.findOne({});
    console.log('📄 ESTRUTURA DOS DADOS VELONEWS:');
    if (sample) {
      console.log('   Campos encontrados:', Object.keys(sample));
      console.log('   title:', sample.title ? '✅' : '❌');
      console.log('   content:', sample.content ? '✅' : '❌');
      console.log('   titulo:', sample.titulo ? '✅' : '❌');
      console.log('   conteudo:', sample.conteudo ? '✅' : '❌');
      
      if (sample.title) console.log('   title exemplo:', sample.title.substring(0, 50) + '...');
      if (sample.content) console.log('   content exemplo:', sample.content.substring(0, 50) + '...');
      if (sample.titulo) console.log('   titulo exemplo:', sample.titulo.substring(0, 50) + '...');
      if (sample.conteudo) console.log('   conteudo exemplo:', sample.conteudo.substring(0, 50) + '...');
    }
    
    // 2. Contar documentos
    const totalDocs = await velonewsCollection.countDocuments();
    console.log(`\n📊 Total de documentos: ${totalDocs}`);
    
    // 3. Verificar quantos têm campos antigos vs novos
    const withOldFields = await velonewsCollection.countDocuments({
      $or: [
        { title: { $exists: true } },
        { content: { $exists: true } }
      ]
    });
    
    const withNewFields = await velonewsCollection.countDocuments({
      $or: [
        { titulo: { $exists: true } },
        { conteudo: { $exists: true } }
      ]
    });
    
    console.log(`📊 Documentos com campos antigos (title/content): ${withOldFields}`);
    console.log(`📊 Documentos com campos novos (titulo/conteudo): ${withNewFields}`);
    
    // 4. Testar o índice atual
    console.log('\n🧪 TESTANDO ÍNDICE ATUAL...');
    
    try {
      const testResults = await velonewsCollection.find({
        $text: { $search: "notícia" }
      }, {
        score: { $meta: "textScore" }
      })
      .sort({ score: { $meta: "textScore" } })
      .limit(3)
      .toArray();
      
      console.log(`✅ Índice funcionando: ${testResults.length} resultados`);
      testResults.forEach((doc, i) => {
        console.log(`   ${i+1}. Score: ${doc.score?.toFixed(2)}`);
        if (doc.title) console.log(`       Title: ${doc.title.substring(0, 50)}...`);
        if (doc.titulo) console.log(`       Titulo: ${doc.titulo.substring(0, 50)}...`);
      });
      
    } catch (error) {
      console.log(`❌ Índice não funcionando: ${error.message}`);
    }
    
    // 5. Verificar índices
    console.log('\n📋 ÍNDICES VELONEWS:');
    const indexes = await velonewsCollection.listIndexes().toArray();
    indexes.forEach((idx, i) => {
      console.log(`${i+1}. ${idx.name}`);
      console.log(`   Campos: ${JSON.stringify(idx.key)}`);
      if (idx.weights) console.log(`   Pesos: ${JSON.stringify(idx.weights)}`);
      if (idx.default_language) console.log(`   Idioma: ${idx.default_language}`);
      console.log('');
    });
    
    // 6. Conclusão
    console.log('💡 CONCLUSÃO VELONEWS:');
    if (withOldFields > 0) {
      console.log('✅ Velonews ainda usa campos antigos (title/content)');
      console.log('✅ Índice atual está correto');
    } else if (withNewFields > 0) {
      console.log('⚠️ Velonews migrou para campos novos (titulo/conteudo)');
      console.log('⚠️ Índice atual está desatualizado');
    } else {
      console.log('❓ Velonews não tem campos de texto');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (client) await client.close();
  }
};

checkVelonews();

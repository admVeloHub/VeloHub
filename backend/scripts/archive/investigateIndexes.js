/**
 * Script para investigar índices antigos
 * VERSION: v1.0.0 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://REDACTED';

const investigateIndexes = async () => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('console_conteudo');
    
    console.log('🔍 INVESTIGANDO ÍNDICES ANTIGOS...\n');
    
    // 1. Verificar quando os índices foram criados
    console.log('📅 VERIFICANDO DETALHES DOS ÍNDICES...\n');
    
    // Bot_perguntas
    const botIndexes = await db.collection('Bot_perguntas').listIndexes().toArray();
    console.log('📚 ÍNDICES BOT_PERGUNTAS:');
    botIndexes.forEach((idx, i) => {
      console.log(`${i+1}. ${idx.name}`);
      console.log(`   Campos: ${JSON.stringify(idx.key)}`);
      if (idx.weights) console.log(`   Pesos: ${JSON.stringify(idx.weights)}`);
      if (idx.default_language) console.log(`   Idioma: ${idx.default_language}`);
      if (idx.v) console.log(`   Versão: ${idx.v}`);
      console.log('');
    });
    
    // Artigos
    const artIndexes = await db.collection('Artigos').listIndexes().toArray();
    console.log('📄 ÍNDICES ARTIGOS:');
    artIndexes.forEach((idx, i) => {
      console.log(`${i+1}. ${idx.name}`);
      console.log(`   Campos: ${JSON.stringify(idx.key)}`);
      if (idx.weights) console.log(`   Pesos: ${JSON.stringify(idx.weights)}`);
      if (idx.default_language) console.log(`   Idioma: ${idx.default_language}`);
      if (idx.v) console.log(`   Versão: ${idx.v}`);
      console.log('');
    });
    
    // 2. Verificar se existem documentos com campos antigos
    console.log('🔍 VERIFICANDO DOCUMENTOS COM CAMPOS ANTIGOS...\n');
    
    // Bot_perguntas - verificar se algum documento tem question/context
    const botWithOldFields = await db.collection('Bot_perguntas').findOne({
      $or: [
        { question: { $exists: true } },
        { context: { $exists: true } }
      ]
    });
    
    if (botWithOldFields) {
      console.log('⚠️ BOT_PERGUNTAS: Encontrado documento com campos antigos!');
      console.log('   Campos encontrados:', Object.keys(botWithOldFields));
      if (botWithOldFields.question) console.log('   question:', botWithOldFields.question.substring(0, 100));
      if (botWithOldFields.context) console.log('   context:', botWithOldFields.context.substring(0, 100));
    } else {
      console.log('✅ BOT_PERGUNTAS: Nenhum documento com campos antigos encontrado');
    }
    
    // Artigos - verificar se algum documento tem title/content
    const artWithOldFields = await db.collection('Artigos').findOne({
      $or: [
        { title: { $exists: true } },
        { content: { $exists: true } }
      ]
    });
    
    if (artWithOldFields) {
      console.log('⚠️ ARTIGOS: Encontrado documento com campos antigos!');
      console.log('   Campos encontrados:', Object.keys(artWithOldFields));
      if (artWithOldFields.title) console.log('   title:', artWithOldFields.title.substring(0, 100));
      if (artWithOldFields.content) console.log('   content:', artWithOldFields.content.substring(0, 100));
    } else {
      console.log('✅ ARTIGOS: Nenhum documento com campos antigos encontrado');
    }
    
    // 3. Verificar histórico de alterações (se possível)
    console.log('\n📊 ESTATÍSTICAS DOS CAMPOS...\n');
    
    // Contar documentos com campos antigos vs novos
    const botOldCount = await db.collection('Bot_perguntas').countDocuments({
      $or: [
        { question: { $exists: true } },
        { context: { $exists: true } }
      ]
    });
    
    const botNewCount = await db.collection('Bot_perguntas').countDocuments({
      $or: [
        { pergunta: { $exists: true } },
        { palavrasChave: { $exists: true } }
      ]
    });
    
    const artOldCount = await db.collection('Artigos').countDocuments({
      $or: [
        { title: { $exists: true } },
        { content: { $exists: true } }
      ]
    });
    
    const artNewCount = await db.collection('Artigos').countDocuments({
      $or: [
        { artigo_titulo: { $exists: true } },
        { artigo_conteudo: { $exists: true } }
      ]
    });
    
    console.log('📚 BOT_PERGUNTAS:');
    console.log(`   Documentos com campos antigos: ${botOldCount}`);
    console.log(`   Documentos com campos novos: ${botNewCount}`);
    
    console.log('\n📄 ARTIGOS:');
    console.log(`   Documentos com campos antigos: ${artOldCount}`);
    console.log(`   Documentos com campos novos: ${artNewCount}`);
    
    // 4. Recomendação
    console.log('\n💡 RECOMENDAÇÃO:');
    if (botOldCount === 0 && artOldCount === 0) {
      console.log('✅ Todos os documentos usam campos novos');
      console.log('🗑️ Podemos remover os índices antigos com segurança');
      console.log('🚀 Criar novos índices para campos atuais');
    } else {
      console.log('⚠️ Ainda existem documentos com campos antigos');
      console.log('🔍 Investigar migração de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (client) await client.close();
  }
};

investigateIndexes();

/**
 * Script para investigar o mistério dos campos title e content
 * VERSION: v1.0.0 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://REDACTED';

const investigateTitleContent = async () => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('console_conteudo');
    
    console.log('🔍 INVESTIGANDO O MISTÉRIO DOS CAMPOS TITLE E CONTENT...\n');
    
    // 1. Verificar se existem documentos com campos antigos em outras coleções
    console.log('📋 VERIFICANDO TODAS AS COLEÇÕES...\n');
    
    const collections = await db.listCollections().toArray();
    console.log('Coleções encontradas:', collections.map(c => c.name));
    
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const sample = await coll.findOne({});
      
      if (sample) {
        const hasTitle = sample.title !== undefined;
        const hasContent = sample.content !== undefined;
        const hasQuestion = sample.question !== undefined;
        const hasContext = sample.context !== undefined;
        
        if (hasTitle || hasContent || hasQuestion || hasContext) {
          console.log(`\n📄 ${collection.name.toUpperCase()}:`);
          console.log('   Campos encontrados:', Object.keys(sample));
          if (hasTitle) console.log('   ✅ title:', sample.title?.substring(0, 50) + '...');
          if (hasContent) console.log('   ✅ content:', sample.content?.substring(0, 50) + '...');
          if (hasQuestion) console.log('   ✅ question:', sample.question?.substring(0, 50) + '...');
          if (hasContext) console.log('   ✅ context:', sample.context?.substring(0, 50) + '...');
        }
      }
    }
    
    // 2. Verificar histórico de alterações (se possível)
    console.log('\n📅 VERIFICANDO DATAS DE CRIAÇÃO DOS ÍNDICES...\n');
    
    // Bot_perguntas
    const botIndexes = await db.collection('Bot_perguntas').listIndexes().toArray();
    console.log('📚 ÍNDICES BOT_PERGUNTAS:');
    botIndexes.forEach((idx, i) => {
      console.log(`${i+1}. ${idx.name}`);
      console.log(`   Campos: ${JSON.stringify(idx.key)}`);
      if (idx.weights) console.log(`   Pesos: ${JSON.stringify(idx.weights)}`);
      if (idx.default_language) console.log(`   Idioma: ${idx.default_language}`);
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
      console.log('');
    });
    
    // 3. Verificar se há documentos com campos antigos em outras bases
    console.log('🗄️ VERIFICANDO OUTRAS BASES DE DADOS...\n');
    
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    
    for (const dbInfo of databases.databases) {
      if (dbInfo.name !== 'console_conteudo' && dbInfo.name !== 'admin' && dbInfo.name !== 'local') {
        console.log(`📊 Verificando base: ${dbInfo.name}`);
        
        try {
          const otherDb = client.db(dbInfo.name);
          const otherCollections = await otherDb.listCollections().toArray();
          
          for (const coll of otherCollections) {
            const sample = await otherDb.collection(coll.name).findOne({});
            if (sample) {
              const hasTitle = sample.title !== undefined;
              const hasContent = sample.content !== undefined;
              const hasQuestion = sample.question !== undefined;
              const hasContext = sample.context !== undefined;
              
              if (hasTitle || hasContent || hasQuestion || hasContext) {
                console.log(`   📄 ${coll.name}:`);
                if (hasTitle) console.log(`      ✅ title: ${sample.title?.substring(0, 30)}...`);
                if (hasContent) console.log(`      ✅ content: ${sample.content?.substring(0, 30)}...`);
                if (hasQuestion) console.log(`      ✅ question: ${sample.question?.substring(0, 30)}...`);
                if (hasContext) console.log(`      ✅ context: ${sample.context?.substring(0, 30)}...`);
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Erro ao acessar ${dbInfo.name}: ${error.message}`);
        }
      }
    }
    
    // 4. Verificar se há índices órfãos em outras coleções
    console.log('\n🔍 VERIFICANDO ÍNDICES ÓRFÃOS EM OUTRAS COLEÇÕES...\n');
    
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const indexes = await coll.listIndexes().toArray();
      
      const textIndexes = indexes.filter(idx => 
        idx.key && idx.key._fts === 'text'
      );
      
      if (textIndexes.length > 0) {
        console.log(`📄 ${collection.name.toUpperCase()} - Índices de texto:`);
        textIndexes.forEach(idx => {
          console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`);
          if (idx.weights) console.log(`   Pesos: ${JSON.stringify(idx.weights)}`);
        });
        console.log('');
      }
    }
    
    // 5. Conclusão
    console.log('💡 CONCLUSÃO:');
    console.log('Os índices question_text_context_text e title_text_content_text');
    console.log('foram criados para campos que não existem mais nos dados atuais.');
    console.log('Isso sugere que:');
    console.log('1. Houve uma migração de schema no passado');
    console.log('2. Os índices antigos não foram removidos');
    console.log('3. Os campos title/content/question/context foram renomeados');
    console.log('4. Os novos campos são artigo_titulo/artigo_conteudo/pergunta/palavrasChave');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (client) await client.close();
  }
};

investigateTitleContent();

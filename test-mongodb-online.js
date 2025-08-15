const { MongoClient } = require('mongodb');

// MongoDB Connection String
const uri = "mongodb+srv://REDACTED";

async function testMongoDBConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Conectando ao MongoDB Atlas...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const db = client.db('console_conteudo');
    console.log('\n📊 Database:', db.databaseName);
    
    // Listar todas as collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections encontradas:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Testar cada collection
    console.log('\n🔍 Testando collections...');
    
    // 1. Velonews
    console.log('\n📰 Testando Velonews:');
    const velonewsCollection = db.collection('Velonews');
    const velonewsCount = await velonewsCollection.countDocuments();
    console.log(`  Total de documentos: ${velonewsCount}`);
    
    if (velonewsCount > 0) {
      const velonewsSample = await velonewsCollection.findOne();
      console.log('  Exemplo de documento:');
      console.log('  ', JSON.stringify(velonewsSample, null, 2));
    }
    
    // 2. Artigos
    console.log('\n📚 Testando Artigos:');
    const artigosCollection = db.collection('Artigos');
    const artigosCount = await artigosCollection.countDocuments();
    console.log(`  Total de documentos: ${artigosCount}`);
    
    if (artigosCount > 0) {
      const artigosSample = await artigosCollection.findOne();
      console.log('  Exemplo de documento:');
      console.log('  ', JSON.stringify(artigosSample, null, 2));
    }
    
    // 3. Bot_perguntas
    console.log('\n❓ Testando Bot_perguntas:');
    const botPerguntasCollection = db.collection('Bot_perguntas');
    const botPerguntasCount = await botPerguntasCollection.countDocuments();
    console.log(`  Total de documentos: ${botPerguntasCount}`);
    
    if (botPerguntasCount > 0) {
      const botPerguntasSample = await botPerguntasCollection.findOne();
      console.log('  Exemplo de documento:');
      console.log('  ', JSON.stringify(botPerguntasSample, null, 2));
    }
    
    // Testar mapeamento
    console.log('\n🔄 Testando mapeamento de dados...');
    
    if (velonewsCount > 0) {
      const velonews = await velonewsCollection.find({}).toArray();
      const mappedVelonews = velonews.map(item => ({
        _id: item._id,
        title: item.title || item.velonews_titulo,
        content: item.content || item.velonews_conteudo,
        is_critical: item.alerta_critico || item.is_critical || 'N',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      console.log('  Velonews mapeado:');
      console.log('  ', JSON.stringify(mappedVelonews[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada.');
  }
}

testMongoDBConnection();

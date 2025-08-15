const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://REDACTED";
const client = new MongoClient(uri);

async function debugAPI() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    const db = client.db('console_conteudo');
    console.log('📊 Database:', db.databaseName);
    
    // Listar todas as collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections disponíveis:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Testar Velonews
    console.log('\n📰 === TESTE VELONEWS ===');
    const velonewsCollection = db.collection('Velonews');
    const velonews = await velonewsCollection.find({}).toArray();
    console.log(`Total de documentos: ${velonews.length}`);
    
    if (velonews.length > 0) {
      console.log('Primeiro documento:');
      console.log(JSON.stringify(velonews[0], null, 2));
      
      // Simular o mapeamento da API
      const mappedNews = velonews.map(item => ({
        _id: item._id,
        title: item.title || item.velonews_titulo,
        content: item.content || item.velonews_conteudo,
        is_critical: item.alerta_critico || item.is_critical || 'N',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      console.log('\nMapeamento resultante:');
      console.log(JSON.stringify(mappedNews, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar debug
debugAPI();

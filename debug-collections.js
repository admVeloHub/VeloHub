const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

async function debugCollections() {
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
    
    // Testar cada collection
    for (const col of collections) {
      console.log(`\n🔍 Testando collection: ${col.name}`);
      const collection = db.collection(col.name);
      const docs = await collection.find({}).toArray();
      console.log(`  Total de documentos: ${docs.length}`);
      
      if (docs.length > 0) {
        console.log('  Primeiro documento:');
        console.log('  ', JSON.stringify(docs[0], null, 2).replace(/\n/g, '\n  '));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar debug
debugCollections();

const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

async function testVelonews() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');
    
    const db = client.db('console_conteudo');
    const collection = db.collection('Velonews');
    
    console.log('\n📰 Buscando dados da collection Velonews...');
    const velonews = await collection.find({}).toArray();
    
    console.log(`\n📊 Total de documentos encontrados: ${velonews.length}`);
    
    if (velonews.length > 0) {
      console.log('\n📋 DADOS DA COLLECTION VELONEWS:');
      console.log('=' .repeat(50));
      
      velonews.forEach((item, index) => {
        console.log(`\n--- Documento ${index + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('\n❌ Nenhum documento encontrado na collection Velonews');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar teste
testVelonews();

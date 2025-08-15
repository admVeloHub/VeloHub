const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

async function testBotPerguntas() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');
    
    const db = client.db('console_conteudo');
    const collection = db.collection('Bot_perguntas');
    
    console.log('\n🤖 Buscando dados da collection Bot_perguntas...');
    const perguntas = await collection.find({}).toArray();
    
    console.log(`\n📊 Total de documentos encontrados: ${perguntas.length}`);
    
    if (perguntas.length > 0) {
      console.log('\n📋 DADOS DA COLLECTION BOT_PERGUNTAS:');
      console.log('=' .repeat(50));
      
      perguntas.forEach((item, index) => {
        console.log(`\n--- Documento ${index + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('\n❌ Nenhum documento encontrado na collection Bot_perguntas');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar teste
testBotPerguntas();

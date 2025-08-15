const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://REDACTED";
const client = new MongoClient(uri);

async function testArtigos() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');
    
    const db = client.db('console_conteudo');
    const collection = db.collection('Artigos');
    
    console.log('\n📄 Buscando dados da collection Artigos...');
    const artigos = await collection.find({}).toArray();
    
    console.log(`\n📊 Total de documentos encontrados: ${artigos.length}`);
    
    if (artigos.length > 0) {
      console.log('\n📋 DADOS DA COLLECTION ARTIGOS:');
      console.log('=' .repeat(50));
      
      artigos.forEach((item, index) => {
        console.log(`\n--- Documento ${index + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('\n❌ Nenhum documento encontrado na collection Artigos');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar teste
testArtigos();

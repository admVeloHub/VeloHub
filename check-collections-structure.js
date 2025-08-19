const { MongoClient } = require('mongodb');

// String de conexão do MongoDB
const uri = "mongodb+srv://REDACTED";

async function checkCollectionsStructure() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
        
        const db = client.db('console_conteudo');
        
        // Verificar collections existentes
        const collections = await db.listCollections().toArray();
        console.log('\n📋 Collections existentes:');
        collections.forEach(col => console.log(`- ${col.name}`));
        
        // Verificar estrutura de cada collection
        console.log('\n🔍 Verificando estrutura das collections...');
        
        // Artigos
        const artigosCollection = db.collection('Artigos');
        const artigosSample = await artigosCollection.findOne();
        console.log('\n📄 Estrutura da collection Artigos:');
        if (artigosSample) {
            console.log(JSON.stringify(artigosSample, null, 2));
        } else {
            console.log('Collection vazia');
        }
        
        // Velonews
        const velonewsCollection = db.collection('Velonews');
        const velonewsSample = await velonewsCollection.findOne();
        console.log('\n📰 Estrutura da collection Velonews:');
        if (velonewsSample) {
            console.log(JSON.stringify(velonewsSample, null, 2));
        } else {
            console.log('Collection vazia');
        }
        
        // Bot_perguntas
        const botPerguntasCollection = db.collection('Bot_perguntas');
        const botPerguntasSample = await botPerguntasCollection.findOne();
        console.log('\n❓ Estrutura da collection Bot_perguntas:');
        if (botPerguntasSample) {
            console.log(JSON.stringify(botPerguntasSample, null, 2));
        } else {
            console.log('Collection vazia');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await client.close();
    }
}

checkCollectionsStructure();


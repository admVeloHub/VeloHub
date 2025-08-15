const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

async function testAllCollections() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');
    
    const db = client.db('console_conteudo');
    
    // Teste 1: Velonews
    console.log('\n📰 === TESTE VELONEWS ===');
    const velonewsCollection = db.collection('Velonews');
    const velonews = await velonewsCollection.find({}).toArray();
    console.log(`Total de Velonews: ${velonews.length}`);
    
    if (velonews.length > 0) {
      const mappedNews = velonews.map(item => ({
        _id: item._id,
        title: item.title || item.velonews_titulo,
        content: item.content || item.velonews_conteudo,
        is_critical: item.alerta_critico || item.is_critical || 'N',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      console.log('Mapeamento Velonews:');
      console.log(JSON.stringify(mappedNews, null, 2));
    }
    
    // Teste 2: Artigos
    console.log('\n📄 === TESTE ARTIGOS ===');
    const artigosCollection = db.collection('Artigos');
    const artigos = await artigosCollection.find({}).toArray();
    console.log(`Total de Artigos: ${artigos.length}`);
    
    if (artigos.length > 0) {
      const mappedArticles = artigos.map(item => ({
        _id: item._id,
        title: item.artigo_titulo || item.title,
        content: item.artigo_conteudo || item.content,
        category: item.categoria_titulo || item.category,
        category_id: item.categoria_id || item.category_id,
        keywords: item.keywords || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      console.log('Mapeamento Artigos:');
      console.log(JSON.stringify(mappedArticles, null, 2));
    }
    
    // Teste 3: Bot_perguntas
    console.log('\n🤖 === TESTE BOT_PERGUNTAS ===');
    const faqCollection = db.collection('Bot_perguntas');
    const faqs = await faqCollection.find({}).toArray();
    console.log(`Total de FAQ: ${faqs.length}`);
    
    if (faqs.length > 0) {
      const mappedFaq = faqs.map(item => ({
        _id: item._id,
        topic: item.topico || item.topic,
        context: item.contexto || item.context,
        keywords: item.keywords || '',
        question: item.topico || item.question,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      console.log('Mapeamento FAQ:');
      console.log(JSON.stringify(mappedFaq, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar teste
testAllCollections();

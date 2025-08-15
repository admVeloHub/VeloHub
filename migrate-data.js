const { MongoClient } = require('mongodb');

// String de conexão
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

async function migrateData() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');

    const db = client.db('velohub');
    
    // 1. Migrar Artigos (console_conteudo.Artigos -> velohub.articles)
    console.log('\n📄 Migrando Artigos...');
    const artigosCollection = client.db('console_conteudo').collection('Artigos');
    const artigos = await artigosCollection.find({}).toArray();
    
    if (artigos.length > 0) {
      const articlesCollection = db.collection('articles');
      
      for (const artigo of artigos) {
        const newArticle = {
          title: artigo.artigo_titulo,
          content: artigo.artigo_conteudo,
          category: artigo.categoria_titulo,
          category_id: artigo.categoria_id,
          createdAt: artigo.createdAt,
          updatedAt: artigo.updatedAt
        };
        
        await articlesCollection.insertOne(newArticle);
        console.log(`✅ Artigo migrado: ${artigo.artigo_titulo}`);
      }
    }

    // 2. Migrar Velonews (console_conteudo.Velonews -> velohub.velonews)
    console.log('\n📰 Migrando Velonews...');
    const velonewsCollection = client.db('console_conteudo').collection('Velonews');
    const velonews = await velonewsCollection.find({}).toArray();
    
    if (velonews.length > 0) {
      const newVelonewsCollection = db.collection('velonews');
      
      for (const velonewsItem of velonews) {
        const newVelonews = {
          title: velonewsItem.velonews_titulo,
          content: velonewsItem.velonews_conteudo,
          is_critical: velonewsItem.is_critical || 'N',
          createdAt: velonewsItem.createdAt,
          updatedAt: velonewsItem.updatedAt
        };
        
        await newVelonewsCollection.insertOne(newVelonews);
        console.log(`✅ Velonews migrado: ${velonewsItem.velonews_titulo}`);
      }
    }

    // 3. Migrar FAQ (console_conteudo.Bot_perguntas -> velohub.chatbotFaq)
    console.log('\n🤖 Migrando FAQ...');
    const faqCollection = client.db('console_conteudo').collection('Bot_perguntas');
    const faqs = await faqCollection.find({}).toArray();
    
    if (faqs.length > 0) {
      const newFaqCollection = db.collection('chatbotFaq');
      
      for (const faq of faqs) {
        const newFaq = {
          topic: faq.pergunta_titulo,
          context: faq.pergunta_conteudo,
          keywords: faq.keywords || '',
          createdAt: faq.createdAt,
          updatedAt: faq.updatedAt
        };
        
        await newFaqCollection.insertOne(newFaq);
        console.log(`✅ FAQ migrado: ${faq.pergunta_titulo}`);
      }
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    
    // Mostrar estatísticas
    const articlesCount = await db.collection('articles').countDocuments();
    const velonewsCount = await db.collection('velonews').countDocuments();
    const faqCount = await db.collection('chatbotFaq').countDocuments();
    
    console.log('\n📊 Estatísticas do database velohub:');
    console.log(`   - Articles: ${articlesCount} documentos`);
    console.log(`   - Velonews: ${velonewsCount} documentos`);
    console.log(`   - ChatbotFaq: ${faqCount} documentos`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar migração
migrateData();

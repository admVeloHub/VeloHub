require('dotenv').config();
const { MongoClient } = require('mongodb');

// URL da API do Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwuX73q38Ypdpigm0TG1AOMj5wNeDHjRi0PhZFI4F_SxA572btd8l2KVYUPEkQFpT9vyw/exec';

// URL do MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não configurada');
  process.exit(1);
}

async function migrateData() {
  try {
    console.log('🔄 Iniciando migração de dados...');

    // 1. Buscar dados da API do Google Apps Script
    console.log('📡 Buscando dados da API do Google Apps Script...');
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    const data = await response.json();

    // 2. Conectar ao MongoDB
    console.log('🗄️ Conectando ao MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();

    // 3. Migrar artigos
    console.log('📝 Migrando artigos...');
    const articlesCollection = db.collection('articles');
    
    await articlesCollection.deleteMany({});
    
    const articles = [];
    Object.entries(data.artigos || {}).forEach(([categoryKey, category]) => {
      if (category.articles) {
        category.articles.forEach(article => {
          articles.push({
            title: article.title,
            content: article.content,
            category: categoryKey,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }
    });
    
    if (articles.length > 0) {
      await articlesCollection.insertMany(articles);
      console.log(`✅ ${articles.length} artigos migrados`);
    }

    // 4. Migrar notícias
    console.log('📰 Migrando notícias...');
    const velonewsCollection = db.collection('velonews');
    
    await velonewsCollection.deleteMany({});
    
    if (data.velonews && data.velonews.length > 0) {
      const velonews = data.velonews.map(news => ({
        title: news.title,
        content: news.content,
        is_critical: news.is_critical || 'N',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await velonewsCollection.insertMany(velonews);
      console.log(`✅ ${velonews.length} notícias migradas`);
    }

    // 5. Migrar FAQs do chatbot
    console.log('🤖 Migrando FAQs do chatbot...');
    const chatbotFaqCollection = db.collection('chatbotFaq');
    
    await chatbotFaqCollection.deleteMany({});
    
    if (data.chatbotFaq && data.chatbotFaq.length > 0) {
      const chatbotFaqs = data.chatbotFaq.map(faq => ({
        topic: faq.topic,
        context: faq.context,
        keywords: faq.keywords || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await chatbotFaqCollection.insertMany(chatbotFaqs);
      console.log(`✅ ${chatbotFaqs.length} FAQs migradas`);
    }

    await client.close();
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Artigos: ${articles.length}`);
    console.log(`   - Notícias: ${data.velonews ? data.velonews.length : 0}`);
    console.log(`   - FAQs: ${data.chatbotFaq ? data.chatbotFaq.length : 0}`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };

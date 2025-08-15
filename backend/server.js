const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

// Test connection endpoint
app.get('/api/test', async (req, res) => {
  try {
    await client.connect();
    res.json({ success: true, message: 'Conexão com MongoDB OK!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get VeloNews from MongoDB
app.get('/api/velo-news', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('console_conteudo');
    const collection = db.collection('Velonews');
    
    const news = await collection.find({}).toArray();
    
    // Mapear campos para o formato esperado pelo frontend
    const mappedNews = news.map(item => ({
      _id: item._id,
      title: item.velonews_titulo || item.title,
      content: item.velonews_conteudo || item.content,
      is_critical: item.is_critical || 'N',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      success: true,
      data: mappedNews
    });
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notícias',
      error: error.message
    });
  }
});

// Get Articles from MongoDB
app.get('/api/articles', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('console_conteudo');
    const collection = db.collection('Artigos');
    
    const articles = await collection.find({}).toArray();
    
    // Mapear campos para o formato esperado pelo frontend
    const mappedArticles = articles.map(item => ({
      _id: item._id,
      title: item.artigo_titulo || item.title,
      content: item.artigo_conteudo || item.content,
      category: item.categoria_titulo || item.category,
      category_id: item.categoria_id || item.category_id,
      keywords: item.keywords || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      success: true,
      data: mappedArticles
    });
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar artigos',
      error: error.message
    });
  }
});

// Get Article by ID from MongoDB
app.get('/api/articles/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('console_conteudo');
    const collection = db.collection('Artigos');
    
    const { ObjectId } = require('mongodb');
    const article = await collection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artigo não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Erro ao buscar artigo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar artigo',
      error: error.message
    });
  }
});

// Get FAQ from MongoDB
app.get('/api/faq', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('console_conteudo');
    const collection = db.collection('Bot_perguntas');
    
    const faq = await collection.find({}).toArray();
    
    // Mapear campos para o formato esperado pelo frontend
    const mappedFaq = faq.map(item => ({
      _id: item._id,
      topic: item.pergunta_titulo || item.topic,
      context: item.pergunta_conteudo || item.context,
      keywords: item.keywords || '',
      question: item.pergunta_titulo || item.question, // Para compatibilidade com o frontend
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      success: true,
      data: mappedFaq
    });
  } catch (error) {
    console.error('Erro ao buscar FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar FAQ',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`📡 Teste a API em: http://localhost:${PORT}/api/test`);
});

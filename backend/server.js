const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCentral";
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
    const db = client.db('velohub');
    const collection = db.collection('velonews');
    
    const news = await collection.find({}).toArray();
    
    res.json({
      success: true,
      data: news
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
    const db = client.db('velohub');
    const collection = db.collection('articles');
    
    const articles = await collection.find({}).toArray();
    
    res.json({
      success: true,
      data: articles
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

// Get FAQ from MongoDB
app.get('/api/faq', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('velohub');
    const collection = db.collection('chatbotFaq');
    
    const faq = await collection.find({}).toArray();
    
    res.json({
      success: true,
      data: faq
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

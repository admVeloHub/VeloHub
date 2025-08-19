const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('velohub');
    
    // Test by listing collections
    const collections = await db.listCollections().toArray();
    
    res.json({
      success: true,
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      collections: collections.map(col => col.name),
      database: 'velohub'
    });
  } catch (error) {
    console.error('Erro na conexão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na conexão com MongoDB',
      error: error.message
    });
  }
});

// Get VeloNews from MongoDB
app.get('/api/velo-news', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('velohub');
    const collection = db.collection('velo_news');
    
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

// Create sample data
app.post('/api/create-sample-data', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('velohub');
    
    // Create velo_news collection with sample data
    const veloNewsCollection = db.collection('velo_news');
    
    const sampleNews = [
      {
        _id: 1,
        title: 'Nova Integração com Sistema de Gestão',
        content: 'Expandimos nossas capacidades! Agora o VeloHub se integra perfeitamente com os principais sistemas de gestão do mercado, otimizando seu fluxo de trabalho e centralizando informações cruciais para o seu negócio. A atualização já está disponível para todos os usuários.',
        created_at: new Date(),
        is_critical: false
      },
      {
        _id: 2,
        title: 'Atualização de Segurança Crítica',
        content: 'Implementamos novas camadas de segurança para proteger seus dados. Esta atualização reforça a criptografia e adiciona novos protocolos de autenticação. Recomendamos que todos os usuários revisem suas configurações de segurança.',
        created_at: new Date(),
        is_critical: true
      },
      {
        _id: 3,
        title: 'VeloAcademy Lança Novo Curso de Processos',
        content: 'Aprenda a dominar a automação de processos com nosso novo curso exclusivo na VeloAcademy. O curso cobre desde os conceitos básicos até as estratégias avançadas para maximizar a eficiência da sua equipe. Inscreva-se já!',
        created_at: new Date(),
        is_critical: false
      }
    ];
    
    // Clear existing data and insert new
    await veloNewsCollection.deleteMany({});
    await veloNewsCollection.insertMany(sampleNews);
    
    res.json({
      success: true,
      message: 'Dados de exemplo criados com sucesso!',
      count: sampleNews.length
    });
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar dados de exemplo',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acessível em: http://localhost:${PORT}`);
  console.log(`🌐 Acessível na rede local: http://0.0.0.0:${PORT}`);
  console.log(`📡 Teste a conexão em: http://localhost:${PORT}/api/test-connection`);
});

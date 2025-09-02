const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";
const client = new MongoClient(uri);

// Conectar ao MongoDB uma vez no início
let isConnected = false;
const connectToMongo = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('✅ Conexão MongoDB estabelecida!');
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error);
      throw error;
    }
  }
  return client;
};

// Test connection endpoint
app.get('/api/test', async (req, res) => {
  try {
    await connectToMongo();
    res.json({ success: true, message: 'Conexão com MongoDB OK!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint único para buscar todos os dados
app.get('/api/data', async (req, res) => {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await connectToMongo();
    console.log('✅ Conexão estabelecida!');
    
    const db = client.db('console_conteudo');
    
    // Buscar dados de todas as collections de uma vez
    console.log('📊 Buscando dados das collections...');
    
    const [velonews, artigos, faq] = await Promise.all([
      db.collection('Velonews').find({}).sort({ createdAt: -1 }).toArray(),
      db.collection('Artigos').find({}).sort({ createdAt: -1 }).toArray(),
      db.collection('Bot_perguntas').find({}).sort({ createdAt: -1 }).toArray()
    ]);
    
    console.log(`📰 Velonews encontrados: ${velonews.length}`);
    console.log(`📚 Artigos encontrados: ${artigos.length}`);
    console.log(`❓ FAQ encontrados: ${faq.length}`);
    
    // Debug: mostrar estrutura dos primeiros velonews
    if (velonews.length > 0) {
      console.log('🔍 Estrutura do primeiro velonews:', JSON.stringify(velonews[0], null, 2));
    }
    
    // Mapear dados para o formato esperado pelo frontend
    const mappedData = {
      velonews: velonews.map(item => ({
        _id: item._id,
        title: item.title || item.velonews_titulo,
        content: item.content || item.velonews_conteudo,
        is_critical: item.alerta_critico === 'Y' || item.alerta_critico === true || item.is_critical === 'Y' || item.is_critical === true ? 'Y' : 'N',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      
      articles: artigos.map(item => ({
        _id: item._id,
        title: item.artigo_titulo || item.title,
        content: item.artigo_conteudo || item.content,
        category: item.categoria_titulo || item.category,
        category_id: item.categoria_id || item.category_id,
        keywords: item.keywords || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      
      faq: faq.map(item => ({
        _id: item._id,
        topic: item.topico || item.topic,
        context: item.contexto || item.context,
        keywords: item.keywords || '',
        question: item.topico || item.question,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    };
    
    console.log('✅ Dados mapeados com sucesso!');
    console.log(`📊 Resumo: ${mappedData.velonews.length} velonews, ${mappedData.articles.length} artigos, ${mappedData.faq.length} faq`);
    
    // Debug: mostrar velonews críticos mapeados
    const criticalNews = mappedData.velonews.filter(n => n.is_critical === 'Y');
    console.log(`🚨 Velonews críticos encontrados: ${criticalNews.length}`);
    if (criticalNews.length > 0) {
      console.log('🚨 Primeiro velonews crítico:', JSON.stringify(criticalNews[0], null, 2));
    }
    
    res.json({
      success: true,
      data: mappedData
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados',
      error: error.message
    });
  }
});

// Endpoints individuais mantidos para compatibilidade
app.get('/api/velo-news', async (req, res) => {
  try {
    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Velonews');

    // Heurística para evitar "artigos" que vazaram pra cá
    const raw = await collection.find({
      $nor: [
        { artigo_titulo: { $exists: true } },
        { artigo_conteudo: { $exists: true } },
        { tipo: 'artigo' },
      ]
    })
    .sort({ createdAt: -1, _id: -1 })
    .toArray();

    console.log('🔍 Buscando dados da collection Velonews...');
    console.log(`📰 Encontrados ${raw.length} documentos na collection Velonews`);
    
    // ADICIONE ESTE LOG PARA DEPURAR
    console.log('DADOS BRUTOS DA COLLECTION VELONEWS:', JSON.stringify(raw, null, 2));
    
    // Debug: mostrar estrutura dos primeiros 3 documentos
    if (raw.length > 0) {
      console.log('🔍 Estrutura dos primeiros documentos:');
      raw.slice(0, 3).forEach((item, index) => {
        console.log(`Documento ${index + 1}:`, {
          _id: item._id,
          title: item.title,
          velonews_titulo: item.velonews_titulo,
          content: item.content ? item.content.substring(0, 100) + '...' : null,
          velonews_conteudo: item.velonews_conteudo ? item.velonews_conteudo.substring(0, 100) + '...' : null,
          alerta_critico: item.alerta_critico,
          is_critical: item.is_critical,
          createdAt: item.createdAt
        });
      });
    }

    const mappedNews = raw.map(item => {
      // Normalização de datas
      const createdAt =
        item.createdAt ??
        item.updatedAt ??
        (item._id && item._id.getTimestamp ? item._id.getTimestamp() : null);

      return {
        _id: item._id,
        // Priorize os campos ESPECÍFICOS de Velonews antes dos genéricos
        title: item.velonews_titulo ?? item.title ?? '(sem título)',
        content: item.velonews_conteudo ?? item.content ?? '',
        is_critical:
          item.alerta_critico === 'Y' || item.alerta_critico === true ||
          item.is_critical === 'Y' || item.is_critical === true
            ? 'Y'
            : 'N',
        createdAt,
        updatedAt: item.updatedAt ?? createdAt,
        source: 'Velonews' // <- rótulo explícito
      };
    });
    
    console.log('✅ Dados mapeados com sucesso:', mappedNews.length, 'velonews');
    
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

app.get('/api/articles', async (req, res) => {
  try {
    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Artigos');
    
    const articles = await collection.find({}).toArray();
    
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

app.get('/api/faq', async (req, res) => {
  try {
    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Bot_perguntas');
    
    const faq = await collection.find({}).toArray();
    
    const mappedFaq = faq.map(item => ({
      _id: item._id,
      topic: item.topico || item.topic,
      context: item.contexto || item.context,
      keywords: item.keywords || '',
      question: item.topico || item.question,
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

// Sistema de Ponto - Endpoints seguros (não interferem nas APIs existentes)
app.post('/api/ponto/entrada', async (req, res) => {
  try {
    // Validar se usuário está autenticado (implementar conforme sua lógica)
    // const user = req.user; // Sua validação de usuário
    
    // Chamar API do Ponto Mais
    const response = await fetch('https://api.pontomais.com.br/time_clock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PONTO_MAIS_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'in',
        timestamp: new Date().toISOString(),
        company_id: process.env.PONTO_MAIS_COMPANY_ID
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar entrada no Ponto Mais');
    }

    res.json({ success: true, message: 'Entrada registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ponto/saida', async (req, res) => {
  try {
    // Validar se usuário está autenticado (implementar conforme sua lógica)
    // const user = req.user; // Sua validação de usuário
    
    // Chamar API do Ponto Mais
    const response = await fetch('https://api.pontomais.com.br/time_clock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PONTO_MAIS_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'out',
        timestamp: new Date().toISOString(),
        company_id: process.env.PONTO_MAIS_COMPANY_ID
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar saída no Ponto Mais');
    }

    res.json({ success: true, message: 'Saída registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ponto/status', async (req, res) => {
  try {
    // Validar se usuário está autenticado (implementar conforme sua lógica)
    // const user = req.user; // Sua validação de usuário
    
    // Chamar API do Ponto Mais para status
    const response = await fetch('https://api.pontomais.com.br/time_clock/current', {
      headers: {
        'Authorization': `Bearer ${process.env.PONTO_MAIS_API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar status no Ponto Mais');
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`🌐 Acessível em: http://localhost:${PORT}`);
  console.log(`🌐 Acessível na rede local: http://0.0.0.0:${PORT}`);
  console.log(`📡 Endpoint principal: http://localhost:${PORT}/api/data`);
  console.log(`📡 Teste a API em: http://localhost:${PORT}/api/test`);
});

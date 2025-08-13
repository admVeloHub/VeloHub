import 'server-only';
import { connectToDatabase } from './mongodb';

// Tipagem para os dados
interface Article {
  title: string;
  content: string;
}

interface Category {
  title: string;
  articles: Article[];
}

interface VeloHubData {
  artigos: Record<string, Category>;
  noticias: any[];
  faq: any[];
}

export async function getVeloHubData(): Promise<VeloHubData> {
  try {
    // Verificar se MONGODB_URI está configurada
    if (!process.env.MONGODB_URI) {
      console.log('MONGODB_URI não configurado, retornando dados de exemplo.');
      return {
        artigos: {
          'Tecnologia': {
            title: 'Tecnologia',
            articles: [
              {
                title: 'Introdução ao Next.js',
                content: 'Next.js é um framework React que oferece funcionalidades como renderização do lado do servidor...'
              },
              {
                title: 'MongoDB para Iniciantes',
                content: 'MongoDB é um banco de dados NoSQL orientado a documentos...'
              }
            ]
          },
          'Ciclismo': {
            title: 'Ciclismo',
            articles: [
              {
                title: 'Dicas de Segurança',
                content: 'Sempre use capacete e equipamentos de segurança ao andar de bicicleta...'
              }
            ]
          }
        },
        noticias: [
          {
            title: 'VeloHub Lançado com Sucesso!',
            content: 'Nossa plataforma está funcionando perfeitamente no Vercel.',
            date: new Date().toISOString()
          }
        ],
        faq: [
          {
            question: 'Como funciona o VeloHub?',
            answer: 'O VeloHub é uma plataforma de conhecimento sobre ciclismo e tecnologia.'
          }
        ]
      };
    }

    const connection = await connectToDatabase();
    
    if (!connection) {
      console.log('Falha na conexão com MongoDB, retornando dados de exemplo.');
      return {
        artigos: {
          'Tecnologia': {
            title: 'Tecnologia',
            articles: [
              {
                title: 'Conexão MongoDB Falhou',
                content: 'A conexão com o banco de dados não foi estabelecida. Verifique as configurações.'
              }
            ]
          }
        },
        noticias: [],
        faq: []
      };
    }

    // Buscar dados das coleções do MongoDB
    const articlesCollection = connection.db.collection('articles');
    const velonewsCollection = connection.db.collection('velonews');
    const chatbotFaqCollection = connection.db.collection('chatbotFaq');
    
    // Buscar artigos
    const artigosResult = await articlesCollection.find({}).toArray();
    
    // Processar artigos
    const artigos: Record<string, Category> = {};
    
    artigosResult.forEach((artigo: any) => {
      const categoria = artigo.category || 'Geral';
      if (!artigos[categoria]) {
        artigos[categoria] = {
          title: categoria,
          articles: []
        };
      }
      artigos[categoria].articles.push({
        title: artigo.title || artigo.name,
        content: artigo.content || artigo.value
      });
    });

    // Buscar notícias
    const noticias = await velonewsCollection.find({}).toArray();
    
    // Buscar FAQs
    const faq = await chatbotFaqCollection.find({}).toArray();

    return { artigos, noticias, faq };

  } catch (error) {
    console.error('Erro ao buscar dados do DB:', error);
    return {
      artigos: {
        'Erro': {
          title: 'Erro de Conexão',
          articles: [
            {
              title: 'Problema de Conexão',
              content: 'Não foi possível conectar ao banco de dados. Erro: ' + (error as Error).message
            }
          ]
        }
      },
      noticias: [],
      faq: []
    };
  }
}

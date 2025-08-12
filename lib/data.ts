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
    const connection = await connectToDatabase();
    
    if (!connection) {
      console.log('MONGODB_URI não configurado, retornando dados vazios.');
      return { artigos: {}, noticias: [], faq: [] };
    }

    // Usar mongoose para buscar dados
    const artigosResult = await connection.models.Example?.find({}) || [];
    
    // Processar artigos (ajuste conforme sua estrutura de dados)
    const artigos: Record<string, Category> = {};
    
    // Se não há dados, retornar estrutura vazia
    if (!artigosResult || artigosResult.length === 0) {
      return { artigos: {}, noticias: [], faq: [] };
    }

    // Processar dados (ajuste conforme sua estrutura)
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

    return { artigos, noticias: [], faq: [] };

  } catch (error) {
    console.error('Erro ao buscar dados do DB:', error);
    return { artigos: {}, noticias: [], faq: [] };
  }
}

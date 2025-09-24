// Search Service - Busca inteligente em Bot_perguntas e Artigos
// VERSION: v2.1.1 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team
const cosineSimilarity = require('cosine-similarity');

class SearchService {
  constructor() {
    this.botPerguntasCache = [];
    this.articlesCache = [];
    this.lastCacheUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Busca pergunta relevante no banco Bot_perguntas
   * @param {string} question - Pergunta do usuário
   * @param {Array} botPerguntasData - Dados do MongoDB Bot_perguntas
   * @returns {Object|null} Pergunta mais relevante ou null
   */
  async findRelevantBotPergunta(question, botPerguntasData) {
    try {
      if (!botPerguntasData || botPerguntasData.length === 0) {
        console.log('📋 Search: Nenhuma pergunta do Bot_perguntas disponível');
        return null;
      }

      const questionWords = this.normalizeText(question);
      let bestMatch = null;
      let bestScore = 0;

      console.log(`🔍 Search: Buscando em Bot_perguntas para: "${question}"`);
      console.log(`📊 Search: Analisando ${botPerguntasData.length} perguntas do Bot_perguntas`);

      for (let i = 0; i < botPerguntasData.length; i++) {
        const pergunta = botPerguntasData[i];
        const score = this.calculateRelevanceScore(questionWords, pergunta);
        
        // Log detalhado para as primeiras 3 perguntas ou scores > 0.05
        if (i < 3 || score > 0.05) {
          console.log(`🔍 Search: Pergunta ${i+1}: "${pergunta.Pergunta || pergunta.pergunta || 'Sem título'}" - Score: ${score.toFixed(3)}`);
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            ...pergunta,
            relevanceScore: score
          };
        }
      }

      // Threshold mínimo de relevância (reduzido para melhor detecção)
      if (bestScore > 0.1) {
        console.log(`✅ Search: Pergunta encontrada em Bot_perguntas com score ${bestScore.toFixed(2)}`);
        console.log(`📋 Search: Match encontrado: "${bestMatch.Pergunta || bestMatch.pergunta}"`);
        return bestMatch;
      }

      console.log(`❌ Search: Nenhuma pergunta relevante encontrada (melhor score: ${bestScore.toFixed(2)})`);
      console.log(`🔍 Search: Total de perguntas analisadas: ${botPerguntasData.length}`);
      return null;

    } catch (error) {
      console.error('❌ Search Error (Bot_perguntas):', error.message);
      return null;
    }
  }

  /**
   * Busca artigos relevantes baseado na pergunta
   * @param {string} question - Pergunta do usuário
   * @param {Array} articlesData - Dados dos artigos
   * @returns {Array} Artigos relevantes ordenados por relevância
   */
  async findRelevantArticles(question, articlesData) {
    try {
      if (!articlesData || articlesData.length === 0) {
        console.log('📋 Search: Nenhum artigo disponível');
        return [];
      }

      const questionWords = this.normalizeText(question);
      const relevantArticles = [];

      console.log(`🔍 Search: Buscando artigos para: "${question}"`);

      for (const article of articlesData) {
        const score = this.calculateRelevanceScore(questionWords, article);
        
        if (score > 0.2) { // Threshold mais baixo para artigos
          relevantArticles.push({
            ...article,
            relevanceScore: score
          });
        }
      }

      // Ordenar por relevância
      relevantArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log(`✅ Search: ${relevantArticles.length} artigos relevantes encontrados`);
      return relevantArticles.slice(0, 5); // Máximo 5 artigos

    } catch (error) {
      console.error('❌ Search Error (Articles):', error.message);
      return [];
    }
  }

  /**
   * Calcula score de relevância entre pergunta e item
   * @param {string} questionWords - Palavras da pergunta normalizadas
   * @param {Object} item - Item do Bot_perguntas ou artigo
   * @returns {number} Score de relevância (0-1)
   */
  calculateRelevanceScore(questionWords, item) {
    try {
      // Extrair texto relevante do item
      const itemText = this.extractRelevantText(item);
      const itemWords = this.normalizeText(itemText);

      // Calcular similaridade usando cosine similarity
      const questionVector = this.createWordVector(questionWords);
      const itemVector = this.createWordVector(itemWords);

      if (questionVector.length === 0 || itemVector.length === 0) {
        return 0;
      }

      const similarity = cosineSimilarity(questionVector, itemVector);
      
      // Boost para matches exatos em keywords
      const keywordBoost = this.calculateKeywordBoost(questionWords, item);
      
      return Math.min(1, similarity + keywordBoost);

    } catch (error) {
      console.error('❌ Search Error (Score):', error.message);
      return 0;
    }
  }

  /**
   * Extrai texto relevante do item (Bot_perguntas ou artigo)
   * @param {Object} item - Item do Bot_perguntas ou artigo
   * @returns {string} Texto relevante
   */
  extractRelevantText(item) {
    const texts = [];
    
    // Para Bot_perguntas (estrutura MongoDB: Bot_perguntas)
    if (item.Pergunta) texts.push(item.Pergunta);
    if (item["Palavras-chave"]) texts.push(item["Palavras-chave"]);
    if (item.Sinonimos) texts.push(item.Sinonimos);
    if (item.Resposta) texts.push(item.Resposta.substring(0, 300)); // Primeiros 300 chars da resposta
    
    // Fallback para estrutura antiga (minúsculas)
    if (item.pergunta) texts.push(item.pergunta);
    if (item.palavras_chave) texts.push(item.palavras_chave);
    if (item.sinonimos) texts.push(item.sinonimos);
    if (item.resposta) texts.push(item.resposta.substring(0, 300));
    if (item.categoria) texts.push(item.categoria);
    
    // Fallback para estrutura ainda mais antiga
    if (item.question) texts.push(item.question);
    if (item.context) texts.push(item.context);
    if (item.keywords) {
      const keywordsText = Array.isArray(item.keywords) ? item.keywords.join(' ') : item.keywords;
      texts.push(keywordsText);
    }
    
    // Para Artigos
    if (item.title) texts.push(item.title);
    if (item.content) texts.push(item.content.substring(0, 500)); // Primeiros 500 chars
    
    const result = texts.join(' ').trim();
    console.log(`🔍 Search: Texto extraído para busca: "${result.substring(0, 100)}..."`);
    return result;
  }

  /**
   * Normaliza texto para busca
   * @param {string} text - Texto a ser normalizado
   * @returns {string} Texto normalizado
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/gi, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Cria vetor de palavras para cálculo de similaridade
   * @param {string} text - Texto normalizado
   * @returns {Array} Vetor de palavras
   */
  createWordVector(text) {
    const words = text.split(' ').filter(word => word.length > 2);
    const wordCount = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.values(wordCount);
  }

  /**
   * Calcula boost para matches em keywords
   * @param {string} questionWords - Palavras da pergunta
   * @param {Object} item - Item do Bot_perguntas ou artigo
   * @returns {number} Boost score
   */
  calculateKeywordBoost(questionWords, item) {
    let boost = 0;
    
    // Buscar em diferentes campos de keywords (MongoDB Bot_perguntas)
    const keywordsFields = [
      item["Palavras-chave"], // Campo principal MongoDB
      item.palavras_chave,    // Fallback minúsculas
      item.palavrasChave,     // Fallback camelCase
      item.keywords           // Fallback genérico
    ];
    
    for (const keywords of keywordsFields) {
      if (keywords) {
        const keywordsText = Array.isArray(keywords) ? 
          keywords.join(' ').toLowerCase() : 
          keywords.toLowerCase();
        
        const questionWordsArray = questionWords.split(' ');
        
        questionWordsArray.forEach(word => {
          if (word.length > 2 && keywordsText.includes(word)) {
            boost += 0.1; // 0.1 de boost por keyword match
          }
        });
      }
    }
    
    return Math.min(0.3, boost); // Máximo 0.3 de boost
  }


  /**
   * Busca híbrida: Bot_perguntas + Artigos (apenas banco de dados)
   * @param {string} question - Pergunta do usuário
   * @param {Array} botPerguntasData - Dados do MongoDB Bot_perguntas
   * @param {Array} articlesData - Dados dos artigos
   * @returns {Object} Resultado da busca híbrida
   */
  async hybridSearch(question, botPerguntasData, articlesData) {
    console.log(`🔍 Search: Iniciando busca híbrida para: "${question}"`);
    
    const [botPerguntaResult, articlesResult] = await Promise.all([
      this.findRelevantBotPergunta(question, botPerguntasData),
      this.findRelevantArticles(question, articlesData)
    ]);

    return {
      botPergunta: botPerguntaResult,
      articles: articlesResult,
      hasResults: !!(botPerguntaResult || articlesResult.length > 0)
    };
  }

  /**
   * Sistema de desduplicação e menu de esclarecimento (adaptado para MongoDB)
   * @param {string} question - Pergunta do usuário
   * @param {Array} botPerguntasData - Dados do MongoDB Bot_perguntas
   * @returns {Object} Resultado com desduplicação e opções de esclarecimento
   */
  findMatchesWithDeduplication(question, botPerguntasData) {
    if (!botPerguntasData || botPerguntasData.length === 0) {
      return { matches: [], needsClarification: false };
    }

    const palavrasDaBusca = this.normalizeText(question).split(' ').filter(p => p.length > 2);
    let todasAsCorrespondencias = [];

    // Processar cada documento do MongoDB
    for (let i = 0; i < botPerguntasData.length; i++) {
      const documento = botPerguntasData[i];
      
      // Extrair campos do documento MongoDB
      const pergunta = documento.Pergunta || documento.pergunta || '';
      const resposta = documento.Resposta || documento.resposta || '';
      const palavrasChave = documento["Palavras-chave"] || documento.palavras_chave || documento.palavrasChave || '';
      const sinonimos = documento.Sinonimos || documento.sinonimos || '';
      
      // Combinar palavras-chave e sinônimos para busca
      const textoBusca = `${palavrasChave} ${sinonimos}`.toLowerCase();
      let relevanceScore = 0;
      
      // Calcular score baseado nas palavras da busca
      palavrasDaBusca.forEach(palavra => {
        if (textoBusca.includes(palavra.toLowerCase())) {
          relevanceScore++;
        }
        // Bonus para match na pergunta
        if (pergunta.toLowerCase().includes(palavra.toLowerCase())) {
          relevanceScore += 0.5;
        }
      });
      
      if (relevanceScore > 0) {
        todasAsCorrespondencias.push({
          resposta: resposta,
          perguntaOriginal: pergunta,
          sourceRow: i + 1,
          score: relevanceScore,
          _id: documento._id,
          palavrasChave: palavrasChave,
          sinonimos: sinonimos
        });
      }
    }

    // Desduplicação e ordenação
    const uniqueMatches = {};
    todasAsCorrespondencias.forEach(match => {
      const key = match.perguntaOriginal.trim();
      if (!uniqueMatches[key] || match.score > uniqueMatches[key].score) {
        uniqueMatches[key] = match;
      }
    });
    
    let correspondenciasUnicas = Object.values(uniqueMatches);
    correspondenciasUnicas.sort((a, b) => b.score - a.score);

    // Verificar se precisa de esclarecimento
    const needsClarification = correspondenciasUnicas.length > 1 && 
      correspondenciasUnicas[0].score === correspondenciasUnicas[1].score;

    return {
      matches: correspondenciasUnicas,
      needsClarification: needsClarification
    };
  }

  /**
   * Gera menu de esclarecimento para perguntas ambíguas
   * @param {Array} matches - Matches encontrados
   * @param {string} question - Pergunta original
   * @returns {Object} Menu de esclarecimento
   */
  generateClarificationMenu(matches, question) {
    const options = matches.slice(0, 12).map(match => match.perguntaOriginal);
    
    return {
      status: "clarification_needed",
      resposta: `Encontrei vários tópicos sobre "${question}". Qual deles se encaixa melhor na sua dúvida?`,
      options: options,
      source: "Planilha",
      sourceRow: 'Pergunta de Esclarecimento'
    };
  }
}

module.exports = new SearchService();

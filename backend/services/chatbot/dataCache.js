// Data Cache Service - Cache inteligente para dados MongoDB
// VERSION: v1.0.0 | DATE: 2025-09-29 | AUTHOR: Lucas Gravina - VeloHub Development Team

class DataCache {
  constructor() {
    // Cache para dados do Bot_perguntas
    this.botPerguntasCache = {
      data: null,
      timestamp: null,
      ttl: 10 * 60 * 1000 // 10 minutos em ms
    };
    
    // Cache para dados dos Artigos
    this.articlesCache = {
      data: null,
      timestamp: null,
      ttl: 10 * 60 * 1000 // 10 minutos em ms
    };
    
    console.log('📦 Data Cache: Serviço de cache inicializado');
  }

  /**
   * Verifica se o cache de Bot_perguntas é válido
   * @returns {boolean} Status do cache
   */
  _isBotPerguntasCacheValid() {
    if (!this.botPerguntasCache.data || !this.botPerguntasCache.timestamp) {
      console.log('⚠️ Data Cache: Cache Bot_perguntas inválido - dados ou timestamp ausentes');
      return false;
    }
    
    const now = Date.now();
    const cacheAge = now - this.botPerguntasCache.timestamp;
    const isValid = cacheAge < this.botPerguntasCache.ttl;
    
    if (!isValid) {
      console.log(`⚠️ Data Cache: Cache Bot_perguntas expirado - idade: ${Math.round(cacheAge / 1000)}s, TTL: ${this.botPerguntasCache.ttl / 1000}s`);
    }
    
    return isValid;
  }

  /**
   * Verifica se o cache de Artigos é válido
   * @returns {boolean} Status do cache
   */
  _isArticlesCacheValid() {
    if (!this.articlesCache.data || !this.articlesCache.timestamp) {
      console.log('⚠️ Data Cache: Cache Artigos inválido - dados ou timestamp ausentes');
      return false;
    }
    
    const now = Date.now();
    const cacheAge = now - this.articlesCache.timestamp;
    const isValid = cacheAge < this.articlesCache.ttl;
    
    if (!isValid) {
      console.log(`⚠️ Data Cache: Cache Artigos expirado - idade: ${Math.round(cacheAge / 1000)}s, TTL: ${this.articlesCache.ttl / 1000}s`);
    }
    
    return isValid;
  }

  /**
   * Atualiza cache de Bot_perguntas
   * @param {Array} data - Dados do Bot_perguntas
   */
  updateBotPerguntas(data) {
    if (!data || !Array.isArray(data)) {
      console.error('❌ Data Cache: Dados inválidos para Bot_perguntas');
      return;
    }
    
    this.botPerguntasCache.data = data;
    this.botPerguntasCache.timestamp = Date.now();
    
    console.log(`✅ Data Cache: Bot_perguntas atualizado - ${data.length} registros`);
    console.log(`✅ Data Cache: Primeiro registro:`, data[0] ? Object.keys(data[0]) : 'Nenhum');
  }

  /**
   * Atualiza cache de Artigos
   * @param {Array} data - Dados dos Artigos
   */
  updateArticles(data) {
    if (!data || !Array.isArray(data)) {
      console.error('❌ Data Cache: Dados inválidos para Artigos');
      return;
    }
    
    this.articlesCache.data = data;
    this.articlesCache.timestamp = Date.now();
    
    console.log(`✅ Data Cache: Artigos atualizados - ${data.length} registros`);
    console.log(`✅ Data Cache: Primeiro artigo:`, data[0] ? Object.keys(data[0]) : 'Nenhum');
  }

  /**
   * Obtém dados do Bot_perguntas do cache
   * @returns {Array|null} Dados do cache ou null se inválido
   */
  getBotPerguntasData() {
    if (this._isBotPerguntasCacheValid()) {
      console.log('✅ Data Cache: Retornando Bot_perguntas do cache');
      return this.botPerguntasCache.data;
    }
    
    console.log('⚠️ Data Cache: Cache Bot_perguntas inválido, retornando null');
    return null;
  }

  /**
   * Obtém dados dos Artigos do cache
   * @returns {Array|null} Dados do cache ou null se inválido
   */
  getArticlesData() {
    if (this._isArticlesCacheValid()) {
      console.log('✅ Data Cache: Retornando Artigos do cache');
      return this.articlesCache.data;
    }
    
    console.log('⚠️ Data Cache: Cache Artigos inválido, retornando null');
    return null;
  }

  /**
   * Limpa todos os caches
   */
  clearAllCaches() {
    this.botPerguntasCache = {
      data: null,
      timestamp: null,
      ttl: 10 * 60 * 1000
    };
    
    this.articlesCache = {
      data: null,
      timestamp: null,
      ttl: 10 * 60 * 1000
    };
    
    console.log('🧹 Data Cache: Todos os caches limpos');
  }

  /**
   * Obtém status dos caches
   * @returns {Object} Status dos caches
   */
  getCacheStatus() {
    return {
      botPerguntas: {
        hasData: !!this.botPerguntasCache.data,
        isValid: this._isBotPerguntasCacheValid(),
        count: this.botPerguntasCache.data ? this.botPerguntasCache.data.length : 0,
        age: this.botPerguntasCache.timestamp ? Math.round((Date.now() - this.botPerguntasCache.timestamp) / 1000) : null
      },
      articles: {
        hasData: !!this.articlesCache.data,
        isValid: this._isArticlesCacheValid(),
        count: this.articlesCache.data ? this.articlesCache.data.length : 0,
        age: this.articlesCache.timestamp ? Math.round((Date.now() - this.articlesCache.timestamp) / 1000) : null
      }
    };
  }
}

module.exports = new DataCache();

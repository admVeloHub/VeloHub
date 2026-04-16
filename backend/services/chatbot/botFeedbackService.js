// Bot Feedback Service - Sistema de feedback do chatbot no MongoDB
// VERSION: v1.0.0 | DATE: 2024-12-19 | AUTHOR: VeloHub Development Team
(function loadVelohubFonteEnv(here) {
  const path = require('path');
  const fs = require('fs');
  let d = here;
  for (let i = 0; i < 14; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(__dirname);

const { MongoClient } = require('mongodb');

class BotFeedbackService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  /**
   * Conecta ao MongoDB
   */
  async connect() {
    if (this.isConnected) return;

    try {
      this.client = new MongoClient(process.env.MONGO_ENV);
      await this.client.connect();
      this.db = this.client.db('console_conteudo');
      this.collection = this.db.collection('bot_feedback');
      this.isConnected = true;
      
      console.log('✅ BotFeedback: Conectado ao MongoDB');
    } catch (error) {
      console.error('❌ BotFeedback: Erro ao conectar MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Registra feedback do bot seguindo schema console_conteudo.bot_feedback
   * @param {Object} feedbackData - Dados do feedback
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logFeedback(feedbackData) {
    try {
      await this.connect();

      const now = new Date();
      const feedback = {
        colaboradorNome: feedbackData.colaboradorNome || feedbackData.userId || 'anonymous',
        action: 'feedback_given',
        messageId: feedbackData.messageId,
        sessionId: feedbackData.sessionId || null,
        source: feedbackData.source || 'chatbot',
        details: {
          feedbackType: feedbackData.feedbackType, // 'positive' ou 'negative'
          comment: feedbackData.comment || '',
          question: feedbackData.question || '',
          answer: feedbackData.answer || '',
          aiProvider: feedbackData.aiProvider || null,
          responseSource: feedbackData.responseSource || 'bot_perguntas'
        },
        createdAt: now,
        updatedAt: now
      };

      const result = await this.collection.insertOne(feedback);
      
      console.log(`✅ BotFeedback: Feedback registrado com ID ${result.insertedId}`);
      
      return true;

    } catch (error) {
      console.error('❌ BotFeedback: Erro ao registrar feedback:', error.message);
      return false;
    }
  }

  /**
   * Registra feedback positivo
   * @param {string} colaboradorNome - Nome do colaborador
   * @param {string} messageId - ID da mensagem
   * @param {string} sessionId - ID da sessão
   * @param {Object} details - Detalhes adicionais
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logPositiveFeedback(colaboradorNome, messageId, sessionId = null, details = {}) {
    return await this.logFeedback({
      colaboradorNome,
      messageId,
      sessionId,
      feedbackType: 'positive',
      source: details.source || 'chatbot',
      comment: details.comment || '',
      question: details.question || '',
      answer: details.answer || '',
      aiProvider: details.aiProvider || null,
      responseSource: details.responseSource || 'bot_perguntas'
    });
  }

  /**
   * Registra feedback negativo
   * @param {string} colaboradorNome - Nome do colaborador
   * @param {string} messageId - ID da mensagem
   * @param {string} sessionId - ID da sessão
   * @param {Object} details - Detalhes adicionais
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logNegativeFeedback(colaboradorNome, messageId, sessionId = null, details = {}) {
    return await this.logFeedback({
      colaboradorNome,
      messageId,
      sessionId,
      feedbackType: 'negative',
      source: details.source || 'chatbot',
      comment: details.comment || '',
      question: details.question || '',
      answer: details.answer || '',
      aiProvider: details.aiProvider || null,
      responseSource: details.responseSource || 'bot_perguntas'
    });
  }

  /**
   * Obtém feedbacks por colaborador
   * @param {string} colaboradorNome - Nome do colaborador
   * @param {number} limit - Limite de resultados
   * @param {Date} startDate - Data de início (opcional)
   * @param {Date} endDate - Data de fim (opcional)
   * @returns {Promise<Array>} Feedbacks do colaborador
   */
  async getFeedbacksByColaborador(colaboradorNome, limit = 50, startDate = null, endDate = null) {
    try {
      await this.connect();

      const filter = { colaboradorNome };
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      const feedbacks = await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      console.log(`📋 BotFeedback: ${feedbacks.length} feedbacks obtidos para colaborador ${colaboradorNome}`);
      
      return feedbacks;

    } catch (error) {
      console.error('❌ BotFeedback: Erro ao obter feedbacks:', error.message);
      return [];
    }
  }

  /**
   * Obtém estatísticas de feedback
   * @param {Date} startDate - Data de início
   * @param {Date} endDate - Data de fim
   * @returns {Promise<Object>} Estatísticas de feedback
   */
  async getFeedbackStats(startDate, endDate) {
    try {
      await this.connect();

      const filter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$details.feedbackType',
            count: { $sum: 1 },
            uniqueColaboradores: { $addToSet: '$colaboradorNome' }
          }
        },
        {
          $project: {
            feedbackType: '$_id',
            count: 1,
            uniqueColaboradores: { $size: '$uniqueColaboradores' }
          }
        },
        { $sort: { count: -1 } }
      ];

      const stats = await this.collection.aggregate(pipeline).toArray();
      
      // Calcular total de colaboradores únicos
      const totalUniqueColaboradores = await this.collection.distinct('colaboradorNome', filter);
      
      // Calcular taxa de satisfação
      const positiveCount = stats.find(s => s.feedbackType === 'positive')?.count || 0;
      const negativeCount = stats.find(s => s.feedbackType === 'negative')?.count || 0;
      const totalFeedback = positiveCount + negativeCount;
      const satisfactionRate = totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;
      
      const result = {
        period: { start: startDate, end: endDate },
        totalFeedbacks: totalFeedback,
        totalUniqueColaboradores: totalUniqueColaboradores.length,
        satisfactionRate: satisfactionRate,
        feedbackTypes: stats
      };

      console.log(`📊 BotFeedback: Estatísticas obtidas - ${result.totalFeedbacks} feedbacks`);
      
      return result;

    } catch (error) {
      console.error('❌ BotFeedback: Erro ao obter estatísticas:', error.message);
      return null;
    }
  }

  /**
   * Obtém feedbacks negativos com comentários
   * @param {number} limit - Limite de resultados
   * @param {Date} startDate - Data de início (opcional)
   * @param {Date} endDate - Data de fim (opcional)
   * @returns {Promise<Array>} Feedbacks negativos
   */
  async getNegativeFeedbacks(limit = 20, startDate = null, endDate = null) {
    try {
      await this.connect();

      const filter = { 'details.feedbackType': 'negative' };
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      const feedbacks = await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      console.log(`📋 BotFeedback: ${feedbacks.length} feedbacks negativos obtidos`);
      
      return feedbacks;

    } catch (error) {
      console.error('❌ BotFeedback: Erro ao obter feedbacks negativos:', error.message);
      return [];
    }
  }

  /**
   * Obtém perguntas mais problemáticas (com mais feedbacks negativos)
   * @param {number} limit - Limite de resultados
   * @param {Date} startDate - Data de início (opcional)
   * @param {Date} endDate - Data de fim (opcional)
   * @returns {Promise<Array>} Perguntas problemáticas
   */
  async getProblematicQuestions(limit = 10, startDate = null, endDate = null) {
    try {
      await this.connect();

      const filter = { 'details.feedbackType': 'negative' };
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$details.question',
            count: { $sum: 1 },
            comments: { $push: '$details.comment' },
            colaboradores: { $addToSet: '$colaboradorNome' }
          }
        },
        {
          $project: {
            question: '$_id',
            count: 1,
            comments: 1,
            uniqueColaboradores: { $size: '$colaboradores' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ];

      const problematicQuestions = await this.collection.aggregate(pipeline).toArray();
      
      console.log(`📋 BotFeedback: ${problematicQuestions.length} perguntas problemáticas identificadas`);
      
      return problematicQuestions;

    } catch (error) {
      console.error('❌ BotFeedback: Erro ao obter perguntas problemáticas:', error.message);
      return [];
    }
  }

  /**
   * Obtém distribuição de feedbacks por fonte
   * @param {Date} startDate - Data de início (opcional)
   * @param {Date} endDate - Data de fim (opcional)
   * @returns {Promise<Object>} Distribuição por fonte
   */
  async getFeedbackDistributionBySource(startDate = null, endDate = null) {
    try {
      await this.connect();

      const filter = {};
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
            positive: {
              $sum: {
                $cond: [{ $eq: ['$details.feedbackType', 'positive'] }, 1, 0]
              }
            },
            negative: {
              $sum: {
                $cond: [{ $eq: ['$details.feedbackType', 'negative'] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            source: '$_id',
            total: 1,
            positive: 1,
            negative: 1,
            satisfactionRate: {
              $cond: [
                { $gt: [{ $add: ['$positive', '$negative'] }, 0] },
                { $multiply: [{ $divide: ['$positive', { $add: ['$positive', '$negative'] }] }, 100] },
                0
              ]
            }
          }
        },
        { $sort: { total: -1 } }
      ];

      const distribution = await this.collection.aggregate(pipeline).toArray();
      
      console.log(`📊 BotFeedback: Distribuição por fonte obtida`);
      
      return distribution;

    } catch (error) {
      console.error('❌ BotFeedback: Erro ao obter distribuição por fonte:', error.message);
      return [];
    }
  }

  /**
   * Fecha a conexão com MongoDB
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 BotFeedback: Conexão MongoDB fechada');
    }
  }

  /**
   * Testa a conexão com MongoDB
   * @returns {Promise<boolean>} Status da conexão
   */
  async testConnection() {
    try {
      await this.connect();
      await this.collection.findOne({});
      console.log('✅ BotFeedback: Teste de conexão bem-sucedido');
      return true;
    } catch (error) {
      console.error('❌ BotFeedback: Erro no teste de conexão:', error.message);
      return false;
    }
  }
}

module.exports = new BotFeedbackService();

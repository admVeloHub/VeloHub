// Feedback Service - Gerenciamento de feedback dos usuários
// VERSION: v2.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team
const { MongoClient } = require('mongodb');
require('dotenv').config();

class FeedbackService {
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
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db('console_conteudo');
      this.collection = this.db.collection('chatbot_feedback');
      this.isConnected = true;
      
      console.log('✅ Feedback: Conectado ao MongoDB');
    } catch (error) {
      console.error('❌ Feedback: Erro ao conectar MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Registra feedback do usuário
   * @param {Object} feedbackData - Dados do feedback
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logFeedback(feedbackData) {
    try {
      await this.connect();

      const feedback = {
        userId: feedbackData.userId,
        messageId: feedbackData.messageId,
        feedbackType: feedbackData.feedbackType, // 'positive' ou 'negative'
        comment: feedbackData.comment || '',
        question: feedbackData.question || '',
        answer: feedbackData.answer || '',
        source: feedbackData.source || 'chatbot',
        timestamp: new Date(),
        sessionId: feedbackData.sessionId || null,
        metadata: feedbackData.metadata || {}
      };

      const result = await this.collection.insertOne(feedback);
      
      console.log(`✅ Feedback: Feedback registrado com ID ${result.insertedId}`);
      
      return true;

    } catch (error) {
      console.error('❌ Feedback: Erro ao registrar feedback:', error.message);
      return false;
    }
  }

  /**
   * Obtém estatísticas de feedback
   * @param {string} userId - ID do usuário (opcional)
   * @param {Date} startDate - Data de início (opcional)
   * @param {Date} endDate - Data de fim (opcional)
   * @returns {Promise<Object>} Estatísticas de feedback
   */
  async getFeedbackStats(userId = null, startDate = null, endDate = null) {
    try {
      await this.connect();

      // Construir filtro
      const filter = {};
      
      if (userId) {
        filter.userId = userId;
      }
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = startDate;
        if (endDate) filter.timestamp.$lte = endDate;
      }

      // Agregação para estatísticas
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$feedbackType',
            count: { $sum: 1 },
            avgRating: { $avg: { $cond: [{ $eq: ['$feedbackType', 'positive'] }, 1, 0] } }
          }
        }
      ];

      const stats = await this.collection.aggregate(pipeline).toArray();
      
      // Processar resultados
      const result = {
        total: 0,
        positive: 0,
        negative: 0,
        satisfactionRate: 0,
        period: {
          start: startDate,
          end: endDate
        }
      };

      stats.forEach(stat => {
        result.total += stat.count;
        if (stat._id === 'positive') {
          result.positive = stat.count;
        } else if (stat._id === 'negative') {
          result.negative = stat.count;
        }
      });

      if (result.total > 0) {
        result.satisfactionRate = (result.positive / result.total) * 100;
      }

      console.log(`📊 Feedback: Estatísticas obtidas - ${result.total} feedbacks`);
      
      return result;

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter estatísticas:', error.message);
      return null;
    }
  }

  /**
   * Obtém feedbacks recentes
   * @param {number} limit - Limite de resultados
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Promise<Array>} Feedbacks recentes
   */
  async getRecentFeedback(limit = 10, userId = null) {
    try {
      await this.connect();

      const filter = userId ? { userId } : {};
      
      const feedbacks = await this.collection
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      console.log(`📋 Feedback: ${feedbacks.length} feedbacks recentes obtidos`);
      
      return feedbacks;

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter feedbacks recentes:', error.message);
      return [];
    }
  }

  /**
   * Obtém feedbacks negativos com comentários
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} Feedbacks negativos
   */
  async getNegativeFeedback(limit = 20) {
    try {
      await this.connect();

      const feedbacks = await this.collection
        .find({ 
          feedbackType: 'negative',
          comment: { $ne: '', $exists: true }
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      console.log(`📋 Feedback: ${feedbacks.length} feedbacks negativos obtidos`);
      
      return feedbacks;

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter feedbacks negativos:', error.message);
      return [];
    }
  }

  /**
   * Obtém perguntas mais frequentes com feedback negativo
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} Perguntas problemáticas
   */
  async getProblematicQuestions(limit = 10) {
    try {
      await this.connect();

      const pipeline = [
        { $match: { feedbackType: 'negative' } },
        { $group: { 
          _id: '$question', 
          count: { $sum: 1 },
          comments: { $push: '$comment' }
        }},
        { $sort: { count: -1 } },
        { $limit: limit }
      ];

      const problematicQuestions = await this.collection.aggregate(pipeline).toArray();
      
      console.log(`📋 Feedback: ${problematicQuestions.length} perguntas problemáticas identificadas`);
      
      return problematicQuestions;

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter perguntas problemáticas:', error.message);
      return [];
    }
  }

  /**
   * Registra feedback aprimorado com mais detalhes (baseado no chatbot Vercel)
   * @param {Object} feedbackData - Dados do feedback
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logEnhancedFeedback(feedbackData) {
    try {
      await this.connect();

      const feedback = {
        userId: feedbackData.userId,
        email: feedbackData.email || '',
        messageId: feedbackData.messageId,
        feedbackType: feedbackData.feedbackType, // 'positive' ou 'negative'
        comment: feedbackData.comment || '',
        question: feedbackData.question || '',
        answer: feedbackData.answer || '',
        source: feedbackData.source || 'chatbot', // IA, Planilha, Sites
        aiProvider: feedbackData.aiProvider || null, // OpenAI, Gemini
        sourceRow: feedbackData.sourceRow || null,
        timestamp: new Date(),
        sessionId: feedbackData.sessionId || null,
        metadata: {
          ...feedbackData.metadata,
          userAgent: feedbackData.userAgent || '',
          ipAddress: feedbackData.ipAddress || '',
          responseTime: feedbackData.responseTime || null,
          clarificationNeeded: feedbackData.clarificationNeeded || false
        }
      };

      const result = await this.collection.insertOne(feedback);
      
      console.log(`✅ Feedback: Feedback aprimorado registrado com ID ${result.insertedId}`);
      
      return true;

    } catch (error) {
      console.error('❌ Feedback: Erro ao registrar feedback aprimorado:', error.message);
      return false;
    }
  }

  /**
   * Obtém métricas de performance do chatbot
   * @param {Date} startDate - Data de início
   * @param {Date} endDate - Data de fim
   * @returns {Promise<Object>} Métricas de performance
   */
  async getPerformanceMetrics(startDate = null, endDate = null) {
    try {
      await this.connect();

      const filter = {};
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = startDate;
        if (endDate) filter.timestamp.$lte = endDate;
      }

      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: null,
            totalInteractions: { $sum: 1 },
            positiveFeedback: { $sum: { $cond: [{ $eq: ['$feedbackType', 'positive'] }, 1, 0] } },
            negativeFeedback: { $sum: { $cond: [{ $eq: ['$feedbackType', 'negative'] }, 1, 0] } },
            aiResponses: { $sum: { $cond: [{ $eq: ['$source', 'IA'] }, 1, 0] } },
            spreadsheetResponses: { $sum: { $cond: [{ $eq: ['$source', 'Planilha'] }, 1, 0] } },
            siteResponses: { $sum: { $cond: [{ $regex: ['$source', 'Site'] }, 1, 0] } },
            openaiResponses: { $sum: { $cond: [{ $eq: ['$aiProvider', 'OpenAI'] }, 1, 0] } },
            geminiResponses: { $sum: { $cond: [{ $eq: ['$aiProvider', 'Gemini'] }, 1, 0] } },
            clarificationsNeeded: { $sum: { $cond: ['$metadata.clarificationNeeded', 1, 0] } },
            avgResponseTime: { $avg: '$metadata.responseTime' }
          }
        }
      ];

      const metrics = await this.collection.aggregate(pipeline).toArray();
      
      if (metrics.length === 0) {
        return {
          totalInteractions: 0,
          satisfactionRate: 0,
          sourceDistribution: {},
          aiProviderDistribution: {},
          performance: {}
        };
      }

      const data = metrics[0];
      const totalFeedback = data.positiveFeedback + data.negativeFeedback;
      
      return {
        totalInteractions: data.totalInteractions,
        satisfactionRate: totalFeedback > 0 ? (data.positiveFeedback / totalFeedback) * 100 : 0,
        sourceDistribution: {
          ai: data.aiResponses,
          spreadsheet: data.spreadsheetResponses,
          sites: data.siteResponses
        },
        aiProviderDistribution: {
          openai: data.openaiResponses,
          gemini: data.geminiResponses
        },
        performance: {
          clarificationsNeeded: data.clarificationsNeeded,
          avgResponseTime: data.avgResponseTime || 0
        }
      };

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter métricas de performance:', error.message);
      return null;
    }
  }

  /**
   * Obtém tendências de feedback ao longo do tempo
   * @param {number} days - Número de dias para análise
   * @returns {Promise<Array>} Tendências diárias
   */
  async getFeedbackTrends(days = 30) {
    try {
      await this.connect();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            total: { $sum: 1 },
            positive: { $sum: { $cond: [{ $eq: ['$feedbackType', 'positive'] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$feedbackType', 'negative'] }, 1, 0] } },
            aiResponses: { $sum: { $cond: [{ $eq: ['$source', 'IA'] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ];

      const trends = await this.collection.aggregate(pipeline).toArray();
      
      return trends.map(trend => ({
        date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
        total: trend.total,
        positive: trend.positive,
        negative: trend.negative,
        aiResponses: trend.aiResponses,
        satisfactionRate: trend.total > 0 ? (trend.positive / trend.total) * 100 : 0
      }));

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter tendências:', error.message);
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
      console.log('🔌 Feedback: Conexão MongoDB fechada');
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
      console.log('✅ Feedback: Teste de conexão bem-sucedido');
      return true;
    } catch (error) {
      console.error('❌ Feedback: Erro no teste de conexão:', error.message);
      return false;
    }
  }
}

module.exports = new FeedbackService();

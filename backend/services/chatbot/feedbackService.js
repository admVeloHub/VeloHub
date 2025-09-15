// Feedback Service - Gerenciamento de feedback dos usuários
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

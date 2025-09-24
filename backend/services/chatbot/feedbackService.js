// Feedback Service - Sistema de feedback no Google Sheets
// VERSION: v2.1.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team
const { google } = require('googleapis');
require('dotenv').config();

class FeedbackService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = "1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ";
    this.feedbackSheetName = "Log_Feedback"; // Aba única para todos os feedbacks
    this.isInitialized = false;
  }

  /**
   * Inicializa o cliente Google Sheets
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;
      
      console.log('✅ Feedback: Google Sheets inicializado');
    } catch (error) {
      console.error('❌ Feedback: Erro ao inicializar Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se o serviço está configurado
   * @returns {boolean} Status da configuração
   */
  isConfigured() {
    return !!(process.env.GOOGLE_CREDENTIALS && this.isInitialized);
  }

  /**
   * Registra feedback do usuário no Google Sheets
   * Estrutura: data | Email do Atendente | Pergunta Original | Tipo de Feedback | Linha da Fonte | Sugestão
   * @param {Object} feedbackData - Dados do feedback
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logFeedback(feedbackData) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return false;
      }

      await this.initialize();

      const timestamp = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const {
        email,
        question = '',
        feedbackType,
        sourceRow = '',
        comment = ''
      } = feedbackData;

      // Preparar dados para inserção seguindo a estrutura da planilha
      const newRow = [
        timestamp,                    // A: data
        email || '',                 // B: Email do Atendente
        question,                    // C: Pergunta Original
        feedbackType === 'positive' ? 'Positivo 👍' : 'Negativo 👎', // D: Tipo de Feedback
        sourceRow,                   // E: Linha da Fonte
        comment                      // F: Sugestão
      ];

      // Inserir na planilha
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
        valueInputOption: 'RAW',
        resource: {
          values: [newRow]
        }
      });

      console.log(`✅ Feedback: Feedback registrado no Google Sheets`);
      return true;

    } catch (error) {
      console.error('❌ Feedback: Erro ao registrar feedback:', error.message);
      return false;
    }
  }

  /**
   * Registra feedback aprimorado com mais detalhes
   * Usa a mesma estrutura da planilha: data | Email do Atendente | Pergunta Original | Tipo de Feedback | Linha da Fonte | Sugestão
   * @param {Object} feedbackData - Dados do feedback
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logEnhancedFeedback(feedbackData) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return false;
      }

      await this.initialize();

      const timestamp = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const {
        email,
        question = '',
        feedbackType,
        sourceRow = '',
        comment = '',
        // Campos adicionais que podem ser incluídos na sugestão
        answer = '',
        aiProvider = '',
        responseTime = null,
        clarificationNeeded = false
      } = feedbackData;

      // Preparar sugestão com informações adicionais
      let enhancedComment = comment;
      if (answer) {
        enhancedComment += ` | Resposta: ${answer.substring(0, 100)}...`;
      }
      if (aiProvider) {
        enhancedComment += ` | IA: ${aiProvider}`;
      }
      if (responseTime) {
        enhancedComment += ` | Tempo: ${responseTime}ms`;
      }
      if (clarificationNeeded) {
        enhancedComment += ` | Esclarecimento necessário`;
      }

      // Preparar dados para inserção seguindo a estrutura da planilha
      const newRow = [
        timestamp,                    // A: data
        email || '',                 // B: Email do Atendente
        question,                    // C: Pergunta Original
        feedbackType === 'positive' ? 'Positivo 👍' : 'Negativo 👎', // D: Tipo de Feedback
        sourceRow,                   // E: Linha da Fonte
        enhancedComment              // F: Sugestão (com informações adicionais)
      ];

      // Inserir na planilha
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
        valueInputOption: 'RAW',
        resource: {
          values: [newRow]
        }
      });

      console.log(`✅ Feedback: Feedback aprimorado registrado no Google Sheets`);
      return true;

    } catch (error) {
      console.error('❌ Feedback: Erro ao registrar feedback aprimorado:', error.message);
      return false;
    }
  }

  /**
   * Obtém estatísticas de feedback do Google Sheets
   * @param {string} userId - ID do usuário (opcional)
   * @param {Date} startDate - Data de início (opcional)
   * @param {Date} endDate - Data de fim (opcional)
   * @returns {Promise<Object>} Estatísticas de feedback
   */
  async getFeedbackStats(userId = null, startDate = null, endDate = null) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return null;
      }

      await this.initialize();

      // Ler dados da planilha
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) {
        return {
        total: 0,
        positive: 0,
        negative: 0,
        satisfactionRate: 0,
          period: { start: startDate, end: endDate }
        };
      }

      // Processar dados (pular cabeçalho)
      const dataRows = rows.slice(1);
      let total = 0;
      let positive = 0;
      let negative = 0;

      dataRows.forEach(row => {
        const [timestamp, email, , feedbackType] = row;
        
        // Aplicar filtros
        if (userId && email !== userId) return;
        
        const rowDate = new Date(timestamp);
        if (startDate && rowDate < startDate) return;
        if (endDate && rowDate > endDate) return;

        total++;
        if (feedbackType === 'Positivo 👍') positive++;
        if (feedbackType === 'Negativo 👎') negative++;
      });

      const satisfactionRate = total > 0 ? (positive / total) * 100 : 0;

      console.log(`📊 Feedback: Estatísticas obtidas - ${total} feedbacks`);
      
      return {
        total,
        positive,
        negative,
        satisfactionRate,
        period: { start: startDate, end: endDate }
      };

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter estatísticas:', error.message);
      return null;
    }
  }

  /**
   * Obtém feedbacks recentes do Google Sheets
   * @param {number} limit - Limite de resultados
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Promise<Array>} Feedbacks recentes
   */
  async getRecentFeedback(limit = 10, userId = null) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return [];
      }

      await this.initialize();

      // Ler dados da planilha
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) return [];

      // Processar dados (pular cabeçalho)
      const dataRows = rows.slice(1);
      
      // Filtrar por usuário se especificado
      let filteredRows = dataRows;
      if (userId) {
        filteredRows = dataRows.filter(row => row[1] === userId);
      }

      // Ordenar por timestamp (mais recente primeiro) e limitar
      const sortedRows = filteredRows
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, limit);

      const feedbacks = sortedRows.map(row => ({
        timestamp: row[0],
        email: row[1],
        question: row[2],
        feedbackType: row[3],
        sourceRow: row[4],
        comment: row[5]
      }));

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
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return [];
      }

      await this.initialize();

      // Ler dados da planilha
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) return [];

      // Processar dados (pular cabeçalho)
      const dataRows = rows.slice(1);
      
      // Filtrar feedbacks negativos com comentários
      const negativeFeedbacks = dataRows
        .filter(row => row[3] === 'Negativo 👎' && row[5] && row[5].trim() !== '')
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, limit)
        .map(row => ({
          timestamp: row[0],
          email: row[1],
          question: row[2],
          feedbackType: row[3],
          sourceRow: row[4],
          comment: row[5]
        }));

      console.log(`📋 Feedback: ${negativeFeedbacks.length} feedbacks negativos obtidos`);
      return negativeFeedbacks;

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
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return [];
      }

      await this.initialize();

      // Ler dados da planilha
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) return [];

      // Processar dados (pular cabeçalho)
      const dataRows = rows.slice(1);
      
      // Filtrar feedbacks negativos
      const negativeFeedbacks = dataRows.filter(row => row[3] === 'Negativo 👎');
      
      // Agrupar por pergunta
      const questionGroups = {};
      negativeFeedbacks.forEach(row => {
        const question = row[2] || 'Pergunta não especificada';
        if (!questionGroups[question]) {
          questionGroups[question] = {
            question,
            count: 0,
            comments: []
          };
        }
        questionGroups[question].count++;
        if (row[5] && row[5].trim() !== '') {
          questionGroups[question].comments.push(row[5]);
        }
      });

      // Converter para array e ordenar por frequência
      const problematicQuestions = Object.values(questionGroups)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      console.log(`📋 Feedback: ${problematicQuestions.length} perguntas problemáticas identificadas`);
      return problematicQuestions;

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter perguntas problemáticas:', error.message);
      return [];
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
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return null;
      }

      await this.initialize();

      // Ler dados da planilha
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) {
        return {
          totalInteractions: 0,
          satisfactionRate: 0,
          sourceDistribution: {},
          aiProviderDistribution: {},
          performance: {}
        };
      }

      // Processar dados (pular cabeçalho)
      const dataRows = rows.slice(1);
      
      let totalInteractions = 0;
      let positiveFeedback = 0;
      let negativeFeedback = 0;
      let aiResponses = 0;
      let spreadsheetResponses = 0;
      let openaiResponses = 0;
      let geminiResponses = 0;
      let clarificationsNeeded = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      dataRows.forEach(row => {
        const [timestamp, , , feedbackType, , comment] = row;
        
        // Aplicar filtros de data
        const rowDate = new Date(timestamp);
        if (startDate && rowDate < startDate) return;
        if (endDate && rowDate > endDate) return;

        totalInteractions++;
        
        if (feedbackType === 'Positivo 👍') positiveFeedback++;
        if (feedbackType === 'Negativo 👎') negativeFeedback++;
        
        // Extrair informações adicionais do comentário se disponível
        if (comment) {
          if (comment.includes('IA:')) aiResponses++;
          if (comment.includes('Tempo:')) {
            const timeMatch = comment.match(/Tempo: (\d+)ms/);
            if (timeMatch) {
              totalResponseTime += parseFloat(timeMatch[1]);
              responseTimeCount++;
            }
          }
          if (comment.includes('Esclarecimento necessário')) clarificationsNeeded++;
        }
      });

      const totalFeedback = positiveFeedback + negativeFeedback;
      const satisfactionRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;
      const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
      
      return {
        totalInteractions,
        satisfactionRate,
        sourceDistribution: {
          ai: aiResponses,
          spreadsheet: spreadsheetResponses,
          sites: 0 // Sites removidos
        },
        aiProviderDistribution: {
          openai: openaiResponses,
          gemini: geminiResponses
        },
        performance: {
          clarificationsNeeded,
          avgResponseTime
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
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return [];
      }

      await this.initialize();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Ler dados da planilha
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.feedbackSheetName,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) return [];

      // Processar dados (pular cabeçalho)
      const dataRows = rows.slice(1);
      
      // Agrupar por dia
      const dailyStats = {};
      
      dataRows.forEach(row => {
        const [timestamp, , , feedbackType, , comment] = row;
        const rowDate = new Date(timestamp);
        
        if (rowDate < startDate) return;
        
        const dateKey = rowDate.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: new Date(dateKey),
            total: 0,
            positive: 0,
            negative: 0,
            aiResponses: 0
          };
        }
        
        dailyStats[dateKey].total++;
        
        if (feedbackType === 'Positivo 👍') dailyStats[dateKey].positive++;
        if (feedbackType === 'Negativo 👎') dailyStats[dateKey].negative++;
        if (comment && comment.includes('IA:')) dailyStats[dateKey].aiResponses++;
      });

      // Converter para array e ordenar por data
      const trends = Object.values(dailyStats)
        .sort((a, b) => a.date - b.date)
        .map(stat => ({
          ...stat,
          satisfactionRate: stat.total > 0 ? (stat.positive / stat.total) * 100 : 0
        }));

      return trends;

    } catch (error) {
      console.error('❌ Feedback: Erro ao obter tendências:', error.message);
      return [];
    }
  }

  /**
   * Testa a conexão com Google Sheets
   * @returns {Promise<boolean>} Status da conexão
   */
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Feedback: Google Sheets não configurado');
        return false;
      }

      await this.initialize();
      
      // Tentar ler uma célula para testar a conexão
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.feedbackSheetName}!A1`,
      });

      console.log('✅ Feedback: Teste de conexão com Google Sheets bem-sucedido');
      return true;
    } catch (error) {
      console.error('❌ Feedback: Erro no teste de conexão:', error.message);
      return false;
    }
  }
}

module.exports = new FeedbackService();
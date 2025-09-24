// Logs Service - Sistema de logs no Google Sheets
// VERSION: v1.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team
const { google } = require('googleapis');
require('dotenv').config();

class LogsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = "1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ";
    this.logSheetName = "Log_IA_Usage";
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
      
      console.log('✅ Logs: Cliente Google Sheets inicializado');
    } catch (error) {
      console.error('❌ Logs: Erro ao inicializar Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Registra uso da IA no Google Sheets
   * @param {string} email - Email do usuário
   * @param {string} question - Pergunta realizada
   * @param {string} source - Fonte da resposta (Bot_perguntas, IA)
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logAIUsage(email, question, source = 'IA') {
    try {
      await this.initialize();

      const timestamp = new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo' 
      });
      
      const newRow = [timestamp, email, question, source];
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.logSheetName,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [newRow] },
      });

      console.log(`✅ Logs: Uso da IA registrado para ${email}`);
      return true;

    } catch (error) {
      console.error("❌ Logs: Erro ao registrar uso da IA:", error.message);
      return false;
    }
  }

  /**
   * Registra pergunta não encontrada
   * @param {string} email - Email do usuário
   * @param {string} question - Pergunta não encontrada
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logNotFoundQuestion(email, question) {
    return await this.logAIUsage(email, question, 'Não Encontrada');
  }

  /**
   * Registra resposta da IA
   * @param {string} email - Email do usuário
   * @param {string} question - Pergunta realizada
   * @param {string} aiProvider - Provedor da IA (OpenAI, Gemini)
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logAIResponse(email, question, aiProvider = 'OpenAI') {
    return await this.logAIUsage(email, question, `IA-${aiProvider}`);
  }

  /**
   * Registra resposta da planilha
   * @param {string} email - Email do usuário
   * @param {string} question - Pergunta realizada
   * @param {string} sourceRow - Linha da planilha
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async logMongoDBResponse(email, question, sourceRow) {
    return await this.logAIUsage(email, question, `Bot_perguntas-${sourceRow}`);
  }


  /**
   * Testa a conexão com Google Sheets
   * @returns {Promise<boolean>} Status da conexão
   */
  async testConnection() {
    try {
      await this.initialize();
      
      // Tentar ler uma célula para testar a conexão
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.logSheetName}!A1`,
      });

      console.log('✅ Logs: Teste de conexão bem-sucedido');
      return true;
    } catch (error) {
      console.error('❌ Logs: Erro no teste de conexão:', error.message);
      return false;
    }
  }

  /**
   * Verifica se o serviço está configurado
   * @returns {boolean} Status da configuração
   */
  isConfigured() {
    return !!process.env.GOOGLE_CREDENTIALS;
  }
}

module.exports = new LogsService();

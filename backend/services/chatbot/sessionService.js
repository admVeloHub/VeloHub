// Session Service - Gerenciamento simplificado de memória de conversa
// VERSION: v2.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team
const { v4: uuidv4 } = require('uuid');

class SessionService {
  constructor() {
    this.sessions = new Map(); // In-memory storage (simplificado)
    this.sessionTimeout = 10 * 60 * 1000; // 10 minutos (simplificado)
    this.maxHistoryLength = 10; // Máximo 10 mensagens no histórico
  }

  /**
   * Cria uma nova sessão para memória de conversa (simplificado)
   * @param {string} userId - ID do usuário (já autenticado via OAuth)
   * @returns {Object} Sessão criada
   */
  createSession(userId) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId: userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      messages: []
    };

    this.sessions.set(sessionId, session);
    
    console.log(`✅ Session: Nova sessão VeloBot criada para ${userId} (${sessionId})`);
    
    return session;
  }

  /**
   * Obtém ou cria uma sessão para memória de conversa (simplificado)
   * @param {string} userId - ID do usuário (já autenticado via OAuth)
   * @param {string} sessionId - ID da sessão (opcional)
   * @returns {Object} Sessão
   */
  getOrCreateSession(userId, sessionId = null) {
    // Se sessionId fornecido, tentar recuperar sessão existente
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      
      // Verificar se a sessão ainda é válida (10 minutos)
      if (this.isSessionValid(session)) {
        session.lastActivity = new Date();
        console.log(`🔄 Session: Sessão VeloBot recuperada para ${userId}`);
        return session;
      } else {
        // Sessão expirada, remover
        this.sessions.delete(sessionId);
        console.log(`⏰ Session: Sessão VeloBot expirada removida para ${userId}`);
      }
    }

    // Criar nova sessão
    return this.createSession(userId);
  }

  /**
   * Adiciona mensagem à sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} role - Role da mensagem (user/bot)
   * @param {string} content - Conteúdo da mensagem
   * @param {Object} metadata - Metadados adicionais
   * @returns {boolean} Sucesso da operação
   */
  addMessage(sessionId, role, content, metadata = {}) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.error(`❌ Session: Sessão ${sessionId} não encontrada`);
      return false;
    }

    const message = {
      id: uuidv4(),
      role: role,
      content: content,
      timestamp: new Date(),
      metadata: metadata
    };

    session.messages.push(message);
    session.lastActivity = new Date();

    // Manter apenas as últimas N mensagens
    if (session.messages.length > this.maxHistoryLength) {
      session.messages = session.messages.slice(-this.maxHistoryLength);
    }

    console.log(`💬 Session: Mensagem adicionada à sessão ${sessionId} (${role})`);
    
    return true;
  }

  /**
   * Obtém histórico de mensagens da sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Array} Histórico de mensagens
   */
  getSessionHistory(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.error(`❌ Session: Sessão ${sessionId} não encontrada`);
      return [];
    }

    return session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Obtém contexto da sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Object} Contexto da sessão
   */
  getSessionContext(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return {};
    }

    return session.context;
  }

  /**
   * Atualiza contexto da sessão
   * @param {string} sessionId - ID da sessão
   * @param {Object} context - Novo contexto
   * @returns {boolean} Sucesso da operação
   */
  updateSessionContext(sessionId, context) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.error(`❌ Session: Sessão ${sessionId} não encontrada`);
      return false;
    }

    session.context = { ...session.context, ...context };
    session.lastActivity = new Date();

    console.log(`🔄 Session: Contexto atualizado para sessão ${sessionId}`);
    
    return true;
  }

  /**
   * Verifica se a sessão é válida (não expirada)
   * @param {Object} session - Sessão a ser verificada
   * @returns {boolean} Sessão válida
   */
  isSessionValid(session) {
    const now = new Date();
    const timeDiff = now - session.lastActivity;
    
    return timeDiff < this.sessionTimeout;
  }

  /**
   * Remove sessões expiradas
   * @returns {number} Número de sessões removidas
   */
  cleanupExpiredSessions() {
    let removedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!this.isSessionValid(session)) {
        this.sessions.delete(sessionId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Session: ${removedCount} sessões expiradas removidas`);
    }

    return removedCount;
  }

  /**
   * Obtém estatísticas das sessões
   * @returns {Object} Estatísticas
   */
  getSessionStats() {
    const now = new Date();
    let activeSessions = 0;
    let expiredSessions = 0;
    let totalMessages = 0;

    for (const session of this.sessions.values()) {
      if (this.isSessionValid(session)) {
        activeSessions++;
      } else {
        expiredSessions++;
      }
      
      totalMessages += session.messages.length;
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiredSessions,
      totalMessages,
      lastCleanup: now
    };
  }

  /**
   * Remove uma sessão específica
   * @param {string} sessionId - ID da sessão
   * @returns {boolean} Sucesso da operação
   */
  removeSession(sessionId) {
    const removed = this.sessions.delete(sessionId);
    
    if (removed) {
      console.log(`🗑️ Session: Sessão ${sessionId} removida`);
    }

    return removed;
  }

  /**
   * Inicia limpeza automática de sessões expiradas
   */
  startAutoCleanup() {
    // Limpeza a cada 10 minutos
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 10 * 60 * 1000);

    console.log('🔄 Session: Limpeza automática de sessões iniciada');
  }
}

module.exports = new SessionService();

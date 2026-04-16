// User Session Logger - Log de sessões de login/logout dos usuários
// VERSION: v1.5.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
//
// Mudanças v1.5.0:
// - Reconexão automática quando a topologia MongoDB está fechada ("Topology is closed")
// - Não confiar só em isConnected: verifica client fechado / topology destruída antes de reutilizar
// - Mesmas opções de timeout do server.js (serverSelection / connect / socket) no MongoClient
// - Single-flight em connect() para evitar corridas com múltiplas requisições simultâneas
//
// Mudanças v1.4.1:
// - CRÍTICO: Corrigido bug onde chatStatus permanecia 'offline' mesmo com isActive=true
// - Heartbeat agora reseta chatStatus para 'online' quando sessão é reativada após estar offline
// - Preserva chatStatus válido (online/ausente) apenas quando já está válido
// 
// Mudanças v1.4.0:
// - CRÍTICO: Corrigido problema de chatStatus sendo perdido no heartbeat
// - Heartbeat agora preserva chatStatus existente (online/ausente) ao invés de sobrescrever
// - Se chatStatus não existe, usa 'online' como padrão apenas na primeira vez
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
const { v4: uuidv4 } = require('uuid');

const MONGO_CLIENT_OPTIONS = {
  serverSelectionTimeoutMS: 45000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 120000,
};

class UserSessionLogger {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
    /** @type {Promise<void> | null} */
    this._connectPromise = null;
  }

  /**
   * Indica se o MongoClient atual ainda pode emitir operações (evita "Topology is closed").
   */
  _clientUsable() {
    if (!this.client) return false;
    try {
      if (this.client.s?.hasBeenClosed) return false;
      const t = this.client.topology;
      if (!t) return false;
      if (typeof t.isDestroyed === 'function' && t.isDestroyed()) return false;
      return true;
    } catch {
      return false;
    }
  }

  async _disposeClient() {
    if (this.client) {
      try {
        await this.client.close();
      } catch (_) {
        /* ignore */
      }
    }
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  _shouldReconnectAfterError(error) {
    const msg = String(error?.message || '');
    return (
      msg.includes('Topology is closed') ||
      msg.includes('topology was destroyed') ||
      msg.includes('MongoClient must be connected')
    );
  }

  /**
   * Executa operação MongoDB; em erro de topologia fechada, reconecta e tenta mais uma vez.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async _withMongoRetry(fn) {
    try {
      return await fn();
    } catch (error) {
      if (!this._shouldReconnectAfterError(error)) {
        throw error;
      }
      console.warn('⚠️ SessionLogger: erro de topologia durante operação, reconectando e repetindo 1x:', error.message);
      await this._disposeClient();
      await this.connect();
      return await fn();
    }
  }

  /**
   * Conecta ao MongoDB (reconecta se a topologia anterior foi fechada)
   */
  async connect() {
    if (this.isConnected && this._clientUsable()) {
      return;
    }

    if (this.isConnected && !this._clientUsable()) {
      console.warn('⚠️ SessionLogger: conexão MongoDB inválida ou topologia fechada — reconectando');
      await this._disposeClient();
    }

    if (this._connectPromise) {
      return this._connectPromise;
    }

    this._connectPromise = (async () => {
      const uri = process.env.MONGO_ENV;
      if (!uri || !String(uri).trim()) {
        throw new Error('MONGO_ENV não configurada');
      }

      await this._disposeClient();

      this.client = new MongoClient(uri, MONGO_CLIENT_OPTIONS);
      await this.client.connect();
      this.db = this.client.db('console_conteudo');
      this.collection = this.db.collection('hub_sessions');
      this.isConnected = true;

      console.log('✅ SessionLogger: Conectado ao MongoDB');
    })();

    try {
      await this._connectPromise;
    } catch (error) {
      console.error('❌ SessionLogger: Erro ao conectar MongoDB:', error.message);
      await this._disposeClient();
      throw error;
    } finally {
      this._connectPromise = null;
    }
  }

  /**
   * Registra login do usuário
   * @param {string} colaboradorNome - Nome do colaborador
   * @param {string} userEmail - Email do usuário
   * @param {string} ipAddress - IP do usuário (opcional)
   * @param {string} userAgent - User Agent (opcional)
   * @returns {Promise<Object>} { success: boolean, sessionId: string }
   */
  async logLogin(colaboradorNome, userEmail, ipAddress = null, userAgent = null) {
    try {
      return await this._withMongoRetry(async () => {
        await this.connect();

        const sessionId = uuidv4();
        const now = new Date();

        const session = {
          colaboradorNome,
          userEmail,
          sessionId,
          ipAddress,
          userAgent,
          isActive: true,
          chatStatus: 'online', // Inicializar status do chat como 'online' por padrão
          loginTimestamp: now,
          logoutTimestamp: null,
          createdAt: now,
          updatedAt: now,
        };

        const result = await this.collection.insertOne(session);

        console.log(`✅ SessionLogger: Login registrado - ${colaboradorNome} (${sessionId})`);

        return {
          success: true,
          sessionId: sessionId,
          insertedId: result.insertedId,
        };
      });
    } catch (error) {
      console.error('❌ SessionLogger: Erro ao registrar login:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Registra logout do usuário
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<Object>} { success: boolean, duration: number }
   */
  async logLogout(sessionId) {
    try {
      await this.connect();

      const now = new Date();
      
      // Buscar sessão ativa
      const session = await this.collection.findOne({
        sessionId: sessionId,
        isActive: true
      });

      if (!session) {
        console.log(`⚠️ SessionLogger: Sessão ${sessionId} não encontrada ou já inativa`);
        return {
          success: false,
          error: 'Sessão não encontrada ou já inativa'
        };
      }

      // Calcular duração
      const duration = Math.round((now - session.loginTimestamp) / 1000 / 60); // minutos

      // Atualizar sessão
      const result = await this.collection.updateOne(
        { sessionId: sessionId },
        {
          $set: {
            isActive: false,
            logoutTimestamp: now,
            updatedAt: now
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ SessionLogger: Logout registrado - ${session.colaboradorNome} (${duration} min)`);
        
        return {
          success: true,
          duration: duration,
          colaboradorNome: session.colaboradorNome
        };
      } else {
        return {
          success: false,
          error: 'Erro ao atualizar sessão'
        };
      }

    } catch (error) {
      console.error('❌ SessionLogger: Erro ao registrar logout:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém sessões ativas
   * @returns {Promise<Array>} Sessões ativas
   */
  async getActiveSessions() {
    try {
      await this.connect();

      const activeSessions = await this.collection
        .find({ isActive: true })
        .sort({ loginTimestamp: -1 })
        .toArray();

      console.log(`📋 SessionLogger: ${activeSessions.length} sessões ativas encontradas`);
      
      return activeSessions;

    } catch (error) {
      console.error('❌ SessionLogger: Erro ao obter sessões ativas:', error.message);
      return [];
    }
  }

  /**
   * Fecha a conexão com MongoDB
   */
  /**
   * Limpa sessões inativas que não receberam heartbeat há mais de 2 minutos
   * Heartbeat é enviado a cada 30s, então 2 minutos sem heartbeat = usuário offline
   */
  async cleanupInactiveSessions() {
    try {
      await this.connect();

      const now = new Date();
      const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos sem heartbeat = offline
      const timeoutThreshold = new Date(now.getTime() - HEARTBEAT_TIMEOUT_MS);

      // Buscar sessões ativas que não receberam heartbeat há mais de 2 minutos
      // updatedAt é armazenado como Date no MongoDB, então comparamos diretamente
      const inactiveSessions = await this.collection.find({
        isActive: true,
        updatedAt: { $lt: timeoutThreshold }
      }).toArray();

      if (inactiveSessions.length > 0) {
        // Marcar todas como inativas
        const result = await this.collection.updateMany(
          {
            isActive: true,
            updatedAt: { $lt: timeoutThreshold }
          },
          {
            $set: {
              isActive: false,
              chatStatus: 'offline',
              logoutTimestamp: now,
              updatedAt: now
            }
          }
        );

        console.log(`🧹 SessionLogger: ${result.modifiedCount} sessão(ões) marcada(s) como offline (sem heartbeat há mais de 2 minutos)`);
        
        // Log detalhado das sessões limpas
        inactiveSessions.forEach(session => {
          // updatedAt pode ser Date ou timestamp (number)
          const lastUpdate = session.updatedAt instanceof Date 
            ? session.updatedAt 
            : new Date(session.updatedAt);
          const minutesAgo = Math.round((now - lastUpdate) / 1000 / 60);
          console.log(`   - ${session.colaboradorNome} (${session.userEmail}): último heartbeat há ${minutesAgo} minutos`);
        });

        return {
          success: true,
          cleaned: result.modifiedCount
        };
      }

      return {
        success: true,
        cleaned: 0
      };

    } catch (error) {
      console.error('❌ SessionLogger: Erro ao limpar sessões inativas:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Inicia limpeza automática de sessões inativas
   * Executa a cada 1 minuto para garantir detecção rápida de usuários offline
   */
  startAutoCleanup() {
    // Limpeza a cada 1 minuto
    setInterval(async () => {
      await this.cleanupInactiveSessions();
    }, 60 * 1000); // 1 minuto

    console.log('🔄 SessionLogger: Limpeza automática de sessões inativas iniciada (executa a cada 1 minuto)');
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this._connectPromise = null;
      console.log('🔌 SessionLogger: Conexão MongoDB fechada');
    }
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  /**
   * Atualiza sessão (heartbeat) - mantém isActive=true
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<Object>} { success: boolean, expired: boolean }
   */
  async updateSession(sessionId) {
    try {
      await this.connect();

      const now = new Date();
      const SESSION_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 horas

      // Buscar sessão
      const session = await this.collection.findOne({
        sessionId: sessionId
      });

      if (!session) {
        return {
          success: false,
          expired: false,
          error: 'Sessão não encontrada'
        };
      }

      // Verificar se sessão expirou (4 horas)
      const elapsedTime = now - session.loginTimestamp;
      if (elapsedTime > SESSION_EXPIRATION_MS) {
        // Marcar como inativa se expirada
        await this.collection.updateOne(
          { sessionId: sessionId },
          {
            $set: {
              isActive: false,
              logoutTimestamp: now,
              updatedAt: now
            }
          }
        );
        
        return {
          success: false,
          expired: true,
          error: 'Sessão expirada (4 horas)'
        };
      }

      // Atualizar sessão mantendo isActive=true E preservando chatStatus existente
      // Se chatStatus é 'offline' e estamos reativando sessão, resetar para 'online'
      // Se chatStatus não existe ou é inválido, usar 'online' como padrão
      // Se chatStatus existe e é válido (online/ausente), preservar
      const updateData = {
        isActive: true,
        updatedAt: now
      };
      
      // Preservar chatStatus se existir e for válido (online/ausente)
      // Se chatStatus é 'offline' ou não existe, resetar para 'online' (sessão está sendo reativada)
      if (session.chatStatus && ['online', 'ausente'].includes(session.chatStatus)) {
        // Manter chatStatus existente válido
        updateData.chatStatus = session.chatStatus;
      } else {
        // Se chatStatus é 'offline' ou não existe, usar 'online' como padrão
        // Isso garante que sessões reativadas sempre voltem para 'online'
        updateData.chatStatus = 'online';
      }
      
      const result = await this.collection.updateOne(
        { sessionId: sessionId },
        {
          $set: updateData
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`💓 SessionLogger: Heartbeat recebido - ${session.colaboradorNome}`);
        return {
          success: true,
          expired: false
        };
      } else {
        return {
          success: false,
          expired: false,
          error: 'Erro ao atualizar sessão'
        };
      }

    } catch (error) {
      console.error('❌ SessionLogger: Erro ao atualizar sessão:', error.message);
      return {
        success: false,
        expired: false,
        error: error.message
      };
    }
  }

  /**
   * Reativa sessão existente do usuário (quando retorna sem novo login)
   * @param {string} userEmail - Email do usuário
   * @returns {Promise<Object>} { success: boolean, sessionId: string, expired: boolean }
   */
  async reactivateSession(userEmail) {
    try {
      return await this._withMongoRetry(async () => {
        await this.connect();

        const now = new Date();
        const SESSION_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 horas

        const session = await this.collection
          .find({ userEmail: userEmail })
          .sort({ loginTimestamp: -1 })
          .limit(1)
          .toArray();

        if (!session || session.length === 0) {
          return {
            success: false,
            expired: false,
            error: 'Nenhuma sessão encontrada para este usuário',
          };
        }

        const latestSession = session[0];

        const elapsedTime = now - latestSession.loginTimestamp;
        if (elapsedTime > SESSION_EXPIRATION_MS) {
          return {
            success: false,
            expired: true,
            error: 'Sessão expirada (4 horas) - novo login necessário',
          };
        }

        const result = await this.collection.updateOne(
          { sessionId: latestSession.sessionId },
          {
            $set: {
              isActive: true,
              updatedAt: now,
            },
          }
        );

        if (result.modifiedCount > 0) {
          console.log(
            `🔄 SessionLogger: Sessão reativada - ${latestSession.colaboradorNome} (${latestSession.sessionId})`
          );
          return {
            success: true,
            sessionId: latestSession.sessionId,
            expired: false,
          };
        }

        return {
          success: false,
          expired: false,
          error: 'Erro ao reativar sessão',
        };
      });
    } catch (error) {
      console.error('❌ SessionLogger: Erro ao reativar sessão:', error.message);
      return {
        success: false,
        expired: false,
        error: error.message,
      };
    }
  }

  /**
   * Verifica se sessão está válida e não expirada
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<Object>} { valid: boolean, expired: boolean, session: Object }
   */
  async validateSession(sessionId) {
    try {
      await this.connect();

      const now = new Date();
      const SESSION_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 horas

      const session = await this.collection.findOne({
        sessionId: sessionId
      });

      if (!session) {
        return {
          valid: false,
          expired: false,
          session: null
        };
      }

      const elapsedTime = now - session.loginTimestamp;
      const expired = elapsedTime > SESSION_EXPIRATION_MS;

      return {
        valid: !expired && session.isActive,
        expired: expired,
        session: session
      };

    } catch (error) {
      console.error('❌ SessionLogger: Erro ao validar sessão:', error.message);
      return {
        valid: false,
        expired: false,
        session: null
      };
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
      console.log('✅ SessionLogger: Teste de conexão bem-sucedido');
      return true;
    } catch (error) {
      console.error('❌ SessionLogger: Erro no teste de conexão:', error.message);
      return false;
    }
  }
}

module.exports = new UserSessionLogger();

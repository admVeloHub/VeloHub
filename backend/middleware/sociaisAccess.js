/**
 * VeloHub V3 - Middleware de Verificação de Acesso ao Módulo Sociais
 * VERSION: v1.2.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
 * v1.2.0: Bypass código lucas.gravina@velotax.com.br na sessão
 */

const { emailTemBypassVelohub } = require('../utils/contaBypassVelohub');
const { getHubSessionsCollection } = require('../config/funcionariosDb');

const checkSociaisAccess = (client, connectToMongo) => {
  return async (req, res, next) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.body?.sessionId;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'SessionId é obrigatório. Usuário deve estar logado.',
          hasAccess: false
        });
      }

      if (!client) {
        return res.status(503).json({
          success: false,
          error: 'MongoDB não configurado',
          hasAccess: false
        });
      }

      await connectToMongo();
      const sessionsCollection = getHubSessionsCollection(client);

      const session = await sessionsCollection.findOne({
        sessionId: sessionId,
        isActive: true
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Sessão inválida ou expirada. Faça login novamente.',
          hasAccess: false
        });
      }

      const perm = session.permissoesVelohub;
      if (!emailTemBypassVelohub(session.userEmail) && perm && typeof perm === 'object' && perm.sociais !== true) {
        return res.status(403).json({
          success: false,
          error: 'Acesso ao módulo Sociais não autorizado',
          hasAccess: false,
        });
      }

      req.user = {
        email: session.userEmail || '',
        name: session.userName || session.user?.name || 'Usuário',
        sessionId: sessionId
      };

      next();
    } catch (error) {
      console.error('❌ [sociaisAccess] Erro:', error.message);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar acesso',
        hasAccess: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

module.exports = checkSociaisAccess;

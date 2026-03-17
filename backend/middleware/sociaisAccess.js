/**
 * VeloHub V3 - Middleware de Verificação de Acesso ao Módulo Sociais
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Middleware que verifica se o usuário tem sessão ativa (já logado no VeloHub)
 * O acesso ao módulo Sociais é verificado no frontend via check-module-access
 */

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
      const db = client.db('console_conteudo');
      const sessionsCollection = db.collection('hub_sessions');

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

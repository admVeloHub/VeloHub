/**
 * VeloHub V3 - Middleware de Verificação de Acesso ao Módulo Ouvidoria
 * VERSION: v2.0.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.0.0:
 * - Simplificado para usar apenas a sessão ativa (usuário já está logado)
 * - Captura nome do usuário diretamente da sessão hub_sessions
 * - Removida busca no banco qualidade_funcionarios (usuário já passou pela verificação ao acessar Velohub)
 * 
 * Middleware que verifica se o usuário tem acesso ao módulo Ouvidoria
 * Como o usuário já está logado e visualizando o módulo, confiamos na sessão ativa
 */

/**
 * Middleware para verificar acesso ao módulo Ouvidoria
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 * @returns {Function} Middleware Express
 */
const checkOuvidoriaAccess = (client, connectToMongo) => {
  return async (req, res, next) => {
    try {
      // Obter sessionId do header
      const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.body.sessionId;
      
      if (!sessionId) {
        console.error(`❌ [ouvidoriaAccess] SessionId não fornecido`);
        return res.status(400).json({
          success: false,
          error: 'SessionId é obrigatório. Usuário deve estar logado.',
          hasAccess: false
        });
      }

      if (!client) {
        console.error('❌ [ouvidoriaAccess] MongoDB não configurado');
        return res.status(503).json({
          success: false,
          error: 'MongoDB não configurado',
          hasAccess: false
        });
      }

      // Conectar ao MongoDB e buscar sessão
      await connectToMongo();
      const db = client.db('console_conteudo');
      const sessionsCollection = db.collection('hub_sessions');
      
      const session = await sessionsCollection.findOne({
        sessionId: sessionId,
        isActive: true
      });
      
      if (!session) {
        console.error(`❌ [ouvidoriaAccess] Sessão não encontrada ou inativa: ${sessionId}`);
        return res.status(401).json({
          success: false,
          error: 'Sessão inválida ou expirada. Faça login novamente.',
          hasAccess: false
        });
      }

      // Capturar nome do usuário da sessão
      const userName = session.userName || session.user?.name || session.userEmail || 'Usuário';
      
      console.log(`✅ [ouvidoriaAccess] Sessão válida encontrada para: ${userName}`);
      
      // Adicionar informações do usuário ao request para uso posterior
      req.user = {
        email: session.userEmail || '',
        name: userName,
        sessionId: sessionId
      };

      next();
    } catch (error) {
      console.error('❌ [ouvidoriaAccess] Erro ao verificar acesso:', error.message);
      console.error('Stack:', error.stack);
      
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar acesso',
        hasAccess: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

module.exports = checkOuvidoriaAccess;

/**
 * VeloHub V3 - Middleware de Verificação de Acesso ao Módulo Ouvidoria
 * VERSION: v1.3.0 | DATE: 2026-02-23 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.3.0:
 * - Adicionados logs detalhados para diagnóstico de problemas de acesso
 * - Melhorada verificação de bypass com logs de comparação
 * 
 * Mudanças v1.2.0:
 * - Adicionado bypass para conta do desenvolvedor (Lucas Gravina)
 * 
 * Mudanças v1.1.0:
 * - Adicionada busca de email via sessionId quando não fornecido diretamente
 * - Suporte para obter email de hub_sessions collection
 * 
 * Middleware que verifica se o usuário tem acesso ao módulo Ouvidoria
 */

// Lista de emails com bypass de acesso (desenvolvedores/admin)
// Bypass removido - acesso agora é verificado normalmente através da coleção qualidade_funcionarios
const BYPASS_EMAILS = [];

/**
 * Middleware para verificar acesso ao módulo Ouvidoria
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 * @returns {Function} Middleware Express
 */
const checkOuvidoriaAccess = (client, connectToMongo) => {
  return async (req, res, next) => {
    try {
      // Obter email do usuário (pode vir de query, body, headers ou sessão)
      let email = req.query.email || req.body.email || req.headers['x-user-email'];
      
      // Log para debug
      console.log(`🔍 [ouvidoriaAccess] ========== MIDDLEWARE CHAMADO ==========`);
      console.log(`🔍 [ouvidoriaAccess] Rota: ${req.method} ${req.path}`);
      console.log(`🔍 [ouvidoriaAccess] Tentando obter email:`);
      console.log(`   - Query: ${req.query.email || 'não fornecido'}`);
      console.log(`   - Body: ${req.body.email || 'não fornecido'}`);
      console.log(`   - Header x-user-email: ${req.headers['x-user-email'] || 'não fornecido'}`);
      console.log(`   - Header x-session-id: ${req.headers['x-session-id'] || 'não fornecido'}`);
      console.log(`   - Email encontrado: ${email || 'não encontrado'}`);
      
      // Se não encontrou email direto, tentar buscar da sessão
      if (!email) {
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.body.sessionId;
        console.log(`🔍 [ouvidoriaAccess] Tentando buscar email da sessão: ${sessionId || 'não fornecido'}`);
        
        if (sessionId) {
          try {
            await connectToMongo();
            const db = client.db('console_conteudo');
            const sessionsCollection = db.collection('hub_sessions');
            
            const session = await sessionsCollection.findOne({
              sessionId: sessionId,
              isActive: true
            });
            
            if (session && session.userEmail) {
              email = session.userEmail;
              console.log(`✅ [ouvidoriaAccess] Email obtido da sessão: ${email}`);
            } else {
              console.log(`⚠️ [ouvidoriaAccess] Sessão não encontrada ou inativa para sessionId: ${sessionId}`);
            }
          } catch (sessionError) {
            console.error('❌ [ouvidoriaAccess] Erro ao buscar sessão:', sessionError);
          }
        }
      }
      
      if (!email) {
        console.error(`❌ [ouvidoriaAccess] Email não encontrado em nenhuma fonte`);
        return res.status(400).json({
          success: false,
          error: 'Email do usuário é obrigatório. Forneça via query, body, header x-user-email ou sessionId.',
          hasAccess: false
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log(`🔍 [ouvidoriaAccess] Verificando acesso ao módulo Ouvidoria para: ${normalizedEmail}`);
      console.log(`🔍 [ouvidoriaAccess] Lista de bypass:`, BYPASS_EMAILS);
      console.log(`🔍 [ouvidoriaAccess] Email normalizado: "${normalizedEmail}"`);
      console.log(`🔍 [ouvidoriaAccess] Email normalizado está na lista?`, BYPASS_EMAILS.includes(normalizedEmail));
      console.log(`🔍 [ouvidoriaAccess] Comparação detalhada:`, BYPASS_EMAILS.map(e => `"${e}" === "${normalizedEmail}"? ${e === normalizedEmail}`));

      // Bypass para desenvolvedores/admin
      if (BYPASS_EMAILS.includes(normalizedEmail)) {
        console.log(`✅ [ouvidoriaAccess] Bypass ativado para: ${normalizedEmail}`);
        console.log(`✅ [ouvidoriaAccess] Continuando para próxima rota sem verificação adicional`);
        req.user = {
          email: normalizedEmail,
          name: 'Desenvolvedor',
          acessos: { Velohub: true, ouvidoria: true },
          bypass: true
        };
        return next();
      }
      
      console.log(`⚠️ [ouvidoriaAccess] Bypass não ativado, continuando verificação normal`);

      if (!client) {
        console.error('❌ [ouvidoriaAccess] MongoDB não configurado');
        return res.status(503).json({
          success: false,
          error: 'MongoDB não configurado',
          hasAccess: false
        });
      }

      // Conectar ao MongoDB
      await connectToMongo();
      const db = client.db('console_analises');
      const funcionariosCollection = db.collection('qualidade_funcionarios');

      // Buscar usuário por email - tentar múltiplas variações
      let funcionario = await funcionariosCollection.findOne({
        userMail: normalizedEmail
      });

      // Se não encontrou, tentar variações mais amplas
      if (!funcionario) {
        funcionario = await funcionariosCollection.findOne({
          $or: [
            { userMail: email }, // Email original (pode ter maiúsculas)
            { userMail: normalizedEmail }, // Email normalizado
            { userMail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }, // Case-insensitive
            { email: normalizedEmail }, // Tentar campo email também
            { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } } // Case-insensitive no campo email
          ]
        });
      }
      
      // Se ainda não encontrou, tentar buscar por parte do email (antes do @)
      if (!funcionario) {
        const emailPrefix = normalizedEmail.split('@')[0];
        if (emailPrefix) {
          funcionario = await funcionariosCollection.findOne({
            $or: [
              { userMail: { $regex: new RegExp(`^${emailPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}@`, 'i') } },
              { email: { $regex: new RegExp(`^${emailPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}@`, 'i') } }
            ]
          });
        }
      }

      if (!funcionario) {
        console.log(`❌ [ouvidoriaAccess] Usuário não encontrado: ${normalizedEmail}`);
        console.log(`🔍 [ouvidoriaAccess] Tentativas de busca realizadas:`);
        console.log(`   - userMail: ${normalizedEmail}`);
        console.log(`   - userMail (case-insensitive)`);
        console.log(`   - userMail: ${email} (original)`);
        console.log(`   - email: ${normalizedEmail}`);
        console.log(`   - email (case-insensitive)`);
        console.log(`   - Busca por prefixo do email`);
        
        // Log adicional para debug em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          try {
            const totalFuncionarios = await funcionariosCollection.countDocuments({});
            console.log(`📊 [ouvidoriaAccess] Total de funcionários na collection: ${totalFuncionarios}`);
            
            // Buscar alguns exemplos de emails para debug
            const sampleEmails = await funcionariosCollection.find({}, { projection: { userMail: 1, email: 1, colaboradorNome: 1 } }).limit(5).toArray();
            console.log(`📋 [ouvidoriaAccess] Exemplos de emails na collection:`, sampleEmails.map(f => ({ 
              userMail: f.userMail, 
              email: f.email, 
              nome: f.colaboradorNome 
            })));
            
            // Tentar buscar qualquer funcionário com email similar
            const similarEmails = await funcionariosCollection.find({
              $or: [
                { userMail: { $regex: normalizedEmail.split('@')[0], $options: 'i' } },
                { email: { $regex: normalizedEmail.split('@')[0], $options: 'i' } }
              ]
            }, { projection: { userMail: 1, email: 1, colaboradorNome: 1 } }).limit(3).toArray();
            
            if (similarEmails.length > 0) {
              console.log(`🔍 [ouvidoriaAccess] Emails similares encontrados:`, similarEmails.map(f => ({ 
                userMail: f.userMail, 
                email: f.email, 
                nome: f.colaboradorNome 
              })));
            }
          } catch (debugError) {
            console.error(`❌ [ouvidoriaAccess] Erro ao buscar exemplos para debug:`, debugError.message);
          }
        }
        
        // Em desenvolvimento, permitir acesso mesmo se não encontrar o usuário (com warning)
        const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        if (isDevelopment) {
          console.warn(`⚠️ [ouvidoriaAccess] Modo desenvolvimento: Permitindo acesso mesmo sem usuário encontrado`);
          console.warn(`⚠️ [ouvidoriaAccess] Email: ${normalizedEmail}`);
          req.user = {
            email: normalizedEmail,
            name: 'Usuário Desenvolvimento',
            acessos: { Velohub: true, ouvidoria: true },
            developmentMode: true
          };
          return next();
        }
        
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado. Verifique se seu email está cadastrado no sistema.',
          hasAccess: false,
          email: normalizedEmail
        });
      }

      // Verificar acesso ao VeloHub primeiro (pré-requisito)
      const acessos = funcionario.acessos || {};
      const acessoVelohub = acessos.Velohub || acessos.velohub || acessos.VeloHub || acessos.VELOHUB || false;
      
      if (!acessoVelohub) {
        console.log(`❌ [ouvidoriaAccess] Acesso negado: usuário não tem acesso ao VeloHub`);
        return res.status(403).json({
          success: false,
          error: 'Acesso ao VeloHub não autorizado',
          hasAccess: false
        });
      }

      // Verificar acesso ao módulo Ouvidoria (verifica variações de case)
      const acessoOuvidoria = acessos.ouvidoria === true || 
                               acessos.Ouvidoria === true || 
                               acessos.OUVIDORIA === true;

      if (!acessoOuvidoria) {
        console.log(`❌ [ouvidoriaAccess] Acesso negado ao módulo Ouvidoria para: ${normalizedEmail}`);
        return res.status(403).json({
          success: false,
          error: 'Acesso ao módulo Ouvidoria não autorizado. Contate o administrador.',
          hasAccess: false
        });
      }

      console.log(`✅ [ouvidoriaAccess] Acesso autorizado ao módulo Ouvidoria para: ${normalizedEmail}`);
      
      // Adicionar informações do usuário ao request para uso posterior
      req.user = {
        email: normalizedEmail,
        name: funcionario.colaboradorNome || normalizedEmail,
        acessos: acessos
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

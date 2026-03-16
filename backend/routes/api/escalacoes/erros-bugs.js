/**
 * VeloHub V3 - Escalações API Routes - Erros/Bugs
 * VERSION: v1.8.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
 * Branch: main (recuperado de escalacoes)
 * 
 * Mudanças v1.8.0:
 * - Adicionada normalização do campo replies em GET / e GET /:id para garantir que sempre seja array
 * - Campo replies agora é sempre inicializado como array vazio se não existir
 * - Adicionados logs de debug para rastrear replies nos erros/bugs
 * - Compatibilidade com funcionalidade de visualização de respostas do WhatsApp
 * 
 * Mudanças v1.7.0:
 * - Adicionado localhost:8090 à lista de origens CORS permitidas
 * - Melhorado tratamento de erros de conexão MongoDB (timeout, network errors)
 * - Criadas funções auxiliares isConnectionError() e handleError() para padronizar tratamento
 * - Erros de conexão agora retornam status 503 (Service Unavailable) ao invés de 500
 * - Mensagens de erro mais claras para problemas de conexão com o banco de dados
 * 
 * Mudanças v1.6.1:
 * - Adicionados headers CORS manualmente em todos os endpoints para garantir funcionamento correto
 * - Criada função auxiliar setCorsHeaders para padronizar headers CORS
 * 
 * Mudanças v1.6.0:
 * - Corrigido import do whatsappService para ser direto (igual à rota de solicitações)
 * - Adicionada verificação !waMessageId && mensagemTexto na condição de envio (igual à rota de solicitações)
 * - Removida verificação desnecessária if (!whatsappService) dentro do bloco
 * - Código agora segue o mesmo padrão da rota de solicitações que funciona corretamente
 * 
 * Mudanças v1.5.0:
 * - Corrigido erro de sintaxe no bloco try-catch do envio WhatsApp
 * - Adicionado tratamento de erro WhatsApp na resposta da API
 * - Adicionado aviso na resposta quando WhatsApp não está disponível
 * - Adicionados logs de instrumentação para debug
 * 
 * Mudanças v1.4.0:
 * - Corrigido extração de imagens: agora usa payload.imageData ao invés de payload.previews
 * - Imagens agora são extraídas dos dados completos em base64, não dos thumbnails
 * - Envio de imagens e vídeos via WhatsApp agora funciona corretamente
 * 
 * Mudanças v1.3.1:
 * - Corrigido mapeamento de status: ✅ (feito) e ❌/✖️/✖ (não feito) para consistência com frontend
 * 
 * Mudanças v1.3.0:
 * - Adicionado endpoint POST /auto-status para atualização automática via reações WhatsApp
 * - Suporte para reações ✅ (feito) e ❌/✖️/✖ (não feito)
 *
 * Rotas para gerenciamento de erros e bugs
 * 
 * Mudanças v1.2.0:
 * - Corrigida extração de vídeos do payload.videoData para envio via WhatsApp
 * - Suporte completo para envio de vídeos através do WhatsApp service
 * 
 * Mudanças v1.1.0:
 * - Integração com WhatsApp service para envio automático de mensagens
 */

const express = require('express');
const router = express.Router();

/**
 * Inicializar rotas de erros/bugs
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 * @param {Object} services - Serviços disponíveis (userActivityLogger, etc.)
 */
const initErrosBugsRoutes = (client, connectToMongo, services = {}) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'erros-bugs.js:47',message:'initErrosBugsRoutes ENTRY',data:{hasClient:!!client,hasConnectToMongo:typeof connectToMongo==='function',servicesKeys:Object.keys(services)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { userActivityLogger } = services;

  /**
   * Função auxiliar para adicionar headers CORS
   */
  const setCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://app.velohub.velotax.com.br',
      'https://velohub-278491073220.us-east1.run.app',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8090'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id, X-Session-Id');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  };

  /**
   * Função auxiliar para detectar erros de conexão do MongoDB
   */
  const isConnectionError = (error) => {
    return (
      error.name === 'MongoNetworkTimeoutError' ||
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError' ||
      error.message?.includes('timed out') ||
      error.message?.includes('connection')
    );
  };

  /**
   * Função auxiliar para tratar erros e retornar resposta apropriada
   */
  const handleError = (req, res, error, defaultMessage) => {
    console.error(`❌ Erro: ${defaultMessage}`, error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Adicionar headers CORS mesmo em caso de erro
    setCorsHeaders(req, res);
    
    // Detectar erros de conexão/timeout do MongoDB
    const isConnError = isConnectionError(error);
    
    // Status 503 (Service Unavailable) para erros de conexão
    // Status 500 (Internal Server Error) para outros erros
    const statusCode = isConnError ? 503 : 500;
    const errorMessage = isConnError 
      ? 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.'
      : defaultMessage;
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      errorType: error.name,
      isConnectionError: isConnError,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };

  /**
   * OPTIONS handler para requisições preflight CORS
   */
  router.options('*', (req, res) => {
    setCorsHeaders(req, res);
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
  });

  /**
   * GET /api/escalacoes/erros-bugs
   * Buscar todos os erros/bugs ou filtrar por query params
   */
  router.get('/', async (req, res) => {
    // Adicionar headers CORS antes de processar a requisição
    setCorsHeaders(req, res);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'erros-bugs.js:54',message:'router.get(/) HANDLER CALLED',data:{path:req.path,method:req.method,url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      console.log('🔍 [GET /erros-bugs] Iniciando busca de erros/bugs...');
      
      if (!client) {
        console.error('❌ [GET /erros-bugs] MongoDB client não configurado');
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: []
        });
      }

      console.log('🔍 [GET /erros-bugs] Conectando ao MongoDB...');
      await connectToMongo();
      console.log('✅ [GET /erros-bugs] Conectado ao MongoDB');
      
      const db = client.db('hub_escalacoes');
      const collection = db.collection('erros_bugs');
      console.log('✅ [GET /erros-bugs] Collection obtida: erros_bugs');

      // Filtros opcionais
      const { cpf, colaboradorNome, agente, tipo } = req.query;
      console.log('🔍 [GET /erros-bugs] Query params:', { cpf, colaboradorNome, agente, tipo });
      
      const filter = {};
      if (cpf) {
        filter.cpf = { $regex: String(cpf).replace(/\D/g, ''), $options: 'i' };
      }
      // Suportar tanto colaboradorNome quanto agente (para compatibilidade)
      if (colaboradorNome) {
        filter.colaboradorNome = { $regex: String(colaboradorNome), $options: 'i' };
      } else if (agente) {
        filter.colaboradorNome = { $regex: String(agente), $options: 'i' };
      }
      if (tipo) {
        filter.tipo = { $regex: String(tipo), $options: 'i' };
      }

      console.log('🔍 [GET /erros-bugs] Filtro aplicado:', JSON.stringify(filter));

      const errosBugs = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`✅ [GET /erros-bugs] Erros/Bugs encontrados: ${errosBugs.length}`);
      
      // Log ANTES da normalização para verificar o que vem do MongoDB
      errosBugs.forEach(eb => {
        if (eb.waMessageId) {
          console.log(`🔍 [GET /erros-bugs] Documento ${eb._id}:`, {
            waMessageId: eb.waMessageId,
            hasRepliesField: 'replies' in eb,
            repliesType: typeof eb.replies,
            repliesValue: eb.replies,
            repliesIsArray: Array.isArray(eb.replies),
            repliesLength: Array.isArray(eb.replies) ? eb.replies.length : 'N/A'
          });
        }
      });
      
      // Normalizar campo replies para garantir que sempre seja array
      errosBugs.forEach(eb => {
        if (!Array.isArray(eb.replies)) {
          eb.replies = [];
        }
      });
      
      // Log de replies para debug (sempre, para identificar problemas)
      if (errosBugs.length > 0) {
        const repliesCount = errosBugs.filter(eb => Array.isArray(eb.replies) && eb.replies.length > 0).length;
        console.log(`📊 [GET /erros-bugs] Erros/Bugs com replies: ${repliesCount}/${errosBugs.length}`);
        errosBugs.forEach(eb => {
          const replies = Array.isArray(eb.replies) ? eb.replies : [];
          if (replies.length > 0) {
            console.log(`  - ${eb._id} (${eb.cpf || 'sem CPF'}): ${replies.length} replies`, {
              waMessageId: eb.waMessageId,
              replies: replies.map(r => ({ reactor: r.reactor, text: r.text?.substring(0, 50) }))
            });
          } else if (eb.waMessageId) {
            // Log também itens que têm waMessageId mas não têm replies (pode indicar problema)
            console.log(`  - ${eb._id} (${eb.cpf || 'sem CPF'}): tem waMessageId mas sem replies`, {
              waMessageId: eb.waMessageId,
              hasRepliesField: 'replies' in eb,
              repliesType: typeof eb.replies
            });
          }
        });
      }

      res.json({
        success: true,
        data: errosBugs
      });
    } catch (error) {
      handleError(req, res, error, 'Erro ao buscar erros/bugs');
    }
  });

  /**
   * GET /api/escalacoes/erros-bugs/:id
   * Buscar erro/bug por ID
   */
  router.get('/:id', async (req, res) => {
    // Adicionar headers CORS antes de processar a requisição
    setCorsHeaders(req, res);
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: null
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('erros_bugs');

      const { ObjectId } = require('mongodb');
      const erroBug = await collection.findOne({
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      });

      if (!erroBug) {
        return res.status(404).json({
          success: false,
          message: 'Erro/Bug não encontrado',
          data: null
        });
      }

      // Normalizar campo replies para garantir que sempre seja array
      if (!Array.isArray(erroBug.replies)) {
        erroBug.replies = [];
      }

      res.json({
        success: true,
        data: erroBug
      });
    } catch (error) {
      handleError(req, res, error, 'Erro ao buscar erro/bug');
    }
  });

  /**
   * POST /api/escalacoes/erros-bugs
   * Criar novo erro/bug
   */
  router.post('/', async (req, res) => {
    // Adicionar headers CORS antes de processar a requisição
    setCorsHeaders(req, res);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'erros-bugs.js:172',message:'router.post(/) HANDLER CALLED',data:{path:req.path,method:req.method,url:req.url,bodyKeys:Object.keys(req.body||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: null
        });
      }

      const { agente, cpf, tipo, payload, descricao } = req.body;

      // Validação básica
      if (!agente || !tipo) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: agente (colaboradorNome), tipo',
          data: null
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('erros_bugs');

      const now = new Date();
      const colaboradorNome = String(agente).trim();
      
      // Garantir que payload tenha agente dentro
      const payloadCompleto = {
        agente: colaboradorNome,
        ...(payload || {})
      };

      // Tipo com prefixo "Erro/Bug - " se não tiver
      const tipoCompleto = String(tipo).startsWith('Erro/Bug - ') 
        ? String(tipo).trim() 
        : `Erro/Bug - ${String(tipo).trim()}`;

      const erroBug = {
        colaboradorNome: colaboradorNome,
        cpf: cpf ? String(cpf).replace(/\D/g, '') : '',
        tipo: tipoCompleto,
        payload: payloadCompleto,
        reply: [{ status: 'enviado', msgProdutos: null, msgN1: null, at: now }],
        createdAt: now,
        updatedAt: now
      };

      const result = await collection.insertOne(erroBug);

      console.log(`✅ Erro/Bug criado: ${result.insertedId}`);

      // Log de atividade
      if (userActivityLogger) {
        try {
          await userActivityLogger.logActivity({
            action: 'create_erro_bug',
            detail: {
              erroBugId: result.insertedId.toString(),
              tipo: tipoCompleto,
              cpf: erroBug.cpf,
              colaboradorNome: colaboradorNome
            }
          });
        } catch (logErr) {
          console.error('Erro ao registrar log:', logErr);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          _id: result.insertedId,
          ...erroBug
        }
      });
    } catch (error) {
      handleError(req, res, error, 'Erro ao criar erro/bug');
    }
  });

  /**
   * PUT /api/escalacoes/erros-bugs/:id
   * Atualizar erro/bug
   */
  router.put('/:id', async (req, res) => {
    // Adicionar headers CORS antes de processar a requisição
    setCorsHeaders(req, res);
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: null
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('erros_bugs');

      const { ObjectId } = require('mongodb');
      const filter = {
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      };

      const now = new Date();
      const updateData = { ...req.body };
      
      // Sempre atualizar updatedAt
      updateData.updatedAt = now;

      const update = {
        $set: updateData
      };

      const result = await collection.updateOne(filter, update);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Erro/Bug não encontrado',
          data: null
        });
      }

      console.log(`✅ Erro/Bug atualizado: ${req.params.id}`);

      // Buscar erro/bug atualizado
      const erroBug = await collection.findOne(filter);

      res.json({
        success: true,
        data: erroBug
      });
    } catch (error) {
      handleError(req, res, error, 'Erro ao atualizar erro/bug');
    }
  });

  /**
   * DELETE /api/escalacoes/erros-bugs/:id
   * Deletar erro/bug
   */
  router.delete('/:id', async (req, res) => {
    // Adicionar headers CORS antes de processar a requisição
    setCorsHeaders(req, res);
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: null
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('erros_bugs');

      const { ObjectId } = require('mongodb');
      const filter = {
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      };

      const result = await collection.deleteOne(filter);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Erro/Bug não encontrado',
          data: null
        });
      }

      console.log(`✅ Erro/Bug deletado: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Erro/Bug deletado com sucesso'
      });
    } catch (error) {
      handleError(req, res, error, 'Erro ao deletar erro/bug');
    }
  });

  /**
   * POST /api/escalacoes/erros-bugs/auto-status
   * Atualizar status automaticamente via reação do WhatsApp
   */
  router.post('/auto-status', async (req, res) => {
    // Adicionar headers CORS antes de processar a requisição
    setCorsHeaders(req, res);
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          error: 'MongoDB não configurado'
        });
      }

      const { waMessageId, reactor, status: inputStatus, reaction } = req.body;

      // Validação
      if (!waMessageId) {
        return res.status(400).json({
          success: false,
          error: 'waMessageId é obrigatório'
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('erros_bugs');

      // Buscar erro/bug por waMessageId (campo direto)
      let erroBug = await collection.findOne({ waMessageId });

      // Se não encontrou, buscar em payload.messageIds (array)
      if (!erroBug) {
        erroBug = await collection.findOne({
          'payload.messageIds': waMessageId
        });
      }

      if (!erroBug) {
        return res.status(404).json({
          success: false,
          error: 'Erro/Bug não encontrado'
        });
      }

      // Mapear emoji para status
      let statusFinal = inputStatus;
      if (!statusFinal && reaction) {
        if (reaction === '✅') {
          statusFinal = 'feito';
        } else if (reaction === '❌' || reaction === '✖️' || reaction === '✖') {
          statusFinal = 'não feito';
        }
      }

      if (!statusFinal) {
        return res.status(400).json({
          success: false,
          error: 'status ou reaction são obrigatórios'
        });
      }

      // Atualizar no MongoDB
      const now = new Date();
      const reactorDigits = reactor ? String(reactor).replace(/\D/g, '') : null;

      const result = await collection.updateOne(
        { _id: erroBug._id },
        {
          $set: {
            status: statusFinal,
            respondedAt: now,
            respondedBy: reactorDigits,
            updatedAt: now
          }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhuma alteração realizada'
        });
      }

      // Buscar erro/bug atualizado
      const atualizado = await collection.findOne({ _id: erroBug._id });

      // Log de atividade
      if (userActivityLogger) {
        try {
          await userActivityLogger.logActivity({
            action: 'auto_status_update_erro',
            detail: {
              erroBugId: erroBug._id.toString(),
              waMessageId,
              status: statusFinal,
              reactor: reactorDigits,
              reaction: reaction || null
            }
          });
        } catch (logErr) {
          console.error('Erro ao registrar log:', logErr);
        }
      }

      console.log(`✅ Status automático atualizado (erro/bug): ${erroBug._id} → ${statusFinal} (reação: ${reaction || 'N/A'})`);

      res.json({
        success: true,
        data: atualizado
      });
    } catch (error) {
      handleError(req, res, error, 'Erro ao atualizar status automático');
    }
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'erros-bugs.js:605',message:'initErrosBugsRoutes RETURN',data:{routerType:typeof router,routerIsFunction:typeof router==='function',hasGet:typeof router.get==='function',hasPost:typeof router.post==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return router;
};

module.exports = initErrosBugsRoutes;


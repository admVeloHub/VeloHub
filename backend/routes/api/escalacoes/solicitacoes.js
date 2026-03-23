/**
 * VeloHub V3 - Escalações API Routes - Solicitações Técnicas
 * VERSION: v1.7.1 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.7.1:
 * - Documentação: POST /:id/reply com origem "produtos" grava msgProdutos + msgN1 null + at; origem "n1" o inverso (comportamento já existente)
 * 
 * Mudanças v1.7.0:
 * - POST /:id/reply aceita cancelarSolicitacao: true → $push em reply { status: "Cancelado", msgProdutos: null, msgN1: null, at }
 * 
 * Mudanças v1.6.0:
 * - Normalização do campo replies em GET / e GET /:id para garantir que sempre seja array
 * - Adicionados logs de debug para rastrear replies nas solicitações
 * - Garantia de que campo replies sempre existe e é array antes de retornar
 * 
 * Mudanças v1.5.0:
 * - Adicionado endpoint POST /reply para receber replies/menções do WhatsApp API
 * - Armazena replies no campo replies do MongoDB quando WhatsApp detecta menção/resposta
 * - Busca solicitação por waMessageId ou payload.messageIds
 * - Evita duplicatas verificando replyMessageId existente
 * 
 * Mudanças v1.4.0:
 * - Adicionado endpoint POST /:id/reply-confirm para confirmar visualização de respostas
 * - Envia reação ✓ no WhatsApp e atualiza confirmedAt/confirmedBy no reply
 * Branch: main (recuperado de escalacoes)
 * 
 * Rotas para gerenciamento de solicitações técnicas
 * 
 * Mudanças v1.3.1:
 * - Corrigido mapeamento de status: ✅ (feito) e ❌/✖️/✖ (não feito) para consistência com frontend
 * 
 * Mudanças v1.3.0:
 * - Adicionado endpoint POST /auto-status para atualização automática via reações WhatsApp
 * - Suporte para reações ✅ (feito) e ❌/✖️/✖ (não feito)
 * 
 * Mudanças v1.2.0:
 * - Integração com WhatsApp service para envio automático de mensagens
 * 
 * Mudanças v1.1.0:
 * - Database alterado de console_servicos para hub_escalacoes
 * - Campo agente substituído por colaboradorNome no nível raiz
 * - Campo agente mantido dentro do payload
 * - Adicionados campos respondedAt, respondedBy, updatedAt
 * - Filtros atualizados para usar colaboradorNome
 */

const express = require('express');
const router = express.Router();

/**
 * Inicializar rotas de solicitações
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 * @param {Object} services - Serviços disponíveis (userActivityLogger, etc.)
 */
const initSolicitacoesRoutes = (client, connectToMongo, services = {}) => {
  const { userActivityLogger } = services;

  /**
   * GET /api/escalacoes/solicitacoes
   * Buscar todas as solicitações ou filtrar por query params
   */
  router.get('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: []
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('solicitacoes_tecnicas');

      // Filtros opcionais
      const { cpf, colaboradorNome, agente, status } = req.query;
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
      if (status) {
        filter.status = String(status);
      }

      const solicitacoes = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`✅ Solicitações encontradas: ${solicitacoes.length}`);
      
      // Log ANTES da normalização para verificar o que vem do MongoDB
      solicitacoes.forEach(s => {
        if (s.waMessageId) {
          console.log(`🔍 [GET /solicitacoes] Documento ${s._id}:`, {
            waMessageId: s.waMessageId,
            hasRepliesField: 'replies' in s,
            repliesType: typeof s.replies,
            repliesValue: s.replies,
            repliesIsArray: Array.isArray(s.replies),
            repliesLength: Array.isArray(s.replies) ? s.replies.length : 'N/A'
          });
        }
      });
      
      // Normalizar campo replies (legado) e reply (novo schema) para garantir que sempre sejam arrays
      solicitacoes.forEach(s => {
        if (!Array.isArray(s.replies)) s.replies = [];
        if (!Array.isArray(s.reply)) s.reply = [];
      });
      
      // Log de replies para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && solicitacoes.length > 0) {
        const repliesCount = solicitacoes.filter(s => Array.isArray(s.replies) && s.replies.length > 0).length;
        console.log(`📊 Solicitações com replies: ${repliesCount}/${solicitacoes.length}`);
        solicitacoes.forEach(s => {
          if (Array.isArray(s.replies) && s.replies.length > 0) {
            console.log(`  - ${s._id}: ${s.replies.length} replies`);
          }
        });
      }
      
      // Log de status para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && solicitacoes.length > 0) {
        const statusCount = {};
        solicitacoes.forEach(s => {
          const st = String(s.status || 'sem status');
          statusCount[st] = (statusCount[st] || 0) + 1;
        });
        console.log(`📊 Status das solicitações:`, statusCount);
      }

      res.json({
        success: true,
        data: solicitacoes
      });
    } catch (error) {
      console.error('❌ Erro ao buscar solicitações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações',
        error: error.message
      });
    }
  });

  /**
   * GET /api/escalacoes/solicitacoes/:id
   * Buscar solicitação por ID
   */
  router.get('/:id', async (req, res) => {
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
      const collection = db.collection('solicitacoes_tecnicas');

      const { ObjectId } = require('mongodb');
      const solicitacao = await collection.findOne({
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      });

      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada',
          data: null
        });
      }

      // Normalizar campo replies (legado) e reply (novo schema) para garantir que sempre sejam arrays
      if (!Array.isArray(solicitacao.replies)) solicitacao.replies = [];
      if (!Array.isArray(solicitacao.reply)) solicitacao.reply = [];

      res.json({
        success: true,
        data: solicitacao
      });
    } catch (error) {
      console.error('❌ Erro ao buscar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitação',
        error: error.message
      });
    }
  });

  /**
   * POST /api/escalacoes/solicitacoes
   * Criar nova solicitação
   */
  router.post('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: null
        });
      }

      const { agente, cpf, tipo, payload, mensagemTexto } = req.body;

      // Validação básica
      if (!agente || !cpf || !tipo) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: agente (colaboradorNome), cpf, tipo',
          data: null
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('solicitacoes_tecnicas');

      const now = new Date();
      const colaboradorNome = String(agente).trim();
      
      // Garantir que payload tenha agente dentro
      const payloadCompleto = {
        agente: colaboradorNome,
        ...(payload || {})
      };

      const solicitacao = {
        colaboradorNome: colaboradorNome,
        cpf: String(cpf).replace(/\D/g, ''),
        tipo: String(tipo).trim(),
        payload: payloadCompleto,
        reply: [{ status: 'enviado', msgProdutos: null, msgN1: null, at: now }],
        createdAt: now,
        updatedAt: now
      };

      const result = await collection.insertOne(solicitacao);

      console.log(`✅ Solicitação criada: ${result.insertedId}`);

      // Log de atividade
      if (userActivityLogger) {
        try {
          await userActivityLogger.logActivity({
            action: 'create_solicitacao',
            detail: {
              solicitacaoId: result.insertedId.toString(),
              tipo,
              cpf: solicitacao.cpf,
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
          ...solicitacao
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação',
        error: error.message
      });
    }
  });

  /**
   * PUT /api/escalacoes/solicitacoes/:id
   * Atualizar solicitação
   */
  router.put('/:id', async (req, res) => {
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
      const collection = db.collection('solicitacoes_tecnicas');

      const { ObjectId } = require('mongodb');
      const filter = {
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      };

      const now = new Date();
      const updateData = { ...req.body };
      
      // Sempre atualizar updatedAt
      updateData.updatedAt = now;
      
      // Se não está sendo atualizado respondedAt/respondedBy, não remover se já existir
      const update = {
        $set: updateData
      };

      const result = await collection.updateOne(filter, update);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada',
          data: null
        });
      }

      console.log(`✅ Solicitação atualizada: ${req.params.id}`);

      // Buscar solicitação atualizada
      const solicitacao = await collection.findOne(filter);

      res.json({
        success: true,
        data: solicitacao
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar solicitação',
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/escalacoes/solicitacoes/:id
   * Deletar solicitação
   */
  router.delete('/:id', async (req, res) => {
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
      const collection = db.collection('solicitacoes_tecnicas');

      const { ObjectId } = require('mongodb');
      const filter = {
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      };

      const result = await collection.deleteOne(filter);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada',
          data: null
        });
      }

      console.log(`✅ Solicitação deletada: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Solicitação deletada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao deletar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar solicitação',
        error: error.message
      });
    }
  });

  /**
   * POST /api/escalacoes/solicitacoes/auto-status
   * Atualizar status automaticamente via reação do WhatsApp
   */
  router.post('/auto-status', async (req, res) => {
    try {
      console.log(`[AUTO-STATUS] Recebida requisição:`, {
        body: req.body,
        headers: req.headers
      });

      if (!client) {
        return res.status(503).json({
          success: false,
          error: 'MongoDB não configurado'
        });
      }

      const { waMessageId, reactor, status: inputStatus, reaction } = req.body;

      console.log(`[AUTO-STATUS] Dados recebidos:`, {
        waMessageId,
        reactor,
        inputStatus,
        reaction
      });

      // Validação
      if (!waMessageId) {
        console.log(`[AUTO-STATUS] ❌ waMessageId ausente`);
        return res.status(400).json({
          success: false,
          error: 'waMessageId é obrigatório'
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('solicitacoes_tecnicas');

      // Buscar solicitação por waMessageId (campo direto)
      console.log(`[AUTO-STATUS] Buscando solicitação por waMessageId: ${waMessageId}`);
      let solicitacao = await collection.findOne({ waMessageId });

      // Se não encontrou, buscar em payload.messageIds (array)
      if (!solicitacao) {
        console.log(`[AUTO-STATUS] Não encontrado em waMessageId, buscando em payload.messageIds`);
        solicitacao = await collection.findOne({
          'payload.messageIds': waMessageId
        });
      }

      if (!solicitacao) {
        console.log(`[AUTO-STATUS] ❌ Solicitação não encontrada para waMessageId: ${waMessageId}`);
        return res.status(404).json({
          success: false,
          error: 'Solicitação não encontrada'
        });
      }

      console.log(`[AUTO-STATUS] ✅ Solicitação encontrada:`, {
        _id: solicitacao._id,
        statusAtual: solicitacao.status,
        waMessageIdAtual: solicitacao.waMessageId,
        messageIds: solicitacao.payload?.messageIds
      });

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
        { _id: solicitacao._id },
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

      // Buscar solicitação atualizada
      const atualizado = await collection.findOne({ _id: solicitacao._id });

      // Log de atividade
      if (userActivityLogger) {
        try {
          await userActivityLogger.logActivity({
            action: 'auto_status_update',
            detail: {
              solicitacaoId: solicitacao._id.toString(),
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

      console.log(`✅ Status automático atualizado: ${solicitacao._id} → ${statusFinal} (reação: ${reaction || 'N/A'})`);

      res.json({
        success: true,
        data: atualizado
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar status automático:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/escalacoes/solicitacoes/:id/reply-confirm
   * Confirmar visualização de resposta do WhatsApp
   * Envia reação ✓ no WhatsApp e atualiza confirmedAt/confirmedBy no reply
   */
  router.post('/:id/reply-confirm', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          ok: false,
          error: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('solicitacoes_tecnicas');

      const { id } = req.params;
      const { replyMessageId, confirmedBy } = req.body || {};

      // Validação
      if (!replyMessageId) {
        return res.status(400).json({
          ok: false,
          error: 'replyMessageId é obrigatório'
        });
      }

      // Buscar documento
      const { ObjectId } = require('mongodb');
      const doc = await collection.findOne({
        _id: ObjectId.isValid(id) ? new ObjectId(id) : id
      });

      if (!doc) {
        return res.status(404).json({
          ok: false,
          error: 'Solicitação não encontrada'
        });
      }

      // Normalizar replies para array
      const replies = Array.isArray(doc.replies) ? doc.replies : [];
      
      // Encontrar índice do reply
      const replyIndex = replies.findIndex(
        r => String(r.replyMessageId) === String(replyMessageId)
      );

      if (replyIndex === -1) {
        return res.status(404).json({
          ok: false,
          error: 'Reply não encontrado'
        });
      }

      const reply = replies[replyIndex];

      // Atualizar confirmedAt e confirmedBy (WhatsApp descontinuado - apenas atualização MongoDB)
      const confirmedAt = new Date();
      replies[replyIndex] = {
        ...reply,
        confirmedAt,
        confirmedBy: confirmedBy || null
      };

      // Atualizar documento no MongoDB
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            replies,
            updatedAt: new Date()
          }
        }
      );

      return res.json({
        ok: true,
        confirmedAt
      });
    } catch (error) {
      console.error('[reply-confirm] Erro:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro ao confirmar resposta'
      });
    }
  });

  /**
   * POST /api/escalacoes/solicitacoes/:id/reply
   * Adicionar item ao array reply OU cancelar solicitação
   * Body cancelar: { cancelarSolicitacao: true } → { status: "Cancelado", msgProdutos: null, msgN1: null, at }
   * Body reply: { origem: "produtos"|"n1", status: "enviado"|"feito"|"não feito", msgProdutos?: string, msgN1?: string }
   * origem "produtos": persiste msgProdutos (texto), msgN1 null, at = agora | origem "n1": msgN1 (texto), msgProdutos null, at = agora
   */
  router.post('/:id/reply', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          ok: false,
          error: 'MongoDB não configurado'
        });
      }

      const { id } = req.params;
      const body = req.body || {};
      const { origem, status, msgProdutos, msgN1 } = body;

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('solicitacoes_tecnicas');
      const { ObjectId } = require('mongodb');
      const filterId = ObjectId.isValid(id) ? new ObjectId(id) : id;

      // Cancelar solicitação: novo item em reply (status Cancelado, mensagens null)
      if (body.cancelarSolicitacao === true || body.cancelarSolicitacao === 'true') {
        const doc = await collection.findOne({ _id: filterId });
        if (!doc) {
          return res.status(404).json({ ok: false, error: 'Solicitação não encontrada' });
        }
        const replyArray = Array.isArray(doc.reply) ? [...doc.reply] : [];
        const cancelEntry = {
          status: 'Cancelado',
          msgProdutos: null,
          msgN1: null,
          at: new Date()
        };
        replyArray.push(cancelEntry);
        await collection.updateOne(
          { _id: doc._id },
          { $set: { reply: replyArray, updatedAt: new Date() } }
        );
        console.log(`[reply] 🛑 Solicitação cancelada em ${doc._id}`);
        return res.json({
          ok: true,
          solicitacaoId: doc._id.toString(),
          replyCount: replyArray.length
        });
      }

      // Validação — reply N1 / Produtos
      if (!origem || !['produtos', 'n1'].includes(String(origem).toLowerCase())) {
        return res.status(400).json({
          ok: false,
          error: 'origem é obrigatório e deve ser "produtos" ou "n1"'
        });
      }

      if (!status || !['enviado', 'feito', 'não feito'].includes(String(status))) {
        return res.status(400).json({
          ok: false,
          error: 'status é obrigatório e deve ser "enviado", "feito" ou "não feito"'
        });
      }

      const msgProd = String(msgProdutos || '').trim();
      const msgN = String(msgN1 || '').trim();
      if (!msgProd && !msgN) {
        return res.status(400).json({
          ok: false,
          error: 'msgProdutos ou msgN1 deve ter conteúdo'
        });
      }

      const doc = await collection.findOne({ _id: filterId });

      if (!doc) {
        return res.status(404).json({
          ok: false,
          error: 'Solicitação não encontrada'
        });
      }

      // Normalizar array reply
      const replyArray = Array.isArray(doc.reply) ? doc.reply : [];

      const newEntry = {
        status: String(status),
        msgProdutos: origem.toLowerCase() === 'produtos' ? (msgProd || null) : null,
        msgN1: origem.toLowerCase() === 'n1' ? (msgN || null) : null,
        at: new Date()
      };

      replyArray.push(newEntry);

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            reply: replyArray,
            updatedAt: new Date()
          }
        }
      );

      console.log(`[reply] ✅ Reply adicionado em ${doc._id}. Total: ${replyArray.length}`);

      return res.json({
        ok: true,
        solicitacaoId: doc._id.toString(),
        replyCount: replyArray.length
      });
    } catch (error) {
      console.error('[reply] Erro:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro ao processar reply'
      });
    }
  });

  return router;
};

module.exports = initSolicitacoesRoutes;


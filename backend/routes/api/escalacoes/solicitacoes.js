/**
 * VeloHub V3 - Escalações API Routes - Solicitações Técnicas
 * VERSION: v1.14.1 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.14.1: POST liberação PIX — recusa duplicata quando já existe liberacao_pix_prod para ouvidoriaReclamacaoId
 * - v1.14.0: POST internal/reconciliar-pix-liberado-ouvidoria — job Cloud Scheduler 15 min (header X-Velohub-Pix-Reconcile-Secret)
 * - v1.13.0: Status reply «feito» propaga pixLiberado na ouvidoria (util compartilhado + POST propagar-pix-liberado)
 * - v1.12.3: Octadesk comentário interno — await + octadeskSync na resposta; octa-agent-email do x-user-email
 * - v1.12.2: Octadesk PUT comentário interno — resolve ticket (protocolosCentral / reclamação vinculada)
 * VERSION: v1.12.1 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.12.1: liberacao_pix_prod cria comentário interno no ticket Octadesk de referência (ouvidoriaNumeroProtocolo)
 * - v1.12.0: protocolosCentral obrigatório em solicitacoes_tecnicas; sync Octadesk (criar/encerrar requisição)
 * - v1.11.9: Removida instrumentação `agentDebugLog` / NDJSON debug-d712b6 (sessão concluída)
 * - v1.11.8: GET /solicitacoes com paginação opcional (page/limit) e metadados `pagination` na resposta
 * - v1.11.5: POST /reply com origem produtos + status terminal (feito/não feito) exige x-user-email de usuário autorizado (Lucas)
 * - v1.11.4: POST /dev/marcar-chamado-status/:id — apenas dev + rede local + e-mail em VELOHUB_DEV_*; marca feito/não feito no reply (+ sync liberacao PIX)
 * - v1.11.3: POST /reply — status pode existir sem msgProdutos/msgN1; liberacao_pix «feito» também $set pixLiberado/dataLiberacao + sync ouvidoria (fallback numeroProtocolo se _id não casar)
 * - v1.11.2: liberacao_pix_prod — reply «feito» ou PUT pixLiberado=true: sincroniza hub_ouvidoria.*.pixLiberado (normalize ObjectId; log se matchedCount=0)
 * - v1.9.0: Aba Liberação chave pix (tipo «Exclusão de Chave PIX» + payload.origem): insert apenas em hub_escalacoes.liberacao_pix_prod — sem registro em solicitacoes_tecnicas; removidos solicitacaoTecnicaId e sync de reply entre coleções
 * - v1.8.1: liberacao_pix_prod: campo observacoes (espelho de payload.observacoes)
 */

const express = require('express');
const { ObjectId } = require('mongodb');
const { getHubOuvidoriaReclamacaoCollectionByTipo } = require('../../../utils/hubOuvidoriaReclamacaoCollectionByTipo');
const { getStatusChamadoFromDoc } = require('../../../utils/escalacoesReplyStatus');
const { permiteDevMarcacaoChamado } = require('../../../utils/devLocalMarcacaoChamado');
const {
  validateProtocolosCentralRequired,
  resolveOctadeskTicketFromRequisicao,
  resolveOctadeskTicketForLiberacaoPix,
  looksLikeOctadeskTicketNumber,
} = require('../../../utils/resolveOctadeskTicketNumber');
const {
  buildSolicitacaoHeaderComment,
  buildRequisicaoEncerradaComment,
} = require('../../../utils/octadeskRequisicaoComments');
const {
  addInternalComment,
  octadeskSyncFireAndForget,
} = require('../../../services/octadesk/octadeskTicketsService');
const config = require('../../../config');
const {
  propagarPixLiberadoSeRequisicaoFeita,
  propagarPixLiberadoPorLiberacaoId,
  reconciliarPixLiberadoOuvidoriaBatch,
} = require('../../../utils/liberacaoPixOuvidoriaSync');
const router = express.Router();

/**
 * @param {import('express').Request} req
 * @returns {{ ok: boolean, reason?: string }}
 */
function validarPixReconcileSecret(req) {
  const secret =
    config.VELOHUB_PIX_RECONCILE_SECRET != null
      ? String(config.VELOHUB_PIX_RECONCILE_SECRET).trim()
      : '';
  if (!secret) return { ok: false, reason: 'not_configured' };
  const header = String(req.headers['x-velohub-pix-reconcile-secret'] || '').trim();
  if (header !== secret) return { ok: false, reason: 'unauthorized' };
  return { ok: true };
}

/** @param {string} status */
function isTerminalChamadoStatus(status) {
  const s = String(status || '')
    .toLowerCase()
    .trim();
  return s === 'feito' || s === 'não feito' || s === 'nao feito' || s === 'cancelado';
}
const DEV_REQUISICOES_ALLOWED_EMAIL = 'lucas.gravina@velotax.com.br';

/**
 * @param {import('express').Request} req
 * @returns {string}
 */
function readAgentEmailFromRequest(req) {
  const h = req?.headers?.['x-user-email'];
  return h != null ? String(h).trim() : '';
}

/**
 * PUT /tickets/{number} — comentário interno (retorno para UI).
 * @param {string} ticketNum
 * @param {string} text
 * @param {string} [agentEmail]
 * @returns {Promise<{ ok: boolean, ticketNumber?: string, error?: string, status?: number, hint?: string }>}
 */
async function pushOctadeskInternalComment(ticketNum, text, agentEmail) {
  if (!ticketNum) {
    return {
      ok: false,
      error: 'Número do ticket Octadesk não informado (protocolosCentral / ticketRegistro da ocorrência).',
    };
  }
  const res = await addInternalComment(ticketNum, text, {
    agentEmail: agentEmail || undefined,
  });
  if (res.ok) return res;
  return {
    ...res,
    hint:
      'PUT /tickets/{number} retornou erro nesta base (api001). No Swagger, use a mesma URL do .env e o number da API (ex. ticketRegistro), não o exemplo 9854984.',
  };
}

/**
 * Monta documento para hub_escalacoes.liberacao_pix_prod (formulário Liberação chave pix).
 * @param {Object} p
 * @param {string} p.colaboradorNome
 * @param {string} p.cpf
 * @param {string} p.origem
 * @param {string} [p.nomeCliente]
 * @param {Object} p.payloadForm — payload bruto do formulário (semDebitoAberto, etc.)
 * @param {Date} p.now
 * @param {string} [p.ouvidoriaNumeroProtocolo]
 */
function buildLiberacaoPixProdDoc({ colaboradorNome, cpf, origem, nomeCliente, payloadForm, now, ouvidoriaNumeroProtocolo }) {
  const pf = payloadForm || {};
  const doc = {
    tipo: 'Exclusão de Chave PIX',
    colaboradorNome: String(colaboradorNome || '').trim(),
    cpf: String(cpf || '').replace(/\D/g, ''),
    nome: String(nomeCliente || '').trim(),
    origem: String(origem || '').trim(),
    observacoes: String(pf.observacoes != null ? pf.observacoes : '').trim(),
    payload: {
      'Sem Débito em aberto': pf.semDebitoAberto === true,
      'N2 - Ouvidora': pf.n2Ouvidora === true,
      'Procon': pf.procon === true,
      'Reclame Aqui': pf.reclameAqui === true,
      'Processo': pf.processo === true,
      'Bacen': pf.bacen === true,
      'Revogado consentimento ECAC': pf.revogadoConsentimentoEcac === true,
    },
    pixLiberado: false,
    dataLiberacao: null,
    reply: [{ status: 'enviado', msgProdutos: null, msgN1: null, at: now }],
    createdAt: now,
    updatedAt: now,
  };
  if (ouvidoriaNumeroProtocolo != null && String(ouvidoriaNumeroProtocolo).trim()) {
    doc.ouvidoriaNumeroProtocolo = String(ouvidoriaNumeroProtocolo).trim();
  }
  return doc;
}

/**
 * Anexa item ao array reply em solicitacoes_tecnicas ou liberacao_pix_prod; se liberação e status efetivo «feito», persiste PIX e sincroniza ouvidoria.
 * @param {import('mongodb').MongoClient|null} client
 * @param {Function} connectToMongo
 * @param {import('mongodb').ObjectId|string} filterIdVal
 * @param {{ statusStr: string, origem?: string, msgProdutos?: string|null, msgN1?: string|null }} opts
 */
async function appendMarcacaoReplyChamadoShared(client, connectToMongo, filterIdVal, opts) {
  const { statusStr, origem, msgProdutos, msgN1 } = opts || {};
  if (!client || !connectToMongo) return { erro: 'mongo_nao_disponivel' };

  await connectToMongo();
  const db = client.db('hub_escalacoes');
  const solicitacoesCol = db.collection('solicitacoes_tecnicas');
  const libCollection = db.collection('liberacao_pix_prod');

  let doc = await solicitacoesCol.findOne({ _id: filterIdVal });
  let col = solicitacoesCol;
  if (!doc) {
    doc = await libCollection.findOne({ _id: filterIdVal });
    col = libCollection;
  }
  if (!doc) return { notFound: true };

  const origLc = String(origem || 'produtos').toLowerCase();
  const msgProd = typeof msgProdutos === 'string' ? msgProdutos.trim() : String(msgProdutos || '').trim();
  const msgN = typeof msgN1 === 'string' ? msgN1.trim() : String(msgN1 || '').trim();

  const replyAt = new Date();
  const replyArray = Array.isArray(doc.reply) ? [...doc.reply] : [];

  let statusCanon = String(statusStr || '').trim();
  const sLow = statusCanon.toLowerCase();
  if (sLow === 'nao feito') statusCanon = 'não feito';

  const newEntry = {
    status: statusCanon,
    msgProdutos: origLc === 'produtos' ? (msgProd || null) : null,
    msgN1: origLc === 'n1' ? (msgN || null) : null,
    at: replyAt,
  };

  replyArray.push(newEntry);

  const mergedForStatus = { ...doc, reply: replyArray };
  const { status: statusEfetivo } = getStatusChamadoFromDoc(mergedForStatus);
  const { status: statusAnterior } = getStatusChamadoFromDoc(doc);
  const setDoc = {
    reply: replyArray,
    updatedAt: replyAt,
  };
  if (col === libCollection && statusEfetivo === 'feito') {
    setDoc.dataLiberacao = replyAt;
  }

  await col.updateOne({ _id: doc._id }, { $set: setDoc });

  if (col === libCollection && statusEfetivo === 'feito') {
    await propagarPixLiberadoSeRequisicaoFeita(client, mergedForStatus);
  }

  if (
    isTerminalChamadoStatus(statusEfetivo) &&
    !isTerminalChamadoStatus(statusAnterior) &&
    col === solicitacoesCol
  ) {
    const ticketNum = resolveOctadeskTicketFromRequisicao(mergedForStatus);
    if (ticketNum) {
      const texto = buildRequisicaoEncerradaComment(statusEfetivo, replyAt);
      octadeskSyncFireAndForget(
        () => addInternalComment(ticketNum, texto),
        `solicitacao-encerrada-${doc._id}`
      );
    }
  }

  return {
    ok: true,
    solicitacaoId: doc._id.toString(),
    replyCount: replyArray.length,
    statusEfetivo,
  };
}

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

      const pageRaw = Number.parseInt(String(req.query.page || ''), 10);
      const limitRaw = Number.parseInt(String(req.query.limit || ''), 10);
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, limitRaw) : null;
      const paginado = limit != null;
      const needCount = paginado ? page * limit : null;

      let solicitacoesCursor = collection.find(filter).sort({ createdAt: -1 });
      if (paginado) {
        solicitacoesCursor = solicitacoesCursor.limit(needCount);
      }
      const solicitacoes = await solicitacoesCursor.toArray();

      const libCollection = db.collection('liberacao_pix_prod');
      let liberacoesCursor = libCollection.find(filter).sort({ createdAt: -1 });
      if (paginado) {
        liberacoesCursor = liberacoesCursor.limit(needCount);
      }
      const liberacoes = await liberacoesCursor.toArray();

      const merged = [...solicitacoes, ...liberacoes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const totalItens = paginado
        ? (await collection.countDocuments(filter)) + (await libCollection.countDocuments(filter))
        : merged.length;
      const totalPaginas = paginado ? Math.max(1, Math.ceil(totalItens / limit)) : 1;
      const paginaAtual = paginado ? Math.min(page, totalPaginas) : 1;
      const startIndex = paginado ? (paginaAtual - 1) * limit : 0;
      const endIndex = paginado ? startIndex + limit : merged.length;
      const mergedPage = paginado ? merged.slice(startIndex, endIndex) : merged;

      console.log(`✅ Solicitações encontradas: ${solicitacoes.length} (solicitacoes_tecnicas) + ${liberacoes.length} (liberacao_pix_prod) → ${merged.length} mescladas`);
      
      // Log ANTES da normalização para verificar o que vem do MongoDB
      mergedPage.forEach(s => {
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
      mergedPage.forEach(s => {
        if (!Array.isArray(s.replies)) s.replies = [];
        if (!Array.isArray(s.reply)) s.reply = [];
      });
      
      // Log de replies para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && mergedPage.length > 0) {
        const repliesCount = mergedPage.filter(s => Array.isArray(s.replies) && s.replies.length > 0).length;
        console.log(`📊 Solicitações com replies: ${repliesCount}/${mergedPage.length}`);
        mergedPage.forEach(s => {
          if (Array.isArray(s.replies) && s.replies.length > 0) {
            console.log(`  - ${s._id}: ${s.replies.length} replies`);
          }
        });
      }
      
      // Log de status para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && mergedPage.length > 0) {
        const statusCount = {};
        mergedPage.forEach(s => {
          const st = String(s.status || 'sem status');
          statusCount[st] = (statusCount[st] || 0) + 1;
        });
        console.log(`📊 Status das solicitações:`, statusCount);
      }

      res.json({
        success: true,
        data: mergedPage,
        pagination: {
          page: paginaAtual,
          limit: paginado ? limit : mergedPage.length,
          total: totalItens,
          totalPages: totalPaginas,
          hasNextPage: paginado ? paginaAtual < totalPaginas : false,
          hasPrevPage: paginado ? paginaAtual > 1 : false,
        },
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
   * POST /api/escalacoes/solicitacoes/dev/marcar-chamado-status/:id
   * Dev local: apenas NODE_ENV=development + env VELOHUB_DEV_MARCACAO_* + cliente em loopback ou LAN permitida — define status «feito» ou «não feito» no reply.
   * Não remover em produção o gate: em produção a rota sempre responde 403.
   */
  router.post('/dev/marcar-chamado-status/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ ok: false, error: 'MongoDB não configurado' });
      }

      const gate = permiteDevMarcacaoChamado(req);
      if (!gate.ok) {
        return res.status(403).json({
          ok: false,
          error: 'Operação disponível apenas em ambiente dev local configurado.',
          codigo: gate.reason,
        });
      }

      const { id } = req.params;
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      let statusRaw = body.status ?? body.chatStatus ?? '';
      const sNorm = String(statusRaw || '').toLowerCase().trim();
      if (sNorm !== 'feito' && sNorm !== 'não feito' && sNorm !== 'nao feito') {
        return res.status(400).json({
          ok: false,
          error: 'body.status deve ser "feito" ou "não feito"',
        });
      }

      const statusStr =
        sNorm === 'nao feito' || sNorm === 'não feito' ? 'não feito' : 'feito';

      const { ObjectId } = require('mongodb');
      const filterId =
        typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : id;

      const result = await appendMarcacaoReplyChamadoShared(client, connectToMongo, filterId, {
        statusStr,
        origem: 'produtos',
        msgProdutos: '',
        msgN1: '',
      });

      if (result.notFound) {
        return res.status(404).json({ ok: false, error: 'Solicitação ou liberação não encontrada' });
      }

      console.log(`[dev-marcacao-chamado] aplicado ${statusStr} em ${filterId}`);

      return res.json({
        ok: true,
        solicitacaoId: result.solicitacaoId,
        replyCount: result.replyCount,
        statusEfetivo: result.statusEfetivo,
      });
    } catch (error) {
      console.error('[dev-marcacao-chamado]', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro ao aplicar marcação',
      });
    }
  });

  /**
   * POST /api/escalacoes/solicitacoes/internal/reconciliar-pix-liberado-ouvidoria
   * Job Cloud Scheduler (15 min): propaga pixLiberado para liberações «feito» recentes.
   * Header: X-Velohub-Pix-Reconcile-Secret (= VELOHUB_PIX_RECONCILE_SECRET)
   */
  router.post('/internal/reconciliar-pix-liberado-ouvidoria', async (req, res) => {
    try {
      const gate = validarPixReconcileSecret(req);
      if (!gate.ok) {
        const status = gate.reason === 'not_configured' ? 503 : 403;
        return res.status(status).json({ ok: false, error: gate.reason });
      }

      if (!client) {
        return res.status(503).json({ ok: false, error: 'MongoDB não configurado' });
      }

      await connectToMongo();
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const windowHours = body.windowHours != null ? Number(body.windowHours) : undefined;
      const limit = body.limit != null ? Number(body.limit) : undefined;

      const stats = await reconciliarPixLiberadoOuvidoriaBatch(client, { windowHours, limit });

      return res.json({ ok: true, ...stats });
    } catch (error) {
      console.error('[reconciliar-pix-liberado-ouvidoria]', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro na reconciliação pixLiberado',
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
      const oid = ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id;
      let solicitacao = await collection.findOne({ _id: oid });

      if (!solicitacao) {
        solicitacao = await db.collection('liberacao_pix_prod').findOne({ _id: oid });
      }

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
      const tipoTrim = String(tipo || '').trim();
      const pl = payload || {};
      const origemStr = String(pl.origem || '').trim();

      // Aba Liberação chave pix: somente hub_escalacoes.liberacao_pix_prod (não grava em solicitacoes_tecnicas)
      if (tipoTrim === 'Exclusão de Chave PIX' && origemStr) {
        const libCollection = db.collection('liberacao_pix_prod');
        const ouvIdRaw = pl.ouvidoriaReclamacaoId;
        const ouvTipoRaw = pl.ouvidoriaReclamacaoTipo;
        const ouvProtoRaw = pl.ouvidoriaNumeroProtocolo;
        const payloadForBuild = { ...pl };
        delete payloadForBuild.ouvidoriaReclamacaoId;
        delete payloadForBuild.ouvidoriaReclamacaoTipo;
        delete payloadForBuild.ouvidoriaNumeroProtocolo;

        const libDoc = buildLiberacaoPixProdDoc({
          colaboradorNome,
          cpf: String(cpf).replace(/\D/g, ''),
          origem: origemStr,
          nomeCliente: pl.nomeCliente != null ? String(pl.nomeCliente) : '',
          payloadForm: payloadForBuild,
          now,
          ouvidoriaNumeroProtocolo:
            ouvProtoRaw != null && String(ouvProtoRaw).trim() ? String(ouvProtoRaw).trim() : undefined,
        });

        if (ouvIdRaw != null && String(ouvIdRaw).trim() && ObjectId.isValid(String(ouvIdRaw)) && String(ouvTipoRaw || '').trim()) {
          libDoc.ouvidoriaReclamacaoId = new ObjectId(String(ouvIdRaw));
          libDoc.ouvidoriaReclamacaoTipo = String(ouvTipoRaw).trim();
        }

        if (libDoc.ouvidoriaReclamacaoId) {
          const libExistente = await libCollection.findOne({
            ouvidoriaReclamacaoId: libDoc.ouvidoriaReclamacaoId,
          });
          if (libExistente) {
            return res.status(409).json({
              success: false,
              message: 'Já existe solicitação de liberação PIX vinculada a esta ocorrência.',
              data: {
                _id: libExistente._id,
                alreadyExists: true,
              },
            });
          }
        }

        const ticketHint = String(ouvProtoRaw != null ? ouvProtoRaw : '').trim();
        if (ticketHint && looksLikeOctadeskTicketNumber(ticketHint)) {
          libDoc.protocolosCentral = [ticketHint];
        }

        const libRes = await libCollection.insertOne(libDoc);
        const insertedDoc = await libCollection.findOne({ _id: libRes.insertedId });
        console.log(`✅ liberacao_pix_prod criado: ${libRes.insertedId}`);

        const ticketRef = await resolveOctadeskTicketForLiberacaoPix(
          client,
          connectToMongo,
          insertedDoc || libDoc
        );
        const headerText = buildSolicitacaoHeaderComment({
          agente: colaboradorNome,
          cpf: libDoc.cpf,
          tipo: tipoTrim,
          payload: payloadForBuild,
          mensagemTexto,
        });
        const octadeskSync = await pushOctadeskInternalComment(
          ticketRef,
          headerText,
          readAgentEmailFromRequest(req)
        );
        if (!octadeskSync.ok) {
          console.warn(
            `[Octadesk] liberacao-pix-criada-${libRes.insertedId}:`,
            octadeskSync.error,
            octadeskSync.ticketNumber || ticketRef || '(sem ticket)'
          );
        }

        let ouvUpdateWarning = null;
        if (libDoc.ouvidoriaReclamacaoId && libDoc.ouvidoriaReclamacaoTipo) {
          try {
            const ouvDb = client.db('hub_ouvidoria');
            const ouvColl = getHubOuvidoriaReclamacaoCollectionByTipo(ouvDb, libDoc.ouvidoriaReclamacaoTipo);
            const upd = await ouvColl.updateOne(
              { _id: libDoc.ouvidoriaReclamacaoId },
              { $set: { liberacaoSolicitada: true, updatedAt: now } }
            );
            if (upd.matchedCount === 0) {
              ouvUpdateWarning =
                'Solicitação registrada no Req_Prod, mas a reclamação Ouvidoria não foi encontrada para marcar liberacaoSolicitada.';
            }
          } catch (ouvErr) {
            console.error('Erro ao atualizar liberacaoSolicitada na Ouvidoria:', ouvErr);
            ouvUpdateWarning =
              ouvErr?.message ||
              'Solicitação registrada no Req_Prod, mas falhou ao marcar liberacaoSolicitada na reclamação.';
          }
        }

        if (userActivityLogger) {
          try {
            await userActivityLogger.logActivity({
              action: 'create_liberacao_pix_prod',
              detail: {
                liberacaoPixProdId: libRes.insertedId.toString(),
                tipo: tipoTrim,
                cpf: libDoc.cpf,
                colaboradorNome,
                origem: origemStr,
                ouvidoriaReclamacaoId: libDoc.ouvidoriaReclamacaoId
                  ? libDoc.ouvidoriaReclamacaoId.toString()
                  : undefined,
              },
            });
          } catch (logErr) {
            console.error('Erro ao registrar log:', logErr);
          }
        }

        return res.status(201).json({
          success: true,
          data: insertedDoc,
          ...(ouvUpdateWarning ? { warning: ouvUpdateWarning } : {}),
          ...(!octadeskSync.ok ? { octadeskSync } : {}),
        });
      }

      const protoVal = validateProtocolosCentralRequired(req.body.protocolosCentral);
      if (!protoVal.ok) {
        return res.status(400).json({
          success: false,
          message: protoVal.message,
          data: null,
        });
      }

      // Garantir que payload tenha agente dentro
      const payloadCompleto = {
        agente: colaboradorNome,
        ...(payload || {}),
      };

      const solicitacao = {
        colaboradorNome: colaboradorNome,
        cpf: String(cpf).replace(/\D/g, ''),
        tipo: tipoTrim,
        protocolosCentral: protoVal.values,
        payload: payloadCompleto,
        reply: [{ status: 'enviado', msgProdutos: null, msgN1: null, at: now }],
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(solicitacao);

      console.log(`✅ Solicitação criada: ${result.insertedId}`);

      const ticketNum = resolveOctadeskTicketFromRequisicao({
        protocolosCentral: protoVal.values,
      });
      const headerText = buildSolicitacaoHeaderComment({
        agente: colaboradorNome,
        cpf: solicitacao.cpf,
        tipo: tipoTrim,
        payload: payloadCompleto,
        mensagemTexto,
      });
      const octadeskSync = await pushOctadeskInternalComment(
        ticketNum,
        headerText,
        readAgentEmailFromRequest(req)
      );
      if (!octadeskSync.ok) {
        console.warn(
          `[Octadesk] solicitacao-criada-${result.insertedId}:`,
          octadeskSync.error,
          octadeskSync.ticketNumber || ticketNum || '(sem ticket)'
        );
      }

      // Log de atividade
      if (userActivityLogger) {
        try {
          await userActivityLogger.logActivity({
            action: 'create_solicitacao',
            detail: {
              solicitacaoId: result.insertedId.toString(),
              tipo,
              cpf: solicitacao.cpf,
              colaboradorNome: colaboradorNome,
            },
          });
        } catch (logErr) {
          console.error('Erro ao registrar log:', logErr);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          _id: result.insertedId,
          ...solicitacao,
        },
        ...(!octadeskSync.ok ? { octadeskSync } : {}),
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
      const libCollection = db.collection('liberacao_pix_prod');

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

      let result = await collection.updateOne(filter, update);
      let targetCol = collection;
      if (result.matchedCount === 0) {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const libSet = { updatedAt: now };
        const libAllowed = ['pixLiberado', 'dataLiberacao', 'observacoes'];
        for (const k of libAllowed) {
          if (Object.prototype.hasOwnProperty.call(body, k)) {
            libSet[k] = body[k];
          }
        }
        result = await libCollection.updateOne(filter, { $set: libSet });
        targetCol = libCollection;
      }

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada',
          data: null
        });
      }

      console.log(`✅ Solicitação atualizada: ${req.params.id}`);

      // Buscar solicitação atualizada
      const solicitacao = await targetCol.findOne(filter);

      if (targetCol === libCollection && solicitacao) {
        await propagarPixLiberadoSeRequisicaoFeita(client, solicitacao);
      }

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
      const libCollection = db.collection('liberacao_pix_prod');

      const { ObjectId } = require('mongodb');
      const filter = {
        _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : req.params.id
      };

      let result = await collection.deleteOne(filter);
      if (result.deletedCount === 0) {
        result = await libCollection.deleteOne(filter);
      }

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
   * Mensagens opcionais — o status do reply é o dado primário (UI e liberação PIX).
   * origem "produtos": persiste msgProdutos (texto ou null), msgN1 null | origem "n1": msgN1 (texto ou null), msgProdutos null
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
      const libCollection = db.collection('liberacao_pix_prod');
      const { ObjectId } = require('mongodb');
      const filterId = ObjectId.isValid(id) ? new ObjectId(id) : id;

      const findSolicitacaoOuLiberacao = async () => {
        let doc = await collection.findOne({ _id: filterId });
        if (doc) return { doc, col: collection };
        doc = await libCollection.findOne({ _id: filterId });
        if (doc) return { doc, col: libCollection };
        return null;
      };

      // Cancelar solicitação: novo item em reply (status Cancelado, mensagens null)
      if (body.cancelarSolicitacao === true || body.cancelarSolicitacao === 'true') {
        const found = await findSolicitacaoOuLiberacao();
        if (!found) {
          return res.status(404).json({ ok: false, error: 'Solicitação não encontrada' });
        }
        const { doc, col } = found;
        const replyArray = Array.isArray(doc.reply) ? [...doc.reply] : [];
        const cancelEntry = {
          status: 'Cancelado',
          msgProdutos: null,
          msgN1: null,
          at: new Date()
        };
        replyArray.push(cancelEntry);
        const cancelAt = cancelEntry.at;
        await col.updateOne(
          { _id: doc._id },
          { $set: { reply: replyArray, updatedAt: cancelAt } }
        );
        if (col === collection) {
          const merged = { ...doc, reply: replyArray };
          const { status: prev } = getStatusChamadoFromDoc(doc);
          if (isTerminalChamadoStatus('Cancelado') && !isTerminalChamadoStatus(prev)) {
            const ticketNum = resolveOctadeskTicketFromRequisicao(merged);
            if (ticketNum) {
              octadeskSyncFireAndForget(
                () => addInternalComment(ticketNum, buildRequisicaoEncerradaComment('Cancelado', cancelAt)),
                `solicitacao-cancel-${doc._id}`
              );
            }
          }
        }
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

      if (!status) {
        return res.status(400).json({
          ok: false,
          error: 'status é obrigatório e deve ser "enviado", "feito" ou "não feito"'
        });
      }
      const stLow = String(status).trim().toLowerCase();
      if (!['enviado', 'feito', 'não feito', 'nao feito'].includes(stLow)) {
        return res.status(400).json({
          ok: false,
          error: 'status é obrigatório e deve ser "enviado", "feito" ou "não feito"'
        });
      }

      const origemNorm = String(origem).toLowerCase();
      const statusTerminal = stLow === 'feito' || stLow === 'não feito' || stLow === 'nao feito';
      if (origemNorm === 'produtos' && statusTerminal) {
        const headerEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
        if (headerEmail !== DEV_REQUISICOES_ALLOWED_EMAIL) {
          return res.status(403).json({
            ok: false,
            error: 'Operação restrita para usuário autorizado',
          });
        }
      }

      const msgProd = String(msgProdutos || '').trim();
      const msgN = String(msgN1 || '').trim();

      const appendRes = await appendMarcacaoReplyChamadoShared(client, connectToMongo, filterId, {
        statusStr: String(status),
        origem: origemNorm,
        msgProdutos: msgProd,
        msgN1: msgN,
      });

      if (appendRes.erro === 'mongo_nao_disponivel') {
        return res.status(503).json({
          ok: false,
          error: 'MongoDB não configurado',
        });
      }

      if (appendRes.notFound) {
        return res.status(404).json({
          ok: false,
          error: 'Solicitação não encontrada'
        });
      }

      console.log(`[reply] ✅ Reply adicionado em ${appendRes.solicitacaoId}. Total: ${appendRes.replyCount}`);

      return res.json({
        ok: true,
        solicitacaoId: appendRes.solicitacaoId,
        replyCount: appendRes.replyCount
      });
    } catch (error) {
      console.error('[reply] Erro:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro ao processar reply'
      });
    }
  });

  /**
   * POST /api/escalacoes/solicitacoes/:id/propagar-pix-liberado
   * Idempotente: se status efetivo = feito, marca pixLiberado=true na reclamação ouvidoria vinculada.
   */
  router.post('/:id/propagar-pix-liberado', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ ok: false, error: 'MongoDB não configurado' });
      }

      await connectToMongo();
      const { ObjectId } = require('mongodb');
      const { id } = req.params;
      const filterId = ObjectId.isValid(id) ? new ObjectId(id) : id;

      const result = await propagarPixLiberadoPorLiberacaoId(client, filterId);

      if (result.notFound) {
        return res.status(404).json({ ok: false, error: 'Liberação PIX não encontrada' });
      }

      return res.json({
        ok: result.ok === true,
        skipped: result.skipped === true,
        statusEfetivo: result.statusEfetivo,
        matched: result.matched,
        reason: result.reason,
      });
    } catch (error) {
      console.error('[propagar-pix-liberado]', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro ao propagar pixLiberado',
      });
    }
  });

  return router;
};

module.exports = initSolicitacoesRoutes;


/**
 * VeloHub V3 - Escalações API — rotas restritas Apoio N1 (visão geral Req_Prod)
 * VERSION: v1.0.0 | DATE: 2026-03-30 | AUTHOR: VeloHub Development Team
 *
 * Novas rotas (não altera solicitacoes/erros-bugs existentes):
 * - GET /overview — lista unificada com filtros
 * - GET /agentes — colaboradorNome distintos (união das coleções)
 *
 * Credencial: qualidade_funcionarios.acessos.apoioN1 ou .apoion1 (legado), com Velohub true.
 */

const express = require('express');
const { getStatusChamadoFromDoc, normalizeReplyArrays } = require('./escalacoesReplyStatusDerive');

const router = express.Router();

function emailFromRequest(req) {
  const q = req.query?.email;
  const h = req.headers['x-user-email'];
  const raw = (q && String(q).trim()) || (h && String(h).trim()) || '';
  return raw.toLowerCase().trim();
}

async function findFuncionarioByEmail(funcionariosCollection, email) {
  const normalizedEmail = email.toLowerCase().trim();
  let funcionario = await funcionariosCollection.findOne({ userMail: normalizedEmail });
  if (!funcionario) {
    funcionario = await funcionariosCollection.findOne({
      $or: [
        { userMail: email },
        { userMail: normalizedEmail },
        {
          userMail: {
            $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          },
        },
      ],
    });
  }
  if (!funcionario) {
    funcionario = await funcionariosCollection.findOne({
      $or: [
        { email: normalizedEmail },
        { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    });
  }
  return funcionario;
}

async function assertApoioN1Access(client, connectToMongo, email) {
  if (!email) {
    return { ok: false, status: 400, message: 'Email obrigatório' };
  }
  await connectToMongo();
  const db = client.db('console_analises');
  const funcionariosCollection = db.collection('qualidade_funcionarios');
  const funcionario = await findFuncionarioByEmail(funcionariosCollection, email);
  if (!funcionario) {
    return { ok: false, status: 403, message: 'Acesso negado' };
  }
  const acessos = funcionario.acessos || {};
  const acessoVelohub =
    acessos.Velohub === true ||
    acessos.velohub === true ||
    acessos.VeloHub === true ||
    acessos.VELOHUB === true;
  const apoioN1 = acessos.apoioN1 === true || acessos.apoion1 === true;
  if (!acessoVelohub || !apoioN1) {
    return { ok: false, status: 403, message: 'Acesso negado' };
  }
  return { ok: true };
}

function buildDateRangeFilter(dataInicio, dataFim) {
  const range = {};
  if (dataInicio && String(dataInicio).trim()) {
    const d = new Date(`${String(dataInicio).trim()}T00:00:00.000Z`);
    if (Number.isFinite(d.getTime())) range.$gte = d;
  }
  if (dataFim && String(dataFim).trim()) {
    const d = new Date(`${String(dataFim).trim()}T23:59:59.999Z`);
    if (Number.isFinite(d.getTime())) range.$lte = d;
  }
  if (Object.keys(range).length === 0) return null;
  return { createdAt: range };
}

function colaboradorFilter(colaboradorNome) {
  if (!colaboradorNome || !String(colaboradorNome).trim()) return {};
  return {
    colaboradorNome: { $regex: String(colaboradorNome).trim(), $options: 'i' },
  };
}

function matchesStatusFilter(statusChamado, doc) {
  if (!statusChamado || !String(statusChamado).trim()) return true;
  const want = String(statusChamado).trim().toLowerCase();
  const got = getStatusChamadoFromDoc(doc).toLowerCase();
  if (want === 'nao feito' || want === 'não feito') {
    return got === 'não feito' || got === 'nao feito';
  }
  if (want === 'cancelado') return got === 'cancelado';
  return got === want;
}

/**
 * @param {import('mongodb').MongoClient} client
 * @param {Function} connectToMongo
 */
const initApoioN1Routes = (client, connectToMongo) => {
  router.get('/overview', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: [] });
      }

      const email = emailFromRequest(req);
      const gate = await assertApoioN1Access(client, connectToMongo, email);
      if (!gate.ok) {
        return res.status(gate.status).json({ success: false, message: gate.message, data: [] });
      }

      const {
        origem = 'todos',
        dataInicio,
        dataFim,
        colaboradorNome,
        statusChamado,
      } = req.query;

      const datePart = buildDateRangeFilter(dataInicio, dataFim);
      const agentPart = colaboradorFilter(colaboradorNome);
      const mongoFilter = { ...agentPart, ...(datePart || {}) };

      await connectToMongo();
      const db = client.db('hub_escalacoes');

      let solicitacoes = [];
      let errosBugs = [];

      const loadSol = origem === 'todos' || origem === 'solicitacoes';
      const loadErr = origem === 'todos' || origem === 'erros-bugs';

      if (loadSol) {
        solicitacoes = await db
          .collection('solicitacoes_tecnicas')
          .find(mongoFilter)
          .sort({ createdAt: -1 })
          .toArray();
      }
      if (loadErr) {
        errosBugs = await db
          .collection('erros_bugs')
          .find(mongoFilter)
          .sort({ createdAt: -1 })
          .toArray();
      }

      const rows = [];
      for (const doc of solicitacoes) {
        const d = normalizeReplyArrays(doc);
        if (!matchesStatusFilter(statusChamado, d)) continue;
        rows.push({ ...d, origem: 'solicitacoes', statusChamado: getStatusChamadoFromDoc(d) });
      }
      for (const doc of errosBugs) {
        const d = normalizeReplyArrays(doc);
        if (!matchesStatusFilter(statusChamado, d)) continue;
        rows.push({ ...d, origem: 'erros-bugs', statusChamado: getStatusChamadoFromDoc(d) });
      }

      rows.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('❌ [apoio-n1/overview]', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar visão geral',
        error: error.message,
        data: [],
      });
    }
  });

  router.get('/agentes', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: [] });
      }

      const email = emailFromRequest(req);
      const gate = await assertApoioN1Access(client, connectToMongo, email);
      if (!gate.ok) {
        return res.status(gate.status).json({ success: false, message: gate.message, data: [] });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const [sNomes, eNomes] = await Promise.all([
        db.collection('solicitacoes_tecnicas').distinct('colaboradorNome'),
        db.collection('erros_bugs').distinct('colaboradorNome'),
      ]);

      const set = new Set();
      for (const n of [...sNomes, ...eNomes]) {
        if (n != null && String(n).trim() !== '') set.add(String(n).trim());
      }
      const sorted = [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));

      res.json({ success: true, data: sorted });
    } catch (error) {
      console.error('❌ [apoio-n1/agentes]', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar agentes',
        error: error.message,
        data: [],
      });
    }
  });

  return router;
};

module.exports = initApoioN1Routes;

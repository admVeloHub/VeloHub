/**
 * VeloHub V3 - Ouvidoria API Routes - Colaboradores
 * VERSION: v1.5.0 | DATE: 2026-06-02 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.5.0:
 * - Histórico responsavel: só nomes exatos de colaboradorNome no cadastro; exclui Sistema/Desativado etc.
 *
 * Mudanças v1.4.0:
 * - Batch gerenciamento_atuacoes (1 query) — evita timeout ~14s do N+1
 * - Credenciados e responsáveis distintos em paralelo
 *
 * Mudanças v1.3.0:
 * - Cadastro só via acessos.Velohub + atuacao/modulosVelohub (sem qualidade_funcionarios.acessos.Ouvidoria)
 *
 * Mudanças v1.2.0:
 * - Lista colaboradores com módulo Reclamações (reclamacoesN1/N2 via resolvePermissoesVelohub)
 * - União com responsáveis distintos já gravados nas coleções hub_ouvidoria (filtro Lista)
 */

const express = require('express');
const router = express.Router();
const {
  getFuncionariosDb,
  getCadastroCollection,
} = require('../../../config/funcionariosDb');
const { FUNCIONARIOS_COLLECTIONS } = require('../../../config/funcionariosCollections');
const { permissoesVelohubFromAtuacao } = require('../../../utils/resolvePermissoesVelohub');
const { reclamacoesModuloPermitido } = require('../../../utils/modulosVelohub');
const { permissoesVelohubBypassTotal, emailTemBypassVelohub } = require('../../../utils/contaBypassVelohub');

/** Mesmas coleções de reclamacoes.js — responsáveis distintos para filtro Colaborador */
const OUVIDORIA_RECLAMACOES_COLLECTIONS = [
  'reclamacoes_timePortabilidade',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_bacen',
  'reclamacoes_procon',
  'reclamacoes_judicial',
];

/** Valores legados em hub_ouvidoria.responsavel que não são pessoas (imports, placeholders). */
const RESPONSAVEL_PLACEHOLDER_KEYS = new Set([
  'sistema',
  'desativado',
  'desativada',
  'n/a',
  'na',
  'null',
  'none',
  'admin',
  'administrador',
  'automático',
  'automatico',
  'sistema velohub',
  'velohub',
  '-',
  '--',
  '—',
]);

function normalizarNomeColaboradorChave(nome) {
  return String(nome || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * @param {string} nome
 * @returns {boolean}
 */
function isNomeColaboradorPlaceholder(nome) {
  const key = normalizarNomeColaboradorChave(nome);
  if (!key || key.length < 2) return true;
  return RESPONSAVEL_PLACEHOLDER_KEYS.has(key);
}

/**
 * Índice de colaboradorNome exatos (cadastro Velohub ativo) para validar histórico responsavel.
 * @param {import('mongodb').MongoClient} client
 */
async function carregarNomesColaboradorCadastro(client) {
  const cadastro = getCadastroCollection(client);
  const docs = await cadastro
    .find({
      desligado: { $ne: true },
      $or: [
        { 'acessos.Velohub': true },
        { 'acessos.velohub': true },
        { 'acessos.VeloHub': true },
        { 'acessos.VELOHUB': true },
      ],
    })
    .project({ colaboradorNome: 1 })
    .toArray();

  const set = new Set();
  docs.forEach((doc) => {
    const nome = String(doc.colaboradorNome || '').trim();
    if (!nome || isNomeColaboradorPlaceholder(nome)) return;
    set.add(normalizarNomeColaboradorChave(nome));
  });
  return set;
}

/**
 * @param {Map<string, { nome: string, email: string }>} map
 * @param {{ nome?: string, email?: string }} entry
 */
function mergeColaborador(map, entry) {
  const nome = String(entry?.nome || '').trim();
  if (!nome || isNomeColaboradorPlaceholder(nome)) return;
  const key = normalizarNomeColaboradorChave(nome);
  const email = String(entry?.email || '').trim().toLowerCase();
  if (!map.has(key)) {
    map.set(key, { nome, email });
    return;
  }
  const existing = map.get(key);
  if (!existing.email && email) {
    existing.email = email;
  }
}

/**
 * Colaboradores credenciados em Reclamações (atuacao → modulosVelohub).
 * @param {import('mongodb').MongoClient} client
 * @param {Array<object>} allAtuacoesDocs
 */
async function listarColaboradoresCredenciados(client, allAtuacoesDocs) {
  const cadastro = getCadastroCollection(client);
  const map = new Map();

  const funcionarios = await cadastro
    .find({
      desligado: { $ne: true },
      $or: [
        { 'acessos.Velohub': true },
        { 'acessos.velohub': true },
        { 'acessos.VeloHub': true },
        { 'acessos.VELOHUB': true },
      ],
    })
    .project({ colaboradorNome: 1, userMail: 1, atuacao: 1 })
    .toArray();

  for (const func of funcionarios) {
    const permissoesVelohub = emailTemBypassVelohub(func.userMail)
      ? permissoesVelohubBypassTotal()
      : permissoesVelohubFromAtuacao(func.atuacao, allAtuacoesDocs);
    if (!reclamacoesModuloPermitido(permissoesVelohub)) continue;
    mergeColaborador(map, {
      nome: func.colaboradorNome || func.userMail,
      email: func.userMail,
    });
  }

  return map;
}

/**
 * Nomes distintos em responsavel nas coleções de reclamações — apenas se bater com cadastro.
 * @param {import('mongodb').MongoClient} client
 * @param {Set<string>} nomesCadastroExatos
 */
async function listarResponsaveisDistintosReclamacoes(client, nomesCadastroExatos) {
  const db = client.db('hub_ouvidoria');
  const map = new Map();

  await Promise.all(
    OUVIDORIA_RECLAMACOES_COLLECTIONS.map(async (colName) => {
      try {
        const nomes = await db.collection(colName).distinct('responsavel', {
          responsavel: { $exists: true, $nin: [null, ''] },
        });
        nomes.forEach((raw) => {
          const nome = String(raw || '').trim();
          if (!nome || isNomeColaboradorPlaceholder(nome)) return;
          const key = normalizarNomeColaboradorChave(nome);
          if (!nomesCadastroExatos.has(key)) return;
          mergeColaborador(map, { nome, email: '' });
        });
      } catch (err) {
        console.warn(`⚠️ [colaboradores] distinct responsavel em ${colName}:`, err.message);
      }
    })
  );

  return map;
}

/**
 * Inicializar rotas de colaboradores
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 */
const initColaboradoresRoutes = (client, connectToMongo) => {
  /**
   * GET /api/ouvidoria/colaboradores
   * Colaboradores credenciados em Reclamações + responsáveis distintos nas reclamações
   */
  router.get('/', async (req, res) => {
    const startedAt = Date.now();
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: [],
        });
      }

      await connectToMongo();
      const funcionariosDb = getFuncionariosDb(client);
      const allAtuacoesDocs = await funcionariosDb
        .collection(FUNCIONARIOS_COLLECTIONS.ATUACOES)
        .find({})
        .project({ funcao: 1, modulosVelohub: 1 })
        .toArray();

      const nomesCadastroExatos = await carregarNomesColaboradorCadastro(client);

      const [credenciados, responsaveis] = await Promise.all([
        listarColaboradoresCredenciados(client, allAtuacoesDocs),
        listarResponsaveisDistintosReclamacoes(client, nomesCadastroExatos),
      ]);

      const qtdCredenciados = credenciados.size;

      responsaveis.forEach((entry, key) => {
        if (!credenciados.has(key)) {
          credenciados.set(key, entry);
        }
      });

      const colaboradores = Array.from(credenciados.values()).sort((a, b) =>
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
      );

      console.log(
        `✅ Colaboradores ouvidoria (filtro Lista): ${colaboradores.length} total (${qtdCredenciados} credenciados Reclamações, ${colaboradores.length - qtdCredenciados} só histórico responsavel) em ${Date.now() - startedAt}ms`
      );

      res.json({
        success: true,
        data: colaboradores,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar colaboradores:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar colaboradores',
        error: error.message,
        data: [],
      });
    }
  });

  return router;
};

module.exports = initColaboradoresRoutes;

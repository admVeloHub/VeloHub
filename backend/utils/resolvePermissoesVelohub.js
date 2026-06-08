// VERSION: v1.5.1 | DATE: 2026-06-02 | AUTHOR: VeloHub Development Team
// v1.5.1: funcoesDocsParaAtuacao + permissoesVelohubFromAtuacao (batch, sem N+1)
// v1.5.0: Permissões só via atuacao → gerenciamento_atuacoes.modulosVelohub (sem fallback acessos legado)
// v1.4.0: atuacao [{ funcao }] ou legado ObjectId/string

const { ObjectId } = require('mongodb');
const {
  agregarPermissoesVelohub,
  normalizarModulosVelohub,
} = require('./modulosVelohub');
const { emailTemBypassVelohub, permissoesVelohubBypassTotal } = require('./contaBypassVelohub');
const { FUNCIONARIOS_COLLECTIONS } = require('../config/funcionariosCollections');

function isObjectIdString(value) {
  const str = String(value || '').trim();
  return str && ObjectId.isValid(str) && String(new ObjectId(str)) === str;
}

function extrairNomesAtuacao(atuacaoRaw) {
  const funcaoNomes = [];
  const objectIds = [];

  if (typeof atuacaoRaw === 'string' && atuacaoRaw.trim()) {
    funcaoNomes.push(atuacaoRaw.trim());
  } else if (Array.isArray(atuacaoRaw)) {
    atuacaoRaw.forEach((item) => {
      if (item == null) return;
      if (typeof item === 'object' && item.funcao != null) {
        const nome = String(item.funcao).trim();
        if (nome) funcaoNomes.push(nome);
        return;
      }
      const str = String(item).trim();
      if (!str) return;
      if (isObjectIdString(str)) {
        objectIds.push(new ObjectId(str));
      } else {
        funcaoNomes.push(str);
      }
    });
  }

  return { funcaoNomes, objectIds };
}

/**
 * Filtra documentos de gerenciamento_atuacoes já carregados para uma atuação.
 * @param {unknown} atuacaoRaw
 * @param {Array<object>} allAtuacoesDocs
 */
function funcoesDocsParaAtuacao(atuacaoRaw, allAtuacoesDocs) {
  const { funcaoNomes, objectIds } = extrairNomesAtuacao(atuacaoRaw);
  if (!Array.isArray(allAtuacoesDocs) || allAtuacoesDocs.length === 0) return [];
  if (funcaoNomes.length === 0 && objectIds.length === 0) return [];

  const idSet = new Set(objectIds.map((id) => String(id)));
  const nomeSet = new Set(funcaoNomes.map((n) => String(n).trim().toLowerCase()));

  return allAtuacoesDocs.filter((doc) => {
    if (doc?._id && idSet.has(String(doc._id))) return true;
    const nome = doc?.funcao != null ? String(doc.funcao).trim().toLowerCase() : '';
    return nome && nomeSet.has(nome);
  });
}

/**
 * Permissões a partir de atuação + cache de gerenciamento_atuacoes (sem query por colaborador).
 * @param {unknown} atuacaoRaw
 * @param {Array<object>} allAtuacoesDocs
 */
function permissoesVelohubFromAtuacao(atuacaoRaw, allAtuacoesDocs) {
  return agregarPermissoesVelohub(funcoesDocsParaAtuacao(atuacaoRaw, allAtuacoesDocs));
}

/**
 * Resolve permissões VeloHub a partir do funcionário e suas funções (atuacao).
 */
async function resolvePermissoesVelohub(funcionariosDb, funcionario) {
  if (emailTemBypassVelohub(funcionario?.userMail)) {
    return {
      permissoesVelohub: permissoesVelohubBypassTotal(),
      funcoesSnapshot: [{ funcao: 'Bypass conta desenvolvedor', bypassConta: true }],
      atuacaoIds: [],
    };
  }

  const { funcaoNomes, objectIds } = extrairNomesAtuacao(funcionario?.atuacao);

  const or = [];
  if (objectIds.length > 0) or.push({ _id: { $in: objectIds } });
  if (funcaoNomes.length > 0) or.push({ funcao: { $in: funcaoNomes } });

  let funcoesDocs = [];
  if (or.length > 0) {
    funcoesDocs = await funcionariosDb
      .collection(FUNCIONARIOS_COLLECTIONS.ATUACOES)
      .find(or.length === 1 ? or[0] : { $or: or })
      .toArray();
  }

  const atuacaoIds = funcoesDocs.map((doc) => String(doc._id));

  const permissoesVelohub = agregarPermissoesVelohub(funcoesDocs);

  const funcoesSnapshot = funcoesDocs.map((doc) => ({
    funcaoId: doc._id,
    funcao: doc.funcao || '',
    modulosVelohub: normalizarModulosVelohub(doc.modulosVelohub),
  }));

  return {
    permissoesVelohub,
    funcoesSnapshot,
    atuacaoIds: [...new Set(atuacaoIds)],
  };
}

module.exports = {
  resolvePermissoesVelohub,
  extrairNomesAtuacao,
  funcoesDocsParaAtuacao,
  permissoesVelohubFromAtuacao,
};

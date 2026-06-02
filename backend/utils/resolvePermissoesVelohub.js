// VERSION: v1.4.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
// v1.4.0: atuacao [{ funcao }] ou legado ObjectId/string

const { ObjectId } = require('mongodb');
const {
  agregarPermissoesVelohub,
  aplicarFallbackAcessosLegado,
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

  let permissoesVelohub = agregarPermissoesVelohub(funcoesDocs);
  permissoesVelohub = aplicarFallbackAcessosLegado(
    permissoesVelohub,
    funcionario?.acessos || {}
  );

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

module.exports = { resolvePermissoesVelohub };

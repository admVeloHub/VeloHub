// VERSION: v1.3.0 | DATE: 2026-06-02 | AUTHOR: VeloHub Development Team
// CHANGELOG: v1.3.0 - Removido aplicarFallbackAcessosLegado (sem qualidade_funcionarios.acessos)
// CHANGELOG: v1.2.0 - Reclamações N1/N2; retrocompat reclamacoes → N2; check-module reclamacoes
// CHANGELOG: v1.1.0 - Chave velobot (visibilidade exclusiva VeloBot; retrocompat atendimento)

const MODULOS_VELOHUB_KEYS = [
  'corporativo',
  'atendimento',
  'velobot',
  'liberacaoPix',
  'acompanhamento',
  'reclamacoesN1',
  'reclamacoesN2',
  'sociais',
];

const MODULOS_VELOHUB_PADRAO = () =>
  Object.fromEntries(MODULOS_VELOHUB_KEYS.map((k) => [k, false]));

function temChaveExplicita(obj, key) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function reclamacoesAcessoTodasAbas(perm) {
  if (!perm || typeof perm !== 'object') return false;
  if (perm.reclamacoesN2 === true) return true;
  const hasN1 = temChaveExplicita(perm, 'reclamacoesN1');
  const hasN2 = temChaveExplicita(perm, 'reclamacoesN2');
  if (perm.reclamacoes === true && !hasN1 && !hasN2) return true;
  return false;
}

function reclamacoesModuloPermitido(perm) {
  if (!perm || typeof perm !== 'object') return false;
  if (reclamacoesAcessoTodasAbas(perm)) return true;
  return perm.reclamacoesN1 === true;
}

function aplicarRetrocompatVelobotNoItem(item, merged) {
  if (!item || typeof item !== 'object') return;
  const hasVelobotKey =
    Object.prototype.hasOwnProperty.call(item, 'velobot') ||
    Object.prototype.hasOwnProperty.call(item, 'VeloBot');
  if (!hasVelobotKey && item.atendimento === true) {
    merged.velobot = true;
  }
}

function aplicarRetrocompatReclamacoesNoItem(item, merged) {
  if (!item || typeof item !== 'object') return;
  const hasN1 = Object.prototype.hasOwnProperty.call(item, 'reclamacoesN1');
  const hasN2 = Object.prototype.hasOwnProperty.call(item, 'reclamacoesN2');
  if (!hasN1 && !hasN2 && item.reclamacoes === true) {
    merged.reclamacoesN2 = true;
  }
}

function normalizarModulosVelohub(input) {
  if (input == null) {
    return [MODULOS_VELOHUB_PADRAO()];
  }
  const items = Array.isArray(input) ? input : [input];
  const merged = MODULOS_VELOHUB_PADRAO();
  let hasAny = false;
  items.forEach((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    hasAny = true;
    MODULOS_VELOHUB_KEYS.forEach((k) => {
      if (item[k] === true) merged[k] = true;
    });
    aplicarRetrocompatVelobotNoItem(item, merged);
    aplicarRetrocompatReclamacoesNoItem(item, merged);
  });
  return [hasAny ? merged : MODULOS_VELOHUB_PADRAO()];
}

function agregarPermissoesVelohub(funcoesDocs) {
  const out = MODULOS_VELOHUB_PADRAO();
  if (!Array.isArray(funcoesDocs)) return out;
  funcoesDocs.forEach((doc) => {
    const flat = normalizarModulosVelohub(doc?.modulosVelohub)[0] || MODULOS_VELOHUB_PADRAO();
    MODULOS_VELOHUB_KEYS.forEach((k) => {
      if (flat[k] === true) out[k] = true;
    });
  });
  return out;
}

/**
 * @param {Record<string, boolean>|null} permissoes
 * @param {string} chave
 */
function permissaoModuloAtiva(permissoes, chave) {
  if (!permissoes || typeof permissoes !== 'object') return false;
  if (chave === 'velobot') {
    if (permissoes.velobot === true) return true;
    if (permissoes.velobot === false) return false;
    return permissoes.atendimento === true;
  }
  if (chave === 'reclamacoes') {
    return reclamacoesModuloPermitido(permissoes);
  }
  return permissoes[chave] === true;
}

/** Mapeia parâmetro legado de check-module-access para chave nova */
function resolverChaveModulo(module) {
  if (!module || typeof module !== 'string') return null;
  const m = module.trim().toLowerCase();
  const map = {
    ouvidoria: 'reclamacoes',
    reclamacoes: 'reclamacoes',
    sociais: 'sociais',
    chavepix: 'liberacaoPix',
    liberacaopix: 'liberacaoPix',
    apoion1: 'acompanhamento',
    acompanhamento: 'acompanhamento',
    corporativo: 'corporativo',
    atendimento: 'atendimento',
    velobot: 'velobot',
    processos: 'velobot',
  };
  return map[m] || null;
}

module.exports = {
  MODULOS_VELOHUB_KEYS,
  MODULOS_VELOHUB_PADRAO,
  normalizarModulosVelohub,
  agregarPermissoesVelohub,
  permissaoModuloAtiva,
  reclamacoesModuloPermitido,
  resolverChaveModulo,
};

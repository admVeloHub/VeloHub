// VERSION: v1.0.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team

const MODULOS_VELOHUB_KEYS = [
  'corporativo',
  'atendimento',
  'liberacaoPix',
  'acompanhamento',
  'reclamacoes',
  'sociais',
];

const MODULOS_VELOHUB_PADRAO = () =>
  Object.fromEntries(MODULOS_VELOHUB_KEYS.map((k) => [k, false]));

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

function aplicarFallbackAcessosLegado(permissoes, acessosLegado) {
  if (!acessosLegado || typeof acessosLegado !== 'object') return permissoes;
  const temAlgum = MODULOS_VELOHUB_KEYS.some((k) => permissoes[k] === true);
  if (temAlgum) return permissoes;
  const out = { ...permissoes };
  if (acessosLegado.Ouvidoria === true || acessosLegado.ouvidoria === true) {
    out.reclamacoes = true;
  }
  if (acessosLegado.Sociais === true || acessosLegado.sociais === true) {
    out.sociais = true;
  }
  if (acessosLegado.apoioN1 === true || acessosLegado.apoion1 === true) {
    out.acompanhamento = true;
  }
  if (acessosLegado.ChavePix === true || acessosLegado.chavepix === true) {
    out.liberacaoPix = true;
  }
  return out;
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
  };
  return map[m] || null;
}

module.exports = {
  MODULOS_VELOHUB_KEYS,
  MODULOS_VELOHUB_PADRAO,
  normalizarModulosVelohub,
  agregarPermissoesVelohub,
  aplicarFallbackAcessosLegado,
  resolverChaveModulo,
};

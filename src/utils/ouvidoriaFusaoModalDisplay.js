/**
 * VeloHub — Exibição do modal «Fundir ocorrências»
 * VERSION: v1.4.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * - v1.4.0: Regra fusão `liberacaoAnterior` quando grupo tem `pixLiberado`
 * - v1.3.0: Linhas selecionáveis (`docId`); `cenarioFusaoEntreTipos` para fusão por par
 * - v1.2.0: Lista de fusão ignora tickets já absorvidos (inferior / redundante filho)
 * - v1.1.0: Status — só fundido no banco na ocorrência atual; projeção nas demais por tier/cenário
 */

import { formatDateRegistro } from './dateUtils';
import { isFusaoAbsorvoAlvo } from './ouvidoriaFusaoNotif';
import { compareTier, tierIndexFromTipo } from './ouvidoriaTierHierarchy';

/**
 * Cenário de fusão entre tipo do registro atual e tipo do alvo selecionado.
 * @param {string} currentTipo
 * @param {string} targetTipo
 * @returns {'current_inferior'|'current_superior'|'redundante'}
 */
export function cenarioFusaoEntreTipos(currentTipo, targetTipo) {
  const cmp = compareTier(currentTipo, targetTipo);
  if (cmp < 0) return 'current_inferior';
  if (cmp > 0) return 'current_superior';
  return 'redundante';
}

/**
 * @param {object} ctx — fusaoConsultaCtx
 * @param {Set<string>|Array<string>} selectedIds
 * @returns {Array<{ doc: Record<string, unknown>, targetId: string, targetTipo: string, cenario: string }>}
 */
/** @param {unknown} tipo */
export function tipoSuportaLiberacaoAnterior(tipo) {
  const t = String(tipo || '').toUpperCase().trim();
  return t !== 'TIME_PORTABILIDADE' && t !== 'TIME PORTABILIDADE';
}

/**
 * @param {object} ctx
 * @param {Set<string>|Array<string>} selectedIds
 * @returns {Array<Record<string, unknown>>}
 */
export function getSelectedFusaoDocs(ctx, selectedIds) {
  const idSet =
    selectedIds instanceof Set
      ? selectedIds
      : new Set(Array.isArray(selectedIds) ? selectedIds.map(String) : []);
  const all = Array.isArray(ctx?.allDocs) ? ctx.allDocs : [];
  const currentId = ctx?.currentId != null ? String(ctx.currentId) : '';
  return all.filter(
    (d) => d?._id != null && idSet.has(String(d._id)) && String(d._id) !== currentId
  );
}

/**
 * @param {{ currentPixLiberado?: boolean, docs?: Array<Record<string, unknown>> }} params
 */
export function grupoFusaoTemPixLiberado({ currentPixLiberado, docs }) {
  if (currentPixLiberado === true) return true;
  return (docs || []).some((d) => d?.pixLiberado === true);
}

/**
 * @param {{ currentTipo?: string, currentPixLiberado?: boolean, selectedDocs?: Array<Record<string, unknown>> }} params
 */
export function deveMarcarLiberacaoAnteriorNoAtual({
  currentTipo,
  currentPixLiberado,
  selectedDocs,
}) {
  if (!tipoSuportaLiberacaoAnterior(currentTipo)) return false;
  if (currentPixLiberado === true) return false;
  return grupoFusaoTemPixLiberado({ currentPixLiberado, docs: selectedDocs });
}

/**
 * @param {{ selectedDocs?: Array<Record<string, unknown>>, currentPixLiberado?: boolean }} params
 * @returns {Array<Record<string, unknown>>}
 */
export function docsAlvoParaLiberacaoAnterior({ selectedDocs, currentPixLiberado }) {
  if (!grupoFusaoTemPixLiberado({ currentPixLiberado, docs: selectedDocs })) {
    return [];
  }
  return (selectedDocs || []).filter(
    (d) =>
      d?.pixLiberado !== true && tipoSuportaLiberacaoAnterior(d?.tipo)
  );
}

export function buildFusaoAlvosFromSelection(ctx, selectedIds) {
  const idSet =
    selectedIds instanceof Set
      ? selectedIds
      : new Set(Array.isArray(selectedIds) ? selectedIds.map(String) : []);
  const all = Array.isArray(ctx?.allDocs) ? ctx.allDocs : [];
  const currentId = ctx?.currentId != null ? String(ctx.currentId) : '';
  const currentTipo = ctx?.currentTipo || ctx?.currentSnapshot?.tipo || '';
  const docs = all.filter(
    (d) => d?._id != null && idSet.has(String(d._id)) && String(d._id) !== currentId
  );
  return docs.map((doc) => ({
    doc,
    targetId: String(doc._id),
    targetTipo: String(doc.tipo || ''),
    cenario: cenarioFusaoEntreTipos(currentTipo, doc.tipo),
  }));
}

/** @param {unknown} tipo */
export function ouvidoriaTipoExibicaoFusao(tipo) {
  if (tipo == null || tipo === '') return '—';
  const tipoUpper = String(tipo).toUpperCase().trim();

  if (
    tipoUpper === 'PROCESSOS' ||
    tipoUpper === 'JUDICIAL' ||
    tipoUpper === 'AÇÃO JUDICIAL' ||
    tipoUpper === 'ACAO JUDICIAL'
  ) {
    return 'Ação Judicial';
  }
  if (
    tipoUpper === 'N2' ||
    tipoUpper === 'N2 & PIX' ||
    tipoUpper === 'N2&PIX' ||
    tipoUpper === 'N2 PIX' ||
    tipoUpper === 'OUVIDORIA'
  ) {
    return 'N2 Pix';
  }
  if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAMEAQUI' || tipoUpper === 'RECLAME AQUI') {
    return 'Reclame Aqui';
  }
  if (tipoUpper === 'PROCON') return 'Procon';
  if (tipoUpper === 'BACEN') return 'BACEN';
  if (
    tipoUpper === 'TIME_PORTABILIDADE' ||
    tipoUpper === 'TIME PORTABILIDADE' ||
    String(tipo).trim() === 'Time Portabilidade'
  ) {
    return 'Time Portabilidade';
  }
  return String(tipo).trim();
}

/** @param {Record<string, unknown>|null|undefined} doc */
export function getDataExibicaoOuvidoriaDoc(doc) {
  const tipoUpper = String(doc?.tipo || '').toUpperCase().trim();
  if (tipoUpper === 'N2' || tipoUpper === 'N2 PIX' || tipoUpper === 'OUVIDORIA') return doc?.dataEntradaN2;
  if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') {
    return doc?.dataReclam;
  }
  if (tipoUpper === 'PROCON') return doc?.dataProcon;
  if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL') return doc?.dataEntradaProcesso ?? doc?.dataEntrada;
  if (tipoUpper === 'TIME_PORTABILIDADE' || tipoUpper === 'TIME PORTABILIDADE') return doc?.dataEntrada;
  return doc?.dataEntrada || doc?.createdAt;
}

/** @param {unknown} motivoReduzido */
export function formatMotivoExibicaoFusao(motivoReduzido) {
  if (!motivoReduzido) return '—';
  if (Array.isArray(motivoReduzido)) {
    const s = motivoReduzido.filter(Boolean).join(', ');
    return s || '—';
  }
  const s = String(motivoReduzido).trim();
  return s || '—';
}

/** @param {Record<string, unknown>|null|undefined} doc */
export function formatProtocoloExibicaoFusao(doc) {
  const num = doc?.numeroProtocolo;
  if (num != null && String(num).trim()) return String(num).trim();
  return '—';
}

/**
 * Tickets já fundidos como inferiores (ou redundante filho) não entram na lista do modal nem no cenário de fusão.
 * @param {Array<Record<string, unknown>>} docs
 * @returns {Array<Record<string, unknown>>}
 */
export function filterReclamacoesElegiveisFusaoLista(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.filter((d) => !isFusaoAbsorvoAlvo(d));
}

/** @param {Record<string, unknown>|null|undefined} doc */
export function isOcorrenciaFechadaFusao(doc) {
  if (!doc || typeof doc !== 'object') return false;
  if (doc.Finalizado?.Resolvido === true) return true;
  return isFusaoAbsorvoAlvo(doc);
}

/**
 * Situação hierárquica (inferior / superior) para coluna Status.
 * @param {Record<string, unknown>|null|undefined} doc
 * @param {object} [opts]
 */
export function fusaoHierarquiaStatusLabel(doc, opts = {}) {
  const fu = doc?.Fusao;
  if (fu && typeof fu === 'object' && fu.fundido === true) {
    const h = String(fu.hierarquia || '').toLowerCase().trim();
    if (h === 'superior') return 'Superior';
    if (h === 'inferior') return 'Inferior';
    if (h === 'redundante') {
      return fu.parentId != null && fu.parentId !== '' ? 'Inferior' : 'Superior';
    }
  }

  const cen = opts.cenario != null ? String(opts.cenario).trim().toLowerCase() : '';

  if (opts.isCurrentRow) {
    if (cen === 'redundante') {
      const papel = opts.redundantePapel != null ? String(opts.redundantePapel).trim() : '';
      if (papel === 'current_child') return 'Inferior';
      if (papel === 'current_parent') return 'Superior';
    }
    return '—';
  }

  if (opts.forDocRelativeToCurrent && cen && opts.currentTierIdx >= 0) {
    const docIdx = tierIndexFromTipo(doc?.tipo);
    if (docIdx < 0) return '—';
    const curIdx = opts.currentTierIdx;

    if (cen === 'current_superior') {
      if (docIdx < curIdx) return 'Inferior';
      if (docIdx > curIdx) return 'Superior';
    } else if (cen === 'current_inferior') {
      if (docIdx > curIdx) return 'Superior';
      if (docIdx < curIdx) return 'Inferior';
    } else if (cen === 'redundante' && docIdx === curIdx && opts.isRedundanteTarget) {
      const papel = opts.redundantePapel != null ? String(opts.redundantePapel).trim() : '';
      if (papel === 'current_child') return 'Superior';
      if (papel === 'current_parent') return 'Inferior';
    }
  }

  return '—';
}

/** @param {Record<string, unknown>} formData */
function getDataExibicaoFromForm(formData) {
  const t = formData?.tipo;
  if (t === 'OUVIDORIA') return formData.dataEntradaN2;
  if (t === 'RECLAME_AQUI') return formData.dataReclam;
  if (t === 'PROCON') return formData.dataProcon;
  if (t === 'PROCESSOS') return formData.dataEntradaProcesso;
  return formData.dataEntrada;
}

/**
 * Snapshot da ocorrência em edição/criação para o modal de fusão.
 * @param {Record<string, unknown>} formData
 * @param {{ protocoloPrevia?: string, numeroProtocolo?: string, Fusao?: object }} [extras]
 */
export function buildFusaoCurrentSnapshot(formData, extras = {}) {
  const protocoloRaw =
    extras.numeroProtocolo != null && String(extras.numeroProtocolo).trim()
      ? String(extras.numeroProtocolo).trim()
      : extras.protocoloPrevia != null && String(extras.protocoloPrevia).trim()
        ? String(extras.protocoloPrevia).trim()
        : '';
  const dataRaw = getDataExibicaoFromForm(formData);
  return {
    tipo: formData.tipo,
    tipoLabel: ouvidoriaTipoExibicaoFusao(formData.tipo),
    protocolo: protocoloRaw || '—',
    motivo: formatMotivoExibicaoFusao(formData.motivoReduzido),
    data: dataRaw ? formatDateRegistro(dataRaw) : '—',
    Fusao: extras.Fusao ?? formData.Fusao,
    pixLiberado: formData.pixLiberado === true,
  };
}

/**
 * @param {Record<string, unknown>} doc
 * @param {object} [opts]
 */
export function docToFusaoModalRow(doc, opts = {}) {
  const id = doc?._id != null ? String(doc._id) : '';
  return {
    key: id || `row-${doc?.tipo}-${doc?.numeroProtocolo}`,
    docId: id || null,
    tipoLabel: ouvidoriaTipoExibicaoFusao(doc.tipo),
    protocolo: formatProtocoloExibicaoFusao(doc),
    motivo: formatMotivoExibicaoFusao(doc.motivoReduzido),
    data: formatDateRegistro(getDataExibicaoOuvidoriaDoc(doc)),
    status: fusaoHierarquiaStatusLabel(doc, opts),
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} snapshot
 * @param {{ projectedCenario?: string, redundantePapel?: string }} [opts]
 */
export function snapshotToFusaoModalRow(snapshot, opts = {}) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  return {
    key: 'current-snapshot',
    tipoLabel: snapshot.tipoLabel || ouvidoriaTipoExibicaoFusao(snapshot.tipo),
    protocolo: snapshot.protocolo || '—',
    motivo: snapshot.motivo || '—',
    data: snapshot.data || '—',
    status: fusaoHierarquiaStatusLabel(
      { Fusao: snapshot.Fusao, tipo: snapshot.tipo },
      {
        isCurrentRow: true,
        cenario: opts.cenario,
        redundantePapel: opts.redundantePapel,
      }
    ),
  };
}

/** @param {string} cpf */
export function formatCpfFusaoModal(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11) return cpf || '—';
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * @param {object} ctx — fusaoConsultaCtx
 * @param {{ redundantePapel?: string }} [opts]
 */
export function partitionFusaoModalDocs(ctx, opts = {}) {
  const all = Array.isArray(ctx?.allDocs) ? ctx.allDocs : [];
  const currentId = ctx?.currentId != null ? String(ctx.currentId) : '';
  const cenario = ctx?.cenario != null ? String(ctx.cenario).trim().toLowerCase() : '';
  const currentTierIdx = tierIndexFromTipo(ctx?.currentTipo || ctx?.currentSnapshot?.tipo);
  const targetId =
    ctx?.targetDoc?._id != null ? String(ctx.targetDoc._id) : '';

  const outros = filterReclamacoesElegiveisFusaoLista(
    currentId ? all.filter((d) => d?._id != null && String(d._id) !== currentId) : [...all]
  );

  const sortByTierDesc = (a, b) => tierIndexFromTipo(b.tipo) - tierIndexFromTipo(a.tipo);

  const statusOptsOutro = (doc) => ({
    forDocRelativeToCurrent: true,
    cenario,
    currentTierIdx,
    redundantePapel: opts.redundantePapel,
    isRedundanteTarget:
      cenario === 'redundante' &&
      targetId &&
      doc?._id != null &&
      String(doc._id) === targetId,
  });

  const docsAbertas = outros.filter((d) => !isOcorrenciaFechadaFusao(d)).sort(sortByTierDesc);
  const docsFechadas = outros.filter((d) => isOcorrenciaFechadaFusao(d)).sort(sortByTierDesc);

  const abertas = docsAbertas.map((d) => docToFusaoModalRow(d, statusOptsOutro(d)));
  const fechadas = docsFechadas.map((d) => docToFusaoModalRow(d, statusOptsOutro(d)));

  let currentRow = null;
  if (ctx?.currentSnapshot) {
    currentRow = snapshotToFusaoModalRow(ctx.currentSnapshot, {
      cenario,
      redundantePapel: opts.redundantePapel,
    });
  } else if (currentId) {
    const curDoc = all.find((d) => d?._id != null && String(d._id) === currentId);
    if (curDoc) {
      currentRow = docToFusaoModalRow(curDoc, {
        isCurrentRow: true,
        cenario,
        redundantePapel: opts.redundantePapel,
      });
    }
  }

  return { currentRow, abertas, fechadas };
}

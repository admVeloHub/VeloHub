/**
 * VeloHub V3 — Sync pixLiberado (hub_ouvidoria) quando liberação PIX está «feito»
 * VERSION: v1.2.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * v1.2.0: hidratarPixLiberadoReclamacaoParaFusao — Req_Prod «feito» / pix na lib antes da fusão
 * v1.1.0: syncPixLiberadoParaReclamacaoDoc + reconciliarPixLiberadoOuvidoriaBatch (job 15 min)
 */

const { ObjectId } = require('mongodb');
const { getHubOuvidoriaReclamacaoCollectionByTipo } = require('./hubOuvidoriaReclamacaoCollectionByTipo');
const { getStatusChamadoFromDoc } = require('./escalacoesReplyStatus');

const OUVIDORIA_COLLECTION_NAMES = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_procon',
  'reclamacoes_judicial',
  'reclamacoes_timePortabilidade',
];

/**
 * @param {unknown} tipo
 * @returns {string}
 */
function normalizarTipoOuvidoriaApi(tipo) {
  const t = String(tipo || '').toUpperCase().trim();
  if (t === 'N2 PIX' || t === 'N2' || t === 'OUVIDORIA') return 'OUVIDORIA';
  if (t === 'RECLAME AQUI' || t === 'RECLAMEAQUI') return 'RECLAME_AQUI';
  if (t === 'AÇÃO JUDICIAL' || t === 'ACAO JUDICIAL' || t === 'JUDICIAL') return 'PROCESSOS';
  if (t === 'TIME PORTABILIDADE') return 'TIME_PORTABILIDADE';
  return t;
}

/**
 * Marca pixLiberado=true na reclamação hub_ouvidoria vinculada à liberação PIX.
 * @param {import('mongodb').MongoClient|null} mongoClient
 * @param {Record<string, unknown>|null|undefined} liberacaoPixDoc
 * @param {{ tipoFallback?: string }} [opts]
 * @returns {Promise<{ ok: boolean, matched?: number, reason?: string }>}
 */
async function sincronizarPixLiberadoNaOuvidoria(mongoClient, liberacaoPixDoc, opts = {}) {
  if (!mongoClient || !liberacaoPixDoc || typeof liberacaoPixDoc !== 'object') {
    return { ok: false, reason: 'invalid_input' };
  }

  const rawId = liberacaoPixDoc.ouvidoriaReclamacaoId;
  const tipoRaw = liberacaoPixDoc.ouvidoriaReclamacaoTipo || opts.tipoFallback;
  const tipo = normalizarTipoOuvidoriaApi(tipoRaw);
  const npTrim =
    liberacaoPixDoc.ouvidoriaNumeroProtocolo != null
      ? String(liberacaoPixDoc.ouvidoriaNumeroProtocolo).trim()
      : '';

  const ouvDb = mongoClient.db('hub_ouvidoria');
  const now = new Date();
  const setPayload = { $set: { pixLiberado: true, updatedAt: now } };

  /** @type {import('mongodb').Collection|null} */
  let ouvColl = null;
  /** @type {import('mongodb').ObjectId|null} */
  let oid = null;

  if (rawId != null && rawId !== '' && String(tipo || '').trim()) {
    if (rawId instanceof ObjectId) {
      oid = rawId;
    } else {
      const s = String(rawId).trim();
      if (ObjectId.isValid(s)) oid = new ObjectId(s);
    }
    if (oid) {
      try {
        ouvColl = getHubOuvidoriaReclamacaoCollectionByTipo(ouvDb, tipo);
      } catch {
        ouvColl = null;
      }
    }
  }

  if (ouvColl && oid) {
    let matched = 0;
    let upd = await ouvColl.updateOne({ _id: oid }, setPayload);
    matched = upd.matchedCount || 0;
    if (matched === 0 && npTrim) {
      upd = await ouvColl.updateOne({ numeroProtocolo: npTrim }, setPayload);
      matched = upd.matchedCount || 0;
    }
    if (matched > 0) return { ok: true, matched };
  }

  if (npTrim) {
    for (const colName of OUVIDORIA_COLLECTION_NAMES) {
      const col = ouvDb.collection(colName);
      const upd = await col.updateOne({ numeroProtocolo: npTrim }, setPayload);
      if (upd.matchedCount > 0) {
        return { ok: true, matched: upd.matchedCount };
      }
    }
  }

  if (oid && !ouvColl) {
    console.warn('[liberacao_pix → ouvidoria] pixLiberado sync: tipo inválido', {
      ouvidoriaReclamacaoId: String(oid),
      ouvidoriaReclamacaoTipo: String(tipoRaw || ''),
    });
  } else if (!oid && !npTrim) {
    console.warn('[liberacao_pix → ouvidoria] pixLiberado sync: sem vínculo ouvidoria', {
      liberacaoId: liberacaoPixDoc._id != null ? String(liberacaoPixDoc._id) : undefined,
    });
  } else {
    console.warn('[liberacao_pix → ouvidoria] pixLiberado sync: reclamação não encontrada', {
      ouvidoriaReclamacaoId: oid ? String(oid) : undefined,
      numeroProtocolo: npTrim || undefined,
      ouvidoriaReclamacaoTipo: String(tipoRaw || ''),
    });
  }

  return { ok: false, matched: 0, reason: 'not_found' };
}

/**
 * Se status efetivo = feito, propaga pixLiberado para reclamação vinculada.
 * @param {import('mongodb').MongoClient|null} mongoClient
 * @param {Record<string, unknown>|null|undefined} liberacaoPixDoc
 * @param {{ tipoFallback?: string }} [opts]
 */
async function propagarPixLiberadoSeRequisicaoFeita(mongoClient, liberacaoPixDoc, opts = {}) {
  if (!liberacaoPixDoc || typeof liberacaoPixDoc !== 'object') {
    return { ok: false, skipped: true, reason: 'no_doc' };
  }
  const { status } = getStatusChamadoFromDoc(liberacaoPixDoc);
  if (String(status || '').toLowerCase() !== 'feito') {
    return { ok: false, skipped: true, reason: 'not_feito', statusEfetivo: status };
  }
  const res = await sincronizarPixLiberadoNaOuvidoria(mongoClient, liberacaoPixDoc, opts);
  return { ...res, skipped: false, statusEfetivo: status };
}

/**
 * Carrega liberacao_pix_prod por _id e propaga se feito.
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {import('mongodb').ObjectId|string} liberacaoId
 */
async function propagarPixLiberadoPorLiberacaoId(mongoClient, liberacaoId) {
  if (!mongoClient || liberacaoId == null) {
    return { ok: false, reason: 'invalid_input' };
  }
  let oid = liberacaoId;
  if (!(oid instanceof ObjectId)) {
    const s = String(liberacaoId).trim();
    if (!ObjectId.isValid(s)) return { ok: false, reason: 'invalid_id' };
    oid = new ObjectId(s);
  }
  const db = mongoClient.db('hub_escalacoes');
  const doc = await db.collection('liberacao_pix_prod').findOne({ _id: oid });
  if (!doc) return { ok: false, notFound: true };
  return propagarPixLiberadoSeRequisicaoFeita(mongoClient, doc);
}

/**
 * Repair: reclamação ouvidoria com liberação «feito» → pixLiberado=true (mutates reclamacao in memory).
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {Record<string, unknown>} reclamacao
 */
async function syncPixLiberadoParaReclamacaoDoc(mongoClient, reclamacao) {
  if (!mongoClient || !reclamacao || typeof reclamacao !== 'object') {
    return { ok: false, skipped: true, reason: 'invalid_input' };
  }
  if (reclamacao.pixLiberado === true) {
    return { ok: true, skipped: true, reason: 'already_true' };
  }

  const escDb = mongoClient.db('hub_escalacoes');
  const libColl = escDb.collection('liberacao_pix_prod');
  const rid = reclamacao._id;

  /** @type {Record<string, unknown>|null} */
  let lib = null;
  if (rid != null) {
    let ridOid = rid;
    if (!(ridOid instanceof ObjectId)) {
      const s = String(rid).trim();
      ridOid = ObjectId.isValid(s) ? new ObjectId(s) : null;
    }
    if (ridOid) {
      lib = await libColl.findOne(
        { ouvidoriaReclamacaoId: ridOid },
        { sort: { createdAt: -1 } }
      );
    }
  }
  const npReclam =
    reclamacao.numeroProtocolo != null ? String(reclamacao.numeroProtocolo).trim() : '';
  if (!lib && npReclam) {
    lib = await libColl.findOne({ ouvidoriaNumeroProtocolo: npReclam }, { sort: { createdAt: -1 } });
  }
  if (!lib) {
    return { ok: false, skipped: true, reason: 'no_liberacao' };
  }

  const { status } = getStatusChamadoFromDoc(lib);
  if (String(status || '').toLowerCase() !== 'feito') {
    return { ok: false, skipped: true, reason: 'lib_not_feito', statusEfetivo: status };
  }

  const syncDoc = {
    ...lib,
    ouvidoriaReclamacaoId: rid,
    ouvidoriaReclamacaoTipo:
      lib.ouvidoriaReclamacaoTipo || normalizarTipoOuvidoriaApi(reclamacao.tipo),
    ouvidoriaNumeroProtocolo: lib.ouvidoriaNumeroProtocolo || npReclam || undefined,
  };

  const syncRes = await propagarPixLiberadoSeRequisicaoFeita(mongoClient, syncDoc, {
    tipoFallback: reclamacao.tipo,
  });
  if (syncRes.ok) reclamacao.pixLiberado = true;
  return syncRes;
}

/**
 * PIX liberado para regras de fusão (campo da reclamação ou snapshot Req_Prod).
 * @param {Record<string, unknown>|null|undefined} doc
 */
function reclamacaoIndicaPixLiberadoEfetivo(doc) {
  if (!doc || typeof doc !== 'object') return false;
  if (doc.pixLiberado === true) return true;
  if (String(doc.reqProdStatusEfetivo || '').toLowerCase() === 'feito') return true;
  const lib = doc.reqProdLiberacaoPix;
  if (lib && typeof lib === 'object') {
    if (lib.pixLiberado === true) return true;
    const { status } = getStatusChamadoFromDoc(lib);
    if (String(status || '').toLowerCase() === 'feito') return true;
  }
  return false;
}

/**
 * Hidrata pixLiberado em memória (e persiste quando possível) antes da fusão.
 * @param {import('mongodb').MongoClient|null} mongoClient
 * @param {Record<string, unknown>} doc
 * @param {string} [tipoFallback]
 */
async function hidratarPixLiberadoReclamacaoParaFusao(mongoClient, doc, tipoFallback) {
  if (!doc || typeof doc !== 'object') return false;

  if (reclamacaoIndicaPixLiberadoEfetivo(doc)) {
    if (doc.pixLiberado !== true && mongoClient) {
      try {
        await syncPixLiberadoParaReclamacaoDoc(mongoClient, doc);
      } catch {
        /* best effort */
      }
    }
    if (doc.pixLiberado !== true) doc.pixLiberado = true;
    return true;
  }

  if (!mongoClient) return doc.pixLiberado === true;

  try {
    await syncPixLiberadoParaReclamacaoDoc(mongoClient, doc);
  } catch {
    /* ignore */
  }
  if (doc.pixLiberado === true) return true;

  const escDb = mongoClient.db('hub_escalacoes');
  const libColl = escDb.collection('liberacao_pix_prod');
  const rid = doc._id;
  /** @type {Record<string, unknown>|null} */
  let lib = null;

  if (rid != null) {
    let ridOid = rid;
    if (!(ridOid instanceof ObjectId)) {
      const s = String(rid).trim();
      ridOid = ObjectId.isValid(s) ? new ObjectId(s) : null;
    }
    if (ridOid) {
      lib = await libColl.findOne({ ouvidoriaReclamacaoId: ridOid }, { sort: { createdAt: -1 } });
    }
  }
  const np = doc.numeroProtocolo != null ? String(doc.numeroProtocolo).trim() : '';
  if (!lib && np) {
    lib = await libColl.findOne({ ouvidoriaNumeroProtocolo: np }, { sort: { createdAt: -1 } });
  }
  if (!lib) return false;
  if (lib.pixLiberado === true) {
    doc.pixLiberado = true;
    return true;
  }
  const { status } = getStatusChamadoFromDoc(lib);
  if (String(status || '').toLowerCase() === 'feito') {
    doc.pixLiberado = true;
    try {
      const syncDoc = {
        ...lib,
        ouvidoriaReclamacaoId: rid,
        ouvidoriaReclamacaoTipo:
          lib.ouvidoriaReclamacaoTipo || normalizarTipoOuvidoriaApi(tipoFallback || doc.tipo),
        ouvidoriaNumeroProtocolo: lib.ouvidoriaNumeroProtocolo || np || undefined,
      };
      await propagarPixLiberadoSeRequisicaoFeita(mongoClient, syncDoc, {
        tipoFallback: tipoFallback || doc.tipo,
      });
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

/**
 * Job agendado: reconcilia liberações «feito» recentes com ouvidoria (idempotente).
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {{ windowHours?: number, limit?: number }} [opts]
 */
async function reconciliarPixLiberadoOuvidoriaBatch(mongoClient, opts = {}) {
  const windowHours = Math.max(1, Number(opts.windowHours) || 48);
  const limit = Math.min(200, Math.max(1, Number(opts.limit) || 100));
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  if (!mongoClient) {
    return { ok: false, reason: 'no_client', scanned: 0, propagated: 0, skipped: 0, failed: 0 };
  }

  const col = mongoClient.db('hub_escalacoes').collection('liberacao_pix_prod');
  const cursor = col
    .find({
      updatedAt: { $gte: since },
      reply: { $elemMatch: { status: { $regex: /^feito$/i } } },
    })
    .sort({ updatedAt: -1 })
    .limit(limit * 3);

  const stats = {
    ok: true,
    windowHours,
    limit,
    scanned: 0,
    propagated: 0,
    skipped: 0,
    failed: 0,
    notFound: 0,
  };

  for await (const doc of cursor) {
    if (stats.scanned >= limit) break;
    const { status } = getStatusChamadoFromDoc(doc);
    if (String(status || '').toLowerCase() !== 'feito') continue;

    stats.scanned += 1;
    const res = await propagarPixLiberadoSeRequisicaoFeita(mongoClient, doc);
    if (res.ok) {
      stats.propagated += 1;
    } else if (res.skipped) {
      stats.skipped += 1;
    } else if (res.reason === 'not_found') {
      stats.notFound += 1;
      stats.failed += 1;
    } else {
      stats.failed += 1;
    }
  }

  if (stats.scanned > 0) {
    console.log('[reconciliar-pix-liberado]', stats);
  }

  return stats;
}

module.exports = {
  sincronizarPixLiberadoNaOuvidoria,
  propagarPixLiberadoSeRequisicaoFeita,
  propagarPixLiberadoPorLiberacaoId,
  syncPixLiberadoParaReclamacaoDoc,
  reconciliarPixLiberadoOuvidoriaBatch,
  normalizarTipoOuvidoriaApi,
  reclamacaoIndicaPixLiberadoEfetivo,
  hidratarPixLiberadoReclamacaoParaFusao,
};

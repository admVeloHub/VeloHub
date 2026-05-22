/**
 * VeloHub V3 — Número de protocolo Ouvidoria (DDMMYY em America/Sao_Paulo)
 * VERSION: v1.0.2 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.1: allocateNextNumeroProtocolo: pipeline de upsert sem $unset intermédio (compatível com drivers)
 */

const SP_TZ = 'America/Sao_Paulo';

/** @param {Date} [date] */
function spDateKeyAndDdmmyy(date = new Date()) {
  const iso = date.toLocaleString('en-CA', {
    timeZone: SP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = iso.split('-');
  const dataKey = `${y}-${m}-${d}`;
  const ddmmyy = `${d}${m}${y.slice(-2)}`;
  return { dataKey, ddmmyy, y, m, d };
}

/**
 * Abreviatura do protocolo a partir do tipo enviado na API de reclamações.
 * @param {string} tipo
 * @returns {string} TP | NP | RA | BC | PC | AJ | ''
 */
function abbrFromTipoApi(tipo) {
  const t = String(tipo || '')
    .toUpperCase()
    .trim();
  if (t === 'BACEN') return 'BC';
  if (
    t === 'OUVIDORIA' ||
    t === 'N2' ||
    t === 'N2 PIX' ||
    t === 'N2 & PIX' ||
    t === 'N2&PIX'
  )
    return 'NP';
  if (t === 'RECLAME_AQUI' || t === 'RECLAME AQUI' || t === 'RECLAMEAQUI') return 'RA';
  if (t === 'PROCON') return 'PC';
  if (
    t === 'PROCESSOS' ||
    t === 'JUDICIAL' ||
    t === 'AÇÃO JUDICIAL' ||
    t === 'ACAO JUDICIAL'
  )
    return 'AJ';
  if (t === 'TIME_PORTABILIDADE' || t === 'TIME PORTABILIDADE') return 'TP';
  return '';
}

function buildPrefix(abbr, ddmmyy) {
  return `${abbr}${ddmmyy}/`;
}

const PROTO_REGEX = /^(TP|NP|RA|BC|PC|AJ)(\d{6})\/(\d{3})$/;

/**
 * @param {import('mongodb').Collection} collection
 * @param {string} abbr
 * @param {string} ddmmyy
 */
async function getMaxSeqInCollection(collection, abbr, ddmmyy) {
  const prefix = `${abbr}${ddmmyy}/`;
  const docs = await collection
    .find({ numeroProtocolo: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } })
    .project({ numeroProtocolo: 1 })
    .toArray();
  let max = 0;
  for (const doc of docs) {
    const m = String(doc.numeroProtocolo || '').match(PROTO_REGEX);
    if (!m) continue;
    const n = parseInt(m[3], 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return max;
}

/**
 * Próximo sugerido (read-only): max(documentos, contador) + 1
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').Collection} collection
 * @param {string} tipoApi
 */
async function getSuggestedNumeroProtocolo(db, collection, tipoApi) {
  const abbr = abbrFromTipoApi(tipoApi);
  if (!abbr) {
    return { success: false, message: 'Tipo inválido para protocolo' };
  }
  const { dataKey, ddmmyy } = spDateKeyAndDdmmyy();
  const maxFromDocs = await getMaxSeqInCollection(collection, abbr, ddmmyy);
  const seqColl = db.collection('protocolo_sequencia_diaria');
  const ctr = await seqColl.findOne({ dataKey, abbr });
  const ctrSeq = ctr && typeof ctr.seq === 'number' ? ctr.seq : 0;
  const next = Math.max(maxFromDocs, ctrSeq) + 1;
  const numeroProtocolo = `${abbr}${ddmmyy}/${String(next).padStart(3, '0')}`;
  return { success: true, numeroProtocolo, dataKey, abbr };
}

/**
 * Atribuição atómica (contador + piso max em documentos).
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').Collection} collection
 * @param {string} tipoApi
 */
async function allocateNextNumeroProtocolo(db, collection, tipoApi) {
  const abbr = abbrFromTipoApi(tipoApi);
  if (!abbr) {
    throw new Error('Tipo inválido para protocolo');
  }
  const { dataKey, ddmmyy } = spDateKeyAndDdmmyy();
  const maxFromDocs = await getMaxSeqInCollection(collection, abbr, ddmmyy);
  const maxInt = Number.isFinite(maxFromDocs) ? maxFromDocs : 0;
  const now = new Date();
  const seqColl = db.collection('protocolo_sequencia_diaria');

  const r = await seqColl.findOneAndUpdate(
    { dataKey, abbr },
    [
      {
        $set: {
          seq: {
            $add: [{ $max: [{ $ifNull: ['$seq', 0] }, maxInt] }, 1],
          },
          updatedAt: now,
          dataKey,
          abbr,
        },
      },
    ],
    { upsert: true, returnDocument: 'after' }
  );

  const seq = r.value && typeof r.value.seq === 'number' ? r.value.seq : maxInt + 1;
  return `${abbr}${ddmmyy}/${String(seq).padStart(3, '0')}`;
}

module.exports = {
  SP_TZ,
  spDateKeyAndDdmmyy,
  abbrFromTipoApi,
  buildPrefix,
  getMaxSeqInCollection,
  getSuggestedNumeroProtocolo,
  allocateNextNumeroProtocolo,
  PROTO_REGEX,
};

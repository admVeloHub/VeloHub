/**
 * Retroação (one-off): remover espelhos legados Finalizado.Fundido / dataFundido,
 * normalizar Finalizado.em absorvidos (Resolvido false quando aplicável),
 * preencher Fusao.parentProtocolo, childProtocolo e childProtocolos onde faltar.
 *
 * USO:
 *   node backend/scripts/backfill-finalizado-protocolos-fusao-legado.js --dry-run
 *   node backend/scripts/backfill-finalizado-protocolos-fusao-legado.js
 *
 * Requer MONGO_ENV ou MONGODB_URI (loadMongoUri.js).
 *
 * VERSION: v1.1.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 */
'use strict';

const { MongoClient, ObjectId } = require('mongodb');
const { MONGODB_URI } = require('./loadMongoUri');

const DATABASE_NAME = 'hub_ouvidoria';

const RECLAMACOES_COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_procon',
  'reclamacoes_judicial',
  'reclamacoes_timePortabilidade',
];

function argDryRun() {
  return process.argv.includes('--dry-run') || process.argv.includes('-n');
}

/** @param {unknown} oid */
function toOid(oid) {
  if (oid instanceof ObjectId) return oid;
  const s = String(oid || '');
  if (!ObjectId.isValid(s)) return null;
  return new ObjectId(s);
}

/** @param {Record<string, unknown>|null|undefined} doc */
function numeroProto(doc) {
  if (!doc || typeof doc !== 'object') return '';
  const n = doc.numeroProtocolo;
  return String(n != null ? n : '').trim();
}

(async () => {
  const dry = argDryRun();
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  /** @type {Map<string, { doc: Record<string, unknown>, coll: string }|null>} */
  const cache = new Map();

  /**
   * @param {unknown} oidRaw
   * @returns {{ doc: Record<string, unknown>, coll: string }|null}
   */
  async function findAcross(oidRaw) {
    const id = toOid(oidRaw);
    if (!id) return null;
    const key = String(id);
    if (cache.has(key)) return /** @type {any} */ (cache.get(key));

    for (const collName of RECLAMACOES_COLLECTIONS) {
      const doc = await db.collection(collName).findOne({ _id: id });
      if (doc) {
        const hit = { doc, coll: collName };
        cache.set(key, hit);
        return hit;
      }
    }
    cache.set(key, null);
    return null;
  }

  let scanned = 0;
  let docsUpdated = 0;
  /** @type {string[]} */
  const samplesConflict = [];

  for (const collName of RECLAMACOES_COLLECTIONS) {
    const col = db.collection(collName);

    /* eslint-disable no-await-in-loop */
    for await (const doc of col.find({ 'Fusao.fundido': true })) {
      scanned += 1;
      const fu = doc.Fusao && typeof doc.Fusao === 'object' ? doc.Fusao : {};
      const hLower = String(fu.hierarquia || '')
        .toLowerCase()
        .trim();

      const oidParent = toOid(fu.parentId);
      const oidChild = toOid(fu.childId);

      /** @type {Record<string, unknown>} */
      const $set = {};

      /** @type {Record<string, ''>} */
      const $unset = {};

      if (doc.Finalizado?.Fundido != null) $unset['Finalizado.Fundido'] = '';
      if (doc.Finalizado?.dataFundido != null) $unset['Finalizado.dataFundido'] = '';

      /** Papel absorvido: inferior ou redundante com pai */
      const papelAbs =
        fu.fundido === true &&
        (hLower === 'inferior' || (hLower === 'redundante' && oidParent != null));

      /** Receptor/pai: superior ou redundante só com filho */
      const papelRec =
        fu.fundido === true &&
        (hLower === 'superior' || (hLower === 'redundante' && oidChild != null && oidParent == null));

      /** --- ramo absorvido --- */
      if (papelAbs) {
        const resolvido = doc.Finalizado && doc.Finalizado.Resolvido === true;
        if (resolvido) {
          if (samplesConflict.length < 24) {
            samplesConflict.push(
              `${collName} ${doc._id}: Finalizado.Resolvido=true com Fusao absorvido — apenas remove espelhos em Finalizado`
            );
          }
        } else {
          const prevFin =
            doc.Finalizado && typeof doc.Finalizado === 'object' ? { ...doc.Finalizado } : {};
          delete prevFin.Fundido;
          delete prevFin.dataFundido;
          prevFin.Resolvido = false;
          $set.Finalizado = prevFin;
        }

        const parentHit = oidParent ? await findAcross(fu.parentId) : null;
        const pp = numeroProto(parentHit?.doc || null);
        if (pp && !String(fu.parentProtocolo || '').trim()) {
          $set['Fusao.parentProtocolo'] = pp;
        }
      }

      /** --- ramo receptor --- */
      let childProtoToAdd = '';
      if (papelRec) {
        const childHit = oidChild ? await findAcross(fu.childId) : null;
        childProtoToAdd = numeroProto(childHit?.doc || null);

        if (childProtoToAdd) {
          if (!String(fu.childProtocolo || '').trim()) {
            $set['Fusao.childProtocolo'] = childProtoToAdd;
          }
        }

        if (doc.Finalizado && typeof doc.Finalizado === 'object') {
          const finCopy = { ...doc.Finalizado };
          delete finCopy.Fundido;
          delete finCopy.dataFundido;
          if (Object.keys(finCopy).length > 0) {
            $set.Finalizado = finCopy;
          }
        }
      }

      /** @type {Record<string, unknown>} */
      const update = {};

      if (Object.keys($unset).length) {
        update.$unset = $unset;
      }

      const keysSet = Object.keys($set);

      if (papelRec && childProtoToAdd) {
        /** @type {string[]} */
        const exist = [];
        if (Array.isArray(fu.childProtocolos)) {
          for (const x of fu.childProtocolos) {
            const s = String(x || '').trim();
            if (s) exist.push(s);
          }
        }
        if (!exist.includes(childProtoToAdd)) {
          update.$addToSet = { 'Fusao.childProtocolos': childProtoToAdd };
        }
      }

      if (keysSet.length) {
        update.$set = $set;
      }

      if (!Object.keys(update).length) {
        continue;
      }

      docsUpdated += 1;
      if (!dry) {
        await col.updateOne({ _id: doc._id }, update);
      }
    }
    /* eslint-enable no-await-in-loop */
  }

  console.log('[backfill-fusao-legado]', dry ? 'DRY-RUN (nenhum write)' : 'APLICADO');
  console.log(`  Documentos lidos (Fusao.fundido): ${scanned}`);
  console.log(`  Documentos com update proposto: ${docsUpdated}`);
  if (samplesConflict.length) {
    console.log(`\nAlertas (${samplesConflict.length} amostra(s)):\n${samplesConflict.join('\n')}`);
  }

  await client.close();
})();

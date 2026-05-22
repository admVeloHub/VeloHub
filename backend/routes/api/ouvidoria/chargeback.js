/**
 * VeloHub V3 — API Ouvidoria — Chargeback
 * VERSION: v1.3.0 | DATE: 2026-05-12 | AUTHOR: VeloHub Development Team
 *
 * Persistência: MongoDB `hub_ouvidoria`, coleção `reclamacoes_chargeback`.
 * Protocolo CBK{AAAA}/{XXX}: ano civil atual (getFullYear), sequência 001+ por ano (geração server-side).
 * GET `/proximo-protocolo-sugerido` — prévia read-only do próximo número (não consome sequência na gravação).
 */

const express = require('express');
const { ObjectId } = require('mongodb');

const OVIDORIA_DB_NAME = 'hub_ouvidoria';
const CHARGEBACK_COLLECTION = 'reclamacoes_chargeback';

const router = express.Router();

function omitUndefined(obj) {
  const o = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) o[k] = obj[k];
  });
  return o;
}

function parseValor(bodyValor) {
  if (bodyValor == null || bodyValor === '') return undefined;
  if (typeof bodyValor === 'number' && Number.isFinite(bodyValor)) return bodyValor;
  const s = String(bodyValor).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeAnexos(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      if (x && typeof x === 'object' && typeof x.url === 'string' && x.url.trim()) return { url: x.url.trim() };
      if (typeof x === 'string' && x.trim()) return { url: x.trim() };
      return null;
    })
    .filter(Boolean);
}

function normalizeTelefones(t) {
  if (!t || typeof t !== 'object') return { lista: [] };
  const lista = Array.isArray(t.lista)
    ? t.lista.map((x) => String(x || '').trim()).filter(Boolean)
    : [];
  return { lista };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {{ modoSalvar?: 'em-andamento'|'resolvido' }} opts
 */
function buildChargebackFields(raw, opts = {}) {
  const { modoSalvar } = opts;
  const cpfDigits = raw.cpf != null ? String(raw.cpf).replace(/\D/g, '') : '';

  /** @type {Record<string, unknown>} */
  const payload = omitUndefined({
    nome: raw.nome != null ? String(raw.nome).trim() : '',
    ...(cpfDigits ? { cpf: cpfDigits } : {}),
    telefones: normalizeTelefones(raw.telefones),
    email: raw.email != null ? String(raw.email).toLowerCase().trim().replace(/\s+/g, '') : '',
    localizarAtendimentos:
      raw.localizarAtendimentos != null ? String(raw.localizarAtendimentos) : '',
    produto: raw.produto != null ? String(raw.produto).trim() : '',
    dataEntrada: raw.dataEntrada ? new Date(raw.dataEntrada) : undefined,
    valor: parseValor(raw.valor),
    descricao: raw.descricao != null ? String(raw.descricao) : '',
    protocolosCentral: Array.isArray(raw.protocolosCentral)
      ? raw.protocolosCentral.map((p) => String(p || '').trim()).filter(Boolean)
      : [],
    revertido: raw.revertido === true || raw.revertido === 'true',
    anexos: normalizeAnexos(raw.anexos),
    responsavel: raw.responsavel != null ? String(raw.responsavel).trim() : '',
  });

  if (modoSalvar === 'resolvido') {
    const dr = raw.Finalizado?.dataResolucao ? new Date(raw.Finalizado.dataResolucao) : new Date();
    payload.Finalizado = { Resolvido: true, dataResolucao: dr };
  } else if (modoSalvar === 'em-andamento') {
    payload.Finalizado = undefined;
  } else if (raw.Finalizado && typeof raw.Finalizado === 'object' && raw.Finalizado.Resolvido === true) {
    payload.Finalizado = {
      Resolvido: true,
      dataResolucao: raw.Finalizado.dataResolucao
        ? new Date(raw.Finalizado.dataResolucao)
        : new Date(),
    };
  }

  return omitUndefined(payload);
}

/**
 * PUT parcial: parte do estado atual + sobrescritas só das chaves enviadas em `body`.
 * @param {Record<string, unknown>} existing
 * @param {Record<string, unknown>} body
 * @param {'em-andamento'|'resolvido'|undefined} modoSalvar
 */
function patchChargebackFieldsFromBody(existing, body, modoSalvar) {
  const raw = { ...existing };
  delete raw._id;
  const keys = [
    'nome',
    'email',
    'cpf',
    'telefones',
    'localizarAtendimentos',
    'produto',
    'dataEntrada',
    'valor',
    'descricao',
    'protocolosCentral',
    'revertido',
    'anexos',
    'responsavel',
    'Finalizado',
  ];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(body, k)) raw[k] = body[k];
  }
  return buildChargebackFields(raw, modoSalvar ? { modoSalvar } : {});
}

async function gerarProximoNumeroProtocolo(coll, year) {
  const re = new RegExp(`^CBK${year}/(\\d{3})$`);
  const docs = await coll
    .find({ numeroProtocolo: { $regex: `^CBK${year}/\\d{3}$` } })
    .project({ numeroProtocolo: 1 })
    .toArray();
  let max = 0;
  for (const d of docs) {
    const m = String(d.numeroProtocolo || '').match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `CBK${year}/${String(max + 1).padStart(3, '0')}`;
}

/**
 * @param {import('mongodb').Collection} coll
 * @param {Record<string, unknown>} fields — sem _id; numeroProtocolo opcional no objeto
 */
async function insertChargebackDoc(coll, fields) {
  const now = new Date();
  const year = now.getFullYear();

  const incomingProto =
    fields.numeroProtocolo != null ? String(fields.numeroProtocolo).trim() : '';

  const baseFields = { ...fields };
  delete baseFields.numeroProtocolo;

  const base = omitUndefined({
    ...baseFields,
    createdAt: now,
    updatedAt: now,
  });

  if (incomingProto) {
    const merged = omitUndefined({
      ...base,
      numeroProtocolo: incomingProto,
    });
    const result = await coll.insertOne(merged);
    return { insertedId: result.insertedId, doc: { ...merged, _id: result.insertedId } };
  }

  for (let i = 0; i < 14; i += 1) {
    const numeroProtocolo = await gerarProximoNumeroProtocolo(coll, year);
    const doc = omitUndefined({
      ...base,
      numeroProtocolo,
    });
    try {
      const result = await coll.insertOne(doc);
      return { insertedId: result.insertedId, doc: { ...doc, _id: result.insertedId } };
    } catch (e) {
      if (e && e.code === 11000) continue;
      throw e;
    }
  }
  throw new Error('Não foi possível gerar numeroProtocolo único');
}

/**
 * @param {import('mongodb').MongoClient} client
 * @param {() => Promise<void>} connectToMongo
 */
function initChargebackRoutes(client, connectToMongo) {
  router.get('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: [],
        });
      }

      await connectToMongo();
      const db = client.db(OVIDORIA_DB_NAME);
      const coll = db.collection(CHARGEBACK_COLLECTION);

      const limitRaw = parseInt(String(req.query.limit || '200'), 10);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

      const cpfQ = String(req.query.cpf || '').replace(/\D/g, '');
      const filter = cpfQ ? { cpf: cpfQ } : {};

      const items = await coll
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return res.json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      console.error('❌ [ouvidoria/chargeback] GET /:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar chargeback',
        error: error.message,
        data: [],
      });
    }
  });

  /** Próximo número CBK do ano corrente (mesma heurística do POST; só leitura). */
  router.get('/proximo-protocolo-sugerido', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: null,
        });
      }

      await connectToMongo();
      const coll = client.db(OVIDORIA_DB_NAME).collection(CHARGEBACK_COLLECTION);
      const year = new Date().getFullYear();
      const numeroProtocolo = await gerarProximoNumeroProtocolo(coll, year);

      return res.json({
        success: true,
        data: { numeroProtocolo },
      });
    } catch (error) {
      console.error('❌ [ouvidoria/chargeback] GET /proximo-protocolo-sugerido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao sugerir protocolo',
        error: error.message,
        data: null,
      });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: null });
      }
      let oid;
      try {
        oid = new ObjectId(req.params.id);
      } catch {
        return res.status(400).json({ success: false, message: 'Id inválido', data: null });
      }
      await connectToMongo();
      const coll = client.db(OVIDORIA_DB_NAME).collection(CHARGEBACK_COLLECTION);
      const doc = await coll.findOne({ _id: oid });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Registro não encontrado', data: null });
      }
      return res.json({ success: true, data: doc });
    } catch (error) {
      console.error('❌ [ouvidoria/chargeback] GET /:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar chargeback',
        error: error.message,
        data: null,
      });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }
      let oid;
      try {
        oid = new ObjectId(req.params.id);
      } catch {
        return res.status(400).json({ success: false, message: 'Id inválido' });
      }

      await connectToMongo();
      const coll = client.db(OVIDORIA_DB_NAME).collection(CHARGEBACK_COLLECTION);

      const existing = await coll.findOne({ _id: oid });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Registro não encontrado' });
      }

      const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
      delete body._id;

      const modoSalvar =
        body._saveMode === 'resolvido'
          ? 'resolvido'
          : body._saveMode === 'em-andamento'
            ? 'em-andamento'
            : undefined;
      delete body._saveMode;

      const fields = patchChargebackFieldsFromBody(existing, body, modoSalvar);
      delete fields.numeroProtocolo;

      const now = new Date();
      const updateDoc = omitUndefined({
        ...fields,
        updatedAt: now,
      });

      const unset = {};
      if (modoSalvar === 'em-andamento') {
        unset.Finalizado = '';
      }

      /** @type {import('mongodb').UpdateFilter<Record<string, unknown>>} */
      const update = { $set: updateDoc };
      if (Object.keys(unset).length) update.$unset = unset;

      await coll.updateOne({ _id: oid }, update);

      const doc = await coll.findOne({ _id: oid });
      return res.json({ success: true, data: doc });
    } catch (error) {
      console.error('❌ [ouvidoria/chargeback] PUT /:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar chargeback',
        error: error.message,
      });
    }
  });

  router.post('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }

      await connectToMongo();
      const coll = client.db(OVIDORIA_DB_NAME).collection(CHARGEBACK_COLLECTION);

      const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
      delete body._id;

      const modoSalvar =
        body._saveMode === 'resolvido'
          ? 'resolvido'
          : body._saveMode === 'em-andamento'
            ? 'em-andamento'
            : 'em-andamento';
      delete body._saveMode;

      const incomingProto = body.numeroProtocolo != null ? String(body.numeroProtocolo).trim() : '';

      const fields = buildChargebackFields(body, { modoSalvar });
      if (incomingProto) fields.numeroProtocolo = incomingProto;

      const { doc } = await insertChargebackDoc(coll, fields);

      return res.status(201).json({
        success: true,
        data: doc,
      });
    } catch (error) {
      console.error('❌ [ouvidoria/chargeback] POST /:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar registro de chargeback',
        error: error.message,
      });
    }
  });

  (async () => {
    try {
      if (!client) return;
      await connectToMongo();
      const coll = client.db(OVIDORIA_DB_NAME).collection(CHARGEBACK_COLLECTION);
      await coll.createIndexes([
        { key: { createdAt: -1 }, name: 'reclamacoes_chargeback_createdAt_desc' },
        { key: { cpf: 1, createdAt: -1 }, name: 'reclamacoes_chargeback_cpf_createdAt', sparse: true },
        {
          key: { numeroProtocolo: 1 },
          name: 'reclamacoes_chargeback_numeroProtocolo_unique',
          unique: true,
          sparse: true,
        },
      ]);
    } catch (e) {
      console.warn('⚠️ [ouvidoria/chargeback] createIndexes:', e.message);
    }
  })();

  return router;
}

module.exports = initChargebackRoutes;

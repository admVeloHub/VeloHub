/**
 * VeloHub V3 - Ouvidoria API Routes - Reclamações
 * VERSION: v2.32.1 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v2.32.1: Fusão — hidrata PIX via Req_Prod «feito»; patch liberacaoAnterior usa tipo do parâmetro
 * - v2.32.0: Fusão — sync pixLiberado (Req_Prod «feito») antes de patch liberacaoAnterior
 * - v2.31.0: enrich/sync pixLiberado em toda listagem + GET /:id; liberação por _id ou numeroProtocolo
 * - v2.30.0: Fusão — child absorvido salvo Resolvido=true; enrich Req_Prod «feito» propaga pixLiberado na reclamação
 * - v2.29.3: gerar-ticket — persiste ticketRegistro após POST; já existente retorna 200 p/ sincronizar UI
 * - v2.29.2: gerar-ticket-octadesk — api001: description no POST; sem PUT (404 na instância)
 * - v2.29.1: gerar-ticket-octadesk — PUT pós-create (comentários + Resolvido); POST só título/solicitante nesta instância
 * - v2.29.0: gerar-ticket-octadesk — payload mínimo no POST (CPF, categoria, comentário interno, Resolvido); sem PUT pós-create
 * - v2.28.0: Fusão — `liberacaoAnterior=true` no par quando um dos tickets tem `pixLiberado=true`
 * - v2.27.0: Protocolos canônicos — syncNativoParaBloco792 no POST/PUT; mirrorTicketRegistro no gerar-ticket-octadesk
 * - v2.26.1: gerar-ticket-octadesk reforça comentário interno com descrição da reclamação e tenta status Em Andamento após criação
 * - v2.26.0: POST /:id/gerar-ticket-octadesk; PUT resolvido → Octadesk; campo ticketRegistro
 * - v2.25.1: Removidos logs NDJSON de sessão debug (enrich/colab GET)
 * - v2.25.0: GET reclamações — query opcional `colaboradorEmail`; com nome + email (`Minhas`): match por responsavelEmail ou legado só responsavel nome exato; lista só nome mantém substring
 * - v2.24.1: SLA automático BACEN: prazoBacen = createdAt + 10 dias corridos UTC (N2/Ouvidoria permanece +2 dias)
 * - v2.24.0: Estado fundido apenas em Fusao — Finalizado só Resolvido/dataResolucao; filtros e PUT alinhados
 * - v2.23.0: Fusão — parentProtocolo/childProtocolo; childProtocolos; demotion enriquecida
 * - v2.20.0: Tipo TIME_PORTABILIDADE (Time Portabilidade) → coleção reclamacoes_timePortabilidade
 * - v2.19.0: GET /reclamacoes: filtro opcional query `produto` (campo existente `produto`, match exato)
 */

const express = require('express');
const path = require('path');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { normalizarCampoMotivoReduzido } = require(path.join(__dirname, '../../../utils/motivoReduzidoNormalize'));
const {
  compareTier,
  tierIndexFromCollectionName,
} = require(path.join(__dirname, '../../../utils/ouvidoriaTierHierarchy'));
const {
  getSuggestedNumeroProtocolo,
  allocateNextNumeroProtocolo,
} = require(path.join(__dirname, '../../../utils/protocoloOuvidoria'));
const { getStatusChamadoFromDoc } = require(path.join(__dirname, '../../../utils/escalacoesReplyStatus'));
const {
  syncPixLiberadoParaReclamacaoDoc,
  hidratarPixLiberadoReclamacaoParaFusao,
} = require(path.join(__dirname, '../../../utils/liberacaoPixOuvidoriaSync'));
const { resolveOctadeskTicketFromReclamacao } = require(path.join(__dirname, '../../../utils/resolveOctadeskTicketNumber'));
const {
  syncNativoParaBloco792,
  mirrorTicketRegistro,
} = require(path.join(__dirname, '../../../utils/ouvidoriaProtocolosCanon'));

/** Campos do bloco 792-800 propagados após sync nativo→protocolos */
const CAMPOS_BLOCO_PROTOCOLOS_SYNC = [
  'acionouCentral',
  'protocolosCentral',
  'n2SegundoNivel',
  'protocolosN2',
  'reclameAqui',
  'protocolosReclameAqui',
  'procon',
  'protocolosProcon',
  'protocolosBacen',
];

/**
 * Aplica sync conservador e retorna apenas campos de protocolos alterados/preenchidos.
 * @param {Record<string, unknown>} existente
 * @param {Record<string, unknown>} payload
 * @param {string} tipo
 * @returns {Record<string, unknown>}
 */
function aplicarSyncProtocolosNoPayload(existente, payload, tipo) {
  const merged = { ...(existente || {}), ...(payload || {}) };
  const synced = syncNativoParaBloco792(merged, tipo);
  const patch = {};
  for (const key of CAMPOS_BLOCO_PROTOCOLOS_SYNC) {
    if (synced[key] !== undefined) patch[key] = synced[key];
  }
  return patch;
}
const {
  buildCreateTicketFromReclamacao,
  createTicket,
  finalizeReclamacaoTicketAfterCreate,
  markTicketResolved,
  octadeskSyncFireAndForget,
  isOctadeskConfigured,
} = require(path.join(__dirname, '../../../services/octadesk/octadeskTicketsService'));
const config = require(path.join(__dirname, '../../../config'));

const HIERARQUIAS_FUSAO = new Set(['superior', 'inferior', 'redundante']);

const OUVIDORIA_COLLECTION_NAMES = [
  'reclamacoes_timePortabilidade',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_bacen',
  'reclamacoes_procon',
  'reclamacoes_judicial',
];

/** Metacaracteres em string para usar como literal dentro de `$regex` do MongoDB. */
function escaparRegexMongoLiteral(raw) {
  return String(raw).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/** @param {unknown} doc */
const numeroProtocoloDeDoc = (doc) => {
  const raw = doc && typeof doc === 'object' ? doc.numeroProtocolo : null;
  const s = raw != null ? String(raw).trim() : '';
  return s.slice(0, 120);
};

/** Critério MongoDB: ticket absorvido (Fusao é fonte única do «fundido» passivo). */
const MONGO_MATCH_FUSAO_ABSORVIDO = {
  $and: [
    { 'Fusao.fundido': true },
    {
      $or: [
        { 'Fusao.hierarquia': 'inferior' },
        {
          $and: [
            { 'Fusao.hierarquia': 'redundante' },
            { 'Fusao.parentId': { $exists: true, $ne: null } },
          ],
        },
      ],
    },
  ],
};

/** @param {unknown} doc */
const isFusaoAbsorvoAlvoDocMongo = (doc) => {
  const fu = doc?.Fusao;
  if (!fu || typeof fu !== 'object' || fu.fundido !== true) return false;
  const h = String(fu.hierarquia || '')
    .toLowerCase()
    .trim();
  if (h === 'inferior') return true;
  if (h === 'redundante' && fu.parentId != null && fu.parentId !== '') return true;
  return false;
};

/**
 * Remove chaves espelho legadas; cliente não deve enviar Finalizado.Fundido.
 * @param {unknown} fin
 * @returns {Record<string, unknown>|undefined}
 */
const sanitizarFinalizadoSemEspelhosFusao = (fin) => {
  if (fin == null || typeof fin !== 'object') return undefined;
  /** @type {Record<string, unknown>} */
  const out = { ...fin };
  delete out.Fundido;
  delete out.dataFundido;
  return Object.keys(out).length ? out : undefined;
};

/**
 * Após fusão absorvindo o atual: garante Resolvido false e sem espelhos em Finalizado.
 * @param {Record<string, unknown>|null|undefined} docExistente
 */
const mergeFinalizadoAoAbsorverEmFusao = (docExistente) => {
  const prev =
    docExistente?.Finalizado != null && typeof docExistente.Finalizado === 'object'
      ? { ...docExistente.Finalizado }
      : {};
  delete prev.Fundido;
  delete prev.dataFundido;
  prev.Resolvido = true;
  if (prev.dataResolucao == null || prev.dataResolucao === '') {
    prev.dataResolucao = new Date();
  }
  return prev;
};

/**
 * Converte string de data (YYYY-MM-DD) para Date. Retorna null se inválido.
 * (Definido cedo — usado por sanitizarFusao antes de CAMPOS_DATA.)
 */
const parsearDataParaDate = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor !== 'string') return null;
  const trimmed = String(valor).trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * @param {Record<string, unknown>|null|undefined} fusao
 * @returns {Record<string, unknown>|undefined}
 */
const sanitizarFusao = (fusao) => {
  if (fusao == null || typeof fusao !== 'object') return undefined;
  const out = {};
  if (typeof fusao.fundido === 'boolean') out.fundido = fusao.fundido;
  if (fusao.dataFundido != null) {
    const d =
      fusao.dataFundido instanceof Date
        ? fusao.dataFundido
        : parsearDataParaDate(String(fusao.dataFundido));
    if (d) out.dataFundido = d;
  }
  const h = String(fusao.hierarquia || '')
    .toLowerCase()
    .trim();
  if (HIERARQUIAS_FUSAO.has(h)) out.hierarquia = h;
  if (fusao.parentId != null && fusao.parentId !== '' && ObjectId.isValid(String(fusao.parentId))) {
    out.parentId = new ObjectId(String(fusao.parentId));
  }
  if (fusao.childId != null && fusao.childId !== '' && ObjectId.isValid(String(fusao.childId))) {
    out.childId = new ObjectId(String(fusao.childId));
  }
  const pp = numeroProtocoloDeDoc({ numeroProtocolo: fusao.parentProtocolo });
  if (pp) out.parentProtocolo = pp;
  const cp = numeroProtocoloDeDoc({ numeroProtocolo: fusao.childProtocolo });
  if (cp) out.childProtocolo = cp;
  if (Array.isArray(fusao.childProtocolos)) {
    const arr = fusao.childProtocolos
      .map((x) => numeroProtocoloDeDoc({ numeroProtocolo: x }))
      .filter(Boolean)
      .slice(0, 50);
    if (arr.length) out.childProtocolos = [...new Set(arr)];
  }
  return Object.keys(out).length ? out : undefined;
};

/**
 * @param {readonly string[]} protos
 */
const mergeDedupProtos = (...protos) => {
  const out = [];
  const seen = new Set();
  for (const chunk of protos) {
    const list = chunk || [];
    for (const p of list) {
      const s = String(p || '').trim();
      if (!s || seen.has(s)) continue;
      seen.add(s);
      out.push(s);
      if (out.length >= 50) return out;
    }
  }
  return out;
};

/**
 * Anexa snapshot Req_Prod (liberacao_pix_prod) e repara pixLiberado quando liberação está «feito».
 * @param {import('mongodb').MongoClient} client
 * @param {Array<Record<string, unknown>>} reclamacoes
 */
async function enrichReclamacoesComReqProd(client, reclamacoes) {
  if (!client || !Array.isArray(reclamacoes) || reclamacoes.length === 0) return;

  const ids = reclamacoes.map((r) => r._id).filter(Boolean);
  const protocolos = [
    ...new Set(
      reclamacoes
        .map((r) => (r.numeroProtocolo != null ? String(r.numeroProtocolo).trim() : ''))
        .filter(Boolean)
    ),
  ];

  if (!ids.length && !protocolos.length) return;

  const escDb = client.db('hub_escalacoes');
  const libColl = escDb.collection('liberacao_pix_prod');

  /** @type {Record<string, unknown>[]} */
  const orClauses = [];
  if (ids.length) orClauses.push({ ouvidoriaReclamacaoId: { $in: ids } });
  if (protocolos.length) orClauses.push({ ouvidoriaNumeroProtocolo: { $in: protocolos } });

  const libs = await libColl
    .find(
      { $or: orClauses },
      {
        projection: {
          reply: 1,
          ouvidoriaNumeroProtocolo: 1,
          pixLiberado: 1,
          createdAt: 1,
          updatedAt: 1,
          ouvidoriaReclamacaoId: 1,
          ouvidoriaReclamacaoTipo: 1,
        },
      }
    )
    .toArray();

  /** @type {Map<string, Record<string, unknown>>} */
  const byReclamId = new Map();
  /** @type {Map<string, Record<string, unknown>>} */
  const byProtocolo = new Map();

  for (const lib of libs) {
    const k = lib.ouvidoriaReclamacaoId != null ? String(lib.ouvidoriaReclamacaoId) : '';
    if (k) {
      const prev = byReclamId.get(k);
      if (!prev || new Date(lib.createdAt || 0) > new Date(prev.createdAt || 0)) {
        byReclamId.set(k, lib);
      }
    }
    const np =
      lib.ouvidoriaNumeroProtocolo != null ? String(lib.ouvidoriaNumeroProtocolo).trim() : '';
    if (np) {
      const prevP = byProtocolo.get(np);
      if (!prevP || new Date(lib.createdAt || 0) > new Date(prevP.createdAt || 0)) {
        byProtocolo.set(np, lib);
      }
    }
  }

  for (const r of reclamacoes) {
    const k = r._id != null ? String(r._id) : '';
    const np = r.numeroProtocolo != null ? String(r.numeroProtocolo).trim() : '';
    const lib = (k && byReclamId.get(k)) || (np && byProtocolo.get(np)) || null;

    if (!lib) {
      r.reqProdLiberacaoPix = null;
      r.reqProdStatusEfetivo = null;
      r.reqProdStatusAt = null;
      continue;
    }

    r.reqProdLiberacaoPix = lib;
    const { status, atMs } = getStatusChamadoFromDoc(lib);
    r.reqProdStatusEfetivo = status;
    r.reqProdStatusAt = atMs > 0 ? new Date(atMs) : null;

    if (String(status || '').toLowerCase() === 'feito' && r.pixLiberado !== true) {
      try {
        await syncPixLiberadoParaReclamacaoDoc(client, r);
      } catch (syncErr) {
        console.error('[enrichReclamacoesComReqProd] propagar pixLiberado:', syncErr);
      }
    }
  }
}

/**
 * Corpo opcional no POST create: fusão aplicada após insert (sem currentId no cliente).
 * @param {unknown} raw
 * @returns {{ targetId: string, targetTipo: string, cenario: string, redundantePapel?: string }|null}
 */
function sanitizarFusaoPendente(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const targetId = raw.targetId;
  const targetTipo = raw.targetTipo;
  const cenario = raw.cenario;
  if (!ObjectId.isValid(String(targetId)) || !targetTipo || !cenario) return null;
  const cen = String(cenario).trim().toLowerCase();
  if (!['current_inferior', 'current_superior', 'redundante'].includes(cen)) return null;
  const out = {
    targetId: String(targetId),
    targetTipo: String(targetTipo),
    cenario: cen,
  };
  if (cen === 'redundante' && raw.redundantePapel != null) {
    out.redundantePapel = String(raw.redundantePapel).trim();
  }
  return out;
}

/**
 * Remove espelhos legados Finalizado.* de fusão quando o papel é receptor.
 * @param {Record<string, unknown>|null|undefined} doc
 */
const finalizadoLimparEspelhosLegadosFusao = (doc) => {
  const prev = doc?.Finalizado != null && typeof doc.Finalizado === 'object' ? { ...doc.Finalizado } : {};
  delete prev.Fundido;
  delete prev.dataFundido;
  return Object.keys(prev).length ? prev : undefined;
};

/** @param {unknown} tipo */
const tipoSuportaLiberacaoAnteriorFusao = (tipo) => {
  const t = String(tipo || '').toUpperCase().trim();
  return t !== 'TIME_PORTABILIDADE' && t !== 'TIME PORTABILIDADE';
};

/**
 * Se um dos dois tem pixLiberado, o outro (elegível e sem PIX) recebe liberacaoAnterior.
 * @param {Record<string, unknown>} cur
 * @param {Record<string, unknown>} tgt
 */
const patchLiberacaoAnteriorFusao = (cur, tgt, currentTipo, targetTipo) => {
  const anyPix = cur.pixLiberado === true || tgt.pixLiberado === true;
  const curExtra = {};
  const tgtExtra = {};
  if (!anyPix) return { cur: curExtra, tgt: tgtExtra };
  if (cur.pixLiberado !== true && tipoSuportaLiberacaoAnteriorFusao(currentTipo)) {
    curExtra.liberacaoAnterior = true;
  }
  if (tgt.pixLiberado !== true && tipoSuportaLiberacaoAnteriorFusao(targetTipo)) {
    tgtExtra.liberacaoAnterior = true;
  }
  return { cur: curExtra, tgt: tgtExtra };
};

/**
 * Confirma fusão entre dois documentos (mesmo CPF). Opcional `session` para transação com insert.
 * @returns {Promise<string[]>} protocolos rebaixados em demotion (apenas cenário current_superior)
 */
async function executarFusaoOuvidoria(db, params, options = {}) {
  const { session, mongoClient } = options;
  const sessOpts = session ? { session } : {};

  const {
    cpfLimpo,
    currentId,
    currentTipo,
    targetId,
    targetTipo,
    cenario,
    redundantePapel,
  } = params;

  const collCurrent = getCollectionByType(db, currentTipo);
  const collTarget = getCollectionByType(db, targetTipo);
  const cur = await collCurrent.findOne({ _id: new ObjectId(String(currentId)) }, sessOpts);
  const tgt = await collTarget.findOne({ _id: new ObjectId(String(targetId)) }, sessOpts);

  if (!cur || !tgt) {
    const err = new Error('Documento não encontrado');
    err.code = 'FUSAO_NOT_FOUND';
    throw err;
  }

  const curCpf = String(cur.cpf || '').replace(/\D/g, '');
  const tgtCpf = String(tgt.cpf || '').replace(/\D/g, '');
  if (curCpf !== cpfLimpo || tgtCpf !== cpfLimpo) {
    const err = new Error('CPF dos documentos não confere');
    err.code = 'FUSAO_CPF';
    throw err;
  }

  const cmp = compareTier(currentTipo, targetTipo);
  const cen = String(cenario).trim().toLowerCase();
  if (cen === 'current_inferior' && cmp >= 0) {
    const err = new Error('Cenário current_inferior inconsistente com os níveis informados');
    err.code = 'FUSAO_CENARIO';
    throw err;
  }
  if (cen === 'current_superior' && cmp <= 0) {
    const err = new Error('Cenário current_superior inconsistente com os níveis informados');
    err.code = 'FUSAO_CENARIO';
    throw err;
  }
  if (cen === 'redundante' && cmp !== 0) {
    const err = new Error('Cenário redundante exige mesmo nível');
    err.code = 'FUSAO_CENARIO';
    throw err;
  }

  const now = new Date();
  const curOid = new ObjectId(String(currentId));
  const tgtOid = new ObjectId(String(targetId));
  const curProt = numeroProtocoloDeDoc(cur);
  const tgtProt = numeroProtocoloDeDoc(tgt);

  if (mongoClient) {
    try {
      await hidratarPixLiberadoReclamacaoParaFusao(mongoClient, cur, currentTipo);
      await hidratarPixLiberadoReclamacaoParaFusao(mongoClient, tgt, targetTipo);
    } catch (syncErr) {
      console.error('[executarFusaoOuvidoria] hidratar pixLiberado:', syncErr);
    }
  }

  const laPatch = patchLiberacaoAnteriorFusao(cur, tgt, currentTipo, targetTipo);

  let protosDemovidos = [];
  if (cen === 'current_superior') {
    protosDemovidos = await demoteFormerSuperiors(
      db,
      cpfLimpo,
      currentId,
      collCurrent.collectionName,
      now,
      session
    );
  }

  if (cen === 'current_inferior') {
    await collCurrent.updateOne(
      { _id: curOid },
      {
        $set: {
          ...laPatch.cur,
          Fusao: {
            fundido: true,
            dataFundido: now,
            hierarquia: 'inferior',
            parentId: tgtOid,
            childId: null,
            ...(tgtProt ? { parentProtocolo: tgtProt } : {}),
          },
          Finalizado: mergeFinalizadoAoAbsorverEmFusao(cur),
          updatedAt: now,
        },
      },
      sessOpts
    );
    const protosPai = mergeDedupProtos(tgt?.Fusao?.childProtocolos || [], curProt ? [curProt] : []);
    await collTarget.updateOne(
      { _id: tgtOid },
      {
        $set: {
          ...laPatch.tgt,
          Fusao: {
            fundido: true,
            dataFundido: now,
            hierarquia: 'superior',
            parentId: null,
            childId: curOid,
            ...(curProt ? { childProtocolo: curProt } : {}),
            ...(protosPai.length ? { childProtocolos: protosPai } : {}),
          },
          ...(finalizadoLimparEspelhosLegadosFusao(tgt)
            ? { Finalizado: finalizadoLimparEspelhosLegadosFusao(tgt), updatedAt: now }
            : { updatedAt: now }),
        },
      },
      sessOpts
    );
  } else if (cen === 'current_superior') {
    const prevChild = tgt.Fusao && tgt.Fusao.childId ? tgt.Fusao.childId : null;
    await collTarget.updateOne(
      { _id: tgtOid },
      {
        $set: {
          ...laPatch.tgt,
          Fusao: {
            fundido: true,
            dataFundido: now,
            hierarquia: 'inferior',
            parentId: curOid,
            childId: prevChild ? new ObjectId(String(prevChild)) : null,
            ...(curProt ? { parentProtocolo: curProt } : {}),
          },
          Finalizado: mergeFinalizadoAoAbsorverEmFusao(tgt),
          updatedAt: now,
        },
      },
      sessOpts
    );

    const mergedChildProtos = mergeDedupProtos(
      protosDemovidos,
      cur?.Fusao?.childProtocolos || [],
      tgtProt ? [tgtProt] : []
    );

    await collCurrent.updateOne(
      { _id: curOid },
      {
        $set: {
          ...laPatch.cur,
          Fusao: {
            fundido: true,
            dataFundido: now,
            hierarquia: 'superior',
            parentId: null,
            childId: tgtOid,
            ...(tgtProt ? { childProtocolo: tgtProt } : {}),
            ...(mergedChildProtos.length ? { childProtocolos: mergedChildProtos } : {}),
          },
          ...(finalizadoLimparEspelhosLegadosFusao(cur)
            ? { Finalizado: finalizadoLimparEspelhosLegadosFusao(cur), updatedAt: now }
            : { updatedAt: now }),
        },
      },
      sessOpts
    );
  } else {
    const asParent =
      redundantePapel === 'current_parent' || redundantePapel === 'parent';
    if (asParent) {
      await collCurrent.updateOne(
        { _id: curOid },
        {
          $set: {
            ...laPatch.cur,
            Fusao: {
              fundido: true,
              dataFundido: now,
              hierarquia: 'redundante',
              parentId: null,
              childId: tgtOid,
              ...(tgtProt ? { childProtocolo: tgtProt } : {}),
              childProtocolos: mergeDedupProtos(cur?.Fusao?.childProtocolos || [], tgtProt ? [tgtProt] : []),
            },
            ...(finalizadoLimparEspelhosLegadosFusao(cur)
              ? { Finalizado: finalizadoLimparEspelhosLegadosFusao(cur), updatedAt: now }
              : { updatedAt: now }),
          },
        },
        sessOpts
      );
      await collTarget.updateOne(
        { _id: tgtOid },
        {
          $set: {
            ...laPatch.tgt,
            Fusao: {
              fundido: true,
              dataFundido: now,
              hierarquia: 'redundante',
              parentId: curOid,
              childId: null,
              ...(curProt ? { parentProtocolo: curProt } : {}),
            },
            Finalizado: mergeFinalizadoAoAbsorverEmFusao(tgt),
            updatedAt: now,
          },
        },
        sessOpts
      );
    } else {
      await collTarget.updateOne(
        { _id: tgtOid },
        {
          $set: {
            ...laPatch.tgt,
            Fusao: {
              fundido: true,
              dataFundido: now,
              hierarquia: 'redundante',
              parentId: null,
              childId: curOid,
              ...(curProt ? { childProtocolo: curProt } : {}),
              childProtocolos: mergeDedupProtos(tgt?.Fusao?.childProtocolos || [], curProt ? [curProt] : []),
            },
            ...(finalizadoLimparEspelhosLegadosFusao(tgt)
              ? { Finalizado: finalizadoLimparEspelhosLegadosFusao(tgt), updatedAt: now }
              : { updatedAt: now }),
          },
        },
        sessOpts
      );
      await collCurrent.updateOne(
        { _id: curOid },
        {
          $set: {
            ...laPatch.cur,
            Fusao: {
              fundido: true,
              dataFundido: now,
              hierarquia: 'redundante',
              parentId: tgtOid,
              childId: null,
              ...(tgtProt ? { parentProtocolo: tgtProt } : {}),
            },
            Finalizado: mergeFinalizadoAoAbsorverEmFusao(cur),
            updatedAt: now,
          },
        },
        sessOpts
      );
    }
  }

  return protosDemovidos;
}

/**
 * Novo apex (mesmo CPF): tickets fundidos como superior em tier inferior ao novo passam a inferior apontando para o novo.
 * @returns {Promise<string[]>} números de protocolo dos documentos rebaixados (para agrupamento no pai)
 */
async function demoteFormerSuperiors(db, cpfLimpo, newTopId, newTopCollectionName, now, session = null) {
  const protosOut = [];
  const sessOpts = session ? { session } : {};
  const newIdx = tierIndexFromCollectionName(newTopCollectionName);
  if (newIdx < 0) return protosOut;
  const cpfFilter = { $regex: `^${cpfLimpo}$`, $options: 'i' };
  const newOid = new ObjectId(String(newTopId));

  const parentColl = db.collection(newTopCollectionName);
  const parentSnap = await parentColl.findOne(
    { _id: newOid },
    { projection: { numeroProtocolo: 1 }, ...(session ? { session } : {}) }
  );
  const parentProt = numeroProtocoloDeDoc(parentSnap || {});

  for (const colName of OUVIDORIA_COLLECTION_NAMES) {
    const idxDoc = tierIndexFromCollectionName(colName);
    if (idxDoc < 0 || idxDoc >= newIdx) continue;

    const col = db.collection(colName);
    const docs = await col
      .find(
        {
          cpf: cpfFilter,
          'Fusao.fundido': true,
          'Fusao.hierarquia': 'superior',
          _id: { $ne: newOid },
        },
        sessOpts
      )
      .toArray();

    for (const d of docs) {
      const prev = d.Fusao && typeof d.Fusao === 'object' ? d.Fusao : {};
      const prevChildOid =
        prev.childId != null && ObjectId.isValid(String(prev.childId))
          ? new ObjectId(String(prev.childId))
          : null;
      const dp = numeroProtocoloDeDoc(d);
      if (dp) protosOut.push(dp);
      await col.updateOne(
        { _id: d._id },
        {
          $set: {
            Fusao: {
              ...prev,
              fundido: true,
              hierarquia: 'inferior',
              parentId: newOid,
              dataFundido: now,
              ...(parentProt ? { parentProtocolo: parentProt } : {}),
              childId: prevChildOid,
            },
            Finalizado: mergeFinalizadoAoAbsorverEmFusao(d),
            updatedAt: now,
          },
        },
        sessOpts
      );
    }
  }

  return protosOut;
}

/** Lista de campos que devem ser Date (não string) */
const CAMPOS_DATA = [
  'dataEntrada', 'dataEntradaN2', 'dataReclam', 'dataProcon',
  'prazoBacen', 'prazoOuvidoria', 'processoEncaminhadoData', 'dataProcessoEncerrado',
  'dataAudiencia', 'dataEntradaProcesso'
];

/** SLA automático: dias corridos (UTC) somados ao createdAt. */
const SLA_DIAS_CORRIDOS_BACEN = 10;
const SLA_DIAS_CORRIDOS_N2_OUVIDORIA = 2;

/**
 * Data limite = N dias corridos (UTC) após a data de criação do registro.
 * @param {Date|string|null|undefined} createdAt
 * @param {number} diasCorridos
 * @returns {Date}
 */
const prazoAutomaticoDiasUtcAposCriacao = (createdAt, diasCorridos) => {
  const n = Number(diasCorridos);
  const dias = Number.isFinite(n) && n > 0 ? n : 2;
  const base =
    createdAt instanceof Date
      ? createdAt
      : createdAt
        ? new Date(createdAt)
        : new Date();
  if (isNaN(base.getTime())) return new Date();
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
};

/**
 * Define prazoBacen (reclamacoes_bacen) ou prazoOuvidoria (reclamacoes_n2Pix); remove o campo da outra família se vier misturado no body.
 * @param {Record<string, unknown>} alvo — documento de insert ou objeto $set do update
 * @param {string} collectionName
 * @param {Date|string|null|undefined} createdAtRef — createdAt do registro (POST: novo; PUT: existente)
 */
const aplicarPrazoAutomaticoPorColecao = (alvo, collectionName, createdAtRef) => {
  if (!alvo || typeof alvo !== 'object') return;
  if (collectionName === 'reclamacoes_bacen') {
    alvo.prazoBacen = prazoAutomaticoDiasUtcAposCriacao(createdAtRef, SLA_DIAS_CORRIDOS_BACEN);
    delete alvo.prazoOuvidoria;
  } else if (collectionName === 'reclamacoes_n2Pix') {
    alvo.prazoOuvidoria = prazoAutomaticoDiasUtcAposCriacao(createdAtRef, SLA_DIAS_CORRIDOS_N2_OUVIDORIA);
    delete alvo.prazoBacen;
  }
};

/**
 * Normaliza campos de data no objeto: converte strings para Date
 * Para OUVIDORIA/N2: dataEntradaAtendimento (legado do form) → dataEntradaN2 (schema oficial)
 */
/**
 * Se o objeto tiver a chave motivoReduzido, substitui pelo array canônico (não altera outras chaves).
 * @param {Record<string, unknown>} alvo
 */
const aplicarMotivoReduzidoNormalizado = (alvo) => {
  if (!alvo || typeof alvo !== 'object') return alvo;
  if (!Object.prototype.hasOwnProperty.call(alvo, 'motivoReduzido')) return alvo;
  const { motivos } = normalizarCampoMotivoReduzido(alvo.motivoReduzido);
  alvo.motivoReduzido = motivos;
  return alvo;
};

const normalizarCamposDataParaDate = (obj) => {
  const result = { ...obj };
  // Mapear dataEntradaAtendimento → dataEntradaN2 (schema LISTA_SCHEMAS.rb tem apenas dataEntradaN2)
  if (result.dataEntradaAtendimento != null) {
    if (!result.dataEntradaN2) {
      const val = result.dataEntradaAtendimento;
      result.dataEntradaN2 = val instanceof Date ? val : (parsearDataParaDate(val) ?? new Date(val));
    }
    delete result.dataEntradaAtendimento;
  }
  for (const campo of CAMPOS_DATA) {
    if (result[campo] != null && typeof result[campo] === 'string') {
      const dataDate = parsearDataParaDate(result[campo]);
      if (dataDate) result[campo] = dataDate;
    }
  }
  if (result.Finalizado?.dataResolucao != null && typeof result.Finalizado.dataResolucao === 'string') {
    const dataResolucao = parsearDataParaDate(result.Finalizado.dataResolucao);
    if (dataResolucao) {
      result.Finalizado = { ...result.Finalizado, dataResolucao };
    }
  }
  if (result.Fusao?.dataFundido != null && typeof result.Fusao.dataFundido === 'string') {
    const dfd = parsearDataParaDate(result.Fusao.dataFundido);
    if (dfd) result.Fusao = { ...result.Fusao, dataFundido: dfd };
  }
  if (result.tentativasContato?.lista) {
    result.tentativasContato = {
      lista: result.tentativasContato.lista.map((t) => {
        if (t.data != null && typeof t.data === 'string') {
          const d = parsearDataParaDate(t.data);
          return d ? { ...t, data: d } : t;
        }
        return t;
      })
    };
  }
  // Remover telefones.principal (schema tem apenas telefones.lista)
  if (result.telefones?.principal != null) {
    const { principal, ...telefonesResto } = result.telefones;
    result.telefones = telefonesResto;
  }
  // pixStatus (legado) → pixLiberado (boolean). Liberado/Excluído/Solicitada → true; Não aplicável/vazio → false
  if (result.pixStatus !== undefined) {
    const s = String(result.pixStatus || '').toLowerCase().trim();
    result.pixLiberado = ['liberado', 'excluído', 'excluido', 'solicitada', 'solicitado'].includes(s);
    delete result.pixStatus;
  }
  if (result.pixLiberado !== undefined) {
    result.pixLiberado = result.pixLiberado === true;
  }
  return result;
};

/**
 * Obter coleção MongoDB baseado no tipo de reclamação
 * @param {Object} db - MongoDB database instance
 * @param {String} tipo - Tipo de reclamação: "BACEN", "N2", "OUVIDORIA", "RECLAME AQUI", "PROCON", "PROCESSOS" (Ação Judicial)
 * @returns {Object} MongoDB collection
 */
const getCollectionByType = (db, tipo) => {
  const tipoUpper = String(tipo || '').toUpperCase().trim();
  
  switch (tipoUpper) {
    case 'BACEN':
      return db.collection('reclamacoes_bacen');
    case 'N2':
    case 'N2 PIX':
    case 'N2 & PIX':
    case 'N2&PIX':
    case 'OUVIDORIA':
      return db.collection('reclamacoes_n2Pix');
    case 'RECLAME AQUI':
    case 'RECLAMEAQUI':
    case 'RECLAME_AQUI':
      return db.collection('reclamacoes_reclameAqui');
    case 'PROCON':
      return db.collection('reclamacoes_procon');
    case 'PROCESSOS':
    case 'JUDICIAL':
    case 'AÇÃO JUDICIAL':
    case 'ACAO JUDICIAL':
      return db.collection('reclamacoes_judicial');
    case 'TIME_PORTABILIDADE':
    case 'TIME PORTABILIDADE':
      return db.collection('reclamacoes_timePortabilidade');
    default:
      // Fallback para BACEN se tipo não especificado
      return db.collection('reclamacoes_bacen');
  }
};

/**
 * Criar índices para uma coleção
 * @param {Object} collection - MongoDB collection
 * @param {String} collectionName - Nome da coleção para logs
 */
const createIndexes = async (collection, collectionName) => {
  try {
    // Criar índice em CPF para buscas rápidas
    await collection.createIndex({ cpf: 1 });
    console.log(`✅ Índice criado em ${collectionName}: cpf`);
    
    // Criar índice em telefones.lista para buscas em telefones
    await collection.createIndex({ 'telefones.lista': 1 });
    console.log(`✅ Índice criado em ${collectionName}: telefones.lista`);
    
    // Criar índice em createdAt para ordenação
    await collection.createIndex({ createdAt: -1 });
    console.log(`✅ Índice criado em ${collectionName}: createdAt`);
    
    // Criar índice em email se existir
    await collection.createIndex({ email: 1 }, { sparse: true });
    console.log(`✅ Índice criado em ${collectionName}: email`);

    await collection.createIndex({ numeroProtocolo: 1 }, { unique: true, sparse: true });
    console.log(`✅ Índice criado em ${collectionName}: numeroProtocolo (unique sparse)`);
  } catch (error) {
    console.error(`❌ Erro ao criar índices em ${collectionName}:`, error);
  }
};

/**
 * Inicializar rotas de reclamações
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 * @param {Object} services - Serviços disponíveis (userActivityLogger, etc.)
 */
const initReclamacoesRoutes = (client, connectToMongo, services = {}) => {
  const { userActivityLogger } = services;

  // Criar índices MongoDB na inicialização para todas as coleções
  (async () => {
    try {
      if (client) {
        await connectToMongo();
        const db = client.db('hub_ouvidoria');
        
        // Criar índices para cada coleção
        await createIndexes(db.collection('reclamacoes_bacen'), 'reclamacoes_bacen');
        await createIndexes(db.collection('reclamacoes_n2Pix'), 'reclamacoes_n2Pix');
        await createIndexes(db.collection('reclamacoes_reclameAqui'), 'reclamacoes_reclameAqui');
        await createIndexes(db.collection('reclamacoes_procon'), 'reclamacoes_procon');
        await createIndexes(db.collection('reclamacoes_judicial'), 'reclamacoes_judicial');
        await createIndexes(db.collection('reclamacoes_timePortabilidade'), 'reclamacoes_timePortabilidade');
        
        // Criar índices específicos para Reclame Aqui
        const reclameAquiCollection = db.collection('reclamacoes_reclameAqui');
        try {
          await reclameAquiCollection.createIndex({ cpfRepetido: 1 });
          console.log('✅ Índice criado em reclamacoes_reclameAqui: cpfRepetido');
          await reclameAquiCollection.createIndex({ idEntrada: 1 }); // Não único, pode haver duplicatas
          console.log('✅ Índice criado em reclamacoes_reclameAqui: idEntrada');
        } catch (error) {
          console.error('❌ Erro ao criar índices específicos para reclamacoes_reclameAqui:', error);
        }
        
        // Criar índices específicos para Procon
        const proconCollection = db.collection('reclamacoes_procon');
        try {
          await proconCollection.createIndex({ codigoProcon: 1 });
          console.log('✅ Índice criado em reclamacoes_procon: codigoProcon');
        } catch (error) {
          console.error('❌ Erro ao criar índices específicos para reclamacoes_procon:', error);
        }
        
        // Criar índices específicos para Ação Judicial
        const processosCollection = db.collection('reclamacoes_judicial');
        try {
          await processosCollection.createIndex({ nroProcesso: 1 });
          console.log('✅ Índice criado em reclamacoes_judicial: nroProcesso');
        } catch (error) {
          console.error('❌ Erro ao criar índices específicos para reclamacoes_judicial:', error);
        }

        try {
          await db.collection('protocolo_sequencia_diaria').createIndex({ dataKey: 1, abbr: 1 }, { unique: true });
          console.log('✅ Índice criado em protocolo_sequencia_diaria: dataKey+abbr');
        } catch (error) {
          console.error('❌ Erro ao criar índices em protocolo_sequencia_diaria:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar índices MongoDB:', error);
    }
  })();

  /**
   * GET /api/ouvidoria/reclamacoes
   * Buscar todas as reclamações ou filtrar por query params
   * Se tipo não especificado, busca em todas as coleções
   */
  router.get('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: []
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      // Filtros opcionais
      const {
        cpf,
        colaboradorNome,
        colaboradorEmail,
        tipo,
        dataInicio,
        dataFim,
        motivo,
        produto,
        status,
        page = '1',
        limit = '20',
      } = req.query;

      const baseFilter = {};
      if (cpf) {
        baseFilter.cpf = { $regex: String(cpf).replace(/\D/g, ''), $options: 'i' };
      }
      const colabNomeTrim = colaboradorNome != null ? String(colaboradorNome).trim() : '';
      const colabEmailLc =
        colaboradorEmail != null ? String(colaboradorEmail).trim().toLowerCase() : '';
      if (colabNomeTrim || colabEmailLc) {
        if (colabNomeTrim && colabEmailLc) {
          const emailEsc = escaparRegexMongoLiteral(colabEmailLc);
          const nomeEsc = escaparRegexMongoLiteral(colabNomeTrim);
          baseFilter.$or = [
            {
              responsavelEmail: { $regex: `^${emailEsc}$`, $options: 'i' },
            },
            {
              $and: [
                {
                  $or: [
                    { responsavelEmail: { $exists: false } },
                    { responsavelEmail: null },
                    { responsavelEmail: '' },
                  ],
                },
                {
                  responsavel: { $regex: `^${nomeEsc}$`, $options: 'i' },
                },
              ],
            },
          ];
        } else if (colabEmailLc) {
          baseFilter.responsavelEmail = {
            $regex: `^${escaparRegexMongoLiteral(colabEmailLc)}$`,
            $options: 'i',
          };
        } else if (colabNomeTrim) {
          baseFilter.responsavel = { $regex: colabNomeTrim, $options: 'i' };
        }
      }
      if (motivo && String(motivo).trim()) {
        baseFilter.motivoReduzido = String(motivo).trim();
      }
      if (produto && String(produto).trim()) {
        baseFilter.produto = String(produto).trim();
      }
      if (status && String(status).trim()) {
        const statusVal = String(status).trim().toLowerCase();
        if (statusVal === 'resolvido') {
          baseFilter['Finalizado.Resolvido'] = true;
        } else if (statusVal === 'em_andamento' || statusVal === 'emandamento') {
          baseFilter['Finalizado.Resolvido'] = { $ne: true };
          if (!baseFilter.$and) baseFilter.$and = [];
          /** Exclui absorvido por Fusao e legado Finalizado.Fundido até limpeza na base */
          baseFilter.$and.push({ $nor: [MONGO_MATCH_FUSAO_ABSORVIDO, { 'Finalizado.Fundido': true }] });
        } else if (statusVal === 'fundido') {
          if (!baseFilter.$and) baseFilter.$and = [];
          baseFilter.$and.push({
            $or: [MONGO_MATCH_FUSAO_ABSORVIDO, { 'Finalizado.Fundido': true }],
          });
        }
      }

      const dataInicioDate = dataInicio ? new Date(String(dataInicio) + 'T00:00:00.000Z') : null;
      const dataFimDate = dataFim ? new Date(String(dataFim) + 'T23:59:59.999Z') : null;

      const criarFiltroDataPorCollection = (collectionName) => {
        if (!dataInicioDate || !dataFimDate) return {};
        if (collectionName === 'reclamacoes_n2Pix') {
          return { $or: [{ dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataEntradaN2: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial' || collectionName === 'reclamacoes_timePortabilidade') {
          return { $or: [{ dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataEntrada: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        if (collectionName === 'reclamacoes_reclameAqui') {
          return { $or: [{ dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataReclam: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        if (collectionName === 'reclamacoes_procon') {
          return { $or: [{ dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataProcon: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        return { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } };
      };

      const mesclarFilter = (collectionName) => {
        const f = { ...baseFilter };
        const dataFiltro = criarFiltroDataPorCollection(collectionName);
        if (Object.keys(dataFiltro).length > 0) {
          f.$and = f.$and || [];
          f.$and.push(dataFiltro);
        }
        return f;
      };

      // Parâmetros de paginação (desativada quando há filtro por CPF: retorno completo para Consultar / fusão)
      const cpfDigits = cpf ? String(cpf).replace(/\D/g, '') : '';
      const skipPaginationForCpf = Boolean(cpf && cpfDigits.length === 11);

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20)); // Máximo 100, mínimo 1
      const skip = (pageNum - 1) * limitNum;

      let reclamacoes = [];
      let totalCount = 0;

      if (tipo) {
        const tipoUpper = String(tipo).toUpperCase().trim();
        const collection = getCollectionByType(db, tipo);
        const collectionName = tipoUpper === 'BACEN' ? 'reclamacoes_bacen'
          : (tipoUpper === 'N2' || tipoUpper === 'N2 PIX' || tipoUpper === 'OUVIDORIA') ? 'reclamacoes_n2Pix'
          : (tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAMEAQUI') ? 'reclamacoes_reclameAqui'
          : tipoUpper === 'PROCON' ? 'reclamacoes_procon'
          : (tipoUpper === 'TIME_PORTABILIDADE' || tipoUpper === 'TIME PORTABILIDADE') ? 'reclamacoes_timePortabilidade'
          : 'reclamacoes_judicial';
        const filter = mesclarFilter(collectionName);

        // Buscar na coleção específica
        totalCount = await collection.countDocuments(filter);
        const cursor = collection.find(filter).sort({ createdAt: -1 });
        if (skipPaginationForCpf) {
          reclamacoes = await cursor.toArray();
        } else {
          reclamacoes = await cursor.skip(skip).limit(limitNum).toArray();
        }
        
        // Mapear tipo para exibição (normalizar nomes)
        let tipoParaAdicionar = tipoUpper;
        if (tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' || tipoUpper === 'N2 PIX') {
          tipoParaAdicionar = 'N2 Pix';
        } else if (tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') {
          tipoParaAdicionar = 'Reclame Aqui';
        } else if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' || tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL') {
          tipoParaAdicionar = 'Ação Judicial';
        } else if (tipoUpper === 'OUVIDORIA') {
          tipoParaAdicionar = 'N2 Pix';
        } else if (tipoUpper === 'PROCON') {
          tipoParaAdicionar = 'Procon';
        } else if (tipoUpper === 'TIME_PORTABILIDADE' || tipoUpper === 'TIME PORTABILIDADE') {
          tipoParaAdicionar = 'Time Portabilidade';
        }
        
        // Adicionar tipo aos resultados
        reclamacoes = reclamacoes.map(r => ({ ...r, tipo: tipoParaAdicionar }));
      } else {
        // Buscar em todas as coleções (6 collections - reclamacoes_ouvidoria descontinuada/renomeada para n2Pix)
        const [bacen, n2Pix, reclameAqui, procon, judicial, timePortabilidade] = await Promise.all([
          db.collection('reclamacoes_bacen').find(mesclarFilter('reclamacoes_bacen')).toArray(),
          db.collection('reclamacoes_n2Pix').find(mesclarFilter('reclamacoes_n2Pix')).toArray(),
          db.collection('reclamacoes_reclameAqui').find(mesclarFilter('reclamacoes_reclameAqui')).toArray(),
          db.collection('reclamacoes_procon').find(mesclarFilter('reclamacoes_procon')).toArray(),
          db.collection('reclamacoes_judicial').find(mesclarFilter('reclamacoes_judicial')).toArray(),
          db.collection('reclamacoes_timePortabilidade').find(mesclarFilter('reclamacoes_timePortabilidade')).toArray()
        ]);
        
        // Adicionar tipo aos resultados (n2Pix inclui N2 e OUVIDORIA - collection unificada)
        const todas = [
          ...bacen.map(r => ({ ...r, tipo: 'BACEN' })),
          ...n2Pix.map(r => ({ ...r, tipo: 'N2 Pix' })),
          ...reclameAqui.map(r => ({ ...r, tipo: 'Reclame Aqui' })),
          ...procon.map(r => ({ ...r, tipo: 'Procon' })),
          ...judicial.map(r => ({ ...r, tipo: 'Ação Judicial' })),
          ...timePortabilidade.map(r => ({ ...r, tipo: 'Time Portabilidade' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        totalCount = todas.length;
        reclamacoes = skipPaginationForCpf ? todas : todas.slice(skip, skip + limitNum);
      }

      const totalPages = skipPaginationForCpf
        ? 1
        : Math.max(1, Math.ceil(totalCount / limitNum));

      console.log(`✅ Reclamações encontradas: ${reclamacoes.length} de ${totalCount} (página ${pageNum}/${totalPages})`);

      if (client) {
        try {
          await enrichReclamacoesComReqProd(client, reclamacoes);
        } catch (enrichErr) {
          console.error('❌ enrichReclamacoesComReqProd:', enrichErr);
        }
      }

      res.json({
        success: true,
        data: reclamacoes,
        count: reclamacoes.length,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('❌ Erro ao buscar reclamações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar reclamações',
        error: error.message
      });
    }
  });

  /**
   * GET /api/ouvidoria/reclamacoes/proximo-numero-protocolo-sugerido?tipo=
   * Prévia read-only do próximo número (não consome sequência).
   */
  router.get('/proximo-numero-protocolo-sugerido', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
        });
      }
      const { tipo } = req.query;
      if (!tipo || !String(tipo).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Query tipo é obrigatória',
        });
      }
      await connectToMongo();
      const db = client.db('hub_ouvidoria');
      const collection = getCollectionByType(db, tipo);
      const r = await getSuggestedNumeroProtocolo(db, collection, tipo);
      if (!r.success) {
        return res.status(400).json({
          success: false,
          message: r.message || 'Tipo inválido para protocolo',
        });
      }
      return res.json({
        success: true,
        data: {
          numeroProtocolo: r.numeroProtocolo,
          sugestaoDisplay: r.numeroProtocolo,
        },
      });
    } catch (error) {
      console.error('❌ Erro ao sugerir protocolo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao sugerir protocolo',
        error: error.message,
      });
    }
  });

  /**
   * POST /api/ouvidoria/reclamacoes/:id/gerar-ticket-octadesk?tipo=
   * Cria ticket no Octadesk e persiste ticketRegistro na reclamação.
   */
  router.post('/:id/gerar-ticket-octadesk', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }

      const { id } = req.params;
      const tipo = req.query.tipo || req.body?.tipo;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      if (!tipo || !String(tipo).trim()) {
        return res.status(400).json({ success: false, message: 'Query tipo é obrigatória' });
      }

      const tipoStr = String(tipo).trim();
      const tipoUp = tipoStr.toUpperCase();
      if (tipoUp === 'TIME_PORTABILIDADE' || tipoUp === 'TIME PORTABILIDADE') {
        return res.status(400).json({
          success: false,
          message: 'Gerar Ticket não se aplica ao tipo Time Portabilidade',
        });
      }

      if (!isOctadeskConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Integração Octadesk não configurada no servidor',
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');
      const collection = getCollectionByType(db, tipoStr);
      const existente = await collection.findOne({ _id: new ObjectId(id) });

      if (!existente) {
        return res.status(404).json({ success: false, message: 'Reclamação não encontrada' });
      }

      const prevReg = String(existente.ticketRegistro != null ? existente.ticketRegistro : '').trim();
      if (prevReg) {
        return res.json({
          success: true,
          message: 'Ticket de registro já vinculado a esta ocorrência',
          data: { ticketRegistro: prevReg, alreadyExists: true },
        });
      }

      let createBody;
      try {
        createBody = buildCreateTicketFromReclamacao(existente, tipoStr);
      } catch (buildErr) {
        const msg = buildErr && buildErr.message ? buildErr.message : String(buildErr);
        return res.status(503).json({
          success: false,
          message: msg,
        });
      }

      const octa = await createTicket(createBody);
      if (!octa.ok || octa.ticketNumber == null) {
        const isConfig =
          octa.error && String(octa.error).includes('OCTADESK_STATUS_RESOLVIDO_ID');
        return res.status(isConfig ? 503 : 502).json({
          success: false,
          message: octa.error || 'Falha ao criar ticket no Octadesk',
        });
      }

      const ticketRegistro = String(octa.ticketNumber).trim();
      const now = new Date();
      const mirrorPatch = mirrorTicketRegistro(existente, tipoStr, ticketRegistro);
      await collection.updateOne(
        { _id: existente._id },
        { $set: { ...mirrorPatch, updatedAt: now } }
      );

      const fin = await finalizeReclamacaoTicketAfterCreate(ticketRegistro, existente, tipoStr);
      if (!fin.ok && !fin.skipped) {
        return res.json({
          success: true,
          message: 'Ticket Octadesk criado (comentário/status pós-create não aplicados nesta instância)',
          data: { ticketRegistro, octadeskFinalizeWarning: fin.error || true },
        });
      }

      return res.json({
        success: true,
        message: 'Ticket Octadesk criado',
        data: { ticketRegistro },
      });
    } catch (error) {
      console.error('❌ Erro gerar-ticket-octadesk:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar ticket Octadesk',
        error: error.message,
      });
    }
  });

  /**
   * GET /api/ouvidoria/reclamacoes/:id
   * Buscar reclamação por ID
   * Busca em todas as coleções se tipo não especificado
   */
  router.get('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { id } = req.params;
      const { tipo } = req.query;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      let reclamacao = null;

      if (tipo) {
        // Buscar apenas na coleção específica
        const collection = getCollectionByType(db, tipo);
        reclamacao = await collection.findOne({ _id: new ObjectId(id) });
      } else {
        // Buscar em todas as coleções (6 collections - reclamacoes_ouvidoria descontinuada)
        const [bacen, n2Pix, reclameAqui, procon, judicial, timePortabilidade] = await Promise.all([
          db.collection('reclamacoes_bacen').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_n2Pix').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_reclameAqui').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_procon').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_judicial').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_timePortabilidade').findOne({ _id: new ObjectId(id) })
        ]);
        
        reclamacao = bacen || n2Pix || reclameAqui || procon || judicial || timePortabilidade;
        if (reclamacao) {
          // Adicionar tipo ao resultado
          if (bacen) reclamacao.tipo = 'BACEN';
          else if (n2Pix) reclamacao.tipo = 'N2 Pix';
          else if (reclameAqui) reclamacao.tipo = 'Reclame Aqui';
          else if (procon) reclamacao.tipo = 'Procon';
          else if (judicial) reclamacao.tipo = 'Ação Judicial';
          else if (timePortabilidade) reclamacao.tipo = 'Time Portabilidade';
        }
      }

      if (!reclamacao) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada'
        });
      }

      try {
        await syncPixLiberadoParaReclamacaoDoc(client, reclamacao);
      } catch (syncErr) {
        console.error('[GET reclamacao/:id] sync pixLiberado:', syncErr);
      }

      res.json({
        success: true,
        data: reclamacao
      });
    } catch (error) {
      console.error('❌ Erro ao buscar reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar reclamação',
        error: error.message
      });
    }
  });

  /**
   * POST /api/ouvidoria/reclamacoes
   * Criar nova reclamação
   * Salva na coleção correta baseado no tipo
   */
  router.post('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const dados = req.body;

      // Validar tipo obrigatório
      if (!dados.tipo) {
        return res.status(400).json({
          success: false,
          message: 'Campo obrigatório: tipo (BACEN, OUVIDORIA, RECLAME_AQUI, PROCON, PROCESSOS/AÇÃO JUDICIAL ou TIME_PORTABILIDADE)'
        });
      }


      // Validar campos obrigatórios básicos
      if (!dados.nome || !dados.cpf) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: nome, cpf'
        });
      }

      // Normalizar CPF (apenas números)
      dados.cpf = String(dados.cpf).replace(/\D/g, '');
      
      if (dados.cpf.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'CPF deve ter 11 dígitos'
        });
      }

      // Obter coleção correta baseado no tipo
      const collection = getCollectionByType(db, dados.tipo);
      
      // Log para confirmar coleção usada
      console.log(`📝 [Reclamações API] Tipo: ${dados.tipo} → Coleção: ${collection.collectionName}`);

      // Normalizar estrutura de telefones (compatibilidade com dados antigos e novos)
      if (Array.isArray(dados.telefones)) {
        // Estrutura antiga: array direto
        dados.telefones = { lista: dados.telefones };
      } else if (dados.telefones && !dados.telefones.lista) {
        // Se for objeto mas não tiver lista, criar lista vazia
        dados.telefones = { lista: [] };
      } else if (!dados.telefones) {
        // Se não existir, criar estrutura padrão
        dados.telefones = { lista: [] };
      }

      // Normalizar estrutura de tentativasContato (compatibilidade com dados antigos e novos)
      if (Array.isArray(dados.tentativasContato)) {
        // Estrutura antiga: array direto
        dados.tentativasContato = { lista: dados.tentativasContato };
      } else if (dados.tentativasContato && !dados.tentativasContato.lista) {
        // Se for objeto mas não tiver lista, criar lista vazia
        dados.tentativasContato = { lista: [] };
      } else if (!dados.tentativasContato) {
        // Se não existir, criar estrutura padrão
        dados.tentativasContato = { lista: [] };
      }

      // Metadados de integração (não vão no documento além do que for explícito abaixo)
      const {
        tipo,
        fusaoPendente: fusaoPendenteRaw,
        liberacaoPixProdIdAssociado: libPixAssocRaw,
        numeroProtocolo: _numeroClienteIgnorado,
        ...dadosSemTipo
      } = dados;

      const fusaoPendenteBloc = sanitizarFusaoPendente(fusaoPendenteRaw);
      let libPixAssoc = null;
      if (libPixAssocRaw != null && String(libPixAssocRaw).trim() && ObjectId.isValid(String(libPixAssocRaw))) {
        libPixAssoc = String(libPixAssocRaw).trim();
      }

      let numeroProtocolo;
      try {
        numeroProtocolo = await allocateNextNumeroProtocolo(db, collection, tipo);
      } catch (allocErr) {
        console.error('allocateNextNumeroProtocolo:', allocErr);
        return res.status(400).json({
          success: false,
          message: allocErr.message || 'Não foi possível atribuir número de protocolo',
        });
      }

      const documento = aplicarMotivoReduzidoNormalizado(
        normalizarCamposDataParaDate({
          ...dadosSemTipo,
          numeroProtocolo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const fusaoSanBoot = sanitizarFusao(dados.Fusao);
      if (fusaoSanBoot) documento.Fusao = fusaoSanBoot;

      if (documento.Finalizado != null && typeof documento.Finalizado === 'object') {
        const finSan = sanitizarFinalizadoSemEspelhosFusao(documento.Finalizado);
        if (finSan) documento.Finalizado = finSan;
        else delete documento.Finalizado;
      }

      Object.assign(documento, syncNativoParaBloco792(documento, tipo));

      aplicarPrazoAutomaticoPorColecao(documento, collection.collectionName, documento.createdAt);

      let resultado;
      if (fusaoPendenteBloc) {
        const session = client.startSession();
        try {
          await session.withTransaction(async () => {
            resultado = await collection.insertOne(documento, { session });
            await executarFusaoOuvidoria(
              db,
              {
                cpfLimpo: dados.cpf,
                currentId: resultado.insertedId.toString(),
                currentTipo: tipo,
                targetId: fusaoPendenteBloc.targetId,
                targetTipo: fusaoPendenteBloc.targetTipo,
                cenario: fusaoPendenteBloc.cenario,
                redundantePapel: fusaoPendenteBloc.redundantePapel,
              },
              { session, mongoClient: client }
            );
          });
        } finally {
          await session.endSession();
        }
      } else {
        resultado = await collection.insertOne(documento);
      }

      console.log(`✅ Reclamação criada na coleção ${collection.collectionName}: ${resultado.insertedId}`);

      if (libPixAssoc) {
        try {
          const escDb = client.db('hub_escalacoes');
          const nowLib = new Date();
          await escDb.collection('liberacao_pix_prod').updateOne(
            { _id: new ObjectId(libPixAssoc) },
            {
              $set: {
                ouvidoriaNumeroProtocolo: numeroProtocolo,
                ouvidoriaReclamacaoId: resultado.insertedId,
                ouvidoriaReclamacaoTipo: String(tipo).trim(),
                updatedAt: nowLib,
              },
            }
          );
        } catch (libErr) {
          console.error('[reclamacoes POST] sync liberacao_pix_prod:', libErr);
        }
      }

      // Log de atividade se disponível
      if (userActivityLogger && dados.responsavel) {
        try {
          await userActivityLogger.log({
            colaboradorNome: dados.responsavel,
            action: 'reclamacao_criada',
            details: {
              reclamacaoId: resultado.insertedId.toString(),
              tipo: tipo,
              cpf: dados.cpf.substring(0, 3) + '***' + dados.cpf.substring(9), // CPF parcial para privacidade
            },
            source: 'ouvidoria',
          });
        } catch (logError) {
          console.error('Erro ao registrar log:', logError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Reclamação criada com sucesso',
        data: {
          _id: resultado.insertedId,
          tipo: tipo,
          ...documento
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar reclamação',
        error: error.message
      });
    }
  });

  /**
   * POST /api/ouvidoria/reclamacoes/fusao
   * Confirma fusão entre dois documentos existentes (mesmo CPF).
   * Body: { cpf, currentId, currentTipo, targetId, targetTipo, cenario, redundantePapel? }
   * cenario: current_inferior | current_superior | redundante
   */
  router.post('/fusao', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const body = req.body || {};
      const {
        cpf,
        currentId,
        currentTipo,
        targetId,
        targetTipo,
        cenario,
        redundantePapel,
      } = body;

      const cpfLimpo = cpf ? String(cpf).replace(/\D/g, '') : '';
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ success: false, message: 'CPF inválido (11 dígitos)' });
      }
      if (!ObjectId.isValid(String(currentId)) || !ObjectId.isValid(String(targetId))) {
        return res.status(400).json({ success: false, message: 'IDs inválidos' });
      }
      if (!currentTipo || !targetTipo || !cenario) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: currentTipo, targetTipo, cenario',
        });
      }

      const cen = String(cenario).trim().toLowerCase();
      if (!['current_inferior', 'current_superior', 'redundante'].includes(cen)) {
        return res.status(400).json({ success: false, message: 'Cenário inválido' });
      }

      try {
        await executarFusaoOuvidoria(
          db,
          {
            cpfLimpo,
            currentId: String(currentId),
            currentTipo,
            targetId: String(targetId),
            targetTipo,
            cenario: cen,
            redundantePapel,
          },
          { mongoClient: client }
        );
      } catch (fusErr) {
        const code = fusErr && fusErr.code;
        if (code === 'FUSAO_NOT_FOUND') {
          return res.status(404).json({ success: false, message: fusErr.message });
        }
        if (code === 'FUSAO_CPF' || code === 'FUSAO_CENARIO') {
          return res.status(400).json({ success: false, message: fusErr.message });
        }
        throw fusErr;
      }

      res.json({ success: true, message: 'Fusão registrada com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao registrar fusão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar fusão',
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/ouvidoria/reclamacoes/:id
   * Atualizar reclamação
   * Requer tipo como query param ou no body
   */
  router.put('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { id } = req.params;
      const dados = req.body;
      const { tipo } = req.query || dados.tipo;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: 'Tipo é obrigatório (query param ou body)'
        });
      }

      // Obter coleção correta
      const collection = getCollectionByType(db, tipo);

      const existente = await collection.findOne({ _id: new ObjectId(id) });
      if (!existente) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada',
        });
      }

      // Normalizar CPF se fornecido
      if (dados.cpf) {
        dados.cpf = String(dados.cpf).replace(/\D/g, '');
      }

      // Normalizar estrutura de telefones (compatibilidade)
      if (Array.isArray(dados.telefones)) {
        dados.telefones = { lista: dados.telefones };
      } else if (dados.telefones && !dados.telefones.lista) {
        dados.telefones = { lista: [] };
      }

      // Normalizar estrutura de tentativasContato (compatibilidade)
      if (Array.isArray(dados.tentativasContato)) {
        dados.tentativasContato = { lista: dados.tentativasContato };
      } else if (dados.tentativasContato && !dados.tentativasContato.lista) {
        dados.tentativasContato = { lista: [] };
      }

      // Remover tipo do updateDoc se presente (não deve ser atualizado)
      const { tipo: tipoRemovido, ...dadosSemTipo } = dados;
      
      // Atualizar documento (normalizar datas para Date)
      const updateDocRaw = aplicarMotivoReduzidoNormalizado(
        normalizarCamposDataParaDate({
          ...dadosSemTipo,
          updatedAt: new Date(),
        })
      );
      if (updateDocRaw.Finalizado != null && typeof updateDocRaw.Finalizado === 'object') {
        const finSan = sanitizarFinalizadoSemEspelhosFusao(updateDocRaw.Finalizado);
        if (finSan) updateDocRaw.Finalizado = finSan;
        else delete updateDocRaw.Finalizado;
      }
      const updateDoc = updateDocRaw;

      if (existente?.Fusao?.fundido === true) {
        delete updateDoc.Fusao;
      }

      if (existente?.Fusao?.fundido !== true && Object.prototype.hasOwnProperty.call(dados, 'Fusao')) {
        const fusaoSan = sanitizarFusao(dados.Fusao);
        if (fusaoSan) updateDoc.Fusao = fusaoSan;
      }

      if (Object.prototype.hasOwnProperty.call(updateDoc, 'numeroProtocolo')) {
        delete updateDoc.numeroProtocolo;
      }

      Object.assign(updateDoc, aplicarSyncProtocolosNoPayload(existente, updateDoc, tipo));

      aplicarPrazoAutomaticoPorColecao(updateDoc, collection.collectionName, existente.createdAt);

      const resultado = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateDoc }
      );

      if (resultado.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada'
        });
      }

      console.log(`✅ Reclamação atualizada: ${id}`);

      const atualizado = await collection.findOne({ _id: new ObjectId(id) });
      const finNovo =
        updateDoc.Finalizado != null && typeof updateDoc.Finalizado === 'object'
          ? updateDoc.Finalizado
          : null;
      const resolvidoAgora = finNovo?.Resolvido === true;
      const eraResolvido = existente?.Finalizado?.Resolvido === true;

      if (resolvidoAgora && !eraResolvido && atualizado) {
        const ticketNum = resolveOctadeskTicketFromReclamacao(atualizado);
        if (ticketNum) {
          octadeskSyncFireAndForget(
            () => markTicketResolved(ticketNum),
            `reclamacao-resolvida-${id}`
          );
        }
      }

      res.json({
        success: true,
        message: 'Reclamação atualizada com sucesso',
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar reclamação',
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/ouvidoria/reclamacoes/:id
   * Excluir reclamação (documento removido da coleção do tipo informado)
   * Query: tipo (obrigatório) — mesmo conjunto de valores aceitos em PUT
   */
  router.delete('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { id } = req.params;
      const { tipo } = req.query;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!tipo || !String(tipo).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tipo é obrigatório (query param tipo)'
        });
      }

      const collection = getCollectionByType(db, tipo);
      const resultado = await collection.deleteOne({ _id: new ObjectId(id) });

      if (resultado.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada na coleção do tipo informado'
        });
      }

      console.log(`✅ Reclamação excluída: ${id} (tipo: ${tipo})`);

      res.json({
        success: true,
        message: 'Reclamação excluída com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao excluir reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir reclamação',
        error: error.message
      });
    }
  });

  return router;
};

module.exports = initReclamacoesRoutes;

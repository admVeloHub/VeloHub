/**
 * Smoke + checklist regressão legado — ouvidoriaProtocolosCanon.js
 * VERSION: v1.1.0 | DATE: 2026-05-21
 *
 * Executar: node backend/scripts/test-ouvidoriaProtocolosCanon.js
 *
 * Checklist regressão (docs legados — leitura/escrita conservadora):
 * 1. RA só idEntrada → extract + sync preenchem protocolosReclameAqui
 * 2. Procon só codigoProcon → extract + sync preenchem protocolosProcon
 * 3. TP só protocoloOctadesk → extract CENTRAL + sync protocolosCentral
 * 4. Doc só ticketRegistro (sem arrays) → extract CENTRAL em TP; mirror N2/BACEN em gravação
 * 5. Arrays já preenchidos → sync não sobrescreve
 */
const m = require('../utils/ouvidoriaProtocolosCanon');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// 1 — RA legado só idEntrada
const ra = { tipo: 'RECLAME_AQUI', idEntrada: '123456789' };
assert(
  JSON.stringify(m.extractProtocolosFromDoc(ra, 'RECLAME_AQUI')) === '["123456789"]',
  'extract RA idEntrada failed'
);
const syncedRa = m.syncNativoParaBloco792({ idEntrada: '999888777', protocolosReclameAqui: [] }, 'RECLAME_AQUI');
assert(syncedRa.reclameAqui === true && syncedRa.protocolosReclameAqui[0] === '999888777', 'sync RA failed');

// 2 — Procon só codigoProcon
const pc = { tipo: 'PROCON', codigoProcon: 'ABCD1234EFGH5678' };
assert(m.extractProtocolosFromDoc(pc, 'PROCON')[0] === 'ABCD1234EFGH5678', 'extract Procon codigo failed');
const syncedPc = m.syncNativoParaBloco792({ codigoProcon: 'ABCD1234EFGH5678' }, 'PROCON');
assert(syncedPc.procon === true && syncedPc.protocolosProcon[0] === 'ABCD1234EFGH5678', 'sync Procon failed');

// 3 — Time Portabilidade protocoloOctadesk
const tp = { tipo: 'TIME_PORTABILIDADE', protocoloOctadesk: 'OCT-12345' };
assert(m.extractProtocolosFromDoc(tp, 'CENTRAL')[0] === 'OCT-12345', 'extract TP octadesk failed');
const syncedTp = m.syncNativoParaBloco792({ protocoloOctadesk: 'OCT-12345' }, 'TIME_PORTABILIDADE');
assert(syncedTp.acionouCentral === true && syncedTp.protocolosCentral[0] === 'OCT-12345', 'sync TP failed');

// 4 — só ticketRegistro (TP leitura CENTRAL)
const tpTicket = { tipo: 'TIME_PORTABILIDADE', ticketRegistro: '777888' };
assert(m.extractProtocolosFromDoc(tpTicket, 'CENTRAL')[0] === '777888', 'extract TP ticketRegistro failed');
const mirrorN2 = m.mirrorTicketRegistro({}, 'OUVIDORIA', '555123');
assert(mirrorN2.n2SegundoNivel === true && mirrorN2.protocolosN2[0] === '555123', 'mirror N2 failed');
const mirrorBacen = m.mirrorTicketRegistro({}, 'BACEN', '111222');
assert(mirrorBacen.acionouCentral === true && mirrorBacen.protocolosCentral[0] === '111222', 'mirror BACEN failed');

// 5 — arrays já preenchidos não sobrescritos
const raPreenchido = m.syncNativoParaBloco792(
  { idEntrada: '111111111', protocolosReclameAqui: ['EXISTENTE'], reclameAqui: true },
  'RECLAME_AQUI'
);
assert(raPreenchido.protocolosReclameAqui[0] === 'EXISTENTE', 'sync must not overwrite RA array');

const agg = m.aggregateProtocolosFromRegistros(
  [{ tipo: 'RECLAME_AQUI', idEntrada: '222333444' }],
  { tipoExcluir: 'PROCON', tipoFormulario: 'PROCON' }
);
assert(agg.reclameAqui === true && agg.protocolosReclameAqui[0] === '222333444', 'aggregate RA idEntrada failed');

console.log('ouvidoriaProtocolosCanon: ok (smoke + regressão legado)');

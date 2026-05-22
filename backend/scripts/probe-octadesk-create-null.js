/**
 * Diagnóstico POST /tickets — erro "Value cannot be null. (Parameter 'input')".
 * VERSION: v1.0.0 | DATE: 2026-05-21
 * Uso: node backend/scripts/probe-octadesk-create-null.js
 */
'use strict';

const path = require('path');
const fs = require('fs');

(function loadVelohubFonteEnv(here) {
  let d = here;
  for (let i = 0; i < 16; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(path.join(__dirname, '..'));

const config = require('../config');
const {
  isOctadeskConfigured,
  getResolvedStatusId,
  buildCreateTicketFromReclamacao,
  createTicket,
} = require('../services/octadesk/octadeskTicketsService');

async function tryPost(label, body) {
  const res = await createTicket(body);
  const err = res.error ? String(res.error).slice(0, 120) : '';
  const num = res.ticketNumber != null ? String(res.ticketNumber) : '';
  console.log(label, res.ok ? `OK #${num}` : err);
}

async function main() {
  if (!isOctadeskConfigured()) {
    console.error('Octadesk não configurado.');
    process.exit(1);
  }
  const sid = getResolvedStatusId();
  const base = {
    summary: 'Probe VeloHub null',
    description: 'Teste diagnóstico',
    idCurrentStatus: sid,
  };
  console.log('ENV', {
    idForm: config.OCTADESK_ID_FORM || '(vazio)',
    idSubject: config.OCTADESK_SUBJECT_CASOS_ESPECIAIS_ID || '(vazio)',
    numberChannel: config.OCTADESK_NUMBER_CHANNEL || '(vazio)',
    statusIdLen: sid ? sid.length : 0,
  });

  await tryPost('sem requester', { ...base });
  await tryPost('requester email', { ...base, requester: { email: 'probe@velotax.com.br' } });

  const mock = {
    tipo: 'RECLAME_AQUI',
    numeroProtocolo: 'PROBE-001',
    cpf: '09876543211',
    descricao: 'teste',
    createdAt: new Date(),
  };
  const built = buildCreateTicketFromReclamacao(mock, 'RECLAME_AQUI');
  const req = built.requester && typeof built.requester === 'object' ? built.requester : null;
  console.log('built requester', req && 'email' in req ? String(req.email).slice(0, 40) : '(none)');
  await tryPost('buildCreate sem email doc', built);

  const mock2 = { ...mock, email: 'cliente@exemplo.com' };
  await tryPost('buildCreate com email', buildCreateTicketFromReclamacao(mock2, 'RECLAME_AQUI'));

  if (config.OCTADESK_ID_FORM) {
    await tryPost('com idForm env', {
      ...base,
      requester: { email: 'probe@velotax.com.br' },
      idForm: config.OCTADESK_ID_FORM,
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

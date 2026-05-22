/**
 * Lista status de tickets Octadesk (GET /tickets/status) — use o id de «Resolvido» em OCTADESK_STATUS_RESOLVIDO_ID.
 * VERSION: v1.0.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * Uso: node backend/scripts/list-octadesk-ticket-status.js
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

const { isOctadeskConfigured, listTicketStatuses } = require('../services/octadesk/octadeskTicketsService');

async function main() {
  if (!isOctadeskConfigured()) {
    console.error('Octadesk não configurado (OCTADESK_API_TOKEN ou email/senha).');
    process.exit(1);
  }
  const result = await listTicketStatuses();
  if (!result.ok) {
    console.error('Erro:', result.error);
    process.exit(1);
  }
  const rows = result.statuses || [];
  if (!rows.length) {
    console.log('Nenhum status retornado.');
    process.exit(0);
  }
  console.log('id\tname');
  for (const s of rows) {
    console.log(`${s.id}\t${s.name}`);
  }
  const resolvido = rows.find((s) => /resolv/i.test(s.name));
  if (resolvido) {
    console.log('\nSugestão OCTADESK_STATUS_RESOLVIDO_ID=' + resolvido.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

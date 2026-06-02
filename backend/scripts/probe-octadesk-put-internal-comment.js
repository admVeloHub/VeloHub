/**
 * Probe PUT /tickets/{number} — comentário interno (spec Tickets/update).
 * VERSION: v1.0.0 | DATE: 2026-05-22
 *
 * Uso: node backend/scripts/probe-octadesk-put-internal-comment.js [ticketNumber]
 */
'use strict';

const { loadFonteEnv } = require('../utils/loadFonteEnv');
loadFonteEnv(__dirname);

const {
  isOctadeskConfigured,
  addInternalComment,
  resolveTicketNumberForPutApi,
  resolveOctadeskAgentEmail,
  getTicketsBaseUrl,
} = require('../services/octadesk/octadeskTicketsService');

async function main() {
  if (!isOctadeskConfigured()) {
    console.error('Octadesk não configurado.');
    process.exit(1);
  }

  const raw = process.argv[2] || process.env.OCTADESK_PROBE_TICKET_NUMBER || '';
  const num = resolveTicketNumberForPutApi(raw);
  if (!num) {
    console.error('Informe o número do ticket: node probe-octadesk-put-internal-comment.js 100150402');
    process.exit(1);
  }

  console.log('Base tickets:', getTicketsBaseUrl());
  console.log('octa-agent-email:', resolveOctadeskAgentEmail());
  console.log('PUT path number:', num);

  const texto = `Probe VeloHub comentário interno ${new Date().toISOString()}`;
  const res = await addInternalComment(num, texto);
  if (res.ok) {
    console.log('OK — comentário interno enviado no ticket', res.ticketNumber || num);
    process.exit(0);
  }
  console.error('Falha:', res.error, res.status != null ? `HTTP ${res.status}` : '');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

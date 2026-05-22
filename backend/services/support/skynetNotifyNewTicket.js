/**
 * Notificação ao SKYNET quando um novo ticket Apoio é criado no VeloHub
 * VERSION: v1.3.3 | DATE: 2026-05-04 | AUTHOR: VeloHub Development Team
 * v1.3.3: res.json(); aviso se corpo ausente; emails=x/y com Number() para attempted/succeeded
 * v1.3.2: Em OK com notified=true, loga emails=succeeded/attempted (Skynet só envia a responsáveis _userTickets, não ao solicitante)
 * v1.3.1: Interpreta JSON do Skynet em HTTP 2xx — alerta se notified=false / skipReason (e-mail pode não ter sido enviado)
 * v1.3.0: Log explícito em sucesso (HTTP 2xx) para operação no terminal; removida instrumentação debug ingest
 * v1.2.0: Header X-Velohub-Ticket-Notify-Secret (VELOHUB_TICKET_NOTIFY_SECRET, somente se não vazio); corpo JSON apenas ticketId + collectionKind — alinhado ao requireVelohubTicketNotifySecret Skynet
 * v1.1.0: Campo secret no JSON (VELOHUB_TICKET_NOTIFY_SECRET via config)
 * v1.0.2: Aviso quando base URL ausente menciona SKYNET ou SKYNET_API_URL (resolução central em config.js)
 * v1.0.1: collectionKind esperado pelo SKYNET — tk_conteudos | tk_gestao (Mongo local deste projeto continua usando a coleção tk_gestão)
 */

const fetch = require('node-fetch');
const config = require('../../config');

const PATH_NOTIFY = '/api/support/notify-new-ticket-velohub';

/**
 * POST JSON para SKYNET (fire-and-forget). Erros de rede ou HTTP não interrompem a criação do ticket.
 * Header (se VELOHUB_TICKET_NOTIFY_SECRET não vazio): X-Velohub-Ticket-Notify-Secret
 * Corpo: { ticketId, collectionKind } apenas.
 * @param {{ ticketId: string, collectionKind: string }} payload
 */
function notifySkynetNewTicket(payload) {
  const raw = typeof config.SKYNET_API_URL === 'string' ? config.SKYNET_API_URL.trim() : '';
  const baseUrl = raw.replace(/\/+$/, '');
  if (!baseUrl) {
    console.warn('[Apoio] SKYNET não configurado (defina SKYNET_API_URL ou SKYNET no .env) — notify-new-ticket-velohub não enviado.');
    return;
  }

  const ticketId = payload && payload.ticketId != null ? String(payload.ticketId) : '';
  const collectionKind = payload && payload.collectionKind != null ? String(payload.collectionKind) : '';
  const secret =
    config.VELOHUB_TICKET_NOTIFY_SECRET != null ? String(config.VELOHUB_TICKET_NOTIFY_SECRET).trim() : '';
  const url = `${baseUrl}${PATH_NOTIFY}`;
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['X-Velohub-Ticket-Notify-Secret'] = secret;
  }

  fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ticketId, collectionKind })
  })
    .then(async (res) => {
      if (!res.ok) {
        console.warn(`[Apoio] SKYNET notify novo ticket HTTP ${res.status} (ticketId=${ticketId})`);
        return;
      }
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (!body) {
        console.warn(
          `[Apoio] SKYNET HTTP ${res.status} corpo JSON inválido ou vazio (ticketId=${ticketId}) — veja logs do Skynet`
        );
        return;
      }
      if (body && body.skipped === true) {
        console.log(
          `[Apoio] SKYNET notify skip HTTP ${res.status} (ticketId=${ticketId}) reason=${body.reason || 'n/d'}`
        );
        return;
      }
      if (body && body.notified === false) {
        console.warn(
          `[Apoio] SKYNET HTTP ${res.status} porém sem envio de e-mail (ticketId=${ticketId}) skipReason=${
            body.skipReason || 'n/d'
          } ticketType=${body.ticketType || 'n/d'}`
        );
        return;
      }
      if (body && body.success === false) {
        console.warn(
          `[Apoio] SKYNET HTTP ${res.status} resposta success=false (ticketId=${ticketId}) skipReason=${
            body.skipReason || body.error || 'n/d'
          }`
        );
        return;
      }
      const att = Number(body.attempted);
      const suc = Number(body.succeeded);
      const mailCounts =
        Number.isFinite(att) && Number.isFinite(suc) ? ` emails=${suc}/${att}` : '';
      console.log(
        `[Apoio] SKYNET notify OK HTTP ${res.status} (ticketId=${ticketId})${mailCounts}`
      );
    })
    .catch((err) => {
      console.error('[Apoio] Erro ao chamar SKYNET notify-new-ticket-velohub:', err.message);
    });
}

module.exports = { notifySkynetNewTicket };

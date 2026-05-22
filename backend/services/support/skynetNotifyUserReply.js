/**
 * Notificação ao SKYNET quando o solicitante adiciona mensagem a um ticket Apoio (VeloHub grava no Mongo via PUT local).
 * VERSION: v1.1.1 | DATE: 2026-05-08 | AUTHOR: VeloHub Development Team
 * v1.1.1: Ordem das verificações: partial_send_failure (success=false) não cai em "sem envio"; log de parcial com emails=x/y
 * v1.1.0: Logs emails=succeeded/attempted quando o JSON do Skynet traz os campos (alinhado a skynetNotifyNewTicket)
 *
 * Mesmo contrato de autenticação que skynetNotifyNewTicket.js (header X-Velohub-Ticket-Notify-Secret).
 */

const fetch = require('node-fetch');
const config = require('../../config');

const PATH_NOTIFY = '/api/support/notify-user-reply-velohub';

/**
 * Dispara envio de e-mail de “nova resposta” no SKYNET (fire-and-forget).
 * @param {{ ticketId: string, collectionKind: string }} payload
 */
function notifySkynetUserReply(payload) {
  const raw = typeof config.SKYNET_API_URL === 'string' ? config.SKYNET_API_URL.trim() : '';
  const baseUrl = raw.replace(/\/+$/, '');
  if (!baseUrl) {
    console.warn(
      '[Apoio] SKYNET não configurado — notify-user-reply-velohub não enviado (resposta do solicitante).'
    );
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
        console.warn(`[Apoio] SKYNET notify resposta solicitante HTTP ${res.status} (ticketId=${ticketId})`);
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
          `[Apoio] SKYNET notify resposta solicitante HTTP ${res.status} corpo inválido (ticketId=${ticketId})`
        );
        return;
      }
      if (body.skipped === true) {
        console.log(
          `[Apoio] SKYNET notify resposta skip (ticketId=${ticketId}) reason=${body.reason || 'n/d'}`
        );
        return;
      }
      if (body.success === false) {
        const att = Number(body.attempted);
        const suc = Number(body.succeeded);
        const mailCounts =
          Number.isFinite(att) && Number.isFinite(suc) ? ` emails=${suc}/${att}` : '';
        if (body.skipReason === 'partial_send_failure' && mailCounts) {
          console.warn(
            `[Apoio] SKYNET notify resposta envio parcial (ticketId=${ticketId})${mailCounts}`
          );
        } else {
          console.warn(
            `[Apoio] SKYNET notify resposta success=false (ticketId=${ticketId}) skipReason=${body.skipReason || 'n/d'}${mailCounts}`
          );
        }
        return;
      }
      if (body.notified === false && body.skipReason) {
        console.warn(
          `[Apoio] SKYNET notify resposta sem envio (ticketId=${ticketId}) skipReason=${body.skipReason}`
        );
        return;
      }
      const att = Number(body.attempted);
      const suc = Number(body.succeeded);
      const mailCounts =
        Number.isFinite(att) && Number.isFinite(suc) ? ` emails=${suc}/${att}` : '';
      console.log(
        `[Apoio] SKYNET notify resposta solicitante OK (ticketId=${ticketId})${mailCounts}`
      );
    })
    .catch((err) => {
      console.error('[Apoio] Erro ao chamar SKYNET notify-user-reply-velohub:', err.message);
    });
}

module.exports = { notifySkynetUserReply };

/**
 * Envio de denúncia ao SKYNET (canal VeloHub → e-mail)
 * VERSION: v1.0.2 | DATE: 2026-06-08 | AUTHOR: VeloHub Development Team
 *
 * - v1.0.2: Falha antecipada sem VELOHUB_TICKET_NOTIFY_SECRET; mensagem amigável em 403 do SKYNET
 *
 * POST /api/support/send-denuncia-velohub
 * Header: X-Velohub-Ticket-Notify-Secret
 * - v1.0.1: Usa SKYNET_DENUNCIA_API_URL (GCP em prod; dev local não depende de localhost:3001)
 */

const fetch = require('node-fetch');
const config = require('../../config');

const PATH_SEND = '/api/support/send-denuncia-velohub';

/**
 * @param {{ modoComunicacao: string, mensagem: string, reportedBy?: { name: string, email: string } | null }} payload
 * @returns {Promise<{ success: boolean, sent?: boolean, error?: string, status?: number }>}
 */
async function sendDenunciaViaSkynet(payload) {
  const raw =
    typeof config.SKYNET_DENUNCIA_API_URL === 'string' ? config.SKYNET_DENUNCIA_API_URL.trim() : '';
  const baseUrl = raw.replace(/\/+$/, '');
  if (!baseUrl) {
    return {
      success: false,
      error: 'SKYNET denúncias não configurado (SKYNET_DENUNCIA_API_URL)',
      status: 503,
    };
  }

  const secret =
    config.VELOHUB_TICKET_NOTIFY_SECRET != null ? String(config.VELOHUB_TICKET_NOTIFY_SECRET).trim() : '';
  if (!secret) {
    console.warn('[Denúncias] VELOHUB_TICKET_NOTIFY_SECRET ausente — SKYNET rejeitaria a requisição (403)');
    return {
      success: false,
      error:
        'Canal de denúncias não configurado no servidor (VELOHUB_TICKET_NOTIFY_SECRET). Contate o administrador.',
      status: 503,
    };
  }
  const url = `${baseUrl}${PATH_SEND}`;
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['X-Velohub-Ticket-Notify-Secret'] = secret;
  }

  const body = {
    modoComunicacao: payload.modoComunicacao,
    mensagem: payload.mensagem,
  };
  if (payload.reportedBy) {
    body.reportedBy = payload.reportedBy;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      let errMsg =
        (data && (data.error || data.message)) ||
        `SKYNET respondeu HTTP ${res.status}`;
      if (res.status === 403) {
        errMsg =
          'Canal de denúncias: credencial do servidor inválida ou ausente (VELOHUB_TICKET_NOTIFY_SECRET). Contate o administrador.';
      }
      console.warn(`[Denúncias] SKYNET send-denuncia HTTP ${res.status}`);
      return { success: false, error: errMsg, status: res.status };
    }

    if (data && data.success === false) {
      return {
        success: false,
        error: data.error || 'Falha ao enviar denúncia',
        status: res.status,
      };
    }

    return { success: true, sent: data?.sent === true };
  } catch (err) {
    console.error(
      `[Denúncias] Erro ao chamar SKYNET send-denuncia-velohub (${baseUrl}):`,
      err.message
    );
    return { success: false, error: 'Não foi possível contatar o serviço de envio', status: 502 };
  }
}

module.exports = { sendDenunciaViaSkynet };

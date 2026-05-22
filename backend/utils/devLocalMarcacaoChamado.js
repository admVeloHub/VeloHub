/**
 * VeloHub — Gate para marcar chamado (feito / não feito) só em dev + rede local + e-mail configurado.
 * VERSION: v1.0.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Env (backend):
 * - VELOHUB_DEV_MARCACAO_CHAMADO_ENABLED=true|1
 * - VELOHUB_DEV_MARCACAO_CHAMADO_EMAIL=mail1@gmail.com,mail2@dominio.com (header x-user-email deve casar)
 * - VELOHUB_DEV_MARCACAO_CHAMADO_ALLOW_LAN=true|1 (opcional — senão apenas loopback 127.* / ::1)
 */

/**
 * Normaliza IPv4 e remove prefixo IPv4-mapeado em IPv6 (::ffff:x.x.x.x)
 * @param {string} ip
 * @returns {string}
 */
function normalizaIpCliente(ip) {
  if (!ip || typeof ip !== 'string') return '';
  let s = ip.trim();
  if (s.startsWith('::ffff:')) s = s.slice(7);
  return s;
}

/**
 * IPv4 privado típico de LAN (RFC1918)
 * @param {string} ipStr
 */
function ehIpv4LanPrivado(ipStr) {
  const m = ipStr.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/**
 * @param {import('express').Request} req
 * @returns {{ ok: boolean, reason?: string }}
 */
function permiteDevMarcacaoChamado(req) {
  if (process.env.NODE_ENV !== 'development') return { ok: false, reason: 'not_development' };

  const enabled = process.env.VELOHUB_DEV_MARCACAO_CHAMADO_ENABLED;
  const on =
    enabled === '1' || String(enabled || '').trim().toLowerCase() === 'true';
  if (!on) return { ok: false, reason: 'disabled' };

  const allowListRaw = String(process.env.VELOHUB_DEV_MARCACAO_CHAMADO_EMAIL || '').trim();
  if (!allowListRaw) return { ok: false, reason: 'no_allowlist_email' };

  const headerEmail = String(
    req.headers['x-user-email'] || req.headers['X-User-Email'] || ''
  )
    .trim()
    .toLowerCase();
  if (!headerEmail) return { ok: false, reason: 'no_x_user_email' };

  const allow = allowListRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.includes(headerEmail)) return { ok: false, reason: 'email_not_allowed' };

  const rawIp =
    typeof req.socket?.remoteAddress === 'string' ? req.socket.remoteAddress : '';
  const expressIp =
    typeof req.ip === 'string' && req.ip !== '' ? req.ip : '';

  /** @type Set<string> */
  const ips = new Set([
    rawIp ? normalizaIpCliente(rawIp) : '',
    expressIp ? normalizaIpCliente(expressIp) : ''
  ].filter(Boolean));

  const allowLanRaw = process.env.VELOHUB_DEV_MARCACAO_CHAMADO_ALLOW_LAN;
  const allowLan =
    allowLanRaw === '1' ||
    String(allowLanRaw || '').trim().toLowerCase() === 'true';

  let okRede = false;
  for (const ip of ips) {
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.')) okRede = true;
    if (allowLan && ehIpv4LanPrivado(ip)) okRede = true;
    if (
      allowLan &&
      (ip.includes('fec0:') || /^fd([0-9a-f]{2}):/i.test(ip))
    )
      okRede = true;
  }

  if (!okRede) return { ok: false, reason: 'not_local_network' };

  return { ok: true };
}

module.exports = { permiteDevMarcacaoChamado, normalizaIpCliente };

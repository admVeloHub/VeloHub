/**
 * Mostrar ferramentas de marcação rápida (feito / não feito): flag + conta + hostname seguro (localhost ou LAN configurada).
 * VERSION: v1.2.1 | DATE: 2026-05-15 | AUTHOR: VeloHub Development Team
 *
 * Referência:
 * - v1.2.1: Comentários — referência ao cliente `requisicoesApi.js` (antes escalacoesApi)
 * - v1.2.0: Removido bloqueio por NODE_ENV; front na rede local usa bundle «production» (ex.: porta 8080).
 *           Segurança: só aparece se REACT_APP_VELOHUB_DEV_MARCACAO_CHAMADO, lista de e-mails e hostname compatível.
 * - v1.1.0: ALLOW_LAN também aceita hostname «curto» (nome do PC na rede) e *.local;
 *           e-mail opcional usa o mesmo fallback de localStorage que requisicoesApi (x-user-email).
 *
 * .env.local (frontend, espelhar regras do backend):
 * - REACT_APP_VELOHUB_DEV_MARCACAO_CHAMADO=1
 * - REACT_APP_VELOHUB_DEV_MARCACAO_EMAIL=email@que.pode usar
 * - REACT_APP_VELOHUB_DEV_MARCACAO_ALLOW_LAN=1 opcional para abrir quando hostname é 192.168.x etc.
 */

/**
 * Hostname atual é considerado “máquina local” ou LAN privada quando ALLOW_LAN.
 * @param {string} hostname
 * @returns {boolean}
 */
function hostnameCompativelMarcacaoDev(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

  const allowLan =
    process.env.REACT_APP_VELOHUB_DEV_MARCACAO_ALLOW_LAN === '1' ||
    String(process.env.REACT_APP_VELOHUB_DEV_MARCACAO_ALLOW_LAN || '').toLowerCase() === 'true';
  if (!allowLan) return false;

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

  // Acesso típico na LAN pelo nome da máquina (sem FQDN) ou mDNS, ex.: http://DESKTOP-xyz:3000
  const h = String(hostname || '').trim().toLowerCase();
  if (/\.local$/.test(h)) return true;
  if (/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(h) && !h.includes('.')) return true;

  return false;
}

/**
 * Mesma ordem de chaves que `headersSessaoVelohubPreferencia` em requisicoesApi (paridade com backend x-user-email).
 * @returns {string}
 */
function lerEmailPreferenciaUsuarioVelohub() {
  try {
    if (typeof localStorage === 'undefined') return '';
    const sessionData =
      localStorage.getItem('velohub_user_session') ||
      localStorage.getItem('veloacademy_user_session') ||
      localStorage.getItem('user_session');

    if (sessionData) {
      const session = JSON.parse(sessionData);
      const email = session?.user?.email || session?.email || '';
      return String(email || '').trim().toLowerCase();
    }
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * @returns {boolean}
 */
export function exibirMenusMarcacaoDevChamado() {
  // Não exigir NODE_ENV=development: o SPA em rede local costuma rodar bundle de produção (ex.: porta 8080).
  // Produção na nuvem: hostname público não passa em hostnameCompativelMarcacaoDev; sem EMAIL/flag não aparece UI.
  const on =
    process.env.REACT_APP_VELOHUB_DEV_MARCACAO_CHAMADO === '1' ||
    String(process.env.REACT_APP_VELOHUB_DEV_MARCACAO_CHAMADO || '').toLowerCase() === 'true';
  if (!on) return false;
  if (typeof window === 'undefined') return false;

  const list = listaEmailsMarcacaoDevNormalizados();
  if (list.length === 0) return false;

  return hostnameCompativelMarcacaoDev(String(window.location.hostname || '').trim());
}

/**
 * @returns {string[]}
 */
export function listaEmailsMarcacaoDevNormalizados() {
  const raw = String(process.env.REACT_APP_VELOHUB_DEV_MARCACAO_EMAIL || '').trim();
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {string|null|undefined} [emailUsuario] — opcional; se vazio usa localStorage VeloHub (igual requisicoesApi).
 * @returns {boolean}
 */
export function usuarioPodeMarcacaoDevChamado(emailUsuario) {
  if (!exibirMenusMarcacaoDevChamado()) return false;
  const explicit = String(emailUsuario || '').trim().toLowerCase();
  const u = explicit || lerEmailPreferenciaUsuarioVelohub();
  if (!u) return false;
  return listaEmailsMarcacaoDevNormalizados().includes(u);
}

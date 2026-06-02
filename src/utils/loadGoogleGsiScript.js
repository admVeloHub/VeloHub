/**
 * VeloHub V3 — Carrega Google Identity Services (GSI)
 * VERSION: v1.0.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 */

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_ID = 'velohub-google-gsi-client';

/**
 * @returns {Promise<void>}
 */
export function loadGoogleGsiScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Ambiente indisponível'));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  const existing = document.getElementById(GSI_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Google GSI')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Google GSI'));
    document.head.appendChild(script);
  });
}

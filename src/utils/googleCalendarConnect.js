/**
 * VeloHub V3 — OAuth Google Calendar (popup + authorization code)
 * VERSION: v1.0.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 */

import { getClientId } from '../config/google-config';
import { loadGoogleGsiScript } from './loadGoogleGsiScript';

const CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

/**
 * @returns {Promise<string>} authorization code
 */
export async function requestGoogleCalendarAuthorizationCode() {
  await loadGoogleGsiScript();

  const clientId = getClientId();
  if (!clientId) {
    throw new Error('Client ID do Google não configurado');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: CALENDAR_READONLY_SCOPE,
        ux_mode: 'popup',
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          if (response.code) {
            resolve(response.code);
            return;
          }
          reject(new Error('Código de autorização não recebido'));
        },
      });
      client.requestCode();
    } catch (error) {
      reject(error);
    }
  });
}

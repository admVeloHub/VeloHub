// VERSION: v1.1.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
/**
 * Agenda Velotax — mesmo padrão do e-mail (Gmail API):
 * DB console_config, coleção email_config, documento _id email_calendar_api
 *
 * Campos do documento:
 * - feedEmail: conta Google cujo calendário primary alimenta o widget
 * - accessToken, refreshToken, expiryDate, scope: OAuth Google Calendar
 * - createdAt, updatedAt
 */

const CONFIG_DB_NAME = process.env.CONSOLE_CONFIG_DB || 'console_config';
const COLLECTION_NAME =
  process.env.VELHUB_EMAIL_CONFIG_COLLECTION ||
  process.env.VELHUB_EMAIL_TRANSPORT_COLLECTION ||
  'email_config';
const FEED_DOCUMENT_ID =
  process.env.VELHUB_EMAIL_CALENDAR_DOCUMENT_ID || 'email_calendar_api';

function getGoogleCalendarFeedCollection(client) {
  return client.db(CONFIG_DB_NAME).collection(COLLECTION_NAME);
}

module.exports = {
  CONFIG_DB_NAME,
  COLLECTION_NAME,
  FEED_DOCUMENT_ID,
  getGoogleCalendarFeedCollection,
};

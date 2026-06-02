/**
 * VeloHub V3 — Google Calendar (agenda corporativa Velotax)
 * VERSION: v1.2.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Singleton console_config.email_config (_id email_calendar_api).
 * feedEmail definido no Console; tokens OAuth vinculados a essa conta.
 */

const { google } = require('googleapis');
const {
  FEED_DOCUMENT_ID,
  getGoogleCalendarFeedCollection,
} = require('../../config/googleCalendarFeedConfig');

const CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const OAUTH_REDIRECT_URI = 'postmessage';
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

function getOAuthClientId() {
  return (
    process.env.GOOGLE_ID_CONSOLE ||
    process.env.GOOGLE_OAUTH_CLIENT_ID ||
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    ''
  );
}

function getOAuthClientSecret() {
  return process.env.GOOGLE_SECRET_CONSOLE || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
}

function createOAuth2Client() {
  return new google.auth.OAuth2(getOAuthClientId(), getOAuthClientSecret(), OAUTH_REDIRECT_URI);
}

function normalizeEmail(email) {
  return email != null ? String(email).trim().toLowerCase() : '';
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function getFeedDoc(mongoClient, connectToMongo) {
  await connectToMongo();
  const col = getGoogleCalendarFeedCollection(mongoClient);
  return col.findOne({ _id: FEED_DOCUMENT_ID });
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function getFeedConfig(mongoClient, connectToMongo) {
  const doc = await getFeedDoc(mongoClient, connectToMongo);
  const feedEmail = normalizeEmail(doc?.feedEmail);
  const connected = Boolean(feedEmail && (doc?.refreshToken || doc?.accessToken));
  return {
    feedEmail,
    connected,
    documentId: FEED_DOCUMENT_ID,
  };
}

/**
 * @param {string} feedEmail
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function saveFeedEmail(feedEmail, mongoClient, connectToMongo) {
  const normalized = normalizeEmail(feedEmail);
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Informe um e-mail válido da conta Google que contém a agenda');
  }

  await connectToMongo();
  const col = getGoogleCalendarFeedCollection(mongoClient);
  const existing = await col.findOne({ _id: FEED_DOCUMENT_ID });
  const now = new Date();
  const emailChanged = existing?.feedEmail && normalizeEmail(existing.feedEmail) !== normalized;

  const update = {
    $set: {
      feedEmail: normalized,
      updatedAt: now,
    },
    $setOnInsert: {
      _id: FEED_DOCUMENT_ID,
      createdAt: now,
    },
  };

  if (emailChanged) {
    update.$unset = {
      accessToken: '',
      refreshToken: '',
      expiryDate: '',
      scope: '',
    };
  }

  await col.updateOne({ _id: FEED_DOCUMENT_ID }, update, { upsert: true });
  return getFeedConfig(mongoClient, connectToMongo);
}

/**
 * @param {string} code
 */
async function exchangeAuthorizationCode(code) {
  const oauth2 = createOAuth2Client();
  const { tokens } = await oauth2.getToken({
    code,
    redirect_uri: OAUTH_REDIRECT_URI,
  });
  return tokens;
}

function normalizeTokenPayload(tokens) {
  const expiryDate =
    tokens.expiry_date != null
      ? Number(tokens.expiry_date)
      : tokens.expires_in
        ? Date.now() + Number(tokens.expires_in) * 1000
        : null;

  return {
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    expiryDate,
    scope: tokens.scope || CALENDAR_READONLY_SCOPE,
  };
}

/**
 * @param {import('google-auth-library').Credentials} tokens
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function saveFeedTokens(tokens, mongoClient, connectToMongo) {
  const doc = await getFeedDoc(mongoClient, connectToMongo);
  const feedEmail = normalizeEmail(doc?.feedEmail);
  if (!feedEmail) {
    const err = new Error('Informe e salve o e-mail da agenda antes de conectar');
    err.code = 'FEED_EMAIL_REQUIRED';
    throw err;
  }

  const normalized = normalizeTokenPayload(tokens);
  const refreshToken = normalized.refreshToken || doc?.refreshToken || null;

  if (!refreshToken && !normalized.accessToken) {
    throw new Error('Tokens inválidos recebidos do Google');
  }

  const col = getGoogleCalendarFeedCollection(mongoClient);
  await col.updateOne(
    { _id: FEED_DOCUMENT_ID },
    {
      $set: {
        feedEmail,
        accessToken: normalized.accessToken || doc?.accessToken || null,
        refreshToken,
        expiryDate: normalized.expiryDate || doc?.expiryDate || null,
        scope: normalized.scope || doc?.scope || CALENDAR_READONLY_SCOPE,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        _id: FEED_DOCUMENT_ID,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function disconnectFeed(mongoClient, connectToMongo) {
  const doc = await getFeedDoc(mongoClient, connectToMongo);
  if (!doc) return;

  if (doc.accessToken || doc.refreshToken) {
    try {
      const oauth2 = createOAuth2Client();
      oauth2.setCredentials({
        access_token: doc.accessToken || undefined,
        refresh_token: doc.refreshToken || undefined,
      });
      if (doc.accessToken) {
        await oauth2.revokeToken(doc.accessToken);
      }
    } catch (err) {
      console.warn('[googleCalendar] revokeToken:', err.message);
    }
  }

  const col = getGoogleCalendarFeedCollection(mongoClient);
  await col.updateOne(
    { _id: FEED_DOCUMENT_ID },
    {
      $unset: {
        accessToken: '',
        refreshToken: '',
        expiryDate: '',
        scope: '',
      },
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function getAuthorizedOAuth2Client(mongoClient, connectToMongo) {
  const doc = await getFeedDoc(mongoClient, connectToMongo);
  const feedEmail = normalizeEmail(doc?.feedEmail);

  if (!feedEmail) {
    const err = new Error('E-mail da agenda não configurado');
    err.code = 'FEED_NOT_CONFIGURED';
    throw err;
  }

  if (!doc?.refreshToken && !doc?.accessToken) {
    const err = new Error('Google Calendar não conectado para a agenda configurada');
    err.code = 'NOT_CONNECTED';
    throw err;
  }

  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({
    access_token: doc.accessToken || undefined,
    refresh_token: doc.refreshToken || undefined,
    expiry_date: doc.expiryDate || undefined,
  });

  const needsRefresh =
    !doc.accessToken ||
    !doc.expiryDate ||
    Date.now() >= Number(doc.expiryDate) - 60_000;

  if (needsRefresh && doc.refreshToken) {
    const { credentials } = await oauth2.refreshAccessToken();
    const normalized = normalizeTokenPayload(credentials);
    await saveFeedTokens(
      {
        ...credentials,
        refresh_token: credentials.refresh_token || doc.refreshToken,
      },
      mongoClient,
      connectToMongo
    );
    oauth2.setCredentials({
      access_token: normalized.accessToken || credentials.access_token,
      refresh_token: credentials.refresh_token || doc.refreshToken,
      expiry_date: normalized.expiryDate || credentials.expiry_date,
    });
  }

  return oauth2;
}

function mapCalendarEvent(event) {
  const start = event.start?.dateTime || event.start?.date || null;
  const end = event.end?.dateTime || event.end?.date || null;
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);

  return {
    id: event.id || null,
    titulo: event.summary || 'Sem título',
    inicio: start,
    fim: end,
    diaInteiro: allDay,
    local: event.location || null,
    url: event.htmlLink || null,
  };
}

/**
 * @param {number} limit
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
async function listUpcomingFeedEvents(limit, mongoClient, connectToMongo) {
  const auth = await getAuthorizedOAuth2Client(mongoClient, connectToMongo);
  const calendar = google.calendar({ version: 'v3', auth });
  const maxResults = Math.min(Math.max(Number(limit) || 4, 1), 20);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
    timeZone: DEFAULT_TIMEZONE,
  });

  return (response.data.items || []).map(mapCalendarEvent);
}

module.exports = {
  CALENDAR_READONLY_SCOPE,
  getFeedConfig,
  saveFeedEmail,
  exchangeAuthorizationCode,
  saveFeedTokens,
  disconnectFeed,
  listUpcomingFeedEvents,
};

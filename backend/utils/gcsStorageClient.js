/**
 * VeloHub V3 — Cliente Google Cloud Storage reutilizável
 * VERSION: v1.0.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 */

const { Storage } = require('@google-cloud/storage');

/**
 * @returns {import('@google-cloud/storage').Storage|null}
 */
function createGcsStorageClient() {
  const gcpProjectId = process.env.GCP_PROJECT_ID;
  const googleCredentials = process.env.GOOGLE_CREDENTIALS;
  const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
    return null;
  }

  if (googleApplicationCredentials) {
    try {
      return new Storage({ projectId: gcpProjectId, keyFilename: googleApplicationCredentials });
    } catch (err) {
      console.error('[gcsStorageClient] GOOGLE_APPLICATION_CREDENTIALS:', err.message);
    }
  }

  if (googleCredentials) {
    if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
      try {
        const credentials = JSON.parse(googleCredentials);
        if (credentials.private_key) {
          credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        return new Storage({ projectId: gcpProjectId, credentials });
      } catch (parseErr) {
        try {
          return new Storage({ projectId: gcpProjectId, keyFilename: googleCredentials });
        } catch (fileErr) {
          console.error('[gcsStorageClient] keyFilename:', fileErr.message);
        }
      }
    } else {
      try {
        return new Storage({ projectId: gcpProjectId, keyFilename: googleCredentials });
      } catch (fileErr) {
        console.error('[gcsStorageClient] keyFilename path:', fileErr.message);
      }
    }
  }

  try {
    return new Storage({ projectId: gcpProjectId });
  } catch (adcErr) {
    console.error('[gcsStorageClient] ADC:', adcErr.message);
    return null;
  }
}

module.exports = { createGcsStorageClient };

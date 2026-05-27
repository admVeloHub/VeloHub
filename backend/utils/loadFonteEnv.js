/**
 * Carrega FONTE DA VERDADE/.env (bootstrapFonteEnv.cjs ou dotenv).
 * VERSION: v1.0.0 | DATE: 2026-05-21
 *
 * @param {string} startDir — diretório inicial da subida (ex.: __dirname de server.js ou scripts/)
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadFonteEnv(startDir) {
  const here = path.resolve(startDir);
  let d = here;
  let bootstrapLoaded = false;

  for (let i = 0; i < 16; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      bootstrapLoaded = true;
      break;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }

  try {
    const dotenv = require('dotenv');
    d = here;
    for (let i = 0; i < 16; i++) {
      const envPath = path.join(d, 'FONTE DA VERDADE', '.env');
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        return { envPath, bootstrapLoaded };
      }
      const parent = path.dirname(d);
      if (parent === d) break;
      d = parent;
    }
  } catch (e) {
    console.warn('⚠️ loadFonteEnv dotenv:', e.message);
  }

  return { envPath: null, bootstrapLoaded };
}

module.exports = { loadFonteEnv };

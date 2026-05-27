/**
 * Carrega MONGO_ENV / MONGODB_URI a partir do ambiente (FONTE DA VERDADE/. em dev).
 * VERSION: v1.2.0 | DATE: 2026-05-21
 * - v1.2.0: FONTE DA VERDADE/.env via loadFonteEnv (dotenv quando bootstrap ausente)
 * VERSION: v1.1.0 | DATE: 2026-05-15
 * - v1.1.0: para `mongodb+srv`, permite DNS público (8.8.8.8 / 1.1.1.1) quando o resolver
 *   do SO recusa querySrv (`ECONNREFUSED`). Opt-out: `VELOHUB_MONGO_DNS_PUBLIC=0`.
 *   Lista customizada: `VELOHUB_MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1` (prioritário sobre o default).
 *
 * Não há fallback com URI, usuário ou senha no repositório.
 * @returns {{ MONGODB_URI: string }}
 */
'use strict';

const dns = require('dns');
const { loadFonteEnv } = require('../utils/loadFonteEnv');

loadFonteEnv(__dirname);

const uri = process.env.MONGO_ENV || process.env.MONGODB_URI;
if (!uri || !String(uri).trim()) {
  console.error(
    '[loadMongoUri] Defina MONGO_ENV ou MONGODB_URI (ex.: FONTE DA VERDADE/. em desenvolvimento).'
  );
  process.exit(1);
}

const trimmed = String(uri).trim();
const isSrvUri = /^mongodb\+srv:\/\//i.test(trimmed);

(function aplicarDnsParaMongoSrv() {
  if (!isSrvUri) return;
  const lista = process.env.VELOHUB_MONGO_DNS_SERVERS;
  if (lista != null && String(lista).trim()) {
    const parts = String(lista)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      dns.setServers(parts);
    }
    return;
  }
  if (process.env.VELOHUB_MONGO_DNS_PUBLIC === '0') {
    return;
  }
  dns.setServers(['8.8.8.8', '1.1.1.1']);
})();

module.exports = { MONGODB_URI: trimmed };

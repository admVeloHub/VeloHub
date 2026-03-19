/**
 * Smoke test: executa GET /stats do router de dashboard ouvidoria com Mongo mockado.
 * Falha se houver ReferenceError, erro de sintaxe na rota ou resposta não-JSON.
 * VERSION: v1.0.0 | DATE: 2026-03-19 | AUTHOR: VeloHub Development Team
 */

const express = require('express');
const initDashboardRoutes = require('../routes/api/ouvidoria/dashboard');

const mockDb = {
  collection: () => ({
    find: () => ({
      toArray: async () => [],
    }),
  }),
};

const mockClient = {
  db: () => mockDb,
};

async function main() {
  const router = initDashboardRoutes(mockClient, async () => {});
  const app = express();
  app.use(router);

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });

  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/stats`);
    let body;
    try {
      body = await res.json();
    } catch (e) {
      console.error('Smoke falhou: resposta não é JSON', e.message);
      process.exit(1);
    }
    if (!res.ok) {
      console.error('Smoke falhou: HTTP', res.status, body);
      process.exit(1);
    }
    if (!body.success) {
      console.error('Smoke falhou: success !== true', body);
      process.exit(1);
    }
    console.log('OK smoke ouvidoria dashboard GET /stats');
  } finally {
    await new Promise((r) => server.close(r));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

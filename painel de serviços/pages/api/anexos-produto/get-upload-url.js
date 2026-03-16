// pages/api/anexos-produto/get-upload-url.js
// VERSION: v1.0.0 | DATE: 2026-03-13 | AUTHOR: VeloHub Development Team
// Proxy para backend: gera signed URL para upload no GCS (mediabank_velohub/anexos_produto)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090').replace(/\/$/, '');
  try {
    const r = await fetch(`${backendUrl}/api/anexos-produto/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Erro ao obter URL de upload' });
  }
}

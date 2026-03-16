/**
 * VeloHub - API Route: Reply Confirm
 * VERSION: v1.1.0 | DATE: 2025-03-13 | AUTHOR: VeloHub Development Team
 * 
 * Endpoint para confirmar visualização de resposta
 * - Busca requisição no MongoDB
 * - Encontra reply específico no array replies
 * - Atualiza confirmedAt e confirmedBy no reply (sem envio WhatsApp)
 */

import { connectToMongo } from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido' });
  }

  try {
    const { requestId, replyMessageId, confirmedBy } = req.body || {};

    // Validação
    if (!requestId || !replyMessageId) {
      return res.status(400).json({
        ok: false,
        error: 'requestId e replyMessageId são obrigatórios'
      });
    }

    // Conectar ao MongoDB
    const client = await connectToMongo();
    const db = client.db('hub_escalacoes');
    const collection = db.collection('solicitacoes_tecnicas');

    // Dynamic import para ObjectId
    const mongodb = await import('mongodb');
    const { ObjectId } = mongodb;
    
    // Buscar documento
    const doc = await collection.findOne({
      _id: ObjectId.isValid(requestId) ? new ObjectId(requestId) : requestId
    });

    if (!doc) {
      return res.status(404).json({
        ok: false,
        error: 'Solicitação não encontrada'
      });
    }

    // Normalizar replies para array
    const replies = Array.isArray(doc.replies) ? doc.replies : [];
    
    // Encontrar índice do reply
    const replyIndex = replies.findIndex(
      r => String(r.replyMessageId) === String(replyMessageId)
    );

    if (replyIndex === -1) {
      return res.status(404).json({
        ok: false,
        error: 'Reply não encontrado'
      });
    }

    const reply = replies[replyIndex];

    // Atualizar confirmedAt e confirmedBy (replies inseridos pelo time não têm replyMessageJid)
    const confirmedAt = new Date();
    replies[replyIndex] = {
      ...reply,
      confirmedAt,
      confirmedBy: confirmedBy || null
    };

    // Atualizar documento no MongoDB
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          replies,
          updatedAt: new Date()
        }
      }
    );

    return res.json({
      ok: true,
      confirmedAt
    });
  } catch (error) {
    console.error('[reply-confirm] Erro:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro ao confirmar resposta'
    });
  }
}

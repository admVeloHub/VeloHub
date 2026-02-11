/**
 * VeloHub - API Route: Reply Confirm
 * VERSION: v1.0.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
 * 
 * Endpoint para confirmar visualização de resposta do grupo WhatsApp
 * - Busca requisição no MongoDB
 * - Encontra reply específico no array replies
 * - Envia reação ✓ via API WhatsApp
 * - Atualiza confirmedAt e confirmedBy no reply
 */

import { getApiUrl } from '@/lib/apiConfig';
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

    // Validar que reply tem replyMessageJid
    if (!reply.replyMessageJid) {
      return res.status(400).json({
        ok: false,
        error: 'Reply não tem replyMessageJid'
      });
    }

    // Enviar reação via API WhatsApp
    const apiUrl = getApiUrl();
    try {
      await fetch(`${apiUrl}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: replyMessageId,
          jid: reply.replyMessageJid,
          participant: reply.replyMessageParticipant || null,
          reaction: '✅'
        })
      });
    } catch (whatsappError) {
      console.error('[reply-confirm] Erro ao enviar reação WhatsApp:', whatsappError);
      // Continuar mesmo se WhatsApp falhar
    }

    // Atualizar confirmedAt e confirmedBy
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

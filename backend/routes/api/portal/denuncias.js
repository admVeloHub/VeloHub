/**
 * VeloHub V3 — API Portal Denúncias
 * VERSION: v1.0.0 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 *
 * POST /api/portal/denuncias — proxy para SKYNET send-denuncia-velohub
 */

const express = require('express');
const { getCadastroCollection } = require('../../../config/funcionariosDb');
const { sendDenunciaViaSkynet } = require('../../../services/support/skynetSendDenuncia');

const MAX_MENSAGEM = 5000;

/**
 * @param {import('express').Request} req
 */
function getHeaderEmail(req) {
  const h = req.headers['x-user-email'];
  return h != null ? String(h).trim().toLowerCase() : '';
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
const initPortalDenunciasRoutes = (mongoClient, connectToMongo) => {
  const router = express.Router();

  /**
   * @param {string} email
   */
  async function findFuncionarioByEmail(email) {
    if (!mongoClient || !email) return null;
    await connectToMongo();
    const col = getCadastroCollection(mongoClient);
    const normalized = email.toLowerCase();
    let funcionario = await col.findOne({ userMail: normalized });
    if (!funcionario) {
      funcionario = await col.findOne({
        userMail: {
          $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        },
      });
    }
    if (!funcionario) {
      funcionario = await col.findOne({ email: normalized });
    }
    return funcionario;
  }

  router.post('/', async (req, res) => {
    try {
      const modoRaw = req.body?.modoComunicacao;
      const modo = modoRaw != null ? String(modoRaw).trim().toLowerCase() : '';
      const mensagem = req.body?.mensagem != null ? String(req.body.mensagem).trim() : '';

      if (modo !== 'identificado' && modo !== 'anonimo') {
        return res.status(400).json({
          success: false,
          message: 'modoComunicacao deve ser identificado ou anonimo',
        });
      }

      if (!mensagem) {
        return res.status(400).json({ success: false, message: 'mensagem é obrigatória' });
      }

      if (mensagem.length > MAX_MENSAGEM) {
        return res.status(400).json({
          success: false,
          message: `mensagem excede o limite de ${MAX_MENSAGEM} caracteres`,
        });
      }

      /** @type {{ name: string, email: string } | null} */
      let reportedBy = null;

      if (modo === 'identificado') {
        const email = getHeaderEmail(req);
        if (!email || !email.includes('@')) {
          return res.status(401).json({
            success: false,
            message: 'Sessão inválida para envio identificado',
          });
        }

        const funcionario = await findFuncionarioByEmail(email);
        const name =
          (funcionario && funcionario.colaboradorNome && String(funcionario.colaboradorNome).trim()) ||
          email;

        reportedBy = { name, email };
      }

      const result = await sendDenunciaViaSkynet({
        modoComunicacao: modo,
        mensagem,
        reportedBy,
      });

      if (!result.success) {
        const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
        return res.status(status).json({
          success: false,
          message: result.error || 'Falha ao enviar manifestação',
        });
      }

      if (modo === 'anonimo') {
        console.log('[Denúncias] Manifestação anônima enviada com sucesso');
      } else {
        console.log('[Denúncias] Manifestação identificada enviada com sucesso');
      }

      return res.json({
        success: true,
        message: 'Manifestação enviada com sucesso',
      });
    } catch (error) {
      console.error('[portal/denuncias]', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro interno',
      });
    }
  });

  return router;
};

module.exports = { initPortalDenunciasRoutes };

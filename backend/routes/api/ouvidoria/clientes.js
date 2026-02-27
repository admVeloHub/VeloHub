/**
 * VeloHub V3 - Ouvidoria API Routes - Clientes
 * VERSION: v2.1.0 | DATE: 2025-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.1.0:
 * - Removida referência à coleção reclamacoes_chatbot (formulário ChatBot foi removido)
 * - Busca apenas em reclamacoes_bacen e reclamacoes_n2Pix
 * 
 * Mudanças v2.0.0:
 * - Busca em todas as coleções (reclamacoes_bacen, reclamacoes_n2Pix)
 * 
 * Rotas para busca de histórico de clientes
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * Inicializar rotas de clientes
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 */
const initClientesRoutes = (client, connectToMongo) => {
  /**
   * GET /api/ouvidoria/clientes/:cpf/historico
   * Buscar histórico de reclamações de um cliente por CPF
   * Busca em todas as coleções
   */
  router.get('/:cpf/historico', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: []
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { cpf } = req.params;
      
      // Normalizar CPF (apenas números)
      const cpfLimpo = String(cpf).replace(/\D/g, '');
      
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'CPF deve ter 11 dígitos',
          data: []
        });
      }

      // Buscar todas as reclamações do CPF em todas as coleções (incluindo deletadas para histórico completo)
      const [bacen, n2Pix] = await Promise.all([
        db.collection('reclamacoes_bacen').find({ cpf: cpfLimpo }).sort({ createdAt: -1 }).toArray(),
        db.collection('reclamacoes_n2Pix').find({ cpf: cpfLimpo }).sort({ createdAt: -1 }).toArray()
      ]);
      
      // Combinar resultados e adicionar tipo
      const historico = [
        ...bacen.map(r => ({ ...r, tipo: 'BACEN' })),
        ...n2Pix.map(r => ({ ...r, tipo: 'OUVIDORIA' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log(`✅ Histórico encontrado para CPF ${cpfLimpo.substring(0, 3)}***${cpfLimpo.substring(9)}: ${historico.length} registros`);

      res.json({
        success: true,
        data: historico,
        count: historico.length
      });
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico do cliente',
        error: error.message,
        data: []
      });
    }
  });

  return router;
};

module.exports = initClientesRoutes;

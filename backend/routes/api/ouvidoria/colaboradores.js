/**
 * VeloHub V3 - Ouvidoria API Routes - Colaboradores
 * VERSION: v1.1.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.0: Removido campo idSecao do retorno
 */

const express = require('express');
const router = express.Router();

/**
 * Inicializar rotas de colaboradores
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 */
const initColaboradoresRoutes = (client, connectToMongo) => {
  /**
   * GET /api/ouvidoria/colaboradores
   * Listar colaboradores com acesso à ouvidoria (acessos.ouvidoria === true)
   */
  router.get('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: []
        });
      }

      await connectToMongo();
      const db = client.db('console_analises');
      const funcionariosCollection = db.collection('qualidade_funcionarios');

      // Buscar funcionários com acesso à ouvidoria (verifica variações de case)
      const funcionarios = await funcionariosCollection.find({
        $or: [
          { 'acessos.ouvidoria': true },
          { 'acessos.Ouvidoria': true },
          { 'acessos.OUVIDORIA': true }
        ]
      }).toArray();

      // Formatar dados para retorno
      const colaboradores = funcionarios.map(func => ({
        nome: func.colaboradorNome || func.userMail || 'Sem nome',
        email: func.userMail || '',
      })).sort((a, b) => {
        // Ordenar alfabeticamente por nome
        return (a.nome || '').localeCompare(b.nome || '');
      });

      console.log(`✅ Colaboradores encontrados: ${colaboradores.length}`);

      res.json({
        success: true,
        data: colaboradores
      });
    } catch (error) {
      console.error('❌ Erro ao buscar colaboradores:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar colaboradores',
        error: error.message,
        data: []
      });
    }
  });

  return router;
};

module.exports = initColaboradoresRoutes;

/**
 * VeloHub V3 - Ouvidoria API Routes - Relatórios
 * VERSION: v2.2.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.1.0:
 * - Removido campo status dos filtros (usar Finalizado.Resolvido)
 * - Removido campo mes do agrupamento
 * - Removidos filtros deletada/deletedAt
 * - Atualizado agrupamento por status para usar Finalizado.Resolvido
 * 
 * Mudanças v2.0.0:
 * - Busca em todas as coleções (reclamacoes_bacen, reclamacoes_ouvidoria)
 * 
 * Rotas para geração de relatórios
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * Inicializar rotas de relatórios
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 */
const initRelatoriosRoutes = (client, connectToMongo) => {
  /**
   * GET /api/ouvidoria/relatorios
   * Gerar relatório com filtros
   * Busca em todas as coleções se tipo não especificado
   */
  router.get('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: {}
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { dataInicio, dataFim, tipo } = req.query;

      // Validar período
      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          success: false,
          message: 'Período é obrigatório (dataInicio e dataFim)',
          data: {}
        });
      }

      // Construir filtro base
      const filterBase = {
        createdAt: {
          $gte: new Date(dataInicio),
          $lte: new Date(dataFim + 'T23:59:59.999Z')
        }
      };

      let reclamacoes = [];

      if (tipo) {
        // Buscar apenas na coleção específica
        const tipoUpper = String(tipo).toUpperCase();
        let collectionName = 'reclamacoes_bacen';
        if (tipoUpper === 'OUVIDORIA') collectionName = 'reclamacoes_ouvidoria';
        
        reclamacoes = await db.collection(collectionName)
          .find(filterBase)
          .sort({ createdAt: -1 })
          .toArray();
        
        // Adicionar tipo aos resultados
        reclamacoes = reclamacoes.map(r => ({ ...r, tipo: tipoUpper }));
      } else {
        // Buscar em todas as coleções
        const [bacen, ouvidoria] = await Promise.all([
          db.collection('reclamacoes_bacen').find(filterBase).sort({ createdAt: -1 }).toArray(),
          db.collection('reclamacoes_ouvidoria').find(filterBase).sort({ createdAt: -1 }).toArray()
        ]);
        
        // Combinar e adicionar tipo
        reclamacoes = [
          ...bacen.map(r => ({ ...r, tipo: 'BACEN' })),
          ...ouvidoria.map(r => ({ ...r, tipo: 'OUVIDORIA' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      // Calcular estatísticas
      const total = reclamacoes.length;
      // Resolvidas = Finalizado.Resolvido === true
      const concluidas = reclamacoes.filter(r => 
        r.Finalizado?.Resolvido === true
      ).length;
      const taxaResolucao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      // Agrupar por tipo
      const porTipo = {};
      reclamacoes.forEach(r => {
        const tipo = r.tipo || 'BACEN';
        porTipo[tipo] = (porTipo[tipo] || 0) + 1;
      });

      // Agrupar por status (baseado em Finalizado.Resolvido)
      const porStatus = {};
      reclamacoes.forEach(r => {
        const status = r.Finalizado?.Resolvido === true ? 'Resolvido' : 'Em Andamento';
        porStatus[status] = (porStatus[status] || 0) + 1;
      });

      const relatorio = {
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
        },
        total,
        concluidas,
        taxaResolucao,
        porTipo,
        porStatus,
        reclamacoes: reclamacoes.map(r => ({
          _id: r._id,
          nome: r.nome,
          cpf: r.cpf ? r.cpf.substring(0, 3) + '***' + r.cpf.substring(9) : '', // CPF parcial
          tipo: r.tipo,
          status: r.Finalizado?.Resolvido === true ? 'Resolvido' : 'Em Andamento',
          dataEntrada: r.dataEntrada || r.dataEntradaAtendimento,
          motivoReduzido: r.motivoReduzido,
          responsavel: r.responsavel,
          createdAt: r.createdAt,
        })),
      };

      console.log(`✅ Relatório gerado: ${total} reclamações no período`);

      res.json({
        success: true,
        data: relatorio
      });
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório',
        error: error.message,
        data: {}
      });
    }
  });

  return router;
};

module.exports = initRelatoriosRoutes;

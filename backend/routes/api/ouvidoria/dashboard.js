/**
 * VeloHub V3 - Ouvidoria API Routes - Dashboard
 * VERSION: v2.3.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.3.0:
 * - Adicionado suporte a filtros de data (dataInicio, dataFim) nas rotas stats e metricas
 * - Filtros aplicados ao campo createdAt das reclamações
 * 
 * Mudanças v2.2.0:
 * - Adicionadas contagens separadas de BACEN e OUVIDORIA
 * - Adicionada métrica "CA e Protocolos" (contagem de reclamações com qualquer protocolo selecionado)
 * 
 * Mudanças v2.1.0:
 * - Removida referência à coleção reclamacoes_chatbot (formulário ChatBot foi removido)
 * - Busca apenas em reclamacoes_bacen e reclamacoes_ouvidoria
 * 
 * Mudanças v2.0.0:
 * - Busca em todas as coleções (reclamacoes_bacen, reclamacoes_ouvidoria)
 * 
 * Rotas para estatísticas e métricas do dashboard de Ouvidoria
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * Inicializar rotas de dashboard
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 */
const initDashboardRoutes = (client, connectToMongo) => {
  /**
   * GET /api/ouvidoria/dashboard/stats
   * Obter estatísticas gerais do dashboard
   * Busca em todas as coleções
   * Query params: dataInicio, dataFim (opcionais, formato YYYY-MM-DD)
   */
  router.get('/stats', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: {
            total: 0,
            emTratativa: 0,
            concluidas: 0,
            prazoVencendo: 0,
          }
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      // Construir filtro de data se fornecido
      const filtroData = {};
      if (req.query.dataInicio || req.query.dataFim) {
        filtroData.createdAt = {};
        if (req.query.dataInicio) {
          const dataInicio = new Date(req.query.dataInicio);
          dataInicio.setHours(0, 0, 0, 0);
          filtroData.createdAt.$gte = dataInicio;
        }
        if (req.query.dataFim) {
          const dataFim = new Date(req.query.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          filtroData.createdAt.$lte = dataFim;
        }
      }

      // Combinar filtro de data com filtro de não deletadas
      const filtroCompleto = {
        deletada: { $ne: true },
        ...filtroData
      };

      // Buscar todas as reclamações não deletadas de todas as coleções
      const [bacen, ouvidoria] = await Promise.all([
        db.collection('reclamacoes_bacen').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_ouvidoria').find(filtroCompleto).toArray()
      ]);
      
      const todas = [...bacen, ...ouvidoria];
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Calcular estatísticas
      const total = todas.length;
      const totalBacen = bacen.length;
      const totalOuvidoria = ouvidoria.length;
      const emTratativa = todas.filter(r => 
        r.status === 'em_tratativa' || r.status === 'em tratativa' || r.status === 'nova'
      ).length;
      const concluidas = todas.filter(r => 
        r.status === 'concluida' || r.status === 'concluída'
      ).length;
      
      // Prazo vencendo (prazoBacen <= hoje + 3 dias)
      const prazoLimite = new Date(hoje);
      prazoLimite.setDate(prazoLimite.getDate() + 3);
      const prazoVencendo = todas.filter(r => {
        if (!r.prazoBacen) return false;
        const prazo = new Date(r.prazoBacen);
        return prazo <= prazoLimite && prazo >= hoje;
      }).length;

      const stats = {
        total,
        totalBacen,
        totalOuvidoria,
        emTratativa,
        concluidas,
        prazoVencendo,
      };

      console.log(`✅ Estatísticas do dashboard calculadas`);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message,
        data: {
          total: 0,
          emTratativa: 0,
          concluidas: 0,
          prazoVencendo: 0,
        }
      });
    }
  });

  /**
   * GET /api/ouvidoria/dashboard/metricas
   * Obter métricas específicas
   * Query params: dataInicio, dataFim (opcionais, formato YYYY-MM-DD)
   */
  router.get('/metricas', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: {
            taxaResolucao: 0,
            mediaPrazo: 0,
            comProcon: 0,
            liquidacaoAntecipada: 0,
            caEProtocolos: 0,
          }
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      // Construir filtro de data se fornecido
      const filtroData = {};
      if (req.query.dataInicio || req.query.dataFim) {
        filtroData.createdAt = {};
        if (req.query.dataInicio) {
          const dataInicio = new Date(req.query.dataInicio);
          dataInicio.setHours(0, 0, 0, 0);
          filtroData.createdAt.$gte = dataInicio;
        }
        if (req.query.dataFim) {
          const dataFim = new Date(req.query.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          filtroData.createdAt.$lte = dataFim;
        }
      }

      // Combinar filtro de data com filtro de não deletadas
      const filtroCompleto = {
        deletada: { $ne: true },
        ...filtroData
      };

      // Buscar todas as reclamações não deletadas de todas as coleções
      const [bacen, ouvidoria] = await Promise.all([
        db.collection('reclamacoes_bacen').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_ouvidoria').find(filtroCompleto).toArray()
      ]);
      
      const todas = [...bacen, ...ouvidoria];
      
      const total = todas.length;
      const concluidas = todas.filter(r => 
        r.status === 'concluida' || r.status === 'concluída'
      ).length;
      
      // Taxa de resolução
      const taxaResolucao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      // Média de prazo (dias entre criação e conclusão)
      const concluidasComData = todas.filter(r => {
        return (r.status === 'concluida' || r.status === 'concluída') && r.createdAt && r.updatedAt;
      });
      
      let mediaPrazo = 0;
      if (concluidasComData.length > 0) {
        const somaDias = concluidasComData.reduce((acc, r) => {
          const inicio = new Date(r.createdAt);
          const fim = new Date(r.updatedAt);
          const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
          return acc + dias;
        }, 0);
        mediaPrazo = Math.round(somaDias / concluidasComData.length);
      }

      // Com Procon
      const comProcon = todas.filter(r => 
        r.procon === true || r.protocolosProcon?.length > 0
      ).length;

      // Liquidação Antecipada
      const liquidacaoAntecipada = todas.filter(r => 
        r.motivoReduzido?.toLowerCase().includes('liquidação antecipada') ||
        r.motivoReduzido?.toLowerCase().includes('liquidacao antecipada')
      ).length;

      // CA e Protocolos (quando qualquer checkbox de protocolos está selecionado)
      const caEProtocolos = todas.filter(r => {
        return (
          r.centralAjuda === true ||
          r.escaladoOuvidoria === true ||
          r.reclameAqui === true ||
          r.procon === true ||
          r.pixLiberado === true ||
          r.pixExcluido === true ||
          r.statusContratoQuitado === true ||
          r.statusContratoAberto === true ||
          (r.protocolosCentral && r.protocolosCentral.length > 0) ||
          (r.protocolosN2 && r.protocolosN2.length > 0) ||
          (r.protocolosReclameAqui && r.protocolosReclameAqui.length > 0) ||
          (r.protocolosProcon && r.protocolosProcon.length > 0)
        );
      }).length;

      const metricas = {
        taxaResolucao,
        mediaPrazo,
        comProcon,
        liquidacaoAntecipada,
        caEProtocolos,
      };

      console.log(`✅ Métricas específicas calculadas`);

      res.json({
        success: true,
        data: metricas
      });
    } catch (error) {
      console.error('❌ Erro ao buscar métricas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar métricas',
        error: error.message,
        data: {
          taxaResolucao: 0,
          mediaPrazo: 0,
          comProcon: 0,
          liquidacaoAntecipada: 0,
        }
      });
    }
  });

  return router;
};

module.exports = initDashboardRoutes;

/**
 * VeloHub V3 - Ouvidoria API Routes - Dashboard
 * VERSION: v2.24.0 | DATE: 2026-02-26 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.24.0:
 * - Corrigido filtro de "Prazo Médio" para excluir casos com datas inválidas (datas muito antigas ou futuras)
 * - Filtro inicial agora valida: datas válidas (não são Invalid Date), dataResolucao >= createdAt, e diferença razoável (0 a 365 dias)
 * - Isso evita incluir casos problemáticos (ex: createdAt em 2025 mas dataResolucao em 1926/1927) no cálculo da média
 * - Correção aplicada nas rotas /stats e /metricas para garantir consistência
 * 
 * Mudanças v2.23.0:
 * - Adicionados logs de debug temporários para identificar problemas no cálculo de "Prazo Médio"
 * - Logs adicionados após o cálculo nas rotas /stats e /metricas
 * - Logs incluem: totalRegistros, quantidadeValida, somaDias, mediaExata, mediaPrazo
 * - Verificação confirmada: reduce inicia com 0 corretamente
 * - Logs ajudam a identificar se soma está muito alta, quantidade muito baixa ou problemas na divisão
 * 
 * Mudanças v2.22.0:
 * - Corrigido cálculo de "Prazo Médio" com validação de dados inválidos
 * - Adicionada validação para ignorar diferenças de dias < 0 ou > 365 dias
 * - Cálculo da média agora usa apenas registros válidos (quantidadeValida)
 * - Validação aplicada nas rotas /stats e /metricas para evitar valores incorretos (ex: 724 dias)
 * 
 * Mudanças v2.21.0:
 * - Formatação de mediaPrazo para 1 casa decimal antes de retornar
 * - Cálculo mantém precisão exata (sem arredondamentos intermediários)
 * - Resultado final formatado usando parseFloat(mediaExata.toFixed(1))
 * - Formatação aplicada nas rotas /stats e /metricas
 * 
 * Mudanças v2.20.0:
 * - Corrigido cálculo de "Prazo Médio" para valores absolutamente exatos, sem arredondamentos intermediários
 * - Removido Math.round da média final - cálculo mantém precisão decimal completa
 * - Diferença em dias calculada exatamente (pode ser decimal) sem arredondamento individual
 * - Média calculada exatamente (soma exata / quantidade) sem arredondamento
 * - Resultado mantido como número decimal para formatação no frontend
 * - Correção aplicada nas rotas /stats e /metricas
 * 
 * Mudanças v2.19.0:
 * - Corrigido cálculo de "Prazo Médio": removido Math.ceil que inflava valores
 * - Agora usa cálculo direto (diffMs / (1000 * 60 * 60 * 24)) sem arredondamento individual
 * - Arredondamento aplicado apenas na média final (Math.round)
 * - Correção aplicada nas rotas /stats e /metricas
 * 
 * Mudanças v2.18.0:
 * - Melhorados comentários do cálculo de "Prazo Médio" para maior clareza
 * - Documentado que o cálculo considera todas as 5 collections (mas apenas as que têm campo Finalizado)
 * - Garantida consistência entre rotas /stats e /metricas para cálculo de média de prazo
 * 
 * Mudanças v2.17.0:
 * - Atualizado cálculo de cards para considerar todas as 5 collections:
 *   - reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_reclameAqui, reclamacoes_procon, reclamacoes_judicial
 * - Cards "Em Aberto", "Resolvido", "Total de Reclamações" e "CA e Protocolos" agora incluem todas as collections
 * - Card "Prazo Vencendo" mantém lógica apenas para BACEN (prazoBacen) e N2 Pix (prazoOuvidoria)
 * - Alterações aplicadas nas rotas /stats e /metricas
 * 
 * Mudanças v2.16.0:
 * - Atualizado cálculo de taxaResolucao para usar 1 casa decimal (Math.round((concluidas / total) * 1000) / 10)
 * - Agora exibe valores como 99.7% ao invés de arredondar para inteiro (100%)
 * 
 * Mudanças v2.15.0:
 * - Corrigido cálculo de "Prazo Vencendo": prazoLimite agora é amanhã às 23:59:59.999 (ao invés de 00:00:00)
 * - Isso garante que prazos que vencem durante todo o dia de amanhã sejam incluídos corretamente
 * 
 * Mudanças v2.14.0:
 * - Adicionados cálculos pixLiberado (pixStatus === "Liberado") e paraCobranca (enviarParaCobranca === true)
 * - Campos pixLiberado e paraCobranca adicionados aos objetos stats e metricas
 * - Aplicados os mesmos cálculos na rota /stats e /metricas para manter consistência
 * 
 * Mudanças v2.13.0:
 * - Atualizada lógica de contagem para usar collections dedicadas:
 *   - reclamacoes_reclameAqui: contagem de Reclame Aqui
 *   - reclamacoes_procon: contagem de Procon
 *   - reclamacoes_judicial: contagem de Ação Judicial
 * - Removidos cálculos baseados em filtros de campos booleanos/protocolos
 * - Filtro de data (filtroCompleto) aplicado às novas collections
 * 
 * Mudanças v2.12.0:
 * - Adicionado campo caEProtocolos ao objeto stats na rota /stats
 * - Cálculo implementado usando a mesma lógica da rota /metricas para manter consistência
 * 
 * Mudanças v2.11.0:
 * - Adicionado campo comProcon ao objeto stats na rota /stats
 * - Cálculo implementado usando a mesma lógica da rota /metricas para manter consistência
 * 
 * Mudanças v2.10.0:
 * - Adicionados campos taxaResolucao, mediaPrazo e liquidacaoAntecipada ao objeto stats na rota /stats
 * - Cálculos implementados usando a mesma lógica da rota /metricas para manter consistência
 * 
 * Mudanças v2.9.0:
 * - Adicionada contagem de Reclame Aqui (similar ao Procon)
 * - Adicionado campo acaoJudicial = 0 (sem collection ainda)
 * - Campos reclameAqui e acaoJudicial adicionados aos objetos stats e metricas
 * 
 * Mudanças v2.8.0:
 * - Corrigido cálculo de "Liquidação Antecipada": agora requer dupla verificação:
 *   - motivoReduzido deve conter "liquidação antecipada" ou "liquidacao antecipada" (case insensitive) E
 *   - statusContratoQuitado deve ser true
 * 
 * Mudanças v2.7.0:
 * - Corrigido nome da collection N2: de reclamacoes_ouvidoria para reclamacoes_n2Pix
 * - Corrigido cálculo de "Prazo Vencendo": agora considera até 1 dia antes do vencimento (ao invés de 3)
 * - Corrigido cálculo de "Média de Prazo": valida que dataResolucao >= createdAt e garante resultado não negativo
 * 
 * Mudanças v2.6.0:
 * - Corrigido cálculo de "Prazo Vencendo" para incluir prazoOuvidoria (N2)
 * - Corrigido cálculo de "CA e Protocolos" para usar campos corretos do schema:
 *   - acionouCentral (ao invés de centralAjuda)
 *   - n2SegundoNivel (ao invés de escaladoOuvidoria)
 *   - Removidos campos inexistentes (pixLiberado, pixExcluido como booleanos)
 *   - Removidos statusContratoQuitado e statusContratoAberto (não fazem parte de CA e Protocolos)
 * 
 * Mudanças v2.5.0:
 * - Atualizado para usar Finalizado.Resolvido ao invés de status
 * - Removidos filtros deletada/deletedAt
 * - Média de prazo agora usa dataResolucao ao invés de updatedAt
 * 
 * Mudanças v2.4.0:
 * - Adicionados logs de debug para diagnóstico de problemas de roteamento
 * - Logs adicionados na inicialização e em cada chamada de rota
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
 * - Busca apenas em reclamacoes_bacen e reclamacoes_n2Pix
 * 
 * Mudanças v2.0.0:
 * - Busca em todas as coleções (reclamacoes_bacen, reclamacoes_n2Pix)
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
  console.log('📋 [dashboard.js] Inicializando rotas de dashboard...');
  
  /**
   * GET /api/ouvidoria/dashboard/stats
   * Obter estatísticas gerais do dashboard
   * Busca em todas as coleções
   * Query params: dataInicio, dataFim (opcionais, formato YYYY-MM-DD)
   */
  router.get('/stats', async (req, res) => {
    console.log('📊 [dashboard.js] Rota /stats chamada');
    console.log('📊 [dashboard.js] Headers recebidos:', {
      'x-user-email': req.headers['x-user-email'],
      'x-session-id': req.headers['x-session-id'],
      'user': req.user ? req.user.email : 'não definido'
    });
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
            reclameAqui: 0,
            acaoJudicial: 0,
            taxaResolucao: 0,
            mediaPrazo: 0,
            liquidacaoAntecipada: 0,
            comProcon: 0,
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

      // Usar apenas filtro de data (sem filtro deletada)
      const filtroCompleto = {
        ...filtroData
      };

      // Buscar todas as reclamações não deletadas de todas as coleções
      const [bacen, n2Pix, reclameAquiDocs, proconDocs, judicialDocs] = await Promise.all([
        db.collection('reclamacoes_bacen').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_n2Pix').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_reclameAqui').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_procon').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_judicial').find(filtroCompleto).toArray()
      ]);
      
      const todas = [...bacen, ...n2Pix, ...reclameAquiDocs, ...proconDocs, ...judicialDocs];
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Calcular estatísticas
      const total = todas.length; // Total = todas as 5 collections
      const totalBacen = bacen.length;
      const totalOuvidoria = n2Pix.length;
      // Em andamento = Finalizado.Resolvido não existe ou é false
      const emTratativa = todas.filter(r => 
        !r.Finalizado || r.Finalizado.Resolvido !== true
      ).length;
      // Resolvidas = Finalizado.Resolvido === true
      const concluidas = todas.filter(r => 
        r.Finalizado?.Resolvido === true
      ).length;
      
      // Prazo vencendo (prazoBacen ou prazoOuvidoria <= hoje + 1 dia completo)
      // Nota: Apenas BACEN e N2 Pix têm campos de prazo (prazoBacen e prazoOuvidoria)
      // As outras collections (reclameAqui, procon, judicial) não têm campos de prazo
      const prazoLimite = new Date(hoje);
      prazoLimite.setDate(prazoLimite.getDate() + 1);
      prazoLimite.setHours(23, 59, 59, 999);
      const prazoVencendo = todas.filter(r => {
        // Para BACEN: verificar prazoBacen
        // Para N2 Pix: verificar prazoOuvidoria
        // Outras collections não têm campo de prazo, então retornam false
        const prazo = r.prazoBacen ? new Date(r.prazoBacen) : (r.prazoOuvidoria ? new Date(r.prazoOuvidoria) : null);
        if (!prazo) return false;
        // Prazo vencendo: hoje <= prazo <= hoje + 1 dia completo (até 23:59:59.999)
        return prazo >= hoje && prazo <= prazoLimite;
      }).length;

      // Reclame Aqui
      const reclameAqui = reclameAquiDocs.length;

      // Ação Judicial
      const acaoJudicial = judicialDocs.length;

      // Pix Liberado (pixStatus === "Liberado")
      const pixLiberado = todas.filter(r => r.pixStatus === 'Liberado').length;
      
      // Para Cobrança (enviarParaCobranca === true)
      const paraCobranca = todas.filter(r => r.enviarParaCobranca === true).length;

      // Taxa de resolução (1 casa decimal)
      const taxaResolucao = total > 0 ? Math.round((concluidas / total) * 1000) / 10 : 0;

      // Prazo Médio = Média aritmética da diferença (em dias) entre createdAt e dataResolucao
      // Considera todas as 5 collections (reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_reclameAqui, 
      // reclamacoes_procon, reclamacoes_judicial), mas apenas as que têm campo Finalizado
      // Apenas para reclamações resolvidas (Finalizado.Resolvido === true) com ambas as datas válidas
      const concluidasComData = todas.filter(r => {
        // 1. Verificar se está resolvida
        if (r.Finalizado?.Resolvido !== true) return false;
        // 2. Verificar se ambas as datas existem
        if (!r.createdAt || !r.Finalizado?.dataResolucao) return false;
        
        const inicio = new Date(r.createdAt);
        const fim = new Date(r.Finalizado.dataResolucao);
        
        // 3. Validar que ambas as datas são válidas (não são Invalid Date)
        if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return false;
        
        // 4. Validar que dataResolucao >= createdAt (lógica de negócio)
        if (fim < inicio) return false;
        
        // 5. Validar que a diferença é razoável (0 a 365 dias) - filtro adicional
        const diffMs = fim.getTime() - inicio.getTime();
        const dias = diffMs / (1000 * 60 * 60 * 24);
        if (dias < 0 || dias > 365) return false;
        
        return true;
      });
      
      let mediaPrazo = 0;
      if (concluidasComData.length > 0) {
        // Calcular soma total de dias para todas as reclamações válidas (exato, sem arredondamento)
        // Nota: O filtro inicial já garante que todos os registros têm diferença válida (0 a 365 dias)
        const somaDias = concluidasComData.reduce((acc, r) => {
          const inicio = new Date(r.createdAt);
          const fim = new Date(r.Finalizado.dataResolucao);
          // Calcular diferença em milissegundos e converter para dias (exato, pode ser decimal)
          const diffMs = fim.getTime() - inicio.getTime();
          const dias = diffMs / (1000 * 60 * 60 * 24); // Cálculo exato, sem arredondamento
          return acc + dias;
        }, 0);
        
        // Como o filtro inicial já garante que todos os registros são válidos, quantidadeValida = concluidasComData.length
        const quantidadeValida = concluidasComData.length;
        
        if (quantidadeValida > 0) {
          // Calcular média exata (sem arredondamento intermediário)
          const mediaExata = somaDias / quantidadeValida;
          // Formatar para 1 casa decimal para exibição (mantém precisão do cálculo)
          mediaPrazo = parseFloat(mediaExata.toFixed(1));
          
          // 🔍 Logs de debug temporários para identificar problemas no cálculo
          console.log('🔍 [Prazo Médio Debug - /stats]', {
            totalRegistros: concluidasComData.length,
            quantidadeValida: quantidadeValida,
            somaDias: somaDias,
            mediaExata: mediaExata,
            mediaPrazo: mediaPrazo,
            reduceIniciouComZero: true, // Verificação: reduce inicia com 0
            divisaoCorreta: quantidadeValida > 0 ? somaDias / quantidadeValida === mediaExata : 'N/A'
          });
        } else {
          console.log('🔍 [Prazo Médio Debug - /stats]', {
            totalRegistros: concluidasComData.length,
            quantidadeValida: quantidadeValida,
            somaDias: somaDias,
            mediaExata: 'N/A (quantidadeValida = 0)',
            mediaPrazo: mediaPrazo,
            motivo: 'Nenhum registro válido encontrado para cálculo'
          });
        }
      }

      // Liquidação Antecipada
      // Dupla verificação: motivo reduzido contém "liquidação antecipada" E status do contrato é quitado
      const liquidacaoAntecipada = todas.filter(r => {
        const motivoContemLiquidacao = 
          r.motivoReduzido?.toLowerCase().includes('liquidação antecipada') ||
          r.motivoReduzido?.toLowerCase().includes('liquidacao antecipada');
        const contratoQuitado = r.statusContratoQuitado === true;
        return motivoContemLiquidacao && contratoQuitado;
      }).length;

      // Com Procon
      const comProcon = proconDocs.length;

      // CA e Protocolos (quando qualquer checkbox de protocolos está selecionado)
      const caEProtocolos = todas.filter(r => {
        return (
          r.acionouCentral === true ||
          (r.protocolosCentral && Array.isArray(r.protocolosCentral) && r.protocolosCentral.length > 0) ||
          r.n2SegundoNivel === true ||
          (r.protocolosN2 && Array.isArray(r.protocolosN2) && r.protocolosN2.length > 0) ||
          r.reclameAqui === true ||
          (r.protocolosReclameAqui && Array.isArray(r.protocolosReclameAqui) && r.protocolosReclameAqui.length > 0) ||
          r.procon === true ||
          (r.protocolosProcon && Array.isArray(r.protocolosProcon) && r.protocolosProcon.length > 0)
        );
      }).length;

      const stats = {
        total,
        totalBacen,
        totalOuvidoria,
        emTratativa,
        concluidas,
        prazoVencendo,
        reclameAqui,
        acaoJudicial,
        taxaResolucao,
        mediaPrazo,
        liquidacaoAntecipada,
        comProcon,
        caEProtocolos,
        pixLiberado,
        paraCobranca,
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
          reclameAqui: 0,
          acaoJudicial: 0,
          taxaResolucao: 0,
          mediaPrazo: 0,
          liquidacaoAntecipada: 0,
          comProcon: 0,
          caEProtocolos: 0,
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
    console.log('📈 [dashboard.js] Rota /metricas chamada');
    console.log('📈 [dashboard.js] Headers recebidos:', {
      'x-user-email': req.headers['x-user-email'],
      'x-session-id': req.headers['x-session-id'],
      'user': req.user ? req.user.email : 'não definido'
    });
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: {
            taxaResolucao: 0,
            mediaPrazo: 0,
            comProcon: 0,
            reclameAqui: 0,
            acaoJudicial: 0,
            liquidacaoAntecipada: 0,
            caEProtocolos: 0,
            pixLiberado: 0,
            paraCobranca: 0,
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

      // Usar apenas filtro de data (sem filtro deletada)
      const filtroCompleto = {
        ...filtroData
      };

      // Buscar todas as reclamações não deletadas de todas as coleções
      const [bacen, n2Pix, reclameAquiDocs, proconDocs, judicialDocs] = await Promise.all([
        db.collection('reclamacoes_bacen').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_n2Pix').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_reclameAqui').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_procon').find(filtroCompleto).toArray(),
        db.collection('reclamacoes_judicial').find(filtroCompleto).toArray()
      ]);
      
      const todas = [...bacen, ...n2Pix, ...reclameAquiDocs, ...proconDocs, ...judicialDocs];
      
      const total = todas.length; // Total = todas as 5 collections
      // Resolvidas = Finalizado.Resolvido === true
      const concluidas = todas.filter(r => 
        r.Finalizado?.Resolvido === true
      ).length;
      
      // Taxa de resolução (1 casa decimal)
      const taxaResolucao = total > 0 ? Math.round((concluidas / total) * 1000) / 10 : 0;

      // Prazo Médio = Média aritmética da diferença (em dias) entre createdAt e dataResolucao
      // Considera todas as 5 collections (reclamacoes_bacen, reclamacoes_n2Pix, reclamacoes_reclameAqui, 
      // reclamacoes_procon, reclamacoes_judicial), mas apenas as que têm campo Finalizado
      // Apenas para reclamações resolvidas (Finalizado.Resolvido === true) com ambas as datas válidas
      const concluidasComData = todas.filter(r => {
        // 1. Verificar se está resolvida
        if (r.Finalizado?.Resolvido !== true) return false;
        // 2. Verificar se ambas as datas existem
        if (!r.createdAt || !r.Finalizado?.dataResolucao) return false;
        
        const inicio = new Date(r.createdAt);
        const fim = new Date(r.Finalizado.dataResolucao);
        
        // 3. Validar que ambas as datas são válidas (não são Invalid Date)
        if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return false;
        
        // 4. Validar que dataResolucao >= createdAt (lógica de negócio)
        if (fim < inicio) return false;
        
        // 5. Validar que a diferença é razoável (0 a 365 dias) - filtro adicional
        const diffMs = fim.getTime() - inicio.getTime();
        const dias = diffMs / (1000 * 60 * 60 * 24);
        if (dias < 0 || dias > 365) return false;
        
        return true;
      });
      
      let mediaPrazo = 0;
      if (concluidasComData.length > 0) {
        // Calcular soma total de dias para todas as reclamações válidas (exato, sem arredondamento)
        // Nota: O filtro inicial já garante que todos os registros têm diferença válida (0 a 365 dias)
        const somaDias = concluidasComData.reduce((acc, r) => {
          const inicio = new Date(r.createdAt);
          const fim = new Date(r.Finalizado.dataResolucao);
          // Calcular diferença em milissegundos e converter para dias (exato, pode ser decimal)
          const diffMs = fim.getTime() - inicio.getTime();
          const dias = diffMs / (1000 * 60 * 60 * 24); // Cálculo exato, sem arredondamento
          return acc + dias;
        }, 0);
        
        // Como o filtro inicial já garante que todos os registros são válidos, quantidadeValida = concluidasComData.length
        const quantidadeValida = concluidasComData.length;
        
        if (quantidadeValida > 0) {
          // Calcular média exata (sem arredondamento intermediário)
          const mediaExata = somaDias / quantidadeValida;
          // Formatar para 1 casa decimal para exibição (mantém precisão do cálculo)
          mediaPrazo = parseFloat(mediaExata.toFixed(1));
          
          // 🔍 Logs de debug temporários para identificar problemas no cálculo
          console.log('🔍 [Prazo Médio Debug - /metricas]', {
            totalRegistros: concluidasComData.length,
            quantidadeValida: quantidadeValida,
            somaDias: somaDias,
            mediaExata: mediaExata,
            mediaPrazo: mediaPrazo,
            reduceIniciouComZero: true, // Verificação: reduce inicia com 0
            divisaoCorreta: quantidadeValida > 0 ? somaDias / quantidadeValida === mediaExata : 'N/A'
          });
        } else {
          console.log('🔍 [Prazo Médio Debug - /metricas]', {
            totalRegistros: concluidasComData.length,
            quantidadeValida: quantidadeValida,
            somaDias: somaDias,
            mediaExata: 'N/A (quantidadeValida = 0)',
            mediaPrazo: mediaPrazo,
            motivo: 'Nenhum registro válido encontrado para cálculo'
          });
        }
      }

      // Com Procon
      const comProcon = proconDocs.length;

      // Reclame Aqui
      const reclameAqui = reclameAquiDocs.length;

      // Ação Judicial
      const acaoJudicial = judicialDocs.length;

      // Pix Liberado (pixStatus === "Liberado")
      const pixLiberado = todas.filter(r => r.pixStatus === 'Liberado').length;
      
      // Para Cobrança (enviarParaCobranca === true)
      const paraCobranca = todas.filter(r => r.enviarParaCobranca === true).length;

      // Liquidação Antecipada
      // Dupla verificação: motivo reduzido contém "liquidação antecipada" E status do contrato é quitado
      const liquidacaoAntecipada = todas.filter(r => {
        const motivoContemLiquidacao = 
          r.motivoReduzido?.toLowerCase().includes('liquidação antecipada') ||
          r.motivoReduzido?.toLowerCase().includes('liquidacao antecipada');
        const contratoQuitado = r.statusContratoQuitado === true;
        return motivoContemLiquidacao && contratoQuitado;
      }).length;

      // CA e Protocolos (quando qualquer checkbox de protocolos está selecionado)
      // Verifica apenas os campos que existem no schema:
      // - acionouCentral (Boolean) ou protocolosCentral (Array)
      // - n2SegundoNivel (Boolean) ou protocolosN2 (Array)
      // - reclameAqui (Boolean) ou protocolosReclameAqui (Array)
      // - procon (Boolean) ou protocolosProcon (Array)
      const caEProtocolos = todas.filter(r => {
        return (
          r.acionouCentral === true ||
          (r.protocolosCentral && Array.isArray(r.protocolosCentral) && r.protocolosCentral.length > 0) ||
          r.n2SegundoNivel === true ||
          (r.protocolosN2 && Array.isArray(r.protocolosN2) && r.protocolosN2.length > 0) ||
          r.reclameAqui === true ||
          (r.protocolosReclameAqui && Array.isArray(r.protocolosReclameAqui) && r.protocolosReclameAqui.length > 0) ||
          r.procon === true ||
          (r.protocolosProcon && Array.isArray(r.protocolosProcon) && r.protocolosProcon.length > 0)
        );
      }).length;

      const metricas = {
        taxaResolucao,
        mediaPrazo,
        comProcon,
        reclameAqui,
        acaoJudicial,
        liquidacaoAntecipada,
        caEProtocolos,
        pixLiberado,
        paraCobranca,
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
          reclameAqui: 0,
          acaoJudicial: 0,
          liquidacaoAntecipada: 0,
          caEProtocolos: 0,
        }
      });
    }
  });

  console.log('✅ [dashboard.js] Rotas de dashboard registradas:');
  console.log('   - GET /stats');
  console.log('   - GET /metricas');
  console.log(`   - Total de rotas no router: ${router.stack ? router.stack.length : 'N/A'}`);
  
  return router;
};

module.exports = initDashboardRoutes;

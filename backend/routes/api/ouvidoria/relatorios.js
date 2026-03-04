/**
 * VeloHub V3 - Ouvidoria API Routes - Relatórios
 * VERSION: v2.15.0 | DATE: 2026-03-04 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.15.0:
 * - CORRIGIDO: Todas as queries N2 agora usam dataEntradaN2 ao invés de dataEntrada
 * - Adicionado fallback para dataEntradaAtendimento e depois createdAt quando dataEntradaN2 não existe
 * - Corrigido logs de debug para usar dataEntradaN2
 * - Corrigido queries: casosRegistradosPorMes, casosFinalizadosPorMes, pixLiberadoPorMes, motivosPorMesN2Raw
 * 
 * Mudanças v2.14.0:
 * - CORRIGIDO: Adicionado fallback para createdAt quando dataEntrada não existe ou é null em N2
 * - Todas as queries de agregação N2 agora usam dataEntrada com fallback para createdAt
 * - Corrigido problema onde gráficos N2 ficavam zerados mesmo com dados existentes
 * - Logs de debug melhorados para mostrar uso de fallback (dataEntrada vs createdAt)
 * 
 * Mudanças v2.13.1:
 * - Adicionados logs de debug detalhados para investigar por que N2, Procon e Judicial retornam 0 registros
 * - Logs mostram total de documentos, documentos com campo de data, e documentos no período
 * - Adicionados exemplos de documentos para verificar estrutura de dados
 * 
 * Mudanças v2.13.0:
 * - CORRIGIDO: Garantido que sempre retornamos arrays vazios ao invés de objetos vazios quando não há dados
 * - Adicionados logs de debug para rastrear processamento de tipos e quantidade de registros retornados
 * - Garantido que estrutura de retorno sempre existe mesmo quando tipo não é processado
 * - Corrigido problema onde gráficos ficavam zerados para N2 Pix, Procon e Ações Judiciais
 * 
 * Mudanças v2.12.0:
 * - CORRIGIDO COMPLETO: Todas as consultas e agregações agora usam campos de data corretos:
 *   - BACEN: dataEntrada (ao invés de createdAt) - filtros, agregações mensais e diárias
 *   - N2 Pix: dataEntrada (ao invés de createdAt) - filtros, agregações mensais e diárias
 *   - Reclame Aqui: dataReclam (ao invés de createdAt) - filtros e agregações mensais
 *   - Procon: dataProcon (ao invés de createdAt) - filtros e agregações mensais
 *   - Ação Judicial: dataEntrada (ao invés de createdAt) - filtros e agregações mensais
 * - Criada função auxiliar criarFiltroData() para gerar filtros corretos por tipo de coleção
 * - Criada função auxiliar obterCampoOrdenacao() para ordenação correta por tipo
 * - Corrigido endpoint /ouvidoria/relatorios para usar filtros e ordenação corretos
 * - Corrigido relatório diário (/diario) para usar campos de data corretos em todas as agregações
 * - Adicionado $addFields em todas as agregações para garantir conversão correta de datas antes de $dateToString
 * - Gráficos e tabelas agora refletem datas de registro da reclamação, não data de criação do documento
 * 
 * Mudanças v2.11.0:
 * - CORRIGIDO: Gráficos agora usam campos de data corretos para cada tipo:
 *   - BACEN: dataEntrada (ao invés de createdAt)
 *   - N2 Pix: dataEntrada (ao invés de createdAt)
 *   - Reclame Aqui: dataReclam (ao invés de createdAt)
 *   - Procon: dataProcon (ao invés de createdAt)
 *   - Ação Judicial: dataEntrada (ao invés de createdAt)
 * - Adicionado $addFields para garantir conversão correta de datas antes de $dateToString
 * - Corrigido agrupamento por mês para usar datas de registro da reclamação, não data de criação
 * 
 * Mudanças v2.10.0:
 * - CORRIGIDO: Adicionado limite de profundidade de recursão em dividirMotivosConcatenados para evitar stack overflow
 * - Adicionada verificação para evitar processar o mesmo motivo múltiplas vezes (Set de processados)
 * - Se não encontrar nenhum motivo conhecido no texto, retorna o original imediatamente (evita recursão infinita)
 * - Verificação antes de recursão: só divide recursivamente se houver motivo conhecido no texto
 * - Melhorado tratamento de erros para evitar crashes em motivos não conhecidos
 * 
 * Mudanças v2.9.0:
 * - Adicionados relatórios específicos para RECLAME_AQUI, PROCON e AÇÃO_JUDICIAL
 * - Cada categoria processa motivos por mês usando mesma lógica de divisão de motivos concatenados
 * - Relatórios específicos só são gerados quando a categoria correspondente está selecionada
 * 
 * VERSION: v2.8.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.8.0:
 * - Melhorada função dividirMotivosConcatenados para evitar matches parciais dentro de matches maiores
 * - Removida duplicação de motivos (ex: "Conta" dentro de "Encerramento de Conta")
 * - Processamento mais robusto de strings concatenadas sem separadores explícitos
 * - Melhorada função processarMotivosParaRelatorio para remover duplicatas e manter ordem
 * 
 * Mudanças v2.7.0:
 * - Adicionada função para dividir motivos concatenados (ex: "Chave PixAbatimento Juros")
 * - Processamento pós-agregação divide strings concatenadas em motivos individuais
 * - Cada motivo individual aparece em sua própria linha, mesmo quando estava concatenado
 * - Função processarMotivosParaRelatorio trata arrays, strings simples e strings concatenadas
 * 
 * Mudanças v2.6.0:
 * - Corrigido processamento de motivos N2Pix para usar $unwind e desenrolar array motivoReduzido
 * - motivoReduzido em N2Pix é [String] (array), então precisa desenrolar antes de agrupar
 * - Correção aplicada em motivosPorMes e motivosPorDia para N2
 * - Agora mostra motivos reais do banco ao invés de valores hardcoded
 * 
 * Mudanças v2.5.0:
 * - Adicionado suporte para filtro de múltiplos tipos via parâmetro 'tipos' (separado por vírgula)
 * - Tipos suportados: BACEN, OUVIDORIA, RECLAME_AQUI, PROCON, PROCESSOS (Ação Judicial)
 * - Endpoint /detalhado agora processa apenas tipos selecionados
 * - Mantida compatibilidade com parâmetro 'tipo' único para código legado
 * 
 * Mudanças v2.4.5:
 * - CORRIGIDO: motivosPorDia agora conta TODOS os valores de motivoReduzido (sem filtro restritivo)
 * - Frontend normaliza e agrupa variações (ex: "CHAVE PIX" e "Chave PIX") automaticamente
 * - Linhas da tabela são geradas a partir dos valores reais encontrados no banco, não de lista fixa
 *
 * Mudanças v2.4.4:
 * - CORRIGIDO quadro Motivos: motivosPorDia (BACEN e N2) filtra por lista de motivos válidos ($in: MOTIVOS_VALIDOS)
 * - Naturezas (Bacen Celcoin, Bacen Via Capital, Consumidor.Gov) não entram na contagem de motivos
 * - MOTIVOS_VALIDOS definido uma vez no handler e reutilizado em BACEN e N2
 *
 * Mudanças v2.4.3:
 * - CORRIGIDO: naturezaPorDia e pixRetiradoPorDia agora usam lógica inteligente para determinar natureza
 * - Usa $cond para verificar primeiro se origem tem valores válidos ("Bacen Celcoin", "Bacen Via Capital", "Consumidor.Gov")
 * - Se origem não tiver valores válidos, usa motivoReduzido como fallback
 * - Resolve problema onde dados com origem="Antecipação" ou "Empréstimo Pessoal" (produtos) não apareciam
 * - Agora captura corretamente dados onde natureza está em motivoReduzido ao invés de origem
 * - CORRIGIDO: motivosPorDia agora conta TODOS os valores de motivoReduzido (sem filtros)
 * - Removido filtro que excluía valores de natureza - agora conta todas as ocorrências de cada motivo
 * - Adicionados logs de debug para verificar valores únicos de motivo encontrados
 * 
 * Mudanças v2.4.2:
 * - Corrigido erro "$dateToString parameter 'date' must be coercible to date" em casosFinalizadosPorMes
 * - Adicionado $addFields para converter dataResolucao/updatedAt para Date antes de usar no $dateToString
 * - Usa $toDate para garantir conversão correta de strings para Date
 * 
 * Mudanças v2.4.1:
 * - Removidos logs de debug do endpoint /detalhado que poderiam causar erros
 * 
 * Mudanças v2.4.0:
 * - Adicionada rota GET /api/ouvidoria/relatorios/diario com agregações por dia
 * - Retorna dados diários para tabelas (Natureza, PIX Retirado, Motivos para BACEN)
 * - Retorna dados diários para tabelas (Chamados, PIX Retirado, Motivos para N2)
 * 
 * Mudanças v2.3.0:
 * - Adicionada rota GET /api/ouvidoria/relatorios/detalhado com agregações por mês
 * - Retorna dados detalhados para gráficos e tabelas (Natureza, PIX, Motivos)
 * 
 * Mudanças v2.1.0:
 * - Removido campo status dos filtros (usar Finalizado.Resolvido)
 * - Removido campo mes do agrupamento
 * - Removidos filtros deletada/deletedAt
 * - Atualizado agrupamento por status para usar Finalizado.Resolvido
 * 
 * Mudanças v2.0.0:
 * - Busca em todas as coleções (reclamacoes_bacen, reclamacoes_n2Pix)
 * 
 * Rotas para geração de relatórios
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * Lista de motivos conhecidos para dividir strings concatenadas
 * Ordenada por tamanho (maior primeiro) para melhor matching
 */
const MOTIVOS_CONHECIDOS = [
  'Não Recebeu Restituição',
  'Liquidação Antecipada',
  'Encerramento de Conta',
  'Exclusão de Conta',
  'Bloqueio de Conta',
  'Contestação de Valores',
  'Crédito do Trabalhador',
  'Empréstimo Pessoal',
  'Liberação Chave Pix',
  'Abatimento Juros',
  'Cancelamento Conta',
  'Devolução à Celcoin',
  'Superendividamento',
  'Portabilidade',
  'Empréstimo',
  'Chave Pix',
  'Fraude',
  'Conta'
].sort((a, b) => b.length - a.length); // Ordenar por tamanho (maior primeiro)

/**
 * Dividir string concatenada de motivos em array de motivos individuais
 * @param {string} motivoConcatenado - String com motivos concatenados (ex: "Chave PixAbatimento Juros")
 * @param {number} profundidade - Profundidade atual da recursão (para evitar loops infinitos)
 * @param {Set} processados - Set de motivos já processados nesta chamada recursiva
 * @returns {Array<string>} - Array de motivos individuais encontrados
 */
function dividirMotivosConcatenados(motivoConcatenado, profundidade = 0, processados = new Set()) {
  try {
    // Limite de profundidade para evitar recursão infinita
    const MAX_PROFUNDIDADE = 3;
    
    if (profundidade > MAX_PROFUNDIDADE) {
      console.warn(`⚠️ Limite de profundidade atingido para: ${motivoConcatenado}`);
      return [motivoConcatenado];
    }
    
    if (!motivoConcatenado) return [];
    if (typeof motivoConcatenado !== 'string') {
      // Se não for string, tentar converter ou retornar array vazio
      if (motivoConcatenado && typeof motivoConcatenado.toString === 'function') {
        motivoConcatenado = motivoConcatenado.toString();
      } else {
        return [];
      }
    }
    
    const motivoTrim = motivoConcatenado.trim();
    if (!motivoTrim) return [];
    
    // Verificar se já foi processado (evitar loops)
    const chaveProcessamento = motivoTrim.toLowerCase();
    if (processados.has(chaveProcessamento)) {
      return [motivoTrim]; // Retornar o motivo original se já foi processado
    }
    processados.add(chaveProcessamento);
  
  // Verificar se é um motivo conhecido completo (não concatenado)
  const motivoLower = motivoTrim.toLowerCase();
  for (const motivo of MOTIVOS_CONHECIDOS) {
    if (motivoLower === motivo.toLowerCase()) {
      return [motivo]; // Retornar o motivo conhecido (com capitalização correta)
    }
  }
  
  // Se não é um motivo conhecido completo, tentar dividir
  // Estratégia: encontrar todos os motivos conhecidos no texto e dividir
  const motivosEncontrados = [];
  const motivosVistos = new Set();
  let textoRestante = motivoTrim;
  
  // Encontrar todos os matches de motivos conhecidos no texto
  const matches = [];
  for (const motivo of MOTIVOS_CONHECIDOS) {
    const motivoLower = motivo.toLowerCase();
    let posicao = textoRestante.toLowerCase().indexOf(motivoLower);
    while (posicao >= 0) {
      matches.push({ motivo, posicao, length: motivo.length, end: posicao + motivo.length });
      posicao = textoRestante.toLowerCase().indexOf(motivoLower, posicao + 1);
    }
  }
  
  // Se não encontrou nenhum motivo conhecido no texto, retornar o original
  // Isso evita recursão infinita quando o motivo não está na lista de conhecidos
  if (matches.length === 0) {
    return [motivoTrim];
  }
  
  // Remover matches que estão dentro de outros matches maiores
  const matchesValidos = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    let estaDentroDeOutro = false;
    for (let j = 0; j < matches.length; j++) {
      if (i !== j) {
        const outroMatch = matches[j];
        // Se este match está completamente dentro de outro match maior
        if (outroMatch.posicao <= match.posicao && outroMatch.end >= match.end && outroMatch.length > match.length) {
          estaDentroDeOutro = true;
          break;
        }
      }
    }
    if (!estaDentroDeOutro) {
      matchesValidos.push(match);
    }
  }
  
  // Se após filtrar não há matches válidos, retornar o original
  if (matchesValidos.length === 0) {
    return [motivoTrim];
  }
  
  // Ordenar matches válidos por posição
  matchesValidos.sort((a, b) => a.posicao - b.posicao);
  
  // Processar matches sequencialmente
  let ultimaPosicao = 0;
  for (const match of matchesValidos) {
    // Se há texto antes deste match, tentar identificar como motivo
    if (match.posicao > ultimaPosicao) {
      const parteAntes = textoRestante.substring(ultimaPosicao, match.posicao).trim();
      if (parteAntes.length > 0) {
        // Verificar se parteAntes é um motivo conhecido
        let encontrado = false;
        for (const motivo of MOTIVOS_CONHECIDOS) {
          if (motivo.toLowerCase() === parteAntes.toLowerCase()) {
            const key = motivo.toLowerCase();
            if (!motivosVistos.has(key)) {
              motivosEncontrados.push(motivo);
              motivosVistos.add(key);
            }
            encontrado = true;
            break;
          }
        }
        if (!encontrado && parteAntes.length > 0) {
          // Verificar se parteAntes contém algum motivo conhecido antes de tentar dividir recursivamente
          const temMotivoConhecido = MOTIVOS_CONHECIDOS.some(m => 
            parteAntes.toLowerCase().includes(m.toLowerCase())
          );
          
          if (temMotivoConhecido && profundidade < MAX_PROFUNDIDADE) {
            // Tentar dividir parteAntes recursivamente (com limite de profundidade)
            const divididos = dividirMotivosConcatenados(parteAntes, profundidade + 1, processados);
            divididos.forEach(m => {
              if (m && typeof m === 'string') {
                const key = m.toLowerCase();
                if (!motivosVistos.has(key)) {
                  motivosEncontrados.push(m);
                  motivosVistos.add(key);
                }
              }
            });
          } else {
            // Se não contém motivo conhecido ou atingiu limite de profundidade, adicionar como está
            const key = parteAntes.toLowerCase();
            if (!motivosVistos.has(key)) {
              motivosEncontrados.push(parteAntes);
              motivosVistos.add(key);
            }
          }
        }
      }
    }
    
    // Adicionar o motivo do match
    const motivoKey = match.motivo.toLowerCase();
    if (!motivosVistos.has(motivoKey)) {
      motivosEncontrados.push(match.motivo);
      motivosVistos.add(motivoKey);
    }
    
    ultimaPosicao = match.end;
  }
  
  // Processar texto restante após o último match
  if (ultimaPosicao < textoRestante.length) {
    const parteRestante = textoRestante.substring(ultimaPosicao).trim();
    if (parteRestante.length > 0) {
      // Verificar se é um motivo conhecido
      let encontrado = false;
      for (const motivo of MOTIVOS_CONHECIDOS) {
        if (motivo.toLowerCase() === parteRestante.toLowerCase()) {
          const key = motivo.toLowerCase();
          if (!motivosVistos.has(key)) {
            motivosEncontrados.push(motivo);
            motivosVistos.add(key);
          }
          encontrado = true;
          break;
        }
      }
      if (!encontrado && parteRestante.length > 0) {
        // Verificar se parteRestante contém algum motivo conhecido antes de tentar dividir recursivamente
        const temMotivoConhecido = MOTIVOS_CONHECIDOS.some(m => 
          parteRestante.toLowerCase().includes(m.toLowerCase())
        );
        
        if (temMotivoConhecido && profundidade < MAX_PROFUNDIDADE) {
          // Tentar dividir recursivamente (com limite de profundidade)
          const divididos = dividirMotivosConcatenados(parteRestante, profundidade + 1, processados);
          divididos.forEach(m => {
            if (m && typeof m === 'string') {
              const key = m.toLowerCase();
              if (!motivosVistos.has(key)) {
                motivosEncontrados.push(m);
                motivosVistos.add(key);
              }
            }
          });
        } else {
          // Se não contém motivo conhecido ou atingiu limite de profundidade, adicionar como está
          const key = parteRestante.toLowerCase();
          if (!motivosVistos.has(key)) {
            motivosEncontrados.push(parteRestante);
            motivosVistos.add(key);
          }
        }
      }
    }
  }
  
    // Se encontrou motivos conhecidos, retornar
    if (motivosEncontrados.length > 0) {
      return motivosEncontrados;
    }
    
    // Se não encontrou nenhum motivo conhecido:
    // - Se o texto é curto (provavelmente é um motivo válido não listado), retornar como está
    // - Se já tentou dividir recursivamente várias vezes, retornar o original para evitar loop infinito
    // - Se não há matches válidos, retornar o motivo original
    if (matchesValidos.length === 0 || motivoTrim.length < 50 || profundidade > 0) {
      return [motivoTrim];
    }
    
    // Caso padrão: retornar o motivo original
    return [motivoTrim];
  } catch (error) {
    console.error('❌ Erro em dividirMotivosConcatenados:', error.message, motivoConcatenado?.substring?.(0, 50));
    // Em caso de erro, retornar array com o motivo original se válido
    if (motivoConcatenado && typeof motivoConcatenado === 'string') {
      const motivoTrim = motivoConcatenado.trim();
      if (motivoTrim.length > 0) {
        return [motivoTrim];
      }
    }
    return [];
  }
}

/**
 * Processar motivos: dividir arrays e strings concatenadas em motivos individuais
 * @param {Array|string} motivoReduzido - Motivo reduzido (pode ser array, string ou string concatenada)
 * @returns {Array<string>} - Array de motivos individuais
 */
function processarMotivosParaRelatorio(motivoReduzido) {
  try {
    if (!motivoReduzido) return [];
    
    // Se for array, processar cada item individualmente
    if (Array.isArray(motivoReduzido)) {
      const motivosProcessados = [];
      motivoReduzido.forEach(motivo => {
        if (motivo && typeof motivo === 'string' && motivo.trim()) {
          try {
            // Verificar se é string concatenada (sem espaços entre palavras conhecidas) e dividir
            const divididos = dividirMotivosConcatenados(motivo);
            if (Array.isArray(divididos)) {
              // Adicionar cada motivo individual encontrado
              divididos.forEach(m => {
                if (m && typeof m === 'string' && m.trim().length > 0) {
                  motivosProcessados.push(m.trim());
                }
              });
            }
          } catch (error) {
            console.error('❌ Erro ao dividir motivo:', error, motivo);
            // Em caso de erro, adicionar o motivo original se for válido
            if (motivo.trim().length > 0) {
              motivosProcessados.push(motivo.trim());
            }
          }
        }
      });
      // Remover duplicatas mantendo ordem
      const motivosUnicos = [];
      const vistos = new Set();
      motivosProcessados.forEach(m => {
        if (m && typeof m === 'string') {
          const key = m.toLowerCase();
          if (!vistos.has(key)) {
            vistos.add(key);
            motivosUnicos.push(m);
          }
        }
      });
      return motivosUnicos;
    }
    
    // Se for string, verificar se é concatenada e dividir
    if (typeof motivoReduzido === 'string') {
      try {
        const divididos = dividirMotivosConcatenados(motivoReduzido);
        if (Array.isArray(divididos)) {
          return divididos.filter(m => m && typeof m === 'string' && m.trim().length > 0).map(m => m.trim());
        }
        // Se não retornou array, retornar array com o motivo original se válido
        if (motivoReduzido.trim().length > 0) {
          return [motivoReduzido.trim()];
        }
      } catch (error) {
        console.error('❌ Erro ao dividir motivo (string):', error, motivoReduzido);
        // Em caso de erro, retornar array com o motivo original se válido
        if (motivoReduzido.trim().length > 0) {
          return [motivoReduzido.trim()];
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erro em processarMotivosParaRelatorio:', error, motivoReduzido);
    return [];
  }
}

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

      const { dataInicio, dataFim, tipo, tipos } = req.query;

      // Validar período
      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          success: false,
          message: 'Período é obrigatório (dataInicio e dataFim)',
          data: {}
        });
      }

      // Função auxiliar para criar filtro de data correto baseado no tipo de coleção
      const criarFiltroData = (collectionName) => {
        const dataInicioDate = new Date(dataInicio);
        const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');
        
        // Para N2, usar $or com fallback para dataEntradaN2, dataEntradaAtendimento e createdAt
        if (collectionName === 'reclamacoes_n2Pix') {
          return {
            $or: [
              { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { 
                $and: [
                  { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                  { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                ]
              },
              { 
                $and: [
                  { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                  { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                  { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                ]
              }
            ]
          };
        }
        
        // Determinar campo de data correto baseado no tipo de coleção
        let campoData;
        if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial') {
          campoData = 'dataEntrada';
        } else if (collectionName === 'reclamacoes_reclameAqui') {
          campoData = 'dataReclam';
        } else if (collectionName === 'reclamacoes_procon') {
          campoData = 'dataProcon';
        } else {
          // Fallback para createdAt se não reconhecer o tipo
          campoData = 'createdAt';
        }
        
        return {
          [campoData]: {
            $gte: dataInicioDate,
            $lte: dataFimDate
          }
        };
      };

      // Função auxiliar para determinar campo de ordenação baseado no tipo
      const obterCampoOrdenacao = (collectionName) => {
        if (collectionName === 'reclamacoes_n2Pix') {
          return 'dataEntradaN2';
        } else if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial') {
          return 'dataEntrada';
        } else if (collectionName === 'reclamacoes_reclameAqui') {
          return 'dataReclam';
        } else if (collectionName === 'reclamacoes_procon') {
          return 'dataProcon';
        }
        return 'createdAt';
      };

      // Mapeamento de tipos para coleções
      const tipoParaCollection = {
        'BACEN': 'reclamacoes_bacen',
        'OUVIDORIA': 'reclamacoes_n2Pix',
        'N2': 'reclamacoes_n2Pix',
        'N2 & PIX': 'reclamacoes_n2Pix',
        'N2&PIX': 'reclamacoes_n2Pix',
        'RECLAME_AQUI': 'reclamacoes_reclameAqui',
        'RECLAME AQUI': 'reclamacoes_reclameAqui',
        'RECLAMEAQUI': 'reclamacoes_reclameAqui',
        'PROCON': 'reclamacoes_procon',
        'PROCESSOS': 'reclamacoes_judicial',
        'JUDICIAL': 'reclamacoes_judicial',
        'AÇÃO JUDICIAL': 'reclamacoes_judicial',
        'ACAO JUDICIAL': 'reclamacoes_judicial'
      };

      let reclamacoes = [];
      let tiposParaBuscar = [];

      // Processar tipos (suporta tanto 'tipo' quanto 'tipos' para compatibilidade)
      if (tipos) {
        // Múltiplos tipos separados por vírgula
        tiposParaBuscar = tipos.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
      } else if (tipo) {
        // Tipo único (compatibilidade com código antigo)
        tiposParaBuscar = [String(tipo).toUpperCase()];
      }

      if (tiposParaBuscar.length > 0) {
        // Buscar apenas nas coleções especificadas
        const promises = tiposParaBuscar.map(async (tipoUpper) => {
          const collectionName = tipoParaCollection[tipoUpper] || 'reclamacoes_bacen';
          const filtroData = criarFiltroData(collectionName);
          const campoOrdenacao = obterCampoOrdenacao(collectionName);
          
          const docs = await db.collection(collectionName)
            .find(filtroData)
            .sort({ [campoOrdenacao]: -1 })
            .toArray();
          
          // Normalizar tipo para retorno
          let tipoNormalizado = tipoUpper;
          if (tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX') {
            tipoNormalizado = 'OUVIDORIA';
          } else if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' || tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL') {
            tipoNormalizado = 'AÇÃO JUDICIAL';
          } else if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAMEAQUI') {
            tipoNormalizado = 'RECLAME AQUI';
          }
          
          return docs.map(r => ({ ...r, tipo: tipoNormalizado }));
        });

        const resultados = await Promise.all(promises);
        // Ordenar usando campo de data correto baseado no tipo
        reclamacoes = resultados.flat().sort((a, b) => {
          // Para N2, usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
          let dataA, dataB;
          if (a.tipo === 'OUVIDORIA' || a.tipo === 'N2') {
            dataA = new Date(a.dataEntradaN2 || a.dataEntradaAtendimento || a.createdAt);
          } else {
            const campoA = a.tipo === 'RECLAME AQUI' ? 'dataReclam' : a.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
            dataA = new Date(a[campoA] || a.createdAt);
          }
          
          if (b.tipo === 'OUVIDORIA' || b.tipo === 'N2') {
            dataB = new Date(b.dataEntradaN2 || b.dataEntradaAtendimento || b.createdAt);
          } else {
            const campoB = b.tipo === 'RECLAME AQUI' ? 'dataReclam' : b.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
            dataB = new Date(b[campoB] || b.createdAt);
          }
          return dataB - dataA;
        });
      } else {
        // Buscar em todas as coleções (comportamento padrão)
        const [bacen, n2Pix, reclameAqui, procon, judicial] = await Promise.all([
          db.collection('reclamacoes_bacen').find(criarFiltroData('reclamacoes_bacen')).sort({ dataEntrada: -1 }).toArray(),
          db.collection('reclamacoes_n2Pix').find(criarFiltroData('reclamacoes_n2Pix')).sort({ dataEntradaN2: -1 }).toArray(),
          db.collection('reclamacoes_reclameAqui').find(criarFiltroData('reclamacoes_reclameAqui')).sort({ dataReclam: -1 }).toArray(),
          db.collection('reclamacoes_procon').find(criarFiltroData('reclamacoes_procon')).sort({ dataProcon: -1 }).toArray(),
          db.collection('reclamacoes_judicial').find(criarFiltroData('reclamacoes_judicial')).sort({ dataEntrada: -1 }).toArray()
        ]);
        
        // Combinar e adicionar tipo
        reclamacoes = [
          ...bacen.map(r => ({ ...r, tipo: 'BACEN' })),
          ...n2Pix.map(r => ({ ...r, tipo: 'OUVIDORIA' })),
          ...reclameAqui.map(r => ({ ...r, tipo: 'RECLAME AQUI' })),
          ...procon.map(r => ({ ...r, tipo: 'PROCON' })),
          ...judicial.map(r => ({ ...r, tipo: 'AÇÃO JUDICIAL' }))
        ].sort((a, b) => {
          // Para N2, usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
          let dataA, dataB;
          if (a.tipo === 'OUVIDORIA' || a.tipo === 'N2') {
            dataA = new Date(a.dataEntradaN2 || a.dataEntradaAtendimento || a.createdAt);
          } else {
            const campoA = a.tipo === 'RECLAME AQUI' ? 'dataReclam' : a.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
            dataA = new Date(a[campoA] || a.createdAt);
          }
          if (b.tipo === 'OUVIDORIA' || b.tipo === 'N2') {
            dataB = new Date(b.dataEntradaN2 || b.dataEntradaAtendimento || b.createdAt);
          } else {
            const campoB = b.tipo === 'RECLAME AQUI' ? 'dataReclam' : b.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
            dataB = new Date(b[campoB] || b.createdAt);
          }
          return dataB - dataA;
        });
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
          dataEntrada: r.dataEntradaN2 || r.dataEntradaAtendimento || r.dataEntrada || r.createdAt,
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

  /**
   * GET /api/ouvidoria/relatorios/detalhado
   * Gerar relatório detalhado com agregações por mês
   * Retorna dados para gráficos e tabelas
   */
  router.get('/detalhado', async (req, res) => {
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

      const { dataInicio, dataFim, tipo, tipos } = req.query;

      // Validar período
      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          success: false,
          message: 'Período é obrigatório (dataInicio e dataFim)',
          data: {}
        });
      }

      const dataInicioDate = new Date(dataInicio);
      const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');

      // Processar tipos (suporta tanto 'tipo' quanto 'tipos' para compatibilidade)
      let tiposParaProcessar = [];
      if (tipos) {
        tiposParaProcessar = tipos.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
      } else if (tipo) {
        tiposParaProcessar = [String(tipo).toUpperCase()];
      }

      // Se nenhum tipo especificado, processar todos (comportamento padrão)
      const processarBacen = tiposParaProcessar.length === 0 || tiposParaProcessar.includes('BACEN');
      const processarN2 = tiposParaProcessar.length === 0 || tiposParaProcessar.includes('OUVIDORIA') || tiposParaProcessar.includes('N2');
      const processarReclameAqui = tiposParaProcessar.length === 0 || tiposParaProcessar.includes('RECLAME_AQUI') || tiposParaProcessar.includes('RECLAME AQUI') || tiposParaProcessar.includes('RECLAMEAQUI');
      const processarProcon = tiposParaProcessar.length === 0 || tiposParaProcessar.includes('PROCON');
      const processarJudicial = tiposParaProcessar.length === 0 || tiposParaProcessar.includes('PROCESSOS') || tiposParaProcessar.includes('JUDICIAL') || tiposParaProcessar.includes('AÇÃO JUDICIAL') || tiposParaProcessar.includes('ACAO JUDICIAL');

      console.log(`🔍 [Relatórios Detalhado] Tipos solicitados: ${tiposParaProcessar.join(', ') || 'TODOS'}`);
      console.log(`🔍 [Relatórios Detalhado] Processar BACEN: ${processarBacen}, N2: ${processarN2}, Reclame Aqui: ${processarReclameAqui}, Procon: ${processarProcon}, Judicial: ${processarJudicial}`);

      const resultado = {
        bacen: {},
        n2: {},
        reclameAqui: {},
        procon: {},
        judicial: {}
      };

      // Processar BACEN (apenas se solicitado)
      if (processarBacen) {
        const bacenCollection = db.collection('reclamacoes_bacen');
      
      // Natureza por mês (origem) - usar dataEntrada ao invés de createdAt
      const naturezaPorMes = await bacenCollection.aggregate([
        {
          $match: {
            dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate }
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                then: '$dataEntrada',
                else: { $toDate: '$dataEntrada' }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
              natureza: '$origem'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1, '_id.natureza': 1 }
        }
      ]).toArray();

      // PIX Retirado por Natureza e Mês (pixStatus === "Liberado" || "Excluído") - usar dataEntrada ao invés de createdAt
      const pixRetiradoPorNatureza = await bacenCollection.aggregate([
        {
          $match: {
            dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
            pixStatus: { $in: ['Liberado', 'Excluído'] }
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                then: '$dataEntrada',
                else: { $toDate: '$dataEntrada' }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
              natureza: '$origem'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1, '_id.natureza': 1 }
        }
      ]).toArray();

      // Motivos por mês - usar dataEntrada ao invés de createdAt
      const motivosPorMesBacen = await bacenCollection.aggregate([
        {
          $match: {
            dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
            motivoReduzido: { $exists: true, $ne: '' }
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                then: '$dataEntrada',
                else: { $toDate: '$dataEntrada' }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
              motivo: '$motivoReduzido'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1, '_id.motivo': 1 }
        }
      ]).toArray();

        resultado.bacen = {
          naturezaPorMes: naturezaPorMes || [],
          pixRetiradoPorNatureza: pixRetiradoPorNatureza || [],
          motivosPorMes: motivosPorMesBacen || []
        };
        console.log(`📊 [BACEN] naturezaPorMes: ${naturezaPorMes?.length || 0} registros`);
        console.log(`📊 [BACEN] pixRetiradoPorNatureza: ${pixRetiradoPorNatureza?.length || 0} registros`);
        console.log(`📊 [BACEN] motivosPorMes: ${motivosPorMesBacen?.length || 0} registros`);
      } else {
        // Garantir que sempre retornamos estrutura vazia mesmo quando não processado
        resultado.bacen = {
          naturezaPorMes: [],
          pixRetiradoPorNatureza: [],
          motivosPorMes: []
        };
      }

      // Processar N2 (OUVIDORIA) - apenas se solicitado
      if (processarN2) {
        const n2Collection = db.collection('reclamacoes_n2Pix');

        // Debug: Verificar quantos documentos existem e quantos têm dataEntradaN2
        const totalN2 = await n2Collection.countDocuments({});
        const n2ComDataEntradaN2 = await n2Collection.countDocuments({ dataEntradaN2: { $exists: true, $ne: null } });
        const n2ComDataEntradaAtendimento = await n2Collection.countDocuments({ 
          $and: [
            { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
            { dataEntradaAtendimento: { $exists: true, $ne: null } }
          ]
        });
        const n2SemDataEntradaN2 = await n2Collection.countDocuments({ 
          $and: [
            { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
            { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] }
          ]
        });
        const n2NoPeriodoDataEntradaN2 = await n2Collection.countDocuments({
          dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
        });
        const n2NoPeriodoDataEntradaAtendimento = await n2Collection.countDocuments({
          $and: [
            { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
            { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
          ]
        });
        const n2NoPeriodoCreatedAt = await n2Collection.countDocuments({
          $and: [
            { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
            { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
            { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
          ]
        });
        const n2NoPeriodoTotal = n2NoPeriodoDataEntradaN2 + n2NoPeriodoDataEntradaAtendimento + n2NoPeriodoCreatedAt;
        console.log(`🔍 [N2 Debug] Total documentos: ${totalN2}`);
        console.log(`🔍 [N2 Debug] Com dataEntradaN2: ${n2ComDataEntradaN2}, Com dataEntradaAtendimento (sem dataEntradaN2): ${n2ComDataEntradaAtendimento}, Sem ambos: ${n2SemDataEntradaN2}`);
        console.log(`🔍 [N2 Debug] No período (${dataInicio} a ${dataFim}): ${n2NoPeriodoTotal} (dataEntradaN2: ${n2NoPeriodoDataEntradaN2}, dataEntradaAtendimento: ${n2NoPeriodoDataEntradaAtendimento}, createdAt: ${n2NoPeriodoCreatedAt})`);
        
        // Verificar alguns documentos de exemplo para debug
        const exemploDocs = await n2Collection.find({}).limit(3).toArray();
        console.log(`🔍 [N2 Debug] Exemplo de documentos:`, exemploDocs.map(d => ({
          _id: d._id,
          dataEntradaN2: d.dataEntradaN2,
          dataEntradaN2Type: typeof d.dataEntradaN2,
          dataEntradaAtendimento: d.dataEntradaAtendimento,
          dataEntradaAtendimentoType: typeof d.dataEntradaAtendimento,
          createdAt: d.createdAt,
          createdAtType: typeof d.createdAt
        })));

      // Casos registrados por mês - usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
      const casosRegistradosPorMes = await n2Collection.aggregate([
        {
          $match: {
            $or: [
              { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { 
                $and: [
                  { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                  { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                ]
              },
              { 
                $and: [
                  { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                  { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                  { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                ]
              }
            ]
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { 
                  $and: [
                    { $ne: ['$dataEntradaN2', null] },
                    { $ne: [{ $type: '$dataEntradaN2' }, 'missing'] }
                  ]
                },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                    then: '$dataEntradaN2',
                    else: { $toDate: '$dataEntradaN2' }
                  }
                },
                else: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: ['$dataEntradaAtendimento', null] },
                        { $ne: [{ $type: '$dataEntradaAtendimento' }, 'missing'] }
                      ]
                    },
                    then: {
                      $cond: {
                        if: { $eq: [{ $type: '$dataEntradaAtendimento' }, 'date'] },
                        then: '$dataEntradaAtendimento',
                        else: { $toDate: '$dataEntradaAtendimento' }
                      }
                    },
                    else: {
                      $cond: {
                        if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                        then: '$createdAt',
                        else: { $toDate: '$createdAt' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1 }
        }
      ]).toArray();

      // Casos finalizados por mês (Finalizado.Resolvido === true)
      // Usar dataResolucao se disponível, senão usar updatedAt quando Resolvido = true
      // Filtro por dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
      const casosFinalizadosPorMes = await n2Collection.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
                  { 
                    $and: [
                      { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                      { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                    ]
                  },
                  { 
                    $and: [
                      { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                      { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                      { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                    ]
                  }
                ]
              },
              { 'Finalizado.Resolvido': true }
            ]
          }
        },
        {
          $addFields: {
            dataParaAgrupamento: {
              $cond: {
                if: { 
                  $and: [
                    { $ne: ['$Finalizado.dataResolucao', null] },
                    { $ne: ['$Finalizado.dataResolucao', ''] }
                  ]
                },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$Finalizado.dataResolucao' }, 'date'] },
                    then: '$Finalizado.dataResolucao',
                    else: { $toDate: '$Finalizado.dataResolucao' }
                  }
                },
                else: {
                  $cond: {
                    if: { $eq: [{ $type: '$updatedAt' }, 'date'] },
                    then: '$updatedAt',
                    else: { $toDate: '$updatedAt' }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: {
                $dateToString: {
                  format: '%Y-%m',
                  date: '$dataParaAgrupamento'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1 }
        }
      ]).toArray();

      // PIX Liberado por mês (pixStatus === "Liberado") - usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
      const pixLiberadoPorMes = await n2Collection.aggregate([
        {
          $match: {
            $or: [
              { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { 
                $and: [
                  { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                  { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                ]
              },
              { 
                $and: [
                  { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                  { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                  { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                ]
              }
            ]
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { 
                  $and: [
                    { $ne: ['$dataEntradaN2', null] },
                    { $ne: [{ $type: '$dataEntradaN2' }, 'missing'] }
                  ]
                },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                    then: '$dataEntradaN2',
                    else: { $toDate: '$dataEntradaN2' }
                  }
                },
                else: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: ['$dataEntradaAtendimento', null] },
                        { $ne: [{ $type: '$dataEntradaAtendimento' }, 'missing'] }
                      ]
                    },
                    then: {
                      $cond: {
                        if: { $eq: [{ $type: '$dataEntradaAtendimento' }, 'date'] },
                        then: '$dataEntradaAtendimento',
                        else: { $toDate: '$dataEntradaAtendimento' }
                      }
                    },
                    else: {
                      $cond: {
                        if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                        then: '$createdAt',
                        else: { $toDate: '$createdAt' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
              pixStatus: '$pixStatus'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1, '_id.pixStatus': 1 }
        }
      ]).toArray();

      // Motivos por mês - usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
      // Tratar tanto arrays quanto strings (alguns registros antigos podem ter strings concatenadas)
      const motivosPorMesN2Raw = await n2Collection.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
                  { 
                    $and: [
                      { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                      { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                    ]
                  },
                  { 
                    $and: [
                      { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                      { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                      { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                    ]
                  }
                ]
              },
              { motivoReduzido: { $exists: true, $ne: null } }
            ]
          }
        },
        {
          // Converter string para array se necessário, depois desenrolar
          $addFields: {
            motivoReduzidoArray: {
              $cond: {
                if: { $isArray: '$motivoReduzido' },
                then: '$motivoReduzido',
                else: {
                  $cond: {
                    if: { $eq: [{ $type: '$motivoReduzido' }, 'string'] },
                    then: ['$motivoReduzido'],
                    else: []
                  }
                }
              }
            },
            // Garantir que dataEntradaN2 seja Date para $dateToString (com fallback para dataEntradaAtendimento e depois createdAt)
            dataEntradaDate: {
              $cond: {
                if: { 
                  $and: [
                    { $ne: ['$dataEntradaN2', null] },
                    { $ne: [{ $type: '$dataEntradaN2' }, 'missing'] }
                  ]
                },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                    then: '$dataEntradaN2',
                    else: { $toDate: '$dataEntradaN2' }
                  }
                },
                else: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: ['$dataEntradaAtendimento', null] },
                        { $ne: [{ $type: '$dataEntradaAtendimento' }, 'missing'] }
                      ]
                    },
                    then: {
                      $cond: {
                        if: { $eq: [{ $type: '$dataEntradaAtendimento' }, 'date'] },
                        then: '$dataEntradaAtendimento',
                        else: { $toDate: '$dataEntradaAtendimento' }
                      }
                    },
                    else: {
                      $cond: {
                        if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                        then: '$createdAt',
                        else: { $toDate: '$createdAt' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          // Desenrolar array motivoReduzido para processar cada motivo individualmente
          $unwind: {
            path: '$motivoReduzidoArray',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $project: {
            mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
            motivo: '$motivoReduzidoArray'
          }
        }
      ]).toArray();
      
      // Processar motivos concatenados e reagrupar
      const motivosPorMesN2Map = new Map();
      motivosPorMesN2Raw.forEach(item => {
        if (!item || !item.motivo || !item.mes) return;
        try {
          const motivosIndividuais = processarMotivosParaRelatorio(item.motivo);
          if (Array.isArray(motivosIndividuais)) {
            motivosIndividuais.forEach(motivo => {
              if (motivo && typeof motivo === 'string' && motivo.trim()) {
                const key = `${item.mes}|${motivo.trim()}`;
                motivosPorMesN2Map.set(key, (motivosPorMesN2Map.get(key) || 0) + 1);
              }
            });
          }
        } catch (error) {
          console.error('❌ Erro ao processar motivo N2:', error, item);
        }
      });
      
      // Converter de volta para formato esperado
      const motivosPorMesN2 = Array.from(motivosPorMesN2Map.entries()).map(([key, count]) => {
        const [mes, motivo] = key.split('|');
        return {
          _id: { mes, motivo },
          count
        };
      }).sort((a, b) => {
        if (a._id.mes !== b._id.mes) return a._id.mes.localeCompare(b._id.mes);
        return a._id.motivo.localeCompare(b._id.motivo);
      });

        resultado.n2 = {
          casosRegistradosPorMes: casosRegistradosPorMes || [],
          casosFinalizadosPorMes: casosFinalizadosPorMes || [],
          pixLiberadoPorMes: pixLiberadoPorMes || [],
          motivosPorMes: motivosPorMesN2 || []
        };
        console.log(`📊 [N2] casosRegistradosPorMes: ${casosRegistradosPorMes?.length || 0} registros`);
        console.log(`📊 [N2] casosFinalizadosPorMes: ${casosFinalizadosPorMes?.length || 0} registros`);
        console.log(`📊 [N2] pixLiberadoPorMes: ${pixLiberadoPorMes?.length || 0} registros`);
        console.log(`📊 [N2] motivosPorMes: ${motivosPorMesN2?.length || 0} registros`);
      } else {
        // Garantir que sempre retornamos estrutura vazia mesmo quando não processado
        resultado.n2 = {
          casosRegistradosPorMes: [],
          casosFinalizadosPorMes: [],
          pixLiberadoPorMes: [],
          motivosPorMes: []
        };
      }

      // Processar RECLAME_AQUI - apenas se solicitado
      if (processarReclameAqui) {
        const reclameAquiCollection = db.collection('reclamacoes_reclameAqui');

        // Motivos por mês - usar dataReclam ao invés de createdAt
        const motivosPorMesReclameAquiRaw = await reclameAquiCollection.aggregate([
          {
            $match: {
              dataReclam: { $gte: dataInicioDate, $lte: dataFimDate },
              motivoReduzido: { $exists: true, $ne: null }
            }
          },
          {
            $addFields: {
              motivoReduzidoArray: {
                $cond: {
                  if: { $isArray: '$motivoReduzido' },
                  then: '$motivoReduzido',
                  else: {
                    $cond: {
                      if: { $eq: [{ $type: '$motivoReduzido' }, 'string'] },
                      then: ['$motivoReduzido'],
                      else: []
                    }
                  }
                }
              },
              // Garantir que dataReclam seja Date para $dateToString
              dataReclamDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataReclam' }, 'date'] },
                  then: '$dataReclam',
                  else: { $toDate: '$dataReclam' }
                }
              }
            }
          },
          {
            $unwind: {
              path: '$motivoReduzidoArray',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $project: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataReclamDate' } },
              motivo: '$motivoReduzidoArray'
            }
          }
        ]).toArray();

        // Processar motivos concatenados e reagrupar
        const motivosPorMesReclameAquiMap = new Map();
        motivosPorMesReclameAquiRaw.forEach(item => {
          if (!item || !item.motivo || !item.mes) return;
          try {
            const motivosIndividuais = processarMotivosParaRelatorio(item.motivo);
            if (Array.isArray(motivosIndividuais)) {
              motivosIndividuais.forEach(motivo => {
                if (motivo && typeof motivo === 'string' && motivo.trim()) {
                  const key = `${item.mes}|${motivo.trim()}`;
                  motivosPorMesReclameAquiMap.set(key, (motivosPorMesReclameAquiMap.get(key) || 0) + 1);
                }
              });
            }
          } catch (error) {
            console.error('❌ Erro ao processar motivo Reclame Aqui:', error, item);
          }
        });

        const motivosPorMesReclameAqui = Array.from(motivosPorMesReclameAquiMap.entries()).map(([key, count]) => {
          const [mes, motivo] = key.split('|');
          return {
            _id: { mes, motivo },
            count
          };
        }).sort((a, b) => {
          if (a._id.mes !== b._id.mes) return a._id.mes.localeCompare(b._id.mes);
          return a._id.motivo.localeCompare(b._id.motivo);
        });

        resultado.reclameAqui = {
          motivosPorMes: motivosPorMesReclameAqui || []
        };
        console.log(`📊 [Reclame Aqui] motivosPorMes: ${motivosPorMesReclameAqui?.length || 0} registros`);
      } else {
        // Garantir que sempre retornamos estrutura vazia mesmo quando não processado
        resultado.reclameAqui = {
          motivosPorMes: []
        };
      }

      // Processar PROCON - apenas se solicitado
      if (processarProcon) {
        const proconCollection = db.collection('reclamacoes_procon');

        // Debug: Verificar quantos documentos existem e quantos têm dataProcon
        const totalProcon = await proconCollection.countDocuments({});
        const proconComDataProcon = await proconCollection.countDocuments({ dataProcon: { $exists: true, $ne: null } });
        const proconNoPeriodo = await proconCollection.countDocuments({
          dataProcon: { $gte: dataInicioDate, $lte: dataFimDate }
        });
        console.log(`🔍 [Procon Debug] Total documentos: ${totalProcon}, Com dataProcon: ${proconComDataProcon}, No período (${dataInicio} a ${dataFim}): ${proconNoPeriodo}`);

        // Motivos por mês - usar dataProcon ao invés de createdAt
        const motivosPorMesProconRaw = await proconCollection.aggregate([
          {
            $match: {
              dataProcon: { $gte: dataInicioDate, $lte: dataFimDate },
              motivoReduzido: { $exists: true, $ne: null }
            }
          },
          {
            $addFields: {
              motivoReduzidoArray: {
                $cond: {
                  if: { $isArray: '$motivoReduzido' },
                  then: '$motivoReduzido',
                  else: {
                    $cond: {
                      if: { $eq: [{ $type: '$motivoReduzido' }, 'string'] },
                      then: ['$motivoReduzido'],
                      else: []
                    }
                  }
                }
              },
              // Garantir que dataProcon seja Date para $dateToString
              dataProconDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataProcon' }, 'date'] },
                  then: '$dataProcon',
                  else: { $toDate: '$dataProcon' }
                }
              }
            }
          },
          {
            $unwind: {
              path: '$motivoReduzidoArray',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $project: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataProconDate' } },
              motivo: '$motivoReduzidoArray'
            }
          }
        ]).toArray();

        // Processar motivos concatenados e reagrupar
        const motivosPorMesProconMap = new Map();
        motivosPorMesProconRaw.forEach(item => {
          if (!item || !item.motivo || !item.mes) return;
          try {
            const motivosIndividuais = processarMotivosParaRelatorio(item.motivo);
            if (Array.isArray(motivosIndividuais)) {
              motivosIndividuais.forEach(motivo => {
                if (motivo && typeof motivo === 'string' && motivo.trim()) {
                  const key = `${item.mes}|${motivo.trim()}`;
                  motivosPorMesProconMap.set(key, (motivosPorMesProconMap.get(key) || 0) + 1);
                }
              });
            }
          } catch (error) {
            console.error('❌ Erro ao processar motivo Procon:', error, item);
          }
        });

        const motivosPorMesProcon = Array.from(motivosPorMesProconMap.entries()).map(([key, count]) => {
          const [mes, motivo] = key.split('|');
          return {
            _id: { mes, motivo },
            count
          };
        }).sort((a, b) => {
          if (a._id.mes !== b._id.mes) return a._id.mes.localeCompare(b._id.mes);
          return a._id.motivo.localeCompare(b._id.motivo);
        });

        resultado.procon = {
          motivosPorMes: motivosPorMesProcon || []
        };
        console.log(`📊 [Procon] motivosPorMes: ${motivosPorMesProcon?.length || 0} registros`);
      } else {
        // Garantir que sempre retornamos estrutura vazia mesmo quando não processado
        resultado.procon = {
          motivosPorMes: []
        };
      }

      // Processar AÇÃO_JUDICIAL - apenas se solicitado
      if (processarJudicial) {
        const judicialCollection = db.collection('reclamacoes_judicial');

        // Debug: Verificar quantos documentos existem e quantos têm dataEntrada
        const totalJudicial = await judicialCollection.countDocuments({});
        const judicialComDataEntrada = await judicialCollection.countDocuments({ dataEntrada: { $exists: true, $ne: null } });
        const judicialNoPeriodo = await judicialCollection.countDocuments({
          dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate }
        });
        console.log(`🔍 [Judicial Debug] Total documentos: ${totalJudicial}, Com dataEntrada: ${judicialComDataEntrada}, No período (${dataInicio} a ${dataFim}): ${judicialNoPeriodo}`);

        // Motivos por mês - usar dataEntrada ao invés de createdAt
        const motivosPorMesJudicialRaw = await judicialCollection.aggregate([
          {
            $match: {
              dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
              motivoReduzido: { $exists: true, $ne: null }
            }
          },
          {
            $addFields: {
              motivoReduzidoArray: {
                $cond: {
                  if: { $isArray: '$motivoReduzido' },
                  then: '$motivoReduzido',
                  else: {
                    $cond: {
                      if: { $eq: [{ $type: '$motivoReduzido' }, 'string'] },
                      then: ['$motivoReduzido'],
                      else: []
                    }
                  }
                }
              },
            // Garantir que dataEntrada seja Date para $dateToString (com fallback para createdAt)
            dataEntradaDate: {
              $cond: {
                if: { 
                  $and: [
                    { $ne: ['$dataEntrada', null] },
                    { $ne: [{ $type: '$dataEntrada' }, 'missing'] }
                  ]
                },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                    then: '$dataEntrada',
                    else: { $toDate: '$dataEntrada' }
                  }
                },
                else: {
                  $cond: {
                    if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                    then: '$createdAt',
                    else: { $toDate: '$createdAt' }
                  }
                }
              }
            }
            }
          },
          {
            $unwind: {
              path: '$motivoReduzidoArray',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $project: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
              motivo: '$motivoReduzidoArray'
            }
          }
        ]).toArray();

        // Processar motivos concatenados e reagrupar
        const motivosPorMesJudicialMap = new Map();
        motivosPorMesJudicialRaw.forEach(item => {
          if (!item || !item.motivo || !item.mes) return;
          try {
            const motivosIndividuais = processarMotivosParaRelatorio(item.motivo);
            if (Array.isArray(motivosIndividuais)) {
              motivosIndividuais.forEach(motivo => {
                if (motivo && typeof motivo === 'string' && motivo.trim()) {
                  const key = `${item.mes}|${motivo.trim()}`;
                  motivosPorMesJudicialMap.set(key, (motivosPorMesJudicialMap.get(key) || 0) + 1);
                }
              });
            }
          } catch (error) {
            console.error('❌ Erro ao processar motivo Judicial:', error, item);
          }
        });

        const motivosPorMesJudicial = Array.from(motivosPorMesJudicialMap.entries()).map(([key, count]) => {
          const [mes, motivo] = key.split('|');
          return {
            _id: { mes, motivo },
            count
          };
        }).sort((a, b) => {
          if (a._id.mes !== b._id.mes) return a._id.mes.localeCompare(b._id.mes);
          return a._id.motivo.localeCompare(b._id.motivo);
        });

        resultado.judicial = {
          motivosPorMes: motivosPorMesJudicial || []
        };
        console.log(`📊 [Judicial] motivosPorMes: ${motivosPorMesJudicial?.length || 0} registros`);
      } else {
        // Garantir que sempre retornamos estrutura vazia mesmo quando não processado
        resultado.judicial = {
          motivosPorMes: []
        };
      }

      console.log(`✅ Relatório detalhado gerado para período ${dataInicio} a ${dataFim}`);
      console.log(`📋 [Resultado] Estrutura retornada:`, JSON.stringify({
        bacen: { naturezaPorMes: resultado.bacen.naturezaPorMes?.length || 0 },
        n2: { casosRegistradosPorMes: resultado.n2.casosRegistradosPorMes?.length || 0 },
        reclameAqui: { motivosPorMes: resultado.reclameAqui.motivosPorMes?.length || 0 },
        procon: { motivosPorMes: resultado.procon.motivosPorMes?.length || 0 },
        judicial: { motivosPorMes: resultado.judicial.motivosPorMes?.length || 0 }
      }, null, 2));

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('❌ Erro ao gerar relatório detalhado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório detalhado',
        error: error.message,
        data: {}
      });
    }
  });

  /**
   * GET /api/ouvidoria/relatorios/diario
   * Gerar relatório diário com agregações por dia
   * Retorna dados diários para tabelas (Natureza, PIX, Motivos, Chamados)
   */
  router.get('/diario', async (req, res) => {
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

      const dataInicioDate = new Date(dataInicio);
      dataInicioDate.setHours(0, 0, 0, 0);
      const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');

      const resultado = {};

      // Lista de motivos válidos (não naturezas) - usada em BACEN e N2 para motivosPorDia
      const MOTIVOS_VALIDOS = [
        'Abatimento Juros',
        'Abatimento Juros/Chave PIX',
        'Cancelamento Conta',
        'Chave PIX',
        'PIX/Abatimento Juros/Encerramento de conta',
        'Chave PIX/Abatimento Juros/Prob. App',
        'Chave PIX/Acesso ao App',
        'Chave PIX/Exclusão de Conta',
        'Conta',
        'Contestação de Valores',
        'Credito do Trabalhador',
        'Credito Pessoal',
        'Cupons Velotax',
        'Devolução à Celcoin',
        'Fraude',
        'Liquidação Antecipada',
        'Liquidação Antecipada/Abatimento Juros',
        'Não recebeu restituição',
        'Não recebeu restituição/Abatimento Juros',
        'Não recebeu restituição/Abatimento Juros/Chave PIX',
        'Não recebeu restituição/Chave PIX',
        'Probl. App/Gov',
        'Seguro Celular',
        'Seguro Divida Zero',
        'Seguro Prestamista',
        'Seguro Saude',
        'Superendividamento'
      ];

      if (!tipo || tipo === 'BACEN') {
        // Processar BACEN
        const bacenCollection = db.collection('reclamacoes_bacen');
        
        // Natureza por dia - usar dataEntrada ao invés de createdAt
        // Usar $cond para verificar se origem tem valores válidos, senão usar motivoReduzido
        // Valores válidos de natureza: "Bacen Celcoin", "Bacen Via Capital", "Consumidor.Gov"
        const naturezaPorDia = await bacenCollection.aggregate([
          {
            $match: {
              dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate }
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                  then: '$dataEntrada',
                  else: { $toDate: '$dataEntrada' }
                }
              }
            }
          },
          {
            $addFields: {
              natureza: {
                $cond: {
                  if: { $in: ['$origem', ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov']] },
                  then: '$origem',
                  else: {
                    $cond: {
                      if: { $in: ['$motivoReduzido', ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov']] },
                      then: '$motivoReduzido',
                      else: null
                    }
                  }
                }
              }
            }
          },
          {
            $match: {
              natureza: { $ne: null }
            }
          },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } },
                natureza: '$natureza'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1, '_id.natureza': 1 }
          }
        ]).toArray();

        // PIX Retirado por dia (pixStatus === "Liberado" || "Excluído") - usar dataEntrada ao invés de createdAt
        // Usar $cond para verificar se origem tem valores válidos, senão usar motivoReduzido
        // Valores válidos de natureza: "Bacen Celcoin", "Bacen Via Capital", "Consumidor.Gov"
        const pixRetiradoPorDia = await bacenCollection.aggregate([
          {
            $match: {
              dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
              pixStatus: { $in: ['Liberado', 'Excluído'] }
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                  then: '$dataEntrada',
                  else: { $toDate: '$dataEntrada' }
                }
              }
            }
          },
          {
            $addFields: {
              natureza: {
                $cond: {
                  if: { $in: ['$origem', ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov']] },
                  then: '$origem',
                  else: {
                    $cond: {
                      if: { $in: ['$motivoReduzido', ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov']] },
                      then: '$motivoReduzido',
                      else: null
                    }
                  }
                }
              }
            }
          },
          {
            $match: {
              natureza: { $ne: null }
            }
          },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } },
                natureza: '$natureza'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1, '_id.natureza': 1 }
          }
        ]).toArray();

        // Motivos por dia - apenas motivoReduzido que são MOTIVOS (não naturezas) - usar dataEntrada ao invés de createdAt
        // #region agent log
        const totalRegistrosPeriodo = await bacenCollection.countDocuments({
          dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate }
        });
        const totalComMotivoReduzido = await bacenCollection.countDocuments({
          dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
          motivoReduzido: { $exists: true, $ne: '' }
        });
        console.log('🔍 [DEBUG] Antes agregação motivosPorDia:', {
          totalRegistrosPeriodo,
          totalComMotivoReduzido,
          motivosValidosCount: MOTIVOS_VALIDOS.length,
          dataInicio,
          dataFim
        });
        // #endregion
        
        // Contar TODOS os valores de motivoReduzido (sem filtro restritivo)
        // O frontend vai normalizar e agrupar variações (ex: "CHAVE PIX" e "Chave PIX")
        const motivosPorDia = await bacenCollection.aggregate([
          {
            $match: {
              dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
              motivoReduzido: { 
                $exists: true, 
                $ne: ''
              }
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataEntrada' }, 'date'] },
                  then: '$dataEntrada',
                  else: { $toDate: '$dataEntrada' }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } },
                motivo: '$motivoReduzido'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1, '_id.motivo': 1 }
          }
        ]).toArray();

        // #region agent log
        const valoresUnicosRetornados = [...new Set(motivosPorDia.map(m => m._id.motivo))];
        console.log('🔍 [DEBUG] Após agregação motivosPorDia:', {
          motivosPorDiaLength: motivosPorDia.length,
          valoresUnicosRetornados,
          primeirosItens: motivosPorDia.slice(0, 5)
        });
        // #endregion

        // Debug: verificar estrutura dos dados retornados
        console.log(`🔍 DEBUG diario - Total de itens em motivosPorDia: ${motivosPorDia.length}`);
        
        // SEMPRE verificar quantos registros têm motivoReduzido (mesmo quando há resultados) - usar dataEntrada
        const totalComMotivo = await bacenCollection.countDocuments({
          dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
          motivoReduzido: { $exists: true, $ne: '' }
        });
        console.log(`🔍 DEBUG diario - Total com motivoReduzido: ${totalComMotivo}`);
        
        // Listar valores únicos de motivoReduzido encontrados (todos, não apenas os válidos) - usar dataEntrada
        const valoresUnicosMotivoReduzido = await bacenCollection.distinct('motivoReduzido', {
          dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
          motivoReduzido: { $exists: true, $ne: '' }
        });
        console.log(`🔍 DEBUG diario - Valores únicos de motivoReduzido encontrados (${valoresUnicosMotivoReduzido.length}):`, valoresUnicosMotivoReduzido);
        
        // Verificar quantos são motivos válidos vs naturezas
        const valoresMotivosValidos = valoresUnicosMotivoReduzido.filter(v => MOTIVOS_VALIDOS.includes(v));
        const valoresNaturezas = valoresUnicosMotivoReduzido.filter(v => !MOTIVOS_VALIDOS.includes(v));
        console.log(`🔍 DEBUG diario - Valores que são motivos válidos (${valoresMotivosValidos.length}):`, valoresMotivosValidos);
        console.log(`🔍 DEBUG diario - Valores que são naturezas ou outros (${valoresNaturezas.length}):`, valoresNaturezas);
        
        if (motivosPorDia.length > 0) {
          const primeiroMotivo = motivosPorDia[0];
          console.log('🔍 DEBUG diario - primeiro item motivosPorDia:', JSON.stringify(primeiroMotivo, null, 2));
          const valoresUnicos = [...new Set(motivosPorDia.map(m => m._id.motivo))];
          console.log(`🔍 DEBUG diario - Valores únicos de motivo encontrados na agregação (${valoresUnicos.length}):`, valoresUnicos);
        }
        
        // Debug: verificar quantos registros têm PIX retirado - usar dataEntrada
        const totalPixRetirado = await bacenCollection.countDocuments({
          dataEntrada: { $gte: dataInicioDate, $lte: dataFimDate },
          pixStatus: { $in: ['Liberado', 'Excluído'] }
        });
        console.log(`🔍 DEBUG diario - Total de registros com PIX retirado: ${totalPixRetirado}`);
        console.log(`🔍 DEBUG diario - Total de itens em pixRetiradoPorDia: ${pixRetiradoPorDia.length}`);

        resultado.bacen = {
          naturezaPorDia,
          pixRetiradoPorDia,
          motivosPorDia
        };
        
        // #region agent log
        console.log('🔍 [DEBUG] resultado.bacen antes de enviar:', {
          motivosPorDiaLength: resultado.bacen.motivosPorDia.length,
          motivosPorDiaSample: resultado.bacen.motivosPorDia.slice(0, 3)
        });
        // #endregion
      }

      if (!tipo || tipo === 'N2') {
        // Processar N2
        const n2Collection = db.collection('reclamacoes_n2Pix');
        
        // Número de chamados por dia - usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
        const chamadosPorDia = await n2Collection.aggregate([
          {
            $match: {
              $or: [
                { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
                { 
                  $and: [
                    { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                    { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                  ]
                },
                { 
                  $and: [
                    { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                    { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                    { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                  ]
                }
              ]
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { 
                    $and: [
                      { $ne: ['$dataEntradaN2', null] },
                      { $ne: [{ $type: '$dataEntradaN2' }, 'missing'] }
                    ]
                  },
                  then: {
                    $cond: {
                      if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                      then: '$dataEntradaN2',
                      else: { $toDate: '$dataEntradaN2' }
                    }
                  },
                  else: {
                    $cond: {
                      if: { 
                        $and: [
                          { $ne: ['$dataEntradaAtendimento', null] },
                          { $ne: [{ $type: '$dataEntradaAtendimento' }, 'missing'] }
                        ]
                      },
                      then: {
                        $cond: {
                          if: { $eq: [{ $type: '$dataEntradaAtendimento' }, 'date'] },
                          then: '$dataEntradaAtendimento',
                          else: { $toDate: '$dataEntradaAtendimento' }
                        }
                      },
                      else: {
                        $cond: {
                          if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                          then: '$createdAt',
                          else: { $toDate: '$createdAt' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1 }
          }
        ]).toArray();

        // PIX Retirado por dia (pixStatus === "Liberado" || "Excluído") - usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
        const pixRetiradoPorDiaN2 = await n2Collection.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [
                    { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
                    { 
                      $and: [
                        { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                        { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                      ]
                    },
                    { 
                      $and: [
                        { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                        { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                        { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                      ]
                    }
                  ]
                },
                { pixStatus: { $in: ['Liberado', 'Excluído'] } }
              ]
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { 
                    $and: [
                      { $ne: ['$dataEntradaN2', null] },
                      { $ne: [{ $type: '$dataEntradaN2' }, 'missing'] }
                    ]
                  },
                  then: {
                    $cond: {
                      if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                      then: '$dataEntradaN2',
                      else: { $toDate: '$dataEntradaN2' }
                    }
                  },
                  else: {
                    $cond: {
                      if: { 
                        $and: [
                          { $ne: ['$dataEntradaAtendimento', null] },
                          { $ne: [{ $type: '$dataEntradaAtendimento' }, 'missing'] }
                        ]
                      },
                      then: {
                        $cond: {
                          if: { $eq: [{ $type: '$dataEntradaAtendimento' }, 'date'] },
                          then: '$dataEntradaAtendimento',
                          else: { $toDate: '$dataEntradaAtendimento' }
                        }
                      },
                      else: {
                        $cond: {
                          if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                          then: '$createdAt',
                          else: { $toDate: '$createdAt' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1 }
          }
        ]).toArray();

        // Motivos por dia - contar TODOS os valores de motivoReduzido (sem filtro restritivo) - usar dataEntradaN2 com fallback para dataEntradaAtendimento e depois createdAt
        // Tratar tanto arrays quanto strings (alguns registros antigos podem ter strings concatenadas)
        const motivosPorDiaN2Raw = await n2Collection.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [
                    { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
                    { 
                      $and: [
                        { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                        { dataEntradaAtendimento: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }
                      ]
                    },
                    { 
                      $and: [
                        { $or: [{ dataEntradaN2: { $exists: false } }, { dataEntradaN2: null }] },
                        { $or: [{ dataEntradaAtendimento: { $exists: false } }, { dataEntradaAtendimento: null }] },
                        { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } }
                      ]
                    }
                  ]
                },
                { motivoReduzido: { $exists: true, $ne: null } }
              ]
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { 
                    $and: [
                      { $ne: ['$dataEntradaN2', null] },
                      { $ne: [{ $type: '$dataEntradaN2' }, 'missing'] }
                    ]
                  },
                  then: {
                    $cond: {
                      if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                      then: '$dataEntradaN2',
                      else: { $toDate: '$dataEntradaN2' }
                    }
                  },
                  else: {
                    $cond: {
                      if: { 
                        $and: [
                          { $ne: ['$dataEntradaAtendimento', null] },
                          { $ne: [{ $type: '$dataEntradaAtendimento' }, 'missing'] }
                        ]
                      },
                      then: {
                        $cond: {
                          if: { $eq: [{ $type: '$dataEntradaAtendimento' }, 'date'] },
                          then: '$dataEntradaAtendimento',
                          else: { $toDate: '$dataEntradaAtendimento' }
                        }
                      },
                      else: {
                        $cond: {
                          if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                          then: '$createdAt',
                          else: { $toDate: '$createdAt' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            // Converter string para array se necessário, depois desenrolar
            $addFields: {
              motivoReduzidoArray: {
                $cond: {
                  if: { $isArray: '$motivoReduzido' },
                  then: '$motivoReduzido',
                  else: {
                    $cond: {
                      if: { $eq: [{ $type: '$motivoReduzido' }, 'string'] },
                      then: ['$motivoReduzido'],
                      else: []
                    }
                  }
                }
              }
            }
          },
          {
            // Desenrolar array motivoReduzido para processar cada motivo individualmente
            $unwind: {
              path: '$motivoReduzidoArray',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $project: {
              dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } },
              motivo: '$motivoReduzidoArray'
            }
          }
        ]).toArray();
        
        // Processar motivos concatenados e reagrupar
        const motivosPorDiaN2Map = new Map();
        motivosPorDiaN2Raw.forEach(item => {
          const motivosIndividuais = processarMotivosParaRelatorio(item.motivo);
          motivosIndividuais.forEach(motivo => {
            const key = `${item.dia}|${motivo}`;
            motivosPorDiaN2Map.set(key, (motivosPorDiaN2Map.get(key) || 0) + 1);
          });
        });
        
        // Converter de volta para formato esperado
        const motivosPorDiaN2 = Array.from(motivosPorDiaN2Map.entries()).map(([key, count]) => {
          const [dia, motivo] = key.split('|');
          return {
            _id: { dia, motivo },
            count
          };
        }).sort((a, b) => {
          if (a._id.dia !== b._id.dia) return a._id.dia.localeCompare(b._id.dia);
          return a._id.motivo.localeCompare(b._id.motivo);
        });

        resultado.n2 = {
          chamadosPorDia,
          pixRetiradoPorDia: pixRetiradoPorDiaN2,
          motivosPorDia: motivosPorDiaN2
        };
      }

      console.log(`✅ Relatório diário gerado para período ${dataInicio} a ${dataFim}, tipo: ${tipo || 'todos'}`);

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('❌ Erro ao gerar relatório diário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório diário',
        error: error.message,
        data: {}
      });
    }
  });

  return router;
};

module.exports = initRelatoriosRoutes;

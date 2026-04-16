/**
 * VeloHub V3 - Ouvidoria API Routes - Relatórios
 * VERSION: v2.27.0 | DATE: 2026-04-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.27.0:
 * - GET relatório (lista reclamacoes): campo dataResolucao (YYYY-MM-DD) quando Finalizado.Resolvido, para exportação/planilha
 * 
 * Mudanças v2.26.0:
 * - MOTIVOS_CONHECIDOS e MOTIVOS_VALIDOS: Juros abusivos (form BACEN/RA)
 * 
 * Mudanças v2.25.0:
 * - MOTIVOS_CONHECIDOS: Empréstimo pessoal → Empréstimo Pessoal (alinhado produto/form)
 * 
 * Mudanças v2.24.0:
 * - MOTIVOS_CONHECIDOS e MOTIVOS_VALIDOS: padrão Xxxxx xxxxx xxxx (sentence case)
 * 
 * Mudanças v2.23.0:
 * - Relatório Diário: adicionados tipos Reclame Aqui, Procon e Ação Judicial (chamadosPorDia, motivosPorDia)
 * 
 * Mudanças v2.22.0:
 * - CORRIGIDO Relatório Diário: dataInicioDate/dataFimDate agora usam UTC explícito (T00:00:00.000Z / T23:59:59.999Z)
 *   para evitar deslocamento de datas por timezone do servidor (ex: 2026-02-28 aparecendo quando filtro era 01-17/03)
 * 
 * Mudanças v2.21.0:
 * - Padronização de grafias em MOTIVOS_CONHECIDOS e MOTIVOS_VALIDOS: Abatimento de Juros, Liberação Chave Pix, Contestação de Valores, Encerramento de Conta, Exclusão de Conta, Não Recebeu Restituição
 * 
 * Mudanças v2.20.0:
 * - CORRIGIDO Análise Diária: Natureza = origem (schema 471); Motivos = motivoReduzido (schema 475); dias = dataEntrada (470)
 * - naturezaPorDia e pixRetiradoPorDia: APENAS origem (Bacen Celcoin, Bacen Via Capital, Consumidor.Gov)
 * - motivosPorDia: find() + processamento em memória (como Painel Tempo Real) - mais robusto que aggregation
 * 
 * Mudanças v2.19.0:
 * - HOMOGENEIZAÇÃO: Contagem baseada APENAS na data de entrada (removido fallback createdAt)
 * - criarFiltroData: BACEN dataEntrada | N2 dataEntradaN2 | Reclame dataReclam | Procon dataProcon | Judicial dataEntrada
 * - Todas as agregações (detalhado e diario): filtro por data de entrada, sem createdAt
 * - Documentos sem data de entrada no período não são contados
 * 
 * Mudanças v2.18.0:
 * - Exibição: tipo retornado como 'N2 Pix' (antes 'OUVIDORIA') em listagens
 * - tipoParaCollection: adicionado 'N2 PIX'
 * 
 * Mudanças v2.16.0:
 * - CORRIGIDO: Filtro de data agora aceita campos armazenados como STRING (ex: "2026-02-24")
 * - Alguns docs têm dataEntrada/dataEntradaN2 como string; comparação Date vs string falhava
 * - Adicionado $or para aceitar tanto Date quanto string no formato YYYY-MM-DD
 * - Corrige discrepância: Relatório mostrava 595/1193 ao invés de 605/1258
 * 
 * Mudanças v2.15.0:
 * - CORRIGIDO: Todas as queries N2 agora usam dataEntradaN2 ao invés de dataEntrada
 * - Adicionado fallback para dataEntradaN2 e depois createdAt quando dataEntradaN2 não existe
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

/** YYYY-MM-DD ou null — Finalizado.dataResolucao quando Resolvido (leitura apenas). */
function extrairDataResolucaoRelatorio(r) {
  if (!r || r.Finalizado?.Resolvido !== true) return null;
  const dr = r.Finalizado?.dataResolucao;
  if (dr == null || dr === '') return null;
  const s = dr instanceof Date ? dr.toISOString() : String(dr);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * Lista de motivos conhecidos para dividir strings concatenadas
 * Padrão: Xxxxx xxxxx xxxx (sentence case)
 * Ordenada por tamanho (maior primeiro) para melhor matching
 */
const MOTIVOS_CONHECIDOS = [
  'Não recebeu restituição',
  'Liquidação antecipada',
  'Liberação chave pix',
  'Encerramento de conta',
  'Exclusão de conta',
  'Bloqueio de conta',
  'Contestação de valores',
  'Crédito do trabalhador',
  'Empréstimo Pessoal',
  'Abatimento de juros',
  'Juros abusivos',
  'Cancelamento conta',
  'Devolução à Celcoin',
  'Superendividamento',
  'Portabilidade',
  'Empréstimo',
  'Chave pix',
  'Em cobrança',
  'Alega fraude',
  'Erro app',
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

/** Valores de origem (schema 471) - NÃO confundir com motivoReduzido (schema 475). Usado para excluir da tabela Motivos. */
const ORIGEM_BACEN = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'];

/** Retorna true se o valor é uma origem (natureza), não um motivo. Motivos não devem incluir origens na tabela. */
const isOrigemBacen = (valor) => ORIGEM_BACEN.includes(valor);

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

      // Função auxiliar para criar filtro de data baseado na data de ENTRADA (NUNCA createdAt)
      // Homogeneizado com Dashboard, Relatórios e Análise Diária
      const criarFiltroData = (collectionName) => {
        const dataInicioDate = new Date(dataInicio);
        const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');

        // N2: dataEntradaN2 (sem fallback createdAt) - aceita Date ou string
        if (collectionName === 'reclamacoes_n2Pix') {
          return {
            $or: [
              { dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { dataEntradaN2: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }
            ]
          };
        }

        // BACEN, Judicial: dataEntrada
        if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial') {
          return {
            $or: [
              { dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { dataEntrada: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }
            ]
          };
        }

        // Reclame Aqui: dataReclam
        if (collectionName === 'reclamacoes_reclameAqui') {
          return {
            $or: [
              { dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { dataReclam: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }
            ]
          };
        }

        // Procon: dataProcon
        if (collectionName === 'reclamacoes_procon') {
          return {
            $or: [
              { dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { dataProcon: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }
            ]
          };
        }

        return { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } };
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
        'N2 PIX': 'reclamacoes_n2Pix',
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
          if (tipoUpper === 'OUVIDORIA' || tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' || tipoUpper === 'N2 PIX') {
            tipoNormalizado = 'N2 Pix';
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
          // Para N2, usar dataEntradaN2 com fallback para dataEntradaN2 e depois createdAt
          let dataA, dataB;
          if (a.tipo === 'OUVIDORIA' || a.tipo === 'N2' || a.tipo === 'N2 Pix') {
            dataA = new Date(a.dataEntradaN2);
          } else {
            const campoA = a.tipo === 'RECLAME AQUI' ? 'dataReclam' : a.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
            dataA = new Date(a[campoA]);
          }
          if (b.tipo === 'OUVIDORIA' || b.tipo === 'N2' || b.tipo === 'N2 Pix') {
            dataB = new Date(b.dataEntradaN2);
          } else {
            const campoB = b.tipo === 'RECLAME AQUI' ? 'dataReclam' : b.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada';
            dataB = new Date(b[campoB]);
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
          ...n2Pix.map(r => ({ ...r, tipo: 'N2 Pix' })),
          ...reclameAqui.map(r => ({ ...r, tipo: 'RECLAME AQUI' })),
          ...procon.map(r => ({ ...r, tipo: 'PROCON' })),
          ...judicial.map(r => ({ ...r, tipo: 'AÇÃO JUDICIAL' }))
        ].sort((a, b) => {
          let dataA, dataB;
          const campoA = (a.tipo === 'OUVIDORIA' || a.tipo === 'N2' || a.tipo === 'N2 Pix') ? 'dataEntradaN2' : (a.tipo === 'RECLAME AQUI' ? 'dataReclam' : a.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada');
          const campoB = (b.tipo === 'OUVIDORIA' || b.tipo === 'N2' || b.tipo === 'N2 Pix') ? 'dataEntradaN2' : (b.tipo === 'RECLAME AQUI' ? 'dataReclam' : b.tipo === 'PROCON' ? 'dataProcon' : 'dataEntrada');
          dataA = new Date(a[campoA]);
          dataB = new Date(b[campoB]);
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
          dataEntrada: (r.tipo === 'OUVIDORIA' || r.tipo === 'N2' || r.tipo === 'N2 Pix') ? r.dataEntradaN2 : (r.tipo === 'RECLAME AQUI' ? r.dataReclam : r.tipo === 'PROCON' ? r.dataProcon : r.dataEntrada),
          dataResolucao: extrairDataResolucaoRelatorio(r),
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
      const processarN2 = tiposParaProcessar.length === 0 || tiposParaProcessar.includes('OUVIDORIA') || tiposParaProcessar.includes('N2') || tiposParaProcessar.includes('N2 Pix');
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
      
      // Natureza por mês (origem) - data de ENTRADA (nunca createdAt)
      const naturezaPorMes = await bacenCollection.aggregate([
        {
          $match: {
            dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
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

      // PIX Retirado por Natureza e Mês - data de ENTRADA (nunca createdAt)
      const pixRetiradoPorNatureza = await bacenCollection.aggregate([
        {
          $match: {
            dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
            $or: [{ pixLiberado: true }, { pixStatus: { $in: ['Liberado', 'Excluído', 'Solicitada'] } }]
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

      // Motivos por mês - data de ENTRADA (nunca createdAt)
      const motivosPorMesBacen = await bacenCollection.aggregate([
        {
          $match: {
            dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
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

        // Debug: contagem baseada APENAS em dataEntradaN2 (sem fallback createdAt)
        const totalN2 = await n2Collection.countDocuments({});
        const n2ComDataEntradaN2 = await n2Collection.countDocuments({ dataEntradaN2: { $exists: true, $ne: null } });
        const n2NoPeriodo = await n2Collection.countDocuments({
          dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
        });
        console.log(`🔍 [N2 Debug] Total: ${totalN2}, Com dataEntradaN2: ${n2ComDataEntradaN2}, No período: ${n2NoPeriodo}`);

      // Casos registrados por mês - APENAS dataEntradaN2 (nunca createdAt)
      const casosRegistradosPorMes = await n2Collection.aggregate([
        {
          $match: {
            dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                then: '$dataEntradaN2',
                else: { $toDate: '$dataEntradaN2' }
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

      // Casos finalizados por mês (Finalizado.Resolvido === true) - APENAS dataEntradaN2
      const casosFinalizadosPorMes = await n2Collection.aggregate([
        {
          $match: {
            dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
            'Finalizado.Resolvido': true
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

      // PIX Liberado por mês - APENAS dataEntradaN2 (nunca createdAt)
      const pixLiberadoPorMes = await n2Collection.aggregate([
        {
          $match: {
            dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
          }
        },
        {
          $addFields: {
            dataEntradaDate: {
              $cond: {
                if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                then: '$dataEntradaN2',
                else: { $toDate: '$dataEntradaN2' }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              mes: { $dateToString: { format: '%Y-%m', date: '$dataEntradaDate' } },
              pixStatus: { $cond: [{ $or: [{ $eq: ['$pixLiberado', true] }, { $in: ['$pixStatus', ['Liberado', 'Excluído', 'Solicitada']] }] }, 'Liberado', 'Não aplicável' ] }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.mes': 1, '_id.pixStatus': 1 }
        }
      ]).toArray();

      // Motivos por mês - APENAS dataEntradaN2 (nunca createdAt)
      const motivosPorMesN2Raw = await n2Collection.aggregate([
        {
          $match: {
            dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
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
            dataEntradaDate: {
              $cond: {
                if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                then: '$dataEntradaN2',
                else: { $toDate: '$dataEntradaN2' }
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

        // Motivos por mês - APENAS dataReclam (nunca createdAt)
        const motivosPorMesReclameAquiRaw = await reclameAquiCollection.aggregate([
          {
            $match: {
              dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
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

        // Motivos por mês - APENAS dataProcon (nunca createdAt)
        const motivosPorMesProconRaw = await proconCollection.aggregate([
          {
            $match: {
              dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
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

        // Motivos por mês - APENAS dataEntrada (nunca createdAt)
        const motivosPorMesJudicialRaw = await judicialCollection.aggregate([
          {
            $match: {
              dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
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
            // dataEntrada para $dateToString (filtro já garante que existe)
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

      // UTC explícito para evitar deslocamento por timezone do servidor
      const dataInicioDate = new Date(dataInicio + 'T00:00:00.000Z');
      const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');

      const resultado = {};

      // Lista de motivos válidos (não naturezas) - referência; motivosPorDia usa dados do banco
      const MOTIVOS_VALIDOS = [
        'Abatimento de juros',
        'Juros abusivos',
        'Liberação chave pix',
        'Portabilidade pix',
        'Cancelamento até 7 dias',
        'Cancelamento superior a 7 dias',
        'Em cobrança',
        'Alega fraude',
        'Erro app',
        'Encerramento cta celcoin',
        'Encerramento cta app',
        'Superendividamento',
        'Liquidação antecipada',
        'Não recebeu restituição',
        'Chave pix',
        'Conta'
      ];

      if (!tipo || tipo === 'BACEN') {
        // Processar BACEN
        const bacenCollection = db.collection('reclamacoes_bacen');
        
        // Filtro data: aceita Date ou string (v2.16.0)
        const filtroDataBacen = {
          $or: [
            { dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
            { dataEntrada: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }
          ],
          origem: { $exists: true, $ne: '', $in: ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'] }
        };

        let naturezaPorDia, pixRetiradoPorDia, motivosPorDia;
        try {
          // Natureza por dia - APENAS origem (schema 471), dataEntrada (schema 470)
          naturezaPorDia = await bacenCollection.aggregate([
          { $match: filtroDataBacen },
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
          { $match: { dataEntradaDate: { $ne: null } } },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } },
                natureza: '$origem'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1, '_id.natureza': 1 }
          }
        ]).toArray();

          // PIX Retirado por dia - APENAS dataEntrada, agrupado por origem (natureza)
          pixRetiradoPorDia = await bacenCollection.aggregate([
          {
            $match: {
              ...filtroDataBacen,
              pixLiberado: true
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
          { $match: { dataEntradaDate: { $ne: null } } },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataEntradaDate' } },
                natureza: '$origem'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.dia': 1, '_id.natureza': 1 }
          }
        ]).toArray();

        // Motivos por dia - find() + processamento em memória (como Painel Tempo Real)
        // Mais robusto que aggregation; funciona com motivoReduzido String ou [String]
          const filtroMotivosBacen = {
            $or: [
              { dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } },
              { dataEntrada: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }
            ]
          };
          const docsBacen = await bacenCollection.find(filtroMotivosBacen).toArray();
          const diaStr = (d) => {
            if (!d) return null;
            const dt = d instanceof Date ? d : new Date(d);
            return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
          };
          const motivosPorDiaMap = {};
          docsBacen.forEach((d) => {
            const dia = diaStr(d.dataEntrada);
            if (!dia) return;
            const motivosArr = Array.isArray(d.motivoReduzido)
              ? d.motivoReduzido.filter((m) => m && String(m).trim())
              : d.motivoReduzido ? [String(d.motivoReduzido).trim()] : [];
            motivosArr.forEach((m) => {
              const motivo = String(m).trim();
              if (!motivo) return;
              if (isOrigemBacen(motivo)) return;
              if (!motivosPorDiaMap[motivo]) motivosPorDiaMap[motivo] = {};
              motivosPorDiaMap[motivo][dia] = (motivosPorDiaMap[motivo][dia] || 0) + 1;
            });
          });
          motivosPorDia = [];
          Object.keys(motivosPorDiaMap).sort().forEach((motivo) => {
            Object.entries(motivosPorDiaMap[motivo]).forEach(([dia, count]) => {
              motivosPorDia.push({ _id: { dia, motivo }, count });
            });
          });
          motivosPorDia.sort((a, b) => {
            if (a._id.dia !== b._id.dia) return a._id.dia.localeCompare(b._id.dia);
            return a._id.motivo.localeCompare(b._id.motivo);
          });
        } catch (bacenErr) {
          console.error('❌ Erro agregação BACEN diario:', bacenErr.message);
          console.error('Stack:', bacenErr.stack);
          naturezaPorDia = [];
          pixRetiradoPorDia = [];
          motivosPorDia = [];
        }

        resultado.bacen = {
          naturezaPorDia: naturezaPorDia || [],
          pixRetiradoPorDia: pixRetiradoPorDia || [],
          motivosPorDia: motivosPorDia || []
        };
        
      }

      if (!tipo || tipo === 'N2') {
        // Processar N2
        const n2Collection = db.collection('reclamacoes_n2Pix');
        
        // Chamados por dia - APENAS dataEntradaN2 (nunca createdAt)
        const chamadosPorDia = await n2Collection.aggregate([
          {
            $match: {
              dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                  then: '$dataEntradaN2',
                  else: { $toDate: '$dataEntradaN2' }
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

        // PIX Retirado por dia - APENAS dataEntradaN2 (nunca createdAt)
        const pixRetiradoPorDiaN2 = await n2Collection.aggregate([
          {
            $match: {
              dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate },
              $or: [{ pixLiberado: true }, { pixStatus: { $in: ['Liberado', 'Excluído', 'Solicitada'] } }]
            }
          },
          {
            $addFields: {
              dataEntradaDate: {
                $cond: {
                  if: { $eq: [{ $type: '$dataEntradaN2' }, 'date'] },
                  then: '$dataEntradaN2',
                  else: { $toDate: '$dataEntradaN2' }
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

        // Motivos por dia N2 - find() + processamento em memória (como Painel Tempo Real)
        const filtroN2 = {
          dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate }
        };
        const docsN2 = await n2Collection.find(filtroN2).toArray();
        const diaStrN2 = (d) => {
          if (!d) return null;
          const dt = d instanceof Date ? d : new Date(d);
          return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
        };
        const motivosPorDiaN2Map = {};
        docsN2.forEach((d) => {
          const dia = diaStrN2(d.dataEntradaN2);
          if (!dia) return;
          const motivosArr = Array.isArray(d.motivoReduzido)
            ? d.motivoReduzido.filter((m) => m && String(m).trim())
            : d.motivoReduzido ? [String(d.motivoReduzido).trim()] : [];
          motivosArr.forEach((m) => {
            const motivo = String(m).trim();
            if (!motivo) return;
            if (isOrigemBacen(motivo)) return;
            if (!motivosPorDiaN2Map[motivo]) motivosPorDiaN2Map[motivo] = {};
            motivosPorDiaN2Map[motivo][dia] = (motivosPorDiaN2Map[motivo][dia] || 0) + 1;
          });
        });
        const motivosPorDiaN2 = [];
        Object.keys(motivosPorDiaN2Map).sort().forEach((motivo) => {
          Object.entries(motivosPorDiaN2Map[motivo]).forEach(([dia, count]) => {
            motivosPorDiaN2.push({ _id: { dia, motivo }, count });
          });
        });
        motivosPorDiaN2.sort((a, b) => {
          if (a._id.dia !== b._id.dia) return a._id.dia.localeCompare(b._id.dia);
          return a._id.motivo.localeCompare(b._id.motivo);
        });

        resultado.n2 = {
          chamadosPorDia,
          pixRetiradoPorDia: pixRetiradoPorDiaN2,
          motivosPorDia: motivosPorDiaN2
        };
      }

      // Normalizar tipo para comparação (OUVIDORIA -> N2, PROCESSOS -> JUDICIAL)
      const tipoNorm = String(tipo || '').toUpperCase().trim();
      const processarReclameAqui = tipoNorm === 'RECLAME_AQUI' || tipoNorm === 'RECLAME AQUI';
      const processarProcon = tipoNorm === 'PROCON';
      const processarJudicial = tipoNorm === 'PROCESSOS' || tipoNorm === 'JUDICIAL' || tipoNorm === 'AÇÃO JUDICIAL' || tipoNorm === 'ACAO JUDICIAL';

      if (processarReclameAqui) {
        const reclameAquiCollection = db.collection('reclamacoes_reclameAqui');
        const chamadosPorDiaRA = await reclameAquiCollection.aggregate([
          { $match: { dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } } },
          { $addFields: { dataDate: { $cond: [{ $eq: [{ $type: '$dataReclam' }, 'date'] }, '$dataReclam', { $toDate: '$dataReclam' }] } } },
          { $match: { dataDate: { $ne: null } } },
          { $group: { _id: { dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataDate' } } }, count: { $sum: 1 } } },
          { $sort: { '_id.dia': 1 } }
        ]).toArray();
        const docsRA = await reclameAquiCollection.find({ dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }).toArray();
        const diaStrRA = (d) => { if (!d) return null; const dt = d instanceof Date ? d : new Date(d); return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10); };
        const motivosPorDiaRAMap = {};
        docsRA.forEach((d) => {
          const dia = diaStrRA(d.dataReclam);
          if (!dia) return;
          const motivosArr = Array.isArray(d.motivoReduzido) ? d.motivoReduzido.filter((m) => m && String(m).trim()) : d.motivoReduzido ? [String(d.motivoReduzido).trim()] : [];
          motivosArr.forEach((m) => {
            const motivo = String(m).trim();
            if (!motivo) return;
            if (!motivosPorDiaRAMap[motivo]) motivosPorDiaRAMap[motivo] = {};
            motivosPorDiaRAMap[motivo][dia] = (motivosPorDiaRAMap[motivo][dia] || 0) + 1;
          });
        });
        const motivosPorDiaRA = [];
        Object.keys(motivosPorDiaRAMap).sort().forEach((motivo) => {
          Object.entries(motivosPorDiaRAMap[motivo]).forEach(([dia, count]) => motivosPorDiaRA.push({ _id: { dia, motivo }, count }));
        });
        motivosPorDiaRA.sort((a, b) => (a._id.dia !== b._id.dia ? a._id.dia.localeCompare(b._id.dia) : a._id.motivo.localeCompare(b._id.motivo)));
        resultado.reclameAqui = { chamadosPorDia: chamadosPorDiaRA, motivosPorDia: motivosPorDiaRA };
      }

      if (processarProcon) {
        const proconCollection = db.collection('reclamacoes_procon');
        const chamadosPorDiaProcon = await proconCollection.aggregate([
          { $match: { dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } } },
          { $addFields: { dataDate: { $cond: [{ $eq: [{ $type: '$dataProcon' }, 'date'] }, '$dataProcon', { $toDate: '$dataProcon' }] } } },
          { $match: { dataDate: { $ne: null } } },
          { $group: { _id: { dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataDate' } } }, count: { $sum: 1 } } },
          { $sort: { '_id.dia': 1 } }
        ]).toArray();
        const docsProcon = await proconCollection.find({ dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }).toArray();
        const diaStrProcon = (d) => { if (!d) return null; const dt = d instanceof Date ? d : new Date(d); return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10); };
        const motivosPorDiaProconMap = {};
        docsProcon.forEach((d) => {
          const dia = diaStrProcon(d.dataProcon);
          if (!dia) return;
          const motivosArr = Array.isArray(d.motivoReduzido) ? d.motivoReduzido.filter((m) => m && String(m).trim()) : d.motivoReduzido ? [String(d.motivoReduzido).trim()] : [];
          motivosArr.forEach((m) => {
            const motivo = String(m).trim();
            if (!motivo) return;
            if (!motivosPorDiaProconMap[motivo]) motivosPorDiaProconMap[motivo] = {};
            motivosPorDiaProconMap[motivo][dia] = (motivosPorDiaProconMap[motivo][dia] || 0) + 1;
          });
        });
        const motivosPorDiaProcon = [];
        Object.keys(motivosPorDiaProconMap).sort().forEach((motivo) => {
          Object.entries(motivosPorDiaProconMap[motivo]).forEach(([dia, count]) => motivosPorDiaProcon.push({ _id: { dia, motivo }, count }));
        });
        motivosPorDiaProcon.sort((a, b) => (a._id.dia !== b._id.dia ? a._id.dia.localeCompare(b._id.dia) : a._id.motivo.localeCompare(b._id.motivo)));
        resultado.procon = { chamadosPorDia: chamadosPorDiaProcon, motivosPorDia: motivosPorDiaProcon };
      }

      if (processarJudicial) {
        const judicialCollection = db.collection('reclamacoes_judicial');
        const chamadosPorDiaJudicial = await judicialCollection.aggregate([
          { $match: { dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } } },
          { $addFields: { dataDate: { $cond: [{ $eq: [{ $type: '$dataEntrada' }, 'date'] }, '$dataEntrada', { $toDate: '$dataEntrada' }] } } },
          { $match: { dataDate: { $ne: null } } },
          { $group: { _id: { dia: { $dateToString: { format: '%Y-%m-%d', date: '$dataDate' } } }, count: { $sum: 1 } } },
          { $sort: { '_id.dia': 1 } }
        ]).toArray();
        const docsJudicial = await judicialCollection.find({ dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }).toArray();
        const diaStrJudicial = (d) => { if (!d) return null; const dt = d instanceof Date ? d : new Date(d); return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10); };
        const motivosPorDiaJudicialMap = {};
        docsJudicial.forEach((d) => {
          const dia = diaStrJudicial(d.dataEntrada);
          if (!dia) return;
          const motivosArr = Array.isArray(d.motivoReduzido) ? d.motivoReduzido.filter((m) => m && String(m).trim()) : d.motivoReduzido ? [String(d.motivoReduzido).trim()] : [];
          motivosArr.forEach((m) => {
            const motivo = String(m).trim();
            if (!motivo) return;
            if (!motivosPorDiaJudicialMap[motivo]) motivosPorDiaJudicialMap[motivo] = {};
            motivosPorDiaJudicialMap[motivo][dia] = (motivosPorDiaJudicialMap[motivo][dia] || 0) + 1;
          });
        });
        const motivosPorDiaJudicial = [];
        Object.keys(motivosPorDiaJudicialMap).sort().forEach((motivo) => {
          Object.entries(motivosPorDiaJudicialMap[motivo]).forEach(([dia, count]) => motivosPorDiaJudicial.push({ _id: { dia, motivo }, count }));
        });
        motivosPorDiaJudicial.sort((a, b) => (a._id.dia !== b._id.dia ? a._id.dia.localeCompare(b._id.dia) : a._id.motivo.localeCompare(b._id.motivo)));
        resultado.judicial = { chamadosPorDia: chamadosPorDiaJudicial, motivosPorDia: motivosPorDiaJudicial };
      }

      console.log(`✅ Relatório diário gerado para período ${dataInicio} a ${dataFim}, tipo: ${tipo || 'todos'}`);

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('❌ Erro ao gerar relatório diário:', error);
      console.error('Stack:', error.stack);
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

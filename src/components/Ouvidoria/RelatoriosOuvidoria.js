/**
 * VeloHub V3 - RelatoriosOuvidoria Component
 * VERSION: v2.13.0 | DATE: 2026-03-25 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.13.0:
 * - normalizarMotivoParaAgrupamento: Encerramento cta App/Celcoin e Portabilidade pix alinhados ao form Reclame Aqui v3.32
 * 
 * Mudanças v2.12.0:
 * - MOTIVOS_CONHECIDOS_FRONTEND e normalizarMotivoParaAgrupamento: padrão Xxxxx xxxxx xxxx (sentence case)
 * - Alinhado a motivoReduzidoNormalize e formulários (Em cobrança, Alega fraude, Liberação chave pix, etc.)
 * - Removido tratamento obsoleto "Retirar Chave PIX Cpf" (banco já normalizado)
 * 
 * Mudanças v2.11.0:
 * - Padronização de grafias em MOTIVOS_CONHECIDOS: Abatimento Juros → Abatimento de Juros
 * 
 * Mudanças v2.10.0:
 * - labelsPorTipo e coresPorTipo: adicionado 'N2 PIX' para compatibilidade com API que retorna tipo 'N2 Pix'
 * - normalizarTipo: aceita 'N2 PIX' além de OUVIDORIA, N2, etc.
 * 
 * Mudanças v2.9.0:
 * - CORRIGIDO: Gráfico de tipos por mês agora usa dados agregados do backend para Reclame Aqui, Procon e Ação Judicial
 * - CORRIGIDO: Fallback no gráfico agora usa campos de data corretos por tipo (dataReclam, dataProcon, dataEntrada) ao invés de createdAt
 * - Gráfico agora prioriza dados agregados do backend (mais preciso) e usa fallback apenas quando necessário
 * 
 * Mudanças v2.8.0:
 * - CORRIGIDO: Adicionadas validações robustas antes de usar .find() em arrays
 * - Verificação adicional de Array.isArray() antes de chamar métodos de array
 * - Validação de d && d._id antes de acessar propriedades em .find()
 * - Prevenção de erro "Cannot read properties of undefined (reading 'find')"
 * 
 * Mudanças v2.7.0:
 * - Melhorada normalização de "pix" e "PIX" isolados → "Chave Pix"
 * - Adicionada normalização de "Portabilidade" → "Portabilidade PIX"
 * - Adicionada normalização de "Encerramento da" → "Encerramento de Conta"
 * - Melhorada normalização de "Banco Do Brasil" → "Banco do Brasil"
 * - Melhorada normalização de "Limite Pix" → "Limite PIX"
 * - Melhorada normalização de "Pix não localizado" → "PIX Não Localizado"
 * - Melhorada normalização de "Restituição 1 Lote" → "Restituição 1° Lote"
 * 
 * Mudanças v2.6.0:
 * - Adicionada função dividirMotivoConcatenado para dividir motivos concatenados (ex: "Retirar Chave PIX Cpf")
 * - Melhorada função normalizarMotivoParaAgrupamento com mais padrões de normalização
 * - Adicionado tratamento especial para "Retirar Chave PIX Cpf" → ["Retirar", "Chave Pix"]
 * - Filtro melhorado para excluir naturezas/origens do quadro de motivos
 * - Normalização de variações como "Erro/aplicativo", "Crédito Pessoal Indisponível", etc.
 * 
 * Mudanças v2.5.0:
 * - Adicionada função normalizarMotivoParaAgrupamento para evitar duplicatas no quadro de motivos
 * - Normalização agrupa variações de capitalização (ex: "Chave Pix", "CHAVE PIX", "Chave PIX")
 * - Normalização trata variações de preposições (ex: "Encerramento de Conta" vs "Encerramento da conta")
 * - Filtro para excluir naturezas/origens (Bacen Celcoin, Bacen Via Capital, Consumidor.Gov) do quadro de motivos
 * 
 * Mudanças v2.4.0:
 * - Removidos gráficos individuais (Natureza BACEN e Casos Registrados vs Finalizados N2)
 * - Criados relatórios específicos para RECLAME_AQUI, PROCON e AÇÃO_JUDICIAL
 * - Seções de relatórios específicos só são exibidas quando a categoria correspondente está selecionada
 * - Cada categoria exibe apenas sua tabela de motivos por mês
 * 
 * Mudanças v2.3.1:
 * - CORRIGIDO: Gráfico geral agora mostra todos os tipos selecionados (não apenas BACEN e N2Pix)
 * - Ajustada normalização de tipos para corresponder ao formato retornado pelo backend
 * - Backend retorna "RECLAME AQUI" (com espaço) e "AÇÃO JUDICIAL", frontend agora normaliza corretamente
 * - Gráfico processa dados de relatorio.reclamacoes para tipos sem dados detalhados disponíveis
 * 
 * Mudanças v2.3.0:
 * - Adicionado quadro de motivos mostrando quantidade e percentual de cada motivoReduzido
 * - Quadro contempla todos os tipos selecionados
 * - Suporta motivos em formato array (Ação Judicial) e string (outros tipos)
 * - Tabela ordenada por quantidade (decrescente)
 * - Exibe total geral e percentuais individuais
 * 
 * Mudanças v2.2.0:
 * - Adicionada seção superior com dados gerais (total, resolvidas, taxa de resolução, tipos selecionados)
 * - Criado gráfico de linhas com uma linha para cada tipo selecionado
 * - Eixo X mostra meses do período selecionado
 * - Legendas na parte inferior com bubbles (círculos apenas com borda, sem preenchimento)
 * - Gráfico dentro de container-secondary
 * - Quando nenhum tipo é selecionado, mostra todos os tipos disponíveis
 * 
 * Mudanças v2.1.0:
 * - Adicionado filtro de múltipla escolha para tipos de reclamações
 * - Tipos disponíveis: BACEN, OUVIDORIA (N2 Pix), RECLAME_AQUI, PROCON, PROCESSOS (Ação Judicial)
 * - Filtro permite selecionar múltiplos tipos ou nenhum (busca todos)
 * - Backend atualizado para aceitar múltiplos tipos via parâmetro 'tipos'
 * 
 * Mudanças v2.0.0:
 * - Implementado filtro mensal (seleção MENSAL)
 * - Adicionados gráficos de Natureza (BACEN) e Casos Registrados/Finalizados (N2)
 * - Adicionados containers secundários para PIX Retirado e PIX Liberado
 * - Adicionadas tabelas de motivos com scroll horizontal
 * - Atualizada exportação XLSX com planilhas detalhadas
 * 
 * Componente para geração de relatórios do módulo de Ouvidoria
 */

import React, { useState, useMemo } from 'react';
import { relatoriosAPI } from '../../services/ouvidoriaApi';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

/**
 * Lista de motivos conhecidos para dividir strings concatenadas
 * Padrão: Xxxxx xxxxx xxxx (sentence case)
 * Ordenada por tamanho (maior primeiro) para melhor matching
 */
const MOTIVOS_CONHECIDOS_FRONTEND = [
  'Não recebeu restituição',
  'Liquidação antecipada',
  'Liberação chave pix',
  'Encerramento de conta',
  'Exclusão de conta',
  'Bloqueio de conta',
  'Contestação de valores',
  'Crédito do trabalhador',
  'Empréstimo pessoal',
  'Abatimento de juros',
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
].sort((a, b) => b.length - a.length);

/**
 * Dividir motivo concatenado em motivos individuais
 */
const dividirMotivoConcatenado = (motivo) => {
  if (!motivo || typeof motivo !== 'string') return [motivo];
  
  const motivoTrim = motivo.trim();
  if (!motivoTrim) return [];
  
  const motivoLower = motivoTrim.toLowerCase();
  
  // Verificar se é um motivo conhecido completo
  for (const motivoConhecido of MOTIVOS_CONHECIDOS_FRONTEND) {
    if (motivoLower === motivoConhecido.toLowerCase()) {
      return [motivoConhecido];
    }
  }
  
  // Tentar encontrar motivos conhecidos no texto
  const motivosEncontrados = [];
  const motivosVistos = new Set();
  let textoRestante = motivoTrim;
  
  // Encontrar matches de motivos conhecidos
  const matches = [];
  for (const motivoConhecido of MOTIVOS_CONHECIDOS_FRONTEND) {
    const motivoConhecidoLower = motivoConhecido.toLowerCase();
    let posicao = textoRestante.toLowerCase().indexOf(motivoConhecidoLower);
    while (posicao >= 0) {
      matches.push({ motivo: motivoConhecido, posicao, length: motivoConhecido.length, end: posicao + motivoConhecido.length });
      posicao = textoRestante.toLowerCase().indexOf(motivoConhecidoLower, posicao + 1);
    }
  }
  
  // Se não encontrou nenhum motivo conhecido, retornar o original
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
  
  matchesValidos.sort((a, b) => a.posicao - b.posicao);
  
  // Processar matches sequencialmente
  let ultimaPosicao = 0;
  for (const match of matchesValidos) {
    // Adicionar texto antes do match se não for vazio
    if (match.posicao > ultimaPosicao) {
      const parteAntes = textoRestante.substring(ultimaPosicao, match.posicao).trim();
      if (parteAntes.length > 0) {
        // Verificar se parteAntes é um motivo conhecido antes de adicionar
        let eMotivoConhecido = false;
        for (const motivoConhecido of MOTIVOS_CONHECIDOS_FRONTEND) {
          if (parteAntes.toLowerCase() === motivoConhecido.toLowerCase()) {
            const key = motivoConhecido.toLowerCase();
            if (!motivosVistos.has(key)) {
              motivosEncontrados.push(motivoConhecido);
              motivosVistos.add(key);
            }
            eMotivoConhecido = true;
            break;
          }
        }
        if (!eMotivoConhecido) {
          const key = parteAntes.toLowerCase();
          if (!motivosVistos.has(key)) {
            motivosEncontrados.push(parteAntes);
            motivosVistos.add(key);
          }
        }
      }
    }
    
    // Adicionar o motivo conhecido
    const motivoKey = match.motivo.toLowerCase();
    if (!motivosVistos.has(motivoKey)) {
      motivosEncontrados.push(match.motivo);
      motivosVistos.add(motivoKey);
    }
    
    ultimaPosicao = match.end;
  }
  
  // Adicionar texto restante
  if (ultimaPosicao < textoRestante.length) {
    const parteRestante = textoRestante.substring(ultimaPosicao).trim();
    if (parteRestante.length > 0) {
      // Verificar se parteRestante é um motivo conhecido antes de adicionar
      let eMotivoConhecido = false;
      for (const motivoConhecido of MOTIVOS_CONHECIDOS_FRONTEND) {
        if (parteRestante.toLowerCase() === motivoConhecido.toLowerCase()) {
          const key = motivoConhecido.toLowerCase();
          if (!motivosVistos.has(key)) {
            motivosEncontrados.push(motivoConhecido);
            motivosVistos.add(key);
          }
          eMotivoConhecido = true;
          break;
        }
      }
      if (!eMotivoConhecido) {
        const key = parteRestante.toLowerCase();
        if (!motivosVistos.has(key)) {
          motivosEncontrados.push(parteRestante);
        }
      }
    }
  }
  
  return motivosEncontrados.length > 0 ? motivosEncontrados : [motivoTrim];
};

/**
 * Normalizar motivo para agrupar variações (capitalização, preposições, etc.)
 * Retorna a versão normalizada para uso como chave e para exibição
 */
const normalizarMotivoParaAgrupamento = (motivo) => {
  if (!motivo || typeof motivo !== 'string') return '';
  
  let normalizado = motivo.trim();
  if (!normalizado) return '';
  
  const motivoLower = normalizado.toLowerCase();
  
  // Filtrar naturezas/origens que não são motivos
  const naturezasOrigens = [
    'bacen celcoin',
    'bacen via capital',
    'consumidor.gov',
    'consumidor gov'
  ];
  
  if (naturezasOrigens.includes(motivoLower)) {
    return ''; // Retornar string vazia para filtrar depois
  }
  
  if (motivoLower === 'lgpd' || motivoLower.includes('encerramento cta app')) {
    return 'Encerramento cta App';
  }
  if (motivoLower.includes('encerramento cta celcoin')) {
    return 'Encerramento cta Celcoin';
  }
  
  // Normalizar variações específicas conhecidas de "Chave Pix"
  // Incluir casos onde apenas "pix" ou "PIX" aparece sozinho
  if (motivoLower === 'chave pix' || motivoLower === 'chavepix' || motivoLower === 'chave pix cpf' || 
      motivoLower === 'pix' || motivoLower.trim() === 'pix') {
    return 'Chave pix';
  }
  
  if (motivoLower === 'liberação chave pix' || motivoLower === 'liberação de chave pix') {
    return 'Liberação chave pix';
  }
  
  if (motivoLower.includes('crédito pessoal') && motivoLower.includes('indisponível')) {
    return 'Crédito pessoal indisponível';
  }
  
  if (motivoLower.includes('juros') && motivoLower.includes('abusivos')) {
    return 'Juros abusivos';
  }
  
  if (motivoLower.includes('dívida') && motivoLower.includes('prescrita')) {
    return 'Dívida prescrita';
  }
  
  if (motivoLower.includes('dúvidas') && motivoLower.includes('restituição')) {
    return 'Dúvidas sobre restituição';
  }
  
  if (motivoLower.includes('dúvidas') && motivoLower.includes('crédito pessoal')) {
    return 'Dúvidas crédito pessoal';
  }
  
  if (motivoLower.includes('alteração') && motivoLower.includes('cadastral')) {
    return 'Alteração cadastral';
  }
  
  if (motivoLower.includes('estorno') && motivoLower.includes('plano')) {
    return 'Estorno de plano';
  }
  
  if (motivoLower.includes('restituição') && motivoLower.includes('2')) {
    return 'Restituição 2° lote';
  }
  
  if (motivoLower.includes('restituição') && motivoLower.includes('1')) {
    return 'Restituição 1° lote';
  }
  
  if (motivoLower.includes('pix') && motivoLower.includes('não') && motivoLower.includes('localizado')) {
    return 'Pix não localizado';
  }
  
  if (motivoLower.includes('cobrança') && motivoLower.includes('indevida')) {
    return 'Cobrança indevida';
  }
  
  if (motivoLower.includes('cobrança')) {
    return 'Em cobrança';
  }
  
  if (motivoLower.includes('fraude') || motivoLower === 'alega fraude') {
    return 'Alega fraude';
  }
  
  if (motivoLower.includes('dúvidas') && motivoLower.includes('crédito') && motivoLower.includes('trabalhador')) {
    return 'Dúvidas crédito ao trabalhador';
  }
  
  if (motivoLower.includes('banco') && motivoLower.includes('brasil')) {
    return 'Banco do Brasil';
  }
  
  if (motivoLower.includes('limite') && motivoLower.includes('pix')) {
    return 'Limite baixo do pix';
  }
  
  if (motivoLower === 'portabilidade' || (motivoLower.includes('portabilidade') && motivoLower.includes('pix'))) {
    return 'Portabilidade pix';
  }
  
  if (motivoLower.includes('encerramento') && motivoLower.includes('conta')) {
    return 'Encerramento cta Celcoin';
  }
  
  if (motivoLower.includes('encerramento') && motivoLower.includes('da')) {
    return 'Encerramento cta Celcoin';
  }
  
  if (motivoLower.includes('malha') && motivoLower.includes('fina')) {
    return 'Malha fina 2024';
  }
  
  if (motivoLower.includes('taxa') && motivoLower.includes('exclusão')) {
    return 'Taxa/Exclusão';
  }
  
  if (motivoLower.includes('seguro') && motivoLower.includes('acidente')) {
    return 'Seguro acidente';
  }
  
  if (motivoLower.includes('seguro') && motivoLower.includes('saúde')) {
    return 'Seguro saúde';
  }
  
  if (motivoLower.includes('portabilidade')) {
    return 'Portabilidade pix';
  }
  
  if (motivoLower === 'encerramento da' || motivoLower.startsWith('encerramento da')) {
    return 'Encerramento cta Celcoin';
  }
  
  if (motivoLower.includes('quitação') && motivoLower.includes('antecipada')) {
    return 'Quitação antecipada';
  }
  
  if (motivoLower.includes('antecipação') && motivoLower.includes('não') && motivoLower.includes('disponível')) {
    return 'Antecipação não disponível';
  }
  
  // Preposições que não devem ser capitalizadas (exceto no início)
  const preposicoes = ['do', 'da', 'de', 'ao', 'à', 'dos', 'das'];
  
  // Siglas que devem ser preservadas em maiúsculas
  const siglas = ['PIX', 'EP', 'BB', 'N/A', 'CPF'];
  
  // Converter para title case: primeira letra de cada palavra maiúscula, resto minúscula
  // Mas preservar siglas e não capitalizar preposições (exceto no início)
  const palavras = normalizado.split(' ');
  const palavrasNormalizadas = palavras.map((palavra, index) => {
    if (!palavra) return '';
    
    // Verificar se está dentro de parênteses (preservar siglas)
    const dentroParenteses = palavra.startsWith('(') && palavra.endsWith(')');
    const palavraSemParenteses = dentroParenteses ? palavra.slice(1, -1) : palavra;
    
    // Preservar siglas conhecidas
    const palavraUpper = palavraSemParenteses.toUpperCase();
    if (siglas.includes(palavraUpper)) {
      return dentroParenteses ? `(${palavraUpper})` : palavraUpper;
    }
    
    // Verificar se é preposição (não capitalizar exceto no início)
    const palavraLower = palavraSemParenteses.toLowerCase();
    if (preposicoes.includes(palavraLower) && index > 0) {
      return dentroParenteses ? `(${palavraLower})` : palavraLower;
    }
    
    // Normal: primeira maiúscula, resto minúscula
    const resultado = palavraSemParenteses.charAt(0).toUpperCase() + palavraSemParenteses.slice(1).toLowerCase();
    return dentroParenteses ? `(${resultado})` : resultado;
  });
  
  normalizado = palavrasNormalizadas.join(' ');
  
  // Normalizar variações conhecidas específicas após processamento
  const normalizadoLower = normalizado.toLowerCase();
  
  if (normalizadoLower === 'chave pix' || normalizadoLower === 'pix') {
    normalizado = 'Chave pix';
  }
  
  if (normalizadoLower === 'liberação chave pix') {
    normalizado = 'Liberação chave pix';
  }
  
  if (normalizadoLower.includes('erro') && normalizadoLower.includes('aplicativo')) {
    normalizado = 'Erro app';
  }
  
  // Normalizar "Banco Do Brasil" → "Banco do Brasil" (preposição "do" em minúscula)
  if (normalizadoLower.includes('banco') && normalizadoLower.includes('brasil')) {
    normalizado = normalizado.replace(/Banco\s+Do\s+Brasil/gi, 'Banco do Brasil');
  }
  
  if (normalizadoLower.includes('limite') && normalizadoLower.includes('pix')) {
    normalizado = 'Limite baixo do pix';
  }
  
  if (normalizadoLower.includes('pix') && normalizadoLower.includes('não') && normalizadoLower.includes('localizado')) {
    normalizado = 'Pix não localizado';
  }
  
  if (normalizadoLower.includes('restituição') && normalizadoLower.includes('1') && normalizadoLower.includes('lote')) {
    normalizado = 'Restituição 1° lote';
  }
  
  return normalizado;
};

const RelatoriosOuvidoria = () => {
  const [mesInicio, setMesInicio] = useState('');
  const [mesFim, setMesFim] = useState('');
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [dadosDetalhados, setDadosDetalhados] = useState(null);

  // Tipos disponíveis para filtro
  const TIPOS_DISPONIVEIS = [
    { value: 'BACEN', label: 'Bacen' },
    { value: 'OUVIDORIA', label: 'N2 Pix' },
    { value: 'RECLAME_AQUI', label: 'Reclame Aqui' },
    { value: 'PROCON', label: 'Procon' },
    { value: 'PROCESSOS', label: 'Ação Judicial' }
  ];

  /**
   * Converter mês (YYYY-MM) para primeiro dia do mês (YYYY-MM-DD)
   */
  const mesParaDataInicio = (mes) => {
    if (!mes) return '';
    return `${mes}-01`;
  };

  /**
   * Converter mês (YYYY-MM) para último dia do mês (YYYY-MM-DD)
   */
  const mesParaDataFim = (mes) => {
    if (!mes) return '';
    const [ano, mesNum] = mes.split('-');
    const ultimoDia = new Date(parseInt(ano), parseInt(mesNum), 0).getDate();
    return `${mes}-${String(ultimoDia).padStart(2, '0')}`;
  };

  /**
   * Toggle tipo selecionado
   */
  const toggleTipo = (tipoValue) => {
    setTiposSelecionados(prev => {
      if (prev.includes(tipoValue)) {
        return prev.filter(t => t !== tipoValue);
      } else {
        return [...prev, tipoValue];
      }
    });
  };

  /**
   * Gerar relatório
   */
  const gerarRelatorio = async () => {
    if (!mesInicio || !mesFim) {
      toast.error('Por favor, selecione o período mensal');
      return;
    }

    const dataInicio = mesParaDataInicio(mesInicio);
    const dataFim = mesParaDataFim(mesFim);

    // Preparar parâmetros com tipos selecionados
    const params = {
      dataInicio,
      dataFim
    };

    // Se houver tipos selecionados, adicionar ao parâmetro (múltiplos tipos separados por vírgula)
    if (tiposSelecionados.length > 0) {
      params.tipos = tiposSelecionados.join(',');
    }

    setLoading(true);
    try {
      // Buscar relatório básico
      const resultado = await relatoriosAPI.gerar(params);
      setRelatorio(resultado.data || resultado);

      // Buscar relatório detalhado
      const detalhado = await relatoriosAPI.detalhado(params);
      setDadosDetalhados(detalhado.data || detalhado);

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gerar array de meses no período
   */
  const gerarMesesNoPeriodo = useMemo(() => {
    if (!mesInicio || !mesFim) return [];
    const meses = [];
    const [anoInicio, mesInicioNum] = mesInicio.split('-').map(Number);
    const [anoFim, mesFimNum] = mesFim.split('-').map(Number);
    
    let anoAtual = anoInicio;
    let mesAtual = mesInicioNum;
    
    while (anoAtual < anoFim || (anoAtual === anoFim && mesAtual <= mesFimNum)) {
      meses.push(`${anoAtual}-${String(mesAtual).padStart(2, '0')}`);
      mesAtual++;
      if (mesAtual > 12) {
        mesAtual = 1;
        anoAtual++;
      }
    }
    
    return meses;
  }, [mesInicio, mesFim]);

  /**
   * Formatar mês para exibição (MMM/YYYY)
   */
  const formatarMes = (mes) => {
    if (!mes) return '';
    const [ano, mesNum] = mes.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mesNum) - 1]}/${ano}`;
  };

  /**
   * Processar dados gerais de todos os tipos selecionados
   */
  const dadosGerais = useMemo(() => {
    if (!relatorio) return null;

    return {
      total: relatorio.total || 0,
      concluidas: relatorio.concluidas || 0,
      taxaResolucao: relatorio.taxaResolucao || 0,
      porTipo: relatorio.porTipo || {},
      porStatus: relatorio.porStatus || {}
    };
  }, [relatorio]);

  /**
   * Processar quadro de motivos de todos os tipos selecionados
   */
  const processarQuadroMotivos = useMemo(() => {
    if (!relatorio?.reclamacoes) return null;

    // Se nenhum tipo selecionado, usar todos os tipos disponíveis
    const tiposParaProcessar = tiposSelecionados.length > 0 
      ? tiposSelecionados 
      : TIPOS_DISPONIVEIS.map(t => t.value);

    // Normalizar tipo para comparação (deve corresponder ao backend)
    const normalizarTipo = (tipo) => {
      const tipoUpper = String(tipo || '').toUpperCase().trim();
      if (tipoUpper === 'OUVIDORIA' || tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' || tipoUpper === 'N2 PIX') {
        return 'OUVIDORIA';
      }
      if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' || tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL') {
        return 'AÇÃO JUDICIAL'; // Backend retorna "AÇÃO JUDICIAL"
      }
      if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') {
        return 'RECLAME AQUI'; // Backend retorna "RECLAME AQUI" (com espaço)
      }
      return tipoUpper;
    };

    // Filtrar reclamações dos tipos selecionados
    const reclamaçõesFiltradas = relatorio.reclamacoes.filter(r => {
      const rTipo = normalizarTipo(r.tipo);
      return tiposParaProcessar.some(t => normalizarTipo(t) === rTipo);
    });

    // Agrupar motivos usando normalização para evitar duplicatas
    const motivosMap = {};
    const motivosNormalizadosMap = {}; // Mapear motivo normalizado (chave) para versão padronizada (valor)
    
    reclamaçõesFiltradas.forEach(reclamacao => {
      const motivoReduzido = reclamacao.motivoReduzido;
      
      if (!motivoReduzido) return;
      
      // Filtrar naturezas/origens que não são motivos (BACEN)
      const origem = reclamacao.origem;
      if (origem && (origem === 'Bacen Celcoin' || origem === 'Bacen Via Capital' || origem === 'Consumidor.Gov')) {
        // Não incluir naturezas/origens como motivos
        return;
      }
      
      // Função auxiliar para processar um motivo individual
      const processarMotivoIndividual = (motivo) => {
        if (!motivo || !motivo.trim()) return;
        
        const motivoTrim = motivo.trim();
        
        // Primeiro, tentar dividir se for concatenado
        const motivosDivididos = dividirMotivoConcatenado(motivoTrim);
        
        // Processar cada motivo dividido
        motivosDivididos.forEach(motivoDiv => {
          if (!motivoDiv || !motivoDiv.trim()) return;
          
          // Normalizar o motivo
          const motivoNormalizado = normalizarMotivoParaAgrupamento(motivoDiv);
          
          // Se retornou string vazia, é uma natureza/origem - pular
          if (motivoNormalizado === '') return;
          
          // Se retornou null ou undefined, usar o motivo original normalizado
          if (!motivoNormalizado) {
            // Usar o motivo original com capitalização básica
            const motivoCapitalizado = motivoDiv.split(' ').map(p => 
              p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
            ).join(' ');
            const chave = motivoCapitalizado.toLowerCase();
            motivosMap[chave] = (motivosMap[chave] || 0) + 1;
            if (!motivosNormalizadosMap[chave]) {
              motivosNormalizadosMap[chave] = motivoCapitalizado;
            }
          } else {
            const chave = motivoNormalizado.toLowerCase();
            motivosMap[chave] = (motivosMap[chave] || 0) + 1;
            if (!motivosNormalizadosMap[chave]) {
              motivosNormalizadosMap[chave] = motivoNormalizado;
            }
          }
        });
      };
      
      // Se for array (como em Ação Judicial), processar cada item
      if (Array.isArray(motivoReduzido)) {
        motivoReduzido.forEach(motivo => {
          processarMotivoIndividual(motivo);
        });
      } else if (typeof motivoReduzido === 'string' && motivoReduzido.trim()) {
        // Se for string, pode ter múltiplos motivos separados por vírgula ou ponto e vírgula
        const motivos = motivoReduzido.split(/[,;]/).map(m => m.trim()).filter(m => m);
        motivos.forEach(motivo => {
          processarMotivoIndividual(motivo);
        });
      }
    });

    // Converter para array usando versões normalizadas e ordenar por quantidade (decrescente)
    const motivosArray = Object.entries(motivosMap)
      .map(([chave, quantidade]) => ({ 
        motivo: motivosNormalizadosMap[chave] || chave, 
        quantidade 
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const totalGeral = motivosArray.reduce((sum, item) => sum + item.quantidade, 0);

    return {
      motivos: motivosArray,
      total: totalGeral
    };
  }, [relatorio, tiposSelecionados]);

  /**
   * Processar dados de tipos por mês para gráfico geral
   */
  const processarDadosTiposPorMes = useMemo(() => {
    if (!relatorio) return null;
    
    // Se nenhum tipo selecionado, usar todos os tipos disponíveis
    const tiposParaProcessar = tiposSelecionados.length > 0 
      ? tiposSelecionados 
      : TIPOS_DISPONIVEIS.map(t => t.value);

    const meses = gerarMesesNoPeriodo;
    const coresPorTipo = {
      'BACEN': '#1634FF',
      'OUVIDORIA': '#1694FF',
      'N2 PIX': '#1694FF',
      'RECLAME_AQUI': '#15A237',
      'PROCON': '#FCC200',
      'PROCESSOS': '#000058'
    };

    const labelsPorTipo = {
      'BACEN': 'Bacen',
      'OUVIDORIA': 'N2 Pix',
      'N2 PIX': 'N2 Pix',
      'RECLAME_AQUI': 'Reclame Aqui',
      'PROCON': 'Procon',
      'PROCESSOS': 'Ação Judicial'
    };

    // Mapeamento de tipos para normalização (deve corresponder ao backend)
    const normalizarTipo = (tipo) => {
      const tipoUpper = String(tipo || '').toUpperCase().trim();
      if (tipoUpper === 'OUVIDORIA' || tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' || tipoUpper === 'N2 PIX') {
        return 'OUVIDORIA';
      }
      if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' || tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL') {
        return 'AÇÃO JUDICIAL'; // Backend retorna "AÇÃO JUDICIAL"
      }
      if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') {
        return 'RECLAME AQUI'; // Backend retorna "RECLAME AQUI" (com espaço)
      }
      return tipoUpper;
    };

    const datasets = tiposParaProcessar.map(tipo => {
      const tipoUpper = tipo.toUpperCase();
      const tipoNormalizado = normalizarTipo(tipoUpper);
      
      // Mapear para chave de cores/labels (usar formato interno)
      const tipoParaChave = {
        'AÇÃO JUDICIAL': 'PROCESSOS',
        'RECLAME AQUI': 'RECLAME_AQUI'
      };
      const chaveTipo = tipoParaChave[tipoNormalizado] || tipoNormalizado;
      
      const cor = coresPorTipo[chaveTipo] || coresPorTipo[tipoUpper] || '#6B7280';
      const label = labelsPorTipo[chaveTipo] || labelsPorTipo[tipoUpper] || tipoUpper;

      // Buscar dados do tipo específico do relatório
      let dadosPorMes = [];
      
      if (tipoNormalizado === 'BACEN' && dadosDetalhados?.bacen?.naturezaPorMes && Array.isArray(dadosDetalhados.bacen.naturezaPorMes)) {
        // Para BACEN, somar todas as naturezas por mês
        dadosPorMes = meses.map(mes => {
          const itens = dadosDetalhados.bacen.naturezaPorMes.filter(d => d && d._id && d._id.mes === mes);
          return itens.reduce((sum, item) => sum + (item.count || 0), 0);
        });
      } else if (tipoNormalizado === 'OUVIDORIA' && dadosDetalhados?.n2?.casosRegistradosPorMes && Array.isArray(dadosDetalhados.n2.casosRegistradosPorMes)) {
        // Para N2, usar casos registrados por mês
        dadosPorMes = meses.map(mes => {
          const item = dadosDetalhados.n2.casosRegistradosPorMes.find(d => d?._id?.mes === mes);
          return item ? (item.count || 0) : 0;
        });
      } else if (tipoNormalizado === 'RECLAME AQUI' && dadosDetalhados?.reclameAqui?.motivosPorMes && Array.isArray(dadosDetalhados.reclameAqui.motivosPorMes)) {
        // Para Reclame Aqui, somar todos os motivos por mês
        dadosPorMes = meses.map(mes => {
          const itens = dadosDetalhados.reclameAqui.motivosPorMes.filter(d => d && d._id && d._id.mes === mes);
          return itens.reduce((sum, item) => sum + (item.count || 0), 0);
        });
      } else if (tipoNormalizado === 'PROCON' && dadosDetalhados?.procon?.motivosPorMes && Array.isArray(dadosDetalhados.procon.motivosPorMes)) {
        // Para Procon, somar todos os motivos por mês
        dadosPorMes = meses.map(mes => {
          const itens = dadosDetalhados.procon.motivosPorMes.filter(d => d && d._id && d._id.mes === mes);
          return itens.reduce((sum, item) => sum + (item.count || 0), 0);
        });
      } else if (tipoNormalizado === 'AÇÃO JUDICIAL' && dadosDetalhados?.judicial?.motivosPorMes && Array.isArray(dadosDetalhados.judicial.motivosPorMes)) {
        // Para Ação Judicial, somar todos os motivos por mês
        dadosPorMes = meses.map(mes => {
          const itens = dadosDetalhados.judicial.motivosPorMes.filter(d => d && d._id && d._id.mes === mes);
          return itens.reduce((sum, item) => sum + (item.count || 0), 0);
        });
      } else {
        // Fallback: buscar do relatório básico usando campo de data correto baseado no tipo
        dadosPorMes = meses.map(mes => {
          const [ano, mesNum] = mes.split('-');
          if (!relatorio.reclamacoes) return 0;
          
          return relatorio.reclamacoes.filter(r => {
            const rTipo = String(r.tipo || '').toUpperCase().trim();
            // Comparar tipos normalizados
            const rTipoNormalizado = normalizarTipo(rTipo);
            return rTipoNormalizado === tipoNormalizado;
          }).filter(r => {
            // Filtrar por mês usando campo de data correto baseado no tipo
            let rDate;
            if (tipoNormalizado === 'RECLAME AQUI' && r.dataReclam) {
              rDate = new Date(r.dataReclam);
            } else if (tipoNormalizado === 'PROCON' && r.dataProcon) {
              rDate = new Date(r.dataProcon);
            } else if ((tipoNormalizado === 'AÇÃO JUDICIAL' || tipoNormalizado === 'PROCESSOS') && r.dataEntrada) {
              rDate = new Date(r.dataEntrada);
            } else if ((tipoNormalizado === 'BACEN' || tipoNormalizado === 'OUVIDORIA') && r.dataEntrada) {
              rDate = new Date(r.dataEntrada);
            } else {
              // Fallback para createdAt apenas se não houver campo específico
              rDate = new Date(r.createdAt);
            }
            return rDate.getFullYear() === parseInt(ano) && (rDate.getMonth() + 1) === parseInt(mesNum);
          }).length;
        });
      }

      return {
        label: label,
        data: dadosPorMes,
        borderColor: cor,
        backgroundColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointBorderColor: cor,
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.1
      };
    });

    return {
      labels: meses.map(formatarMes),
      datasets
    };
  }, [dadosDetalhados, tiposSelecionados, gerarMesesNoPeriodo, relatorio]);

  /**
   * Processar dados de natureza por mês para gráfico BACEN
   */
  const processarDadosNatureza = useMemo(() => {
    if (!dadosDetalhados?.bacen?.naturezaPorMes || !Array.isArray(dadosDetalhados.bacen.naturezaPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    const naturezas = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'];
    
    const datasets = naturezas.map((natureza, index) => {
      const cores = ['#1634FF', '#1694FF', '#000058'];
      const dados = meses.map(mes => {
        if (!Array.isArray(dadosDetalhados.bacen.naturezaPorMes)) return 0;
        const item = dadosDetalhados.bacen.naturezaPorMes.find(
          d => d && d._id && d._id.mes === mes && d._id.natureza === natureza
        );
        return item ? (item.count || 0) : 0;
      });

      return {
        label: natureza,
        data: dados,
        borderColor: cores[index],
        backgroundColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointBorderColor: cores[index],
        pointBorderWidth: 2,
        tension: 0.1
      };
    });

    return {
      labels: meses.map(formatarMes),
      datasets
    };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar dados de casos registrados vs finalizados para gráfico N2
   */
  const processarDadosCasosN2 = useMemo(() => {
    if (!dadosDetalhados?.n2) return null;
    if (!Array.isArray(dadosDetalhados.n2.casosRegistradosPorMes) || !Array.isArray(dadosDetalhados.n2.casosFinalizadosPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    
    const registrados = meses.map(mes => {
      if (!Array.isArray(dadosDetalhados.n2.casosRegistradosPorMes)) return 0;
      const item = dadosDetalhados.n2.casosRegistradosPorMes.find(d => d && d._id && d._id.mes === mes);
      return item ? (item.count || 0) : 0;
    });

    const finalizados = meses.map(mes => {
      if (!Array.isArray(dadosDetalhados.n2.casosFinalizadosPorMes)) return 0;
      const item = dadosDetalhados.n2.casosFinalizadosPorMes.find(d => d && d._id && d._id.mes === mes);
      return item ? (item.count || 0) : 0;
    });

    return {
      labels: meses.map(formatarMes),
      datasets: [
        {
          label: 'Casos Registrados',
          data: registrados,
          borderColor: '#1634FF',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'transparent',
          pointBorderColor: '#1634FF',
          pointBorderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Casos Finalizados',
          data: finalizados,
          borderColor: '#15A237',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'transparent',
          pointBorderColor: '#15A237',
          pointBorderWidth: 2,
          tension: 0.1
        }
      ]
    };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar dados PIX Retirado por Natureza
   */
  const processarPixRetirado = useMemo(() => {
    if (!dadosDetalhados?.bacen?.pixRetiradoPorNatureza || !Array.isArray(dadosDetalhados.bacen.pixRetiradoPorNatureza)) return null;

    const meses = gerarMesesNoPeriodo;
    const naturezas = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'];
    
    const tabela = naturezas.map(natureza => {
      const valores = meses.map(mes => {
        if (!Array.isArray(dadosDetalhados.bacen.pixRetiradoPorNatureza)) return 0;
        const item = dadosDetalhados.bacen.pixRetiradoPorNatureza.find(
          d => d && d._id && d._id.mes === mes && d._id.natureza === natureza
        );
        return item ? (item.count || 0) : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { natureza, valores, total };
    });

    const totaisPorMes = meses.map(mes => {
      if (!Array.isArray(dadosDetalhados.bacen.pixRetiradoPorNatureza)) return 0;
      return naturezas.reduce((sum, natureza) => {
        const item = dadosDetalhados.bacen.pixRetiradoPorNatureza.find(
          d => d && d._id && d._id.mes === mes && d._id.natureza === natureza
        );
        return sum + (item ? (item.count || 0) : 0);
      }, 0);
    });
    const totalGeral = totaisPorMes.reduce((sum, val) => sum + val, 0);

    return { tabela, totaisPorMes, totalGeral, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar dados PIX Liberado N2
   */
  const processarPixLiberado = useMemo(() => {
    if (!dadosDetalhados?.n2?.pixLiberadoPorMes || !Array.isArray(dadosDetalhados.n2.pixLiberadoPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    
    const sim = meses.map(mes => {
      if (!Array.isArray(dadosDetalhados.n2.pixLiberadoPorMes)) return 0;
      const item = dadosDetalhados.n2.pixLiberadoPorMes.find(
        d => d && d._id && d._id.mes === mes && d._id.pixStatus === 'Liberado'
      );
      return item ? (item.count || 0) : 0;
    });

    const nao = meses.map(mes => {
      if (!Array.isArray(dadosDetalhados.n2.pixLiberadoPorMes)) return 0;
      const totalMes = dadosDetalhados.n2.pixLiberadoPorMes
        .filter(d => d && d._id && d._id.mes === mes)
        .reduce((sum, item) => sum + (item.count || 0), 0);
      const liberado = dadosDetalhados.n2.pixLiberadoPorMes.find(
        d => d && d._id && d._id.mes === mes && d._id.pixStatus === 'Liberado'
      );
      return totalMes - (liberado ? (liberado.count || 0) : 0);
    });

    const totaisPorMes = meses.map((mes, index) => sim[index] + nao[index]);
    const totalSim = sim.reduce((sum, val) => sum + val, 0);
    const totalNao = nao.reduce((sum, val) => sum + val, 0);
    const totalGeral = totalSim + totalNao;

    return { sim, nao, totaisPorMes, totalSim, totalNao, totalGeral, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar motivos BACEN
   */
  const processarMotivosBacen = useMemo(() => {
    if (!dadosDetalhados?.bacen?.motivosPorMes || !Array.isArray(dadosDetalhados.bacen.motivosPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    const dadosParaProcessar = dadosDetalhados.bacen.motivosPorMes;
    if (!Array.isArray(dadosParaProcessar) || dadosParaProcessar.length === 0) return null;
    
    // Verificar se os dados estão usando 'natureza' ao invés de 'motivo' (erro no backend)
    const primeiroItem = dadosParaProcessar[0];
    if (primeiroItem && primeiroItem._id && primeiroItem._id.natureza) {
      // Se os dados têm 'natureza' ao invés de 'motivo', há um erro no backend
      // Mas vamos processar mesmo assim para não quebrar a interface
      console.warn('⚠️ AVISO: motivosPorMes está retornando dados de natureza. Verifique o backend.');
      const motivosUnicos = [...new Set(dadosParaProcessar.map(d => d?._id?.natureza).filter(Boolean))];
      if (motivosUnicos.length === 0) return null;
      
      const tabela = motivosUnicos.map(motivo => {
        const valores = meses.map(mes => {
          if (!Array.isArray(dadosParaProcessar)) return 0;
          const item = dadosParaProcessar.find(
            d => d && d._id && d._id.mes === mes && d._id.natureza === motivo
          );
          return item ? (item.count || 0) : 0;
        });
        const total = valores.reduce((sum, val) => sum + val, 0);
        return { motivo, valores, total };
      });

      return { tabela, meses };
    }
    
    // Processamento normal com 'motivo'
    const motivosUnicos = [...new Set(dadosParaProcessar.map(d => d?._id?.motivo).filter(Boolean))];
    if (motivosUnicos.length === 0) return null;
    
    const tabela = motivosUnicos.map(motivo => {
        const valores = meses.map(mes => {
          if (!Array.isArray(dadosParaProcessar)) return 0;
          const item = dadosParaProcessar.find(
            d => d && d._id && d._id.mes === mes && d._id.motivo === motivo
          );
          return item ? (item.count || 0) : 0;
        });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { motivo, valores, total };
    });

    return { tabela, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar motivos N2
   */
  const processarMotivosN2 = useMemo(() => {
    if (!dadosDetalhados?.n2?.motivosPorMes || !Array.isArray(dadosDetalhados.n2.motivosPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    const motivosPorMes = dadosDetalhados.n2.motivosPorMes;
    if (motivosPorMes.length === 0) return null;

    const motivosUnicos = [...new Set(motivosPorMes.map(d => d?._id?.motivo).filter(Boolean))];
    if (motivosUnicos.length === 0) return null;
    
    const tabela = motivosUnicos.map(motivo => {
      const valores = meses.map(mes => {
        if (!Array.isArray(motivosPorMes)) return 0;
        const item = motivosPorMes.find(
          d => d && d._id && d._id.mes === mes && d._id.motivo === motivo
        );
        return item ? (item.count || 0) : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { motivo, valores, total };
    });

    return { tabela, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar motivos Reclame Aqui
   */
  const processarMotivosReclameAqui = useMemo(() => {
    if (!dadosDetalhados?.reclameAqui?.motivosPorMes || !Array.isArray(dadosDetalhados.reclameAqui.motivosPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    const motivosPorMes = dadosDetalhados.reclameAqui.motivosPorMes;
    if (motivosPorMes.length === 0) return null;

    const motivosUnicos = [...new Set(motivosPorMes.map(d => d?._id?.motivo).filter(Boolean))];
    if (motivosUnicos.length === 0) return null;
    
    const tabela = motivosUnicos.map(motivo => {
      const valores = meses.map(mes => {
        if (!Array.isArray(motivosPorMes)) return 0;
        const item = motivosPorMes.find(
          d => d && d._id && d._id.mes === mes && d._id.motivo === motivo
        );
        return item ? (item.count || 0) : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { motivo, valores, total };
    });

    return { tabela, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar motivos Procon
   */
  const processarMotivosProcon = useMemo(() => {
    if (!dadosDetalhados?.procon?.motivosPorMes || !Array.isArray(dadosDetalhados.procon.motivosPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    const motivosPorMes = dadosDetalhados.procon.motivosPorMes;
    if (motivosPorMes.length === 0) return null;

    const motivosUnicos = [...new Set(motivosPorMes.map(d => d?._id?.motivo).filter(Boolean))];
    if (motivosUnicos.length === 0) return null;
    
    const tabela = motivosUnicos.map(motivo => {
      const valores = meses.map(mes => {
        if (!Array.isArray(motivosPorMes)) return 0;
        const item = motivosPorMes.find(
          d => d && d._id && d._id.mes === mes && d._id.motivo === motivo
        );
        return item ? (item.count || 0) : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { motivo, valores, total };
    });

    return { tabela, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar motivos Ação Judicial
   */
  const processarMotivosJudicial = useMemo(() => {
    if (!dadosDetalhados?.judicial?.motivosPorMes || !Array.isArray(dadosDetalhados.judicial.motivosPorMes)) return null;

    const meses = gerarMesesNoPeriodo;
    const motivosPorMes = dadosDetalhados.judicial.motivosPorMes;
    if (motivosPorMes.length === 0) return null;

    const motivosUnicos = [...new Set(motivosPorMes.map(d => d?._id?.motivo).filter(Boolean))];
    if (motivosUnicos.length === 0) return null;
    
    const tabela = motivosUnicos.map(motivo => {
      const valores = meses.map(mes => {
        if (!Array.isArray(motivosPorMes)) return 0;
        const item = motivosPorMes.find(
          d => d && d._id && d._id.mes === mes && d._id.motivo === motivo
        );
        return item ? (item.count || 0) : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { motivo, valores, total };
    });

    return { tabela, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Exportar relatório para XLSX
   */
  const exportarRelatorio = () => {
    if (!relatorio || !dadosDetalhados) {
      toast.error('Gere um relatório primeiro');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Planilha: BACEN - Natureza por Mês
      if (processarDadosNatureza) {
        const dadosNatureza = [];
        dadosNatureza.push(['Mês', ...gerarMesesNoPeriodo.map(formatarMes)]);
        processarDadosNatureza.datasets.forEach(dataset => {
          dadosNatureza.push([dataset.label, ...dataset.data]);
        });
        const wsNatureza = XLSX.utils.aoa_to_sheet(dadosNatureza);
        XLSX.utils.book_append_sheet(wb, wsNatureza, 'BACEN - Natureza');
      }

      // Planilha: BACEN - PIX Retirado
      if (processarPixRetirado) {
        const dadosPixRetirado = [];
        dadosPixRetirado.push(['Natureza', ...processarPixRetirado.meses.map(formatarMes), 'Total']);
        processarPixRetirado.tabela.forEach(linha => {
          dadosPixRetirado.push([linha.natureza, ...linha.valores, linha.total]);
        });
        dadosPixRetirado.push(['Total', ...processarPixRetirado.totaisPorMes, processarPixRetirado.totalGeral]);
        const wsPixRetirado = XLSX.utils.aoa_to_sheet(dadosPixRetirado);
        XLSX.utils.book_append_sheet(wb, wsPixRetirado, 'BACEN - PIX Retirado');
      }

      // Planilha: BACEN - Motivos
      if (processarMotivosBacen) {
        const dadosMotivosBacen = [];
        dadosMotivosBacen.push(['Motivo', ...processarMotivosBacen.meses.map(formatarMes), 'Total']);
        processarMotivosBacen.tabela.forEach(linha => {
          dadosMotivosBacen.push([linha.motivo, ...linha.valores, linha.total]);
        });
        const wsMotivosBacen = XLSX.utils.aoa_to_sheet(dadosMotivosBacen);
        XLSX.utils.book_append_sheet(wb, wsMotivosBacen, 'BACEN - Motivos');
      }

      // Planilha: N2 - Casos Registrados vs Finalizados
      if (processarDadosCasosN2) {
        const dadosCasos = [];
        dadosCasos.push(['Mês', ...gerarMesesNoPeriodo.map(formatarMes)]);
        processarDadosCasosN2.datasets.forEach(dataset => {
          dadosCasos.push([dataset.label, ...dataset.data]);
        });
        const wsCasos = XLSX.utils.aoa_to_sheet(dadosCasos);
        XLSX.utils.book_append_sheet(wb, wsCasos, 'N2 - Casos');
      }

      // Planilha: N2 - PIX Liberado
      if (processarPixLiberado) {
        const dadosPixLiberado = [];
        dadosPixLiberado.push(['Status', ...processarPixLiberado.meses.map(formatarMes), 'Total']);
        dadosPixLiberado.push(['Sim', ...processarPixLiberado.sim, processarPixLiberado.totalSim]);
        dadosPixLiberado.push(['Não', ...processarPixLiberado.nao, processarPixLiberado.totalNao]);
        dadosPixLiberado.push(['Total', ...processarPixLiberado.totaisPorMes, processarPixLiberado.totalGeral]);
        const wsPixLiberado = XLSX.utils.aoa_to_sheet(dadosPixLiberado);
        XLSX.utils.book_append_sheet(wb, wsPixLiberado, 'N2 - PIX Liberado');
      }

      // Planilha: N2 - Motivos
      if (processarMotivosN2) {
        const dadosMotivosN2 = [];
        dadosMotivosN2.push(['Motivo', ...processarMotivosN2.meses.map(formatarMes), 'Total']);
        processarMotivosN2.tabela.forEach(linha => {
          dadosMotivosN2.push([linha.motivo, ...linha.valores, linha.total]);
        });
        const wsMotivosN2 = XLSX.utils.aoa_to_sheet(dadosMotivosN2);
        XLSX.utils.book_append_sheet(wb, wsMotivosN2, 'N2 - Motivos');
      }

      // Planilha: Reclamações (mantida)
      if (relatorio.reclamacoes) {
        const dadosReclamacoes = (relatorio.reclamacoes || []).map((r, index) => ({
          '#': index + 1,
          'Nome': r.nome || '-',
          'CPF': r.cpf || '-',
          'Tipo': r.tipo || '-',
          'Status': r.status || '-',
          'Data Entrada': r.dataEntrada || '-',
          'Motivo': r.motivoReduzido || '-',
          'Responsável': r.responsavel || '-',
        }));
        const wsReclamacoes = XLSX.utils.json_to_sheet(dadosReclamacoes);
        XLSX.utils.book_append_sheet(wb, wsReclamacoes, 'Reclamações');
      }

      const dataAtual = new Date().toISOString().slice(0, 10);
      const nomeArquivo = `relatorio_ouvidoria_${dataAtual}.xlsx`;
      XLSX.writeFile(wb, nomeArquivo);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const opcoesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          boxWidth: 10,
          boxHeight: 10,
          generateLabels: function(chart) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            labels.forEach((label, index) => {
              // Bubble: apenas borda, sem preenchimento
              const dataset = chart.data.datasets[index];
              if (dataset) {
                label.fillStyle = 'transparent';
                label.strokeStyle = dataset.borderColor || dataset.pointBorderColor || label.strokeStyle;
                label.lineWidth = 2;
              }
            });
            return labels;
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (value) => value !== null && value !== undefined ? value : '',
        color: '#272A30',
        font: {
          size: 10,
          weight: 'bold',
        },
        display: function(context) {
          return context.dataset.data[context.dataIndex] !== null && context.dataset.data[context.dataIndex] !== undefined;
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: 'transparent',
      },
      line: {
        borderWidth: 2,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Opções específicas para gráfico de tipos (com bubbles nas legendas)
  const opcoesGraficoTipos = {
    ...opcoesGrafico,
    plugins: {
      ...opcoesGrafico.plugins,
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          boxWidth: 10,
          boxHeight: 10,
          generateLabels: function(chart) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            labels.forEach((label, index) => {
              // Bubble: apenas borda circular, sem preenchimento
              const dataset = chart.data.datasets[index];
              if (dataset) {
                label.fillStyle = 'transparent';
                label.strokeStyle = dataset.borderColor || dataset.pointBorderColor || label.strokeStyle;
                label.lineWidth = 2;
                label.pointStyle = 'circle';
              }
            });
            return labels;
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Filtros */}
      <div className="velohub-card mb-6">
        <h3 className="text-xl font-semibold velohub-title mb-4">Filtros do Relatório</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Mês Início *
            </label>
            <input
              type="month"
              value={mesInicio}
              onChange={(e) => setMesInicio(e.target.value)}
              className="w-full max-w-xs border border-gray-400 dark:border-gray-500 rounded-lg px-2 py-1.5 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Mês Fim *
            </label>
            <input
              type="month"
              value={mesFim}
              onChange={(e) => setMesFim(e.target.value)}
              className="w-full max-w-xs border border-gray-400 dark:border-gray-500 rounded-lg px-2 py-1.5 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tipos
            </label>
            <div className="flex gap-2 items-center">
              {TIPOS_DISPONIVEIS.map(tipo => (
                <label
                  key={tipo.value}
                  className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded border transition-all duration-200 dark:bg-gray-800 whitespace-nowrap"
                  style={{
                    borderColor: tiposSelecionados.includes(tipo.value) ? '#006AB9' : '#9CA3AF',
                    backgroundColor: tiposSelecionados.includes(tipo.value) ? '#E6F2FF' : 'transparent',
                    color: tiposSelecionados.includes(tipo.value) ? '#006AB9' : '#6B7280'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tiposSelecionados.includes(tipo.value)}
                    onChange={() => toggleTipo(tipo.value)}
                    className="w-4 h-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{tipo.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={gerarRelatorio}
            disabled={loading}
            className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
            style={{
              borderColor: '#006AB9',
              color: '#006AB9',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                e.target.style.color = '#F3F7FC';
                e.target.style.borderColor = '#006AB9';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
                e.target.style.borderColor = '#006AB9';
              }
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando...
              </>
            ) : (
              'Gerar Relatório'
            )}
          </button>
          {relatorio && (
            <button
              onClick={exportarRelatorio}
              className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                e.target.style.color = '#F3F7FC';
                e.target.style.borderColor = '#006AB9';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
                e.target.style.borderColor = '#006AB9';
              }}
            >
              Exportar
            </button>
          )}
        </div>
      </div>

      {/* Linha Divisória */}
      {relatorio && <hr className="border-b border-gray-300 dark:border-gray-600 my-6" />}

      {/* Seção Superior: Dados Gerais */}
      {dadosGerais && (
        <div className="velohub-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#006AB9' }}>
                {dadosGerais.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total de Reclamações
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#15A237' }}>
                {dadosGerais.concluidas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Resolvidas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#1634FF' }}>
                {dadosGerais.taxaResolucao}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Taxa de Resolução
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#272A30' }}>
                {Object.keys(dadosGerais.porTipo).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tipos Selecionados
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Tipos por Mês */}
      {processarDadosTiposPorMes && (
        <div className="container-secondary mb-6">
          <div style={{ height: '300px', width: '100%' }}>
            <Line data={processarDadosTiposPorMes} options={opcoesGraficoTipos} />
          </div>
        </div>
      )}

      {/* Quadro de Motivos */}
      {processarQuadroMotivos && processarQuadroMotivos.motivos.length > 0 && (
        <div className="container-secondary mb-6">
          <h3 className="text-lg font-semibold mb-4">Motivos</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Quantidade</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {processarQuadroMotivos.motivos.map((item, index) => {
                  const percentual = processarQuadroMotivos.total > 0 
                    ? ((item.quantidade / processarQuadroMotivos.total) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{item.motivo}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">{item.quantidade}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">{percentual}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Total</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">{processarQuadroMotivos.total}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Linha Divisória */}
      {relatorio && <hr className="border-b border-gray-300 dark:border-gray-600 my-6" />}

      {/* Seção BACEN */}
      {dadosDetalhados?.bacen && (
        <>
          <h2 className="text-xl font-semibold velohub-title mb-4">BACEN</h2>

          {/* Container PIX Retirado */}
          {processarPixRetirado && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">PIX Retirado</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Natureza</th>
                      {processarPixRetirado.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarPixRetirado.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.natureza}</td>
                        {linha.valores.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                          {linha.total}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Total</td>
                      {processarPixRetirado.totaisPorMes.map((total, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                          {total}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                        {processarPixRetirado.totalGeral}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela Motivos BACEN */}
          {processarMotivosBacen && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className={`overflow-x-auto ${gerarMesesNoPeriodo.length > 6 ? 'overflow-x-scroll' : ''}`}>
                <table className="w-full border-collapse min-w-full">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosBacen.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarMotivosBacen.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.motivo}</td>
                        {linha.valores.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                          {linha.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Linha Divisória */}
          <hr className="border-b border-gray-300 dark:border-gray-600 my-6" />
        </>
      )}

      {/* Seção N2 e Pix */}
      {dadosDetalhados?.n2 && (
        <>
          <h2 className="text-xl font-semibold velohub-title mb-4">N2 e Pix</h2>

          {/* Container PIX Liberado */}
          {processarPixLiberado && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Pix Liberado</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Status</th>
                      {processarPixLiberado.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Sim</td>
                      {processarPixLiberado.sim.map((valor, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                          {valor}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                        {processarPixLiberado.totalSim}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Não</td>
                      {processarPixLiberado.nao.map((valor, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                          {valor}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                        {processarPixLiberado.totalNao}
                      </td>
                    </tr>
                    <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Total</td>
                      {processarPixLiberado.totaisPorMes.map((total, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                          {total}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                        {processarPixLiberado.totalGeral}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela Motivos N2 */}
          {processarMotivosN2 && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className={`overflow-x-auto ${gerarMesesNoPeriodo.length > 6 ? 'overflow-x-scroll' : ''}`}>
                <table className="w-full border-collapse min-w-full">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosN2.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarMotivosN2.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.motivo}</td>
                        {linha.valores.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                          {linha.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Seção Reclame Aqui */}
      {dadosDetalhados?.reclameAqui && (
        <>
          <h2 className="text-xl font-semibold velohub-title mb-4">Reclame Aqui</h2>

          {/* Tabela Motivos Reclame Aqui */}
          {processarMotivosReclameAqui && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className={`overflow-x-auto ${gerarMesesNoPeriodo.length > 6 ? 'overflow-x-scroll' : ''}`}>
                <table className="w-full border-collapse min-w-full">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosReclameAqui.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarMotivosReclameAqui.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.motivo}</td>
                        {linha.valores.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                          {linha.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Linha Divisória */}
          <hr className="border-b border-gray-300 dark:border-gray-600 my-6" />
        </>
      )}

      {/* Seção Procon */}
      {dadosDetalhados?.procon && (
        <>
          <h2 className="text-xl font-semibold velohub-title mb-4">Procon</h2>

          {/* Tabela Motivos Procon */}
          {processarMotivosProcon && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className={`overflow-x-auto ${gerarMesesNoPeriodo.length > 6 ? 'overflow-x-scroll' : ''}`}>
                <table className="w-full border-collapse min-w-full">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosProcon.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarMotivosProcon.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.motivo}</td>
                        {linha.valores.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                          {linha.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Linha Divisória */}
          <hr className="border-b border-gray-300 dark:border-gray-600 my-6" />
        </>
      )}

      {/* Seção Ação Judicial */}
      {dadosDetalhados?.judicial && (
        <>
          <h2 className="text-xl font-semibold velohub-title mb-4">Ação Judicial</h2>

          {/* Tabela Motivos Ação Judicial */}
          {processarMotivosJudicial && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className={`overflow-x-auto ${gerarMesesNoPeriodo.length > 6 ? 'overflow-x-scroll' : ''}`}>
                <table className="w-full border-collapse min-w-full">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosJudicial.meses.map(mes => (
                        <th key={mes} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarMes(mes)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarMotivosJudicial.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.motivo}</td>
                        {linha.valores.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                          {linha.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RelatoriosOuvidoria;

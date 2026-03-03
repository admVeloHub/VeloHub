/**
 * VeloHub V3 - AnaliseDiaria Component
 * VERSION: v2.2.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.2.0:
 * - Removida normalização/agrupamento de motivos - cada motivo individual aparece em sua própria linha
 * - Motivos são exibidos exatamente como estão no banco, sem agrupar variações (ex: "CHAVE PIX" e "Chave PIX" são linhas separadas)
 * - Quando um registro tem múltiplos motivos no array, cada um é contado separadamente em sua própria linha
 * - Correção aplicada em processarMotivosBacen e processarMotivosN2
 * 
 * Mudanças v1.3.0:
 * - CORRIGIDO: processarMotivosBacen e processarMotivosN2 agora usam valores reais do banco como linhas (não lista fixa)
 * - Normalização automática agrupa variações como "CHAVE PIX" e "Chave PIX" em uma única linha
 * - Função normalizarMotivo() agrupa variações case-insensitive e normaliza espaços
 * - CORRIGIDO: gerarDiasNoPeriodo usa UTC explicitamente para evitar problemas de timezone
 *
 * Mudanças v1.2.0:
 * - CORRIGIDO quadro Motivos: linhas passam a ser a lista fixa de motivos (MOTIVOS_REDUZIDOS), não mais valores vindos da API
 * - Naturezas (Bacen Celcoin, Consumidor.Gov, etc.) deixam de aparecer como linhas; apenas motivos reais (Abatimento Juros, Chave PIX, etc.)
 * - processarMotivosBacen e processarMotivosN2 usam MOTIVOS_REDUZIDOS como linhas e preenchem com contagem por dia ou 0
 *
 * Mudanças v1.1.0:
 * - CORRIGIDO: Container secundário não expande mais horizontalmente além do frame
 * - CSS atualizado: overflow-x: hidden e min-width: 0 no container-secondary
 * - Divs internos com overflow-x-auto agora têm width: 100% e maxWidth: 100% explícitos
 * - Tabelas ajustadas: removido min-w-full, usando minWidth: 'max-content' para scroll interno correto
 * - Container pai em OuvidoriaPage.js agora tem minWidth: 0, maxWidth: '100%' e overflow: 'hidden' para garantir limitação correta
 * 
 * Mudanças v1.0.8:
 * - Container-secondary agora limitado ao tamanho do frame (max-width: 100%, width: 100%, box-sizing: border-box)
 * - Overflow hidden no container para evitar vazamento
 * - Scroll horizontal apenas dentro do div interno com overflow-x-auto
 * 
 * Mudanças v1.0.7:
 * - CORRIGIDO scroll: usando exatamente o mesmo padrão do RelatoriosOuvidoria (sem estilos inline)
 * - CORRIGIDO dados de Motivos: filtrando apenas itens com campo 'motivo' (não 'natureza')
 * - Adicionado log de erro detalhado quando backend retorna estrutura incorreta
 * - Tabelas agora usam className="w-full border-collapse min-w-full" como em RelatoriosOuvidoria
 * 
 * Mudanças v1.0.6:
 * - CORRIGIDO: Container com width: '100%', maxWidth: '100%', overflow: 'hidden' para não vazar
 * - Div interno com overflow-x-auto e width: '100%' para scroll horizontal apenas dentro
 * - Tabela com minWidth: 'max-content' para permitir crescimento interno sem forçar container
 * - Scroll agora funciona APENAS dentro do container, sem causar scroll na tela inteira
 * 
 * Mudanças v1.0.5:
 * - Corrigido scroll: usando mesmo padrão do RelatoriosOuvidoria
 * - Container com apenas className="overflow-x-auto" (sem estilos inline que causavam problemas)
 * - Tabela com className="w-full border-collapse min-w-full" para scroll interno correto
 * - Scroll agora funciona apenas dentro do container, não na tela inteira
 * 
 * Mudanças v1.0.4:
 * - CRÍTICO: Corrigido scroll infinito da tela - scroll agora é apenas dentro do container
 * - Containers com width: '100%' e maxWidth: '100%' para não vazar para fora
 * - overflowY: 'hidden' para evitar scroll vertical indesejado
 * - Tabelas com minWidth: 'max-content' mas sem width: '100%' para permitir scroll interno
 * 
 * Mudanças v1.0.3:
 * - Corrigido scroll horizontal: containers agora sempre têm overflow-x-auto ativo
 * - Removida condição que limitava scroll apenas quando há mais de 7 dias
 * - Adicionado WebkitOverflowScrolling: 'touch' para melhor experiência em dispositivos móveis
 * - Tabelas com minWidth: 'max-content' garantem largura adequada para scroll
 * 
 * Mudanças v1.0.2:
 * - Ajustados tamanhos dos campos de filtro (min-w-[180px] para datas, min-w-[150px] para tipo)
 * - Implementado scroll horizontal em todos os containers de tabelas quando há mais de 7 dias
 * - Tabelas agora usam minWidth: 'max-content' para garantir largura adequada
 * - Containers com maxWidth: '100%' para permitir scroll quando necessário
 * 
 * Mudanças v1.0.1:
 * - Adicionada verificação para detectar se motivosPorDia está retornando dados de natureza
 * - Previne exibição de dados incorretos quando backend retorna estrutura errada
 * 
 * Componente para análise diária de reclamações BACEN e N2
 * - Filtros: data início, data fim, tipo (BACEN/N2)
 * - Tabelas por tipo:
 *   BACEN: Natureza, PIX Retirado, Motivos
 *   N2: Número de Chamados, PIX Retirado, Motivos
 */

import React, { useState, useMemo, useEffect } from 'react';
import { relatoriosAPI } from '../../services/ouvidoriaApi';
import toast from 'react-hot-toast';

/** Lista fixa de motivos reduzidos (BACEN/N2) - mesma do FormReclamacao e schema. Linhas da tabela Motivos. */
const MOTIVOS_REDUZIDOS = [
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

const AnaliseDiaria = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipo, setTipo] = useState('BACEN');
  const [loading, setLoading] = useState(false);
  const [dadosDiarios, setDadosDiarios] = useState(null);

  /**
   * Gerar análise diária
   */
  const gerarAnalise = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Por favor, selecione o período (data início e data fim)');
      return;
    }

    setLoading(true);
    try {
      const resultado = await relatoriosAPI.diario({
        dataInicio,
        dataFim,
        tipo
      });
      // #region agent log
      console.log('🔍 [DEBUG] API Response completo:', JSON.stringify(resultado, null, 2));
      console.log('🔍 [DEBUG] Resultado estrutura:', {
        keys: Object.keys(resultado),
        hasData: !!resultado.data,
        dataKeys: resultado.data ? Object.keys(resultado.data) : [],
        bacenKeys: resultado.data?.bacen ? Object.keys(resultado.data.bacen) : [],
        n2Keys: resultado.data?.n2 ? Object.keys(resultado.data.n2) : [],
        bacenNaturezaLength: resultado.data?.bacen?.naturezaPorDia?.length,
        n2ChamadosLength: resultado.data?.n2?.chamadosPorDia?.length,
        firstNaturezaItem: resultado.data?.bacen?.naturezaPorDia?.[0],
        firstChamadoItem: resultado.data?.n2?.chamadosPorDia?.[0],
        allNaturezaItems: resultado.data?.bacen?.naturezaPorDia,
        allPixItems: resultado.data?.bacen?.pixRetiradoPorDia,
        allMotivosItems: resultado.data?.bacen?.motivosPorDia
      });
      fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:gerarAnalise',message:'API response received',data:{dataInicio,dataFim,tipo,resultadoStructure:Object.keys(resultado),hasData:!!resultado.data,dataKeys:resultado.data?Object.keys(resultado.data):[],bacenKeys:resultado.data?.bacen?Object.keys(resultado.data.bacen):[],n2Keys:resultado.data?.n2?Object.keys(resultado.data.n2):[],bacenNaturezaLength:resultado.data?.bacen?.naturezaPorDia?.length,n2ChamadosLength:resultado.data?.n2?.chamadosPorDia?.length,firstNaturezaItem:resultado.data?.bacen?.naturezaPorDia?.[0],firstChamadoItem:resultado.data?.n2?.chamadosPorDia?.[0]},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const dadosProcessados = resultado.data || resultado;
      // #region agent log
      console.log('🔍 [DEBUG] Dados processados:', dadosProcessados);
      console.log('🔍 [DEBUG] Amostras:', {
        bacenNaturezaSample: dadosProcessados?.bacen?.naturezaPorDia?.slice(0, 3),
        bacenPixSample: dadosProcessados?.bacen?.pixRetiradoPorDia?.slice(0, 3),
        bacenMotivosSample: dadosProcessados?.bacen?.motivosPorDia?.slice(0, 3),
        bacenMotivosLength: dadosProcessados?.bacen?.motivosPorDia?.length,
        bacenMotivosTodos: dadosProcessados?.bacen?.motivosPorDia
      });
      fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:gerarAnalise',message:'Data processed and set',data:{dadosProcessadosKeys:Object.keys(dadosProcessados),bacenNaturezaSample:dadosProcessados?.bacen?.naturezaPorDia?.slice(0,3),bacenPixSample:dadosProcessados?.bacen?.pixRetiradoPorDia?.slice(0,3),bacenMotivosSample:dadosProcessados?.bacen?.motivosPorDia?.slice(0,3),bacenMotivosLength:dadosProcessados?.bacen?.motivosPorDia?.length,bacenMotivosTodos:dadosProcessados?.bacen?.motivosPorDia},timestamp:Date.now(),runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setDadosDiarios(dadosProcessados);
      toast.success('Análise diária gerada com sucesso!');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:gerarAnalise',message:'Error occurred',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Erro ao gerar análise diária:', error);
      toast.error('Erro ao gerar análise diária');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gerar array de dias no período
   */
  const gerarDiasNoPeriodo = useMemo(() => {
    if (!dataInicio || !dataFim) return [];
    
    // Usar UTC para evitar problemas de timezone
    const inicio = new Date(dataInicio + 'T00:00:00.000Z');
    const fim = new Date(dataFim + 'T00:00:00.000Z');
    const dias = [];
    
    for (let d = new Date(inicio); d <= fim; d.setUTCDate(d.getUTCDate() + 1)) {
      const ano = d.getUTCFullYear();
      const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(d.getUTCDate()).padStart(2, '0');
      dias.push(`${ano}-${mes}-${dia}`);
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:gerarDiasNoPeriodo',message:'Array de dias gerado',data:{dataInicio,dataFim,diasLength:dias.length,diasPrimeiros:dias.slice(0,5),diasUltimos:dias.slice(-5)},timestamp:Date.now(),runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    return dias;
  }, [dataInicio, dataFim]);

  /**
   * Formatar data para exibição
   */
  const formatarData = (dataString) => {
    if (!dataString) return '';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataString;
    }
  };

  /**
   * Processar dados de Natureza por dia (BACEN)
   */
    const processarNaturezaBacen = useMemo(() => {
    if (!dadosDiarios?.bacen?.naturezaPorDia) {
      // #region agent log
      console.log('⚠️ [DEBUG] Sem dados de natureza:', {
        hasDadosDiarios: !!dadosDiarios,
        hasBacen: !!dadosDiarios?.bacen,
        hasNaturezaPorDia: !!dadosDiarios?.bacen?.naturezaPorDia
      });
      fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:processarNaturezaBacen',message:'No data available',data:{hasDadosDiarios:!!dadosDiarios,hasBacen:!!dadosDiarios?.bacen,hasNaturezaPorDia:!!dadosDiarios?.bacen?.naturezaPorDia},timestamp:Date.now(),runId:'initial',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return null;
    }

    const dias = gerarDiasNoPeriodo;
    const naturezas = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov', 'Chave PIX'];
    
    // #region agent log
    console.log('🔍 [DEBUG] Processando natureza:', {
      diasCount: dias.length,
      dias: dias.slice(0, 5),
      naturezaPorDiaLength: dadosDiarios.bacen.naturezaPorDia.length,
      firstItem: dadosDiarios.bacen.naturezaPorDia[0],
      sampleItems: dadosDiarios.bacen.naturezaPorDia.slice(0, 5),
      naturezasEsperadas: naturezas,
      allNaturezaItems: dadosDiarios.bacen.naturezaPorDia,
      uniqueNaturezas: [...new Set(dadosDiarios.bacen.naturezaPorDia.map(d => d._id.natureza))]
    });
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:processarNaturezaBacen',message:'Processing natureza data',data:{diasCount:dias.length,naturezaPorDiaLength:dadosDiarios.bacen.naturezaPorDia.length,firstItem:dadosDiarios.bacen.naturezaPorDia[0],sampleItems:dadosDiarios.bacen.naturezaPorDia.slice(0,5)},timestamp:Date.now(),runId:'initial',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    const tabela = naturezas.map(natureza => {
      const valores = dias.map(dia => {
        const item = dadosDiarios.bacen.naturezaPorDia.find(
          d => d._id.dia === dia && d._id.natureza === natureza
        );
        return item ? item.count : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { natureza, valores, total };
    });

    // #region agent log
    console.log('🔍 [DEBUG] Tabela processada:', {
      tabelaLength: tabela.length,
      firstRow: tabela[0],
      allRows: tabela.map(r => ({ 
        natureza: r.natureza, 
        total: r.total, 
        valoresCount: r.valores.length,
        valores: r.valores,
        valoresSum: r.valores.reduce((a, b) => a + b, 0)
      })),
      tabelaCompleta: tabela
    });
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:processarNaturezaBacen',message:'Processed tabela result',data:{tabelaLength:tabela.length,firstRow:tabela[0],totalFirstRow:tabela[0]?.total},timestamp:Date.now(),runId:'initial',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    return { tabela, dias };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /**
   * Processar dados de PIX Retirado por dia (BACEN)
   */
  const processarPixRetiradoBacen = useMemo(() => {
    if (!dadosDiarios?.bacen?.pixRetiradoPorDia) return null;

    const dias = gerarDiasNoPeriodo;
    const naturezas = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'];
    
    const tabela = naturezas.map(natureza => {
      const valores = dias.map(dia => {
        const item = dadosDiarios.bacen.pixRetiradoPorDia.find(
          d => d._id.dia === dia && d._id.natureza === natureza
        );
        return item ? item.count : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { natureza, valores, total };
    });

    return { tabela, dias };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /**
   * Normalizar motivo para agrupar variações (ex: "CHAVE PIX" e "Chave PIX")
   * Função auxiliar para normalização case-insensitive e espaços
   */
  const normalizarMotivo = useMemo(() => {
    return (motivo) => {
      if (!motivo) return '';
      // Normalizar: trim, case-insensitive, normalizar espaços múltiplos
      return motivo.trim().toLowerCase().replace(/\s+/g, ' ');
    };
  }, []);

  /**
   * Processar dados de Motivos por dia (BACEN)
   * Linhas = valores únicos de motivoReduzido encontrados no banco (sem normalização/agrupamento).
   * Colunas = datas. Cada motivo individual aparece em sua própria linha.
   */
  const processarMotivosBacen = useMemo(() => {
    if (!dadosDiarios?.bacen) return null;

    const dias = gerarDiasNoPeriodo;
    const dadosParaProcessar = dadosDiarios.bacen.motivosPorDia || [];

    // Agrupar por motivo exato (sem normalização): criar mapa { motivo: { contagensPorDia } }
    const motivosAgrupados = new Map();
    
    dadosParaProcessar.forEach(item => {
      if (!item._id || !item._id.motivo || !item._id.dia) return;
      
      const motivo = item._id.motivo;
      const dia = item._id.dia;
      const count = item.count || 0;
      
      if (!motivosAgrupados.has(motivo)) {
        motivosAgrupados.set(motivo, {
          motivo: motivo,
          contagensPorDia: new Map()
        });
      }
      
      const grupo = motivosAgrupados.get(motivo);
      const contagemAtual = grupo.contagensPorDia.get(dia) || 0;
      grupo.contagensPorDia.set(dia, contagemAtual + count);
    });

    // Converter para array e ordenar por nome do motivo
    const tabela = Array.from(motivosAgrupados.values())
      .map(grupo => {
        const valores = dias.map(dia => {
          return grupo.contagensPorDia.get(dia) || 0;
        });
        const total = valores.reduce((sum, val) => sum + val, 0);
        return { motivo: grupo.motivo, valores, total };
      })
      .sort((a, b) => a.motivo.localeCompare(b.motivo));

    // #region agent log
    const motivosComDados = tabela.filter(t => t.total > 0);
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c90fc9'},body:JSON.stringify({sessionId:'c90fc9',location:'AnaliseDiaria.js:processarMotivosBacen',message:'tabela processada',data:{tabelaLength:tabela.length,motivosComDados:motivosComDados.map(t=>({motivo:t.motivo,total:t.total}))},timestamp:Date.now(),runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    return { tabela, dias };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /**
   * Processar dados de Chamados por dia (N2)
   */
  const processarChamadosN2 = useMemo(() => {
    if (!dadosDiarios?.n2?.chamadosPorDia) return null;

    const dias = gerarDiasNoPeriodo;
    
    const valores = dias.map(dia => {
      const item = dadosDiarios.n2.chamadosPorDia.find(d => d._id.dia === dia);
      return item ? item.count : 0;
    });
    const total = valores.reduce((sum, val) => sum + val, 0);

    return { valores, dias, total };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /**
   * Processar dados de PIX Retirado por dia (N2)
   */
  const processarPixRetiradoN2 = useMemo(() => {
    if (!dadosDiarios?.n2?.pixRetiradoPorDia) return null;

    const dias = gerarDiasNoPeriodo;
    
    const valores = dias.map(dia => {
      const item = dadosDiarios.n2.pixRetiradoPorDia.find(d => d._id.dia === dia);
      return item ? item.count : 0;
    });
    const total = valores.reduce((sum, val) => sum + val, 0);

    return { valores, dias, total };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /**
   * Processar dados de Motivos por dia (N2)
   * Linhas = valores únicos de motivoReduzido encontrados no banco (sem normalização/agrupamento).
   * Colunas = datas. Cada motivo individual aparece em sua própria linha.
   */
  const processarMotivosN2 = useMemo(() => {
    if (!dadosDiarios?.n2) return null;

    const dias = gerarDiasNoPeriodo;
    const dadosParaProcessar = dadosDiarios.n2.motivosPorDia || [];

    // Agrupar por motivo exato (sem normalização): criar mapa { motivo: { contagensPorDia } }
    const motivosAgrupados = new Map();
    
    dadosParaProcessar.forEach(item => {
      if (!item._id || !item._id.motivo || !item._id.dia) return;
      
      const motivo = item._id.motivo;
      const dia = item._id.dia;
      const count = item.count || 0;
      
      if (!motivosAgrupados.has(motivo)) {
        motivosAgrupados.set(motivo, {
          motivo: motivo,
          contagensPorDia: new Map()
        });
      }
      
      const grupo = motivosAgrupados.get(motivo);
      const contagemAtual = grupo.contagensPorDia.get(dia) || 0;
      grupo.contagensPorDia.set(dia, contagemAtual + count);
    });

    const tabela = Array.from(motivosAgrupados.values())
      .map(grupo => {
        const valores = dias.map(dia => {
          return grupo.contagensPorDia.get(dia) || 0;
        });
        const total = valores.reduce((sum, val) => sum + val, 0);
        return { motivo: grupo.motivo, valores, total };
      })
      .sort((a, b) => a.motivo.localeCompare(b.motivo));

    return { tabela, dias };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  return (
    <div>
      {/* Filtros */}
      <div className="velohub-card mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data Início *
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-[180px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data Fim *
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tipo *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="BACEN">BACEN</option>
              <option value="N2">N2</option>
            </select>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={gerarAnalise}
              disabled={loading}
              className="text-sm px-6 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700 disabled:opacity-50"
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
              {loading ? 'Gerando...' : 'Gerar Análise'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabelas BACEN */}
      {tipo === 'BACEN' && dadosDiarios?.bacen && (
        <>
          {/* Tabela Natureza */}
          {processarNaturezaBacen && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Natureza</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Natureza</th>
                      {processarNaturezaBacen.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarData(dia)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarNaturezaBacen.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.natureza}</td>
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

          {/* Tabela PIX Retirado */}
          {processarPixRetiradoBacen && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">PIX Retirado</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Natureza</th>
                      {processarPixRetiradoBacen.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarData(dia)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarPixRetiradoBacen.tabela.map((linha, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.natureza}</td>
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

          {/* Tabela Motivos */}
          {processarMotivosBacen && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosBacen.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarData(dia)}
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
        </>
      )}

      {/* Tabelas N2 */}
      {tipo === 'N2' && dadosDiarios?.n2 && (
        <>
          {/* Tabela Número de Chamados */}
          {processarChamadosN2 && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Número de Chamados</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      {processarChamadosN2.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarData(dia)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {processarChamadosN2.valores.map((valor, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                          {valor}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                        {processarChamadosN2.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela PIX Retirado */}
          {processarPixRetiradoN2 && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">PIX Retirado</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      {processarPixRetiradoN2.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarData(dia)}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {processarPixRetiradoN2.valores.map((valor, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                          {valor}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                        {processarPixRetiradoN2.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela Motivos */}
          {processarMotivosN2 && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosN2.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatarData(dia)}
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

      {!dadosDiarios && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Selecione o período e o tipo, depois clique em "Gerar Análise"</p>
        </div>
      )}
    </div>
  );
};

export default AnaliseDiaria;

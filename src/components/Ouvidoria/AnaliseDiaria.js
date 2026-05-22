/**
 * VeloHub V3 - AnaliseDiaria Component
 * VERSION: v2.8.5 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v2.8.5: Removidos logs de instrumentação ingest 127.0.0.1:7244 e `console.log` `[DEBUG]` (Análise diária)
 * - v2.8.4: MOTIVOS_REDUZIDOS: «Elegibilidade» (referência alinhada ao form)
 * - v2.7.0: MOTIVOS_REDUZIDOS: padrão Xxxxx xxxxx xxxx, alinhado a FormReclamacao e motivoReduzidoNormalize
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FloatingLabelField } from '../shared/FloatingLabelField';
import { relatoriosAPI } from '../../services/ouvidoriaApi';
import { formatDateRegistro } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

/** Origens BACEN nos quadros diários (Consumidor.Gov no fluxo Procon). */
const ORIGENS_QUADRO_BACEN_ANALISE = ['Bacen Celcoin', 'Bacen Via Capital'];

/** Texto de origem/natureza a excluir da tabela Motivos BACEN (histórico Consumidor.Gov no campo motivo). */
const ROTULOS_ORIGEM_EXCLUIR_DE_MOTIVOS_BACEN = [...ORIGENS_QUADRO_BACEN_ANALISE, 'Consumidor.Gov'];

/** Lista fixa de motivos reduzidos (BACEN/N2) - referência. Tabela Motivos usa dados da API (motivoReduzido). Padrão: Xxxxx xxxxx xxxx */
const MOTIVOS_REDUZIDOS = [
  'Liberação chave pix',
  'Portabilidade pix',
  'Abatimento de juros',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Em cobrança',
  'Alega fraude',
  'Erro app',
  'Elegibilidade',
  'Encerramento cta celcoin',
  'Encerramento cta app',
  'Superendividamento',
  'Liquidação antecipada',
  'Não recebeu restituição',
  'Chave pix',
  'Conta'
];

/** Linhas «Número de Chamados» Procon — origens canónicas (`chamadosPorDiaPorOrigem` na API diário). */
const ORIGENS_PROCON_NUMERO_CHAMADOS = ['Procon', 'Consumidor.gov.br'];

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
      const dadosProcessados = resultado.data || resultado;
      setDadosDiarios(dadosProcessados);
      toast.success('Análise diária gerada com sucesso!');
    } catch (error) {
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
    
    return dias;
  }, [dataInicio, dataFim]);

  /**
   * Processar dados de Natureza por dia (BACEN)
   */
    const processarNaturezaBacen = useMemo(() => {
    if (!dadosDiarios?.bacen?.naturezaPorDia) {
      return null;
    }

    const dias = gerarDiasNoPeriodo;
    // Quadro Número de Chamados: apenas origens BACEN atuais (schema 471).
    const naturezas = [...ORIGENS_QUADRO_BACEN_ANALISE];
    
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

    const totaisPorDia = dias.map((_, idx) =>
      tabela.reduce((sum, linha) => sum + linha.valores[idx], 0)
    );
    const totalGeral = tabela.reduce((sum, linha) => sum + linha.total, 0);

    return { tabela, dias, totaisPorDia, totalGeral };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /**
   * Processar dados de PIX Retirado por dia (BACEN)
   */
  const processarPixRetiradoBacen = useMemo(() => {
    if (!dadosDiarios?.bacen?.pixRetiradoPorDia) return null;

    const dias = gerarDiasNoPeriodo;
    const naturezas = [...ORIGENS_QUADRO_BACEN_ANALISE];
    
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
   * MOTIVOS = motivoReduzido (schema 475). Linhas = valores do banco. Colunas = dataEntrada (schema 470).
   * Excluir naturezas (origem) da tabela Motivos.
   */
  const processarMotivosBacen = useMemo(() => {
    if (!dadosDiarios?.bacen) return null;

    const dias = gerarDiasNoPeriodo;
    const dadosParaProcessar = (dadosDiarios.bacen.motivosPorDia || []).filter(
      item => item._id?.motivo && !ROTULOS_ORIGEM_EXCLUIR_DE_MOTIVOS_BACEN.includes(item._id.motivo)
    );

    // Agrupar por motivo: criar mapa { motivo: { contagensPorDia } }
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
      .sort((a, b) => String(a.motivo || '').localeCompare(String(b.motivo || '')));

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
      .sort((a, b) => String(a.motivo || '').localeCompare(String(b.motivo || '')));

    return { tabela, dias };
  }, [dadosDiarios, gerarDiasNoPeriodo]);

  /** Processadores para Reclame Aqui, Procon e Ação Judicial (chamadosPorDia + motivosPorDia) */
  const processarChamadosReclameAqui = useMemo(() => {
    const dados = dadosDiarios?.reclameAqui;
    if (!dados?.chamadosPorDia) return null;
    const dias = gerarDiasNoPeriodo;
    const valores = dias.map(dia => {
      const item = dados.chamadosPorDia.find(d => d._id.dia === dia);
      return item ? item.count : 0;
    });
    return { valores, dias, total: valores.reduce((s, v) => s + v, 0) };
  }, [dadosDiarios?.reclameAqui, gerarDiasNoPeriodo]);

  const processarMotivosReclameAqui = useMemo(() => {
    const dados = dadosDiarios?.reclameAqui;
    if (!dados) return null;
    const dias = gerarDiasNoPeriodo;
    const dadosParaProcessar = dados.motivosPorDia || [];
    const motivosAgrupados = new Map();
    dadosParaProcessar.forEach(item => {
      if (!item._id?.motivo || !item._id?.dia) return;
      const motivo = item._id.motivo;
      const dia = item._id.dia;
      const count = item.count || 0;
      if (!motivosAgrupados.has(motivo)) motivosAgrupados.set(motivo, { motivo, contagensPorDia: new Map() });
      const grupo = motivosAgrupados.get(motivo);
      grupo.contagensPorDia.set(dia, (grupo.contagensPorDia.get(dia) || 0) + count);
    });
    const tabela = Array.from(motivosAgrupados.values())
      .map(grupo => {
        const valores = dias.map(dia => grupo.contagensPorDia.get(dia) || 0);
        return { motivo: grupo.motivo, valores, total: valores.reduce((s, v) => s + v, 0) };
      })
      .sort((a, b) => String(a.motivo || '').localeCompare(String(b.motivo || '')));
    return { tabela, dias };
  }, [dadosDiarios?.reclameAqui, gerarDiasNoPeriodo]);

  /** Procon — chamados por dia e por origem (Procon vs Consumidor.gov.br); compatível se API só enviar chamadosPorDia. */
  const processarChamadosProcon = useMemo(() => {
    const dados = dadosDiarios?.procon;
    const dias = gerarDiasNoPeriodo;
    if (!dados || dias.length === 0) return null;

    const porOrigem = dados.chamadosPorDiaPorOrigem;

    if (Array.isArray(porOrigem) && porOrigem.length > 0) {
      const tabela = ORIGENS_PROCON_NUMERO_CHAMADOS.map((origem) => {
        const valores = dias.map((dia) => {
          const item = porOrigem.find(
            (row) =>
              row &&
              row._id &&
              row._id.dia === dia &&
              String(row._id.origem) === origem
          );
          return item ? item.count || 0 : 0;
        });
        const total = valores.reduce((sum, val) => sum + val, 0);
        return { origem, valores, total };
      });
      const totaisPorDia = dias.map((_, idx) =>
        tabela.reduce((sum, linha) => sum + linha.valores[idx], 0)
      );
      const totalGeral = tabela.reduce((sum, linha) => sum + linha.total, 0);
      return { tabela, dias, totaisPorDia, totalGeral };
    }

    if (!Array.isArray(dados.chamadosPorDia) || dados.chamadosPorDia.length === 0) return null;
    const valores = dias.map((dia) => {
      const item = dados.chamadosPorDia.find((d) => d._id?.dia === dia);
      return item ? item.count || 0 : 0;
    });
    const totalGeral = valores.reduce((sum, val) => sum + val, 0);
    return {
      tabela: [{ origem: 'Total', valores, total: totalGeral }],
      dias,
      totaisPorDia: [...valores],
      totalGeral,
    };
  }, [dadosDiarios?.procon, gerarDiasNoPeriodo]);

  const processarMotivosProcon = useMemo(() => {
    const dados = dadosDiarios?.procon;
    if (!dados) return null;
    const dias = gerarDiasNoPeriodo;
    const dadosParaProcessar = dados.motivosPorDia || [];
    const motivosAgrupados = new Map();
    dadosParaProcessar.forEach(item => {
      if (!item._id?.motivo || !item._id?.dia) return;
      const motivo = item._id.motivo;
      const dia = item._id.dia;
      const count = item.count || 0;
      if (!motivosAgrupados.has(motivo)) motivosAgrupados.set(motivo, { motivo, contagensPorDia: new Map() });
      const grupo = motivosAgrupados.get(motivo);
      grupo.contagensPorDia.set(dia, (grupo.contagensPorDia.get(dia) || 0) + count);
    });
    const tabela = Array.from(motivosAgrupados.values())
      .map(grupo => {
        const valores = dias.map(dia => grupo.contagensPorDia.get(dia) || 0);
        return { motivo: grupo.motivo, valores, total: valores.reduce((s, v) => s + v, 0) };
      })
      .sort((a, b) => String(a.motivo || '').localeCompare(String(b.motivo || '')));
    return { tabela, dias };
  }, [dadosDiarios?.procon, gerarDiasNoPeriodo]);

  const processarChamadosJudicial = useMemo(() => {
    const dados = dadosDiarios?.judicial;
    if (!dados?.chamadosPorDia) return null;
    const dias = gerarDiasNoPeriodo;
    const valores = dias.map(dia => {
      const item = dados.chamadosPorDia.find(d => d._id.dia === dia);
      return item ? item.count : 0;
    });
    return { valores, dias, total: valores.reduce((s, v) => s + v, 0) };
  }, [dadosDiarios?.judicial, gerarDiasNoPeriodo]);

  const processarMotivosJudicial = useMemo(() => {
    const dados = dadosDiarios?.judicial;
    if (!dados) return null;
    const dias = gerarDiasNoPeriodo;
    const dadosParaProcessar = dados.motivosPorDia || [];
    const motivosAgrupados = new Map();
    dadosParaProcessar.forEach(item => {
      if (!item._id?.motivo || !item._id?.dia) return;
      const motivo = item._id.motivo;
      const dia = item._id.dia;
      const count = item.count || 0;
      if (!motivosAgrupados.has(motivo)) motivosAgrupados.set(motivo, { motivo, contagensPorDia: new Map() });
      const grupo = motivosAgrupados.get(motivo);
      grupo.contagensPorDia.set(dia, (grupo.contagensPorDia.get(dia) || 0) + count);
    });
    const tabela = Array.from(motivosAgrupados.values())
      .map(grupo => {
        const valores = dias.map(dia => grupo.contagensPorDia.get(dia) || 0);
        return { motivo: grupo.motivo, valores, total: valores.reduce((s, v) => s + v, 0) };
      })
      .sort((a, b) => String(a.motivo || '').localeCompare(String(b.motivo || '')));
    return { tabela, dias };
  }, [dadosDiarios?.judicial, gerarDiasNoPeriodo]);

  return (
    <div>
      {/* Filtros */}
      <div className="velohub-card mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="min-w-[180px]">
            <FloatingLabelField id="analise-diaria-inicio" label="Data Início" required value={dataInicio}>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </FloatingLabelField>
          </div>

          <div className="min-w-[180px]">
            <FloatingLabelField id="analise-diaria-fim" label="Data Fim" required value={dataFim}>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </FloatingLabelField>
          </div>

          <div className="min-w-[150px]">
            <FloatingLabelField id="analise-diaria-tipo" label="Tipo" required value={tipo}>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="BACEN">BACEN</option>
                <option value="N2">N2 Pix</option>
                <option value="RECLAME_AQUI">Reclame Aqui</option>
                <option value="PROCON">Procon</option>
                <option value="PROCESSOS">Ação Judicial</option>
              </select>
            </FloatingLabelField>
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
          {/* Número de chamados por origem (BACEN — `naturezaPorDia`: origem/schema 471) */}
          {processarNaturezaBacen && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Número de Chamados</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Origem</th>
                      {processarNaturezaBacen.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
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
                    {processarNaturezaBacen.tabela.length > 1 && Array.isArray(processarNaturezaBacen.totaisPorDia) && (
                      <tr className="bg-gray-100 font-semibold dark:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Total</td>
                        {processarNaturezaBacen.totaisPorDia.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                          {processarNaturezaBacen.totalGeral}
                        </td>
                      </tr>
                    )}
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
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Origem</th>
                      {processarPixRetiradoBacen.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
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
                          {formatDateRegistro(dia, '')}
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
                          {formatDateRegistro(dia, '')}
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
                          {formatDateRegistro(dia, '')}
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
                          {formatDateRegistro(dia, '')}
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

      {/* Tabelas Reclame Aqui */}
      {tipo === 'RECLAME_AQUI' && dadosDiarios?.reclameAqui && (
        <>
          {processarChamadosReclameAqui && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Número de Chamados</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      {processarChamadosReclameAqui.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {processarChamadosReclameAqui.valores.map((valor, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                          {valor}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                        {processarChamadosReclameAqui.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {processarMotivosReclameAqui && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosReclameAqui.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
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
        </>
      )}

      {/* Tabelas Procon */}
      {tipo === 'PROCON' && dadosDiarios?.procon && (
        <>
          {processarChamadosProcon && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Número de Chamados</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">
                        Origem
                      </th>
                      {processarChamadosProcon.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processarChamadosProcon.tabela.map((linha, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{linha.origem}</td>
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
                    {processarChamadosProcon.tabela.length > 1 && Array.isArray(processarChamadosProcon.totaisPorDia) && (
                      <tr className="bg-gray-100 font-semibold dark:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Total</td>
                        {processarChamadosProcon.totaisPorDia.map((valor, idx) => (
                          <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                            {valor}
                          </td>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm">
                          {processarChamadosProcon.totalGeral}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {processarMotivosProcon && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosProcon.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
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
        </>
      )}

      {/* Tabelas Ação Judicial */}
      {tipo === 'PROCESSOS' && dadosDiarios?.judicial && (
        <>
          {processarChamadosJudicial && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Número de Chamados</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      {processarChamadosJudicial.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
                        </th>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {processarChamadosJudicial.valores.map((valor, idx) => (
                        <td key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm whitespace-nowrap">
                          {valor}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold">
                        {processarChamadosJudicial.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {processarMotivosJudicial && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Motivos</h3>
              <div className="overflow-x-auto" style={{ width: '100%', maxWidth: '100%' }}>
                <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium">Motivo</th>
                      {processarMotivosJudicial.dias.map(dia => (
                        <th key={dia} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium whitespace-nowrap">
                          {formatDateRegistro(dia, '')}
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

      {(!dadosDiarios ||
        (tipo === 'BACEN' && !dadosDiarios?.bacen) ||
        (tipo === 'N2' && !dadosDiarios?.n2) ||
        (tipo === 'RECLAME_AQUI' && !dadosDiarios?.reclameAqui) ||
        (tipo === 'PROCON' && !dadosDiarios?.procon) ||
        (tipo === 'PROCESSOS' && !dadosDiarios?.judicial)) && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {!dadosDiarios
              ? 'Selecione o período e o tipo, depois clique em "Gerar Análise"'
              : 'Clique em "Gerar Análise" para carregar os dados do tipo selecionado'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnaliseDiaria;

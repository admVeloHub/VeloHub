/**
 * VeloHub V3 - RelatoriosOuvidoria Component
 * VERSION: v2.0.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
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

const RelatoriosOuvidoria = () => {
  const [mesInicio, setMesInicio] = useState('');
  const [mesFim, setMesFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [dadosDetalhados, setDadosDetalhados] = useState(null);

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
   * Gerar relatório
   */
  const gerarRelatorio = async () => {
    if (!mesInicio || !mesFim) {
      toast.error('Por favor, selecione o período mensal');
      return;
    }

    const dataInicio = mesParaDataInicio(mesInicio);
    const dataFim = mesParaDataFim(mesFim);

    setLoading(true);
    try {
      // Buscar relatório básico
      const resultado = await relatoriosAPI.gerar({
        dataInicio,
        dataFim
      });
      setRelatorio(resultado.data || resultado);

      // Buscar relatório detalhado
      const detalhado = await relatoriosAPI.detalhado({
        dataInicio,
        dataFim
      });
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
   * Processar dados de natureza por mês para gráfico BACEN
   */
  const processarDadosNatureza = useMemo(() => {
    if (!dadosDetalhados?.bacen?.naturezaPorMes) return null;

    const meses = gerarMesesNoPeriodo;
    const naturezas = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'];
    
    const datasets = naturezas.map((natureza, index) => {
      const cores = ['#1634FF', '#1694FF', '#000058'];
      const dados = meses.map(mes => {
        const item = dadosDetalhados.bacen.naturezaPorMes.find(
          d => d._id.mes === mes && d._id.natureza === natureza
        );
        return item ? item.count : 0;
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

    const meses = gerarMesesNoPeriodo;
    
    const registrados = meses.map(mes => {
      const item = dadosDetalhados.n2.casosRegistradosPorMes.find(d => d._id.mes === mes);
      return item ? item.count : 0;
    });

    const finalizados = meses.map(mes => {
      const item = dadosDetalhados.n2.casosFinalizadosPorMes.find(d => d._id.mes === mes);
      return item ? item.count : 0;
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
    if (!dadosDetalhados?.bacen?.pixRetiradoPorNatureza) return null;

    const meses = gerarMesesNoPeriodo;
    const naturezas = ['Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov'];
    
    const tabela = naturezas.map(natureza => {
      const valores = meses.map(mes => {
        const item = dadosDetalhados.bacen.pixRetiradoPorNatureza.find(
          d => d._id.mes === mes && d._id.natureza === natureza
        );
        return item ? item.count : 0;
      });
      const total = valores.reduce((sum, val) => sum + val, 0);
      return { natureza, valores, total };
    });

    const totaisPorMes = meses.map(mes => {
      return naturezas.reduce((sum, natureza) => {
        const item = dadosDetalhados.bacen.pixRetiradoPorNatureza.find(
          d => d._id.mes === mes && d._id.natureza === natureza
        );
        return sum + (item ? item.count : 0);
      }, 0);
    });
    const totalGeral = totaisPorMes.reduce((sum, val) => sum + val, 0);

    return { tabela, totaisPorMes, totalGeral, meses };
  }, [dadosDetalhados, gerarMesesNoPeriodo]);

  /**
   * Processar dados PIX Liberado N2
   */
  const processarPixLiberado = useMemo(() => {
    if (!dadosDetalhados?.n2?.pixLiberadoPorMes) return null;

    const meses = gerarMesesNoPeriodo;
    
    const sim = meses.map(mes => {
      const item = dadosDetalhados.n2.pixLiberadoPorMes.find(
        d => d._id.mes === mes && d._id.pixStatus === 'Liberado'
      );
      return item ? item.count : 0;
    });

    const nao = meses.map(mes => {
      const totalMes = dadosDetalhados.n2.pixLiberadoPorMes
        .filter(d => d._id.mes === mes)
        .reduce((sum, item) => sum + item.count, 0);
      const liberado = dadosDetalhados.n2.pixLiberadoPorMes.find(
        d => d._id.mes === mes && d._id.pixStatus === 'Liberado'
      );
      return totalMes - (liberado ? liberado.count : 0);
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
    if (!dadosDetalhados?.bacen?.motivosPorMes) return null;

    const meses = gerarMesesNoPeriodo;
    const motivosUnicos = [...new Set(dadosDetalhados.bacen.motivosPorMes.map(d => d._id.motivo))];
    
    const tabela = motivosUnicos.map(motivo => {
      const valores = meses.map(mes => {
        const item = dadosDetalhados.bacen.motivosPorMes.find(
          d => d._id.mes === mes && d._id.motivo === motivo
        );
        return item ? item.count : 0;
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
    if (!dadosDetalhados?.n2?.motivosPorMes) return null;

    const meses = gerarMesesNoPeriodo;
    const motivosUnicos = [...new Set(dadosDetalhados.n2.motivosPorMes.map(d => d._id.motivo))];
    
    const tabela = motivosUnicos.map(motivo => {
      const valores = meses.map(mes => {
        const item = dadosDetalhados.n2.motivosPorMes.find(
          d => d._id.mes === mes && d._id.motivo === motivo
        );
        return item ? item.count : 0;
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

      {/* Seção BACEN */}
      {dadosDetalhados?.bacen && (
        <>
          <h2 className="text-xl font-semibold velohub-title mb-4">BACEN</h2>

          {/* Gráfico Natureza */}
          {processarDadosNatureza && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Natureza</h3>
              <div style={{ height: '200px', width: '100%' }}>
                <Line data={processarDadosNatureza} options={opcoesGrafico} />
              </div>
            </div>
          )}

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

          {/* Gráfico Casos Registrados vs Finalizados */}
          {processarDadosCasosN2 && (
            <div className="container-secondary mb-6">
              <h3 className="text-lg font-semibold mb-4">Casos Registrados vs Finalizados</h3>
              <div style={{ height: '200px', width: '100%' }}>
                <Line data={processarDadosCasosN2} options={opcoesGrafico} />
              </div>
            </div>
          )}

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
    </div>
  );
};

export default RelatoriosOuvidoria;

/**
 * VeloHub V3 - Dashboard (Sociais)
 * VERSION: v1.4.0 | DATE: 2026-03-25 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.4.0:
 * - Filtro rede social: opção LinkedIn
 *
 * Mudanças v1.3.0:
 * - Botão Filtrar sem área vazia (div flex: 0 0 auto)
 * - dashboard-filters-section: campos compactos
 * - Alinhamento rígido: dashboard-sociais padding 16px, filtros/cards/gráficos alinhados
 * - Espaçamento vertical reduzido (setas verdes): margin-bottom 8px, padding 8px
 *
 * Mudanças v1.2.0:
 * - Botão Filtrar; filtros aplicados apenas ao clicar
 * - filters-section no padrão do Feed (flex, align-items flex-end)
 * - Botão Filtrar com velohub-btn secondary (padrão ações secundárias)
 *
 * Mudanças v1.1.0:
 * - Filtros e conteúdo em único velohub-container
 */

import { useState, useEffect, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { getDashboardMetrics, getChartData, getRatingAverage, getTabulations } from '../../services/sociaisApi';
import WordCloudInsights from './WordCloudInsights';

const Plot = createPlotlyComponent(Plotly);

const Dashboard = ({ onWordClick, setWordCloudWords }) => {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [ratingAverage, setRatingAverage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState({ socialNetwork: '', contactReason: '', dateFrom: '', dateTo: '' });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [loading, setLoading] = useState(true);

  const socialNetworks = ['WhatsApp', 'Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Messenger', 'YouTube', 'PlayStore'];
  const reasons = ['Produto', 'Suporte', 'Bug', 'Elogio', 'Reclamação', 'Oculto', 'Outro'];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsResult, chartResult, ratingResult, messagesResult] = await Promise.allSettled([
        getDashboardMetrics(appliedFilters),
        getChartData(appliedFilters),
        getRatingAverage(appliedFilters),
        getTabulations(appliedFilters)
      ]);
      if (metricsResult.status === 'fulfilled') {
        const v = metricsResult.value;
        if (v?.success && v?.data) setMetrics(v.data);
        else if (v?.data) setMetrics(v.data);
      }
      if (chartResult.status === 'fulfilled') {
        const v = chartResult.value;
        if (v?.success && v?.data) setChartData(v.data);
        else if (v?.data) setChartData(v.data);
      }
      if (ratingResult.status === 'fulfilled' && ratingResult.value?.success && ratingResult.value?.data) {
        setRatingAverage(ratingResult.value.data);
      }
      if (messagesResult.status === 'fulfilled') {
        const v = messagesResult.value;
        if (v?.data && Array.isArray(v.data)) setMessages(v.data);
        else setMessages([]);
      } else setMessages([]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilterChange = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
  const handleApplyFilters = () => setAppliedFilters({ ...filters });
  const handleWordsProcessed = useCallback((words) => { if (setWordCloudWords) setWordCloudWords(words); }, [setWordCloudWords]);

  if (loading) {
    return (
      <div className="velohub-container dashboard-sociais">
        <div className="filters-section dashboard-filters-section"><p>Carregando dados...</p></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="velohub-container dashboard-sociais">
      <div className="filters-section dashboard-filters-section">
        <div className="filter-group">
          <label>Rede Social</label>
          <select value={filters.socialNetwork} onChange={(e) => handleFilterChange('socialNetwork', e.target.value)} className="velohub-input">
            <option value="">Todas</option>
            {socialNetworks.map(network => <option key={network} value={network}>{network}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Motivo</label>
          <select value={filters.contactReason} onChange={(e) => handleFilterChange('contactReason', e.target.value)} className="velohub-input">
            <option value="">Todos</option>
            {reasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Data Inicial</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="velohub-input" />
        </div>
        <div className="filter-group">
          <label>Data Final</label>
          <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="velohub-input" />
        </div>
        <div style={{ alignSelf: 'flex-end', flex: '0 0 auto' }}>
          <button type="button" onClick={handleApplyFilters} className="velohub-btn secondary" disabled={loading}>
            {loading ? 'Carregando...' : 'Filtrar'}
          </button>
        </div>
      </div>
      {metrics && (
          <div className="metrics-cards">
            <div className="metric-card"><h3>Total de Contatos</h3><p className="metric-value">{metrics.totalContacts}</p></div>
            <div className="metric-card"><h3>% Sentimento Positivo</h3><p className="metric-value">{metrics.positivePercent}%</p></div>
            {ratingAverage ? (
              <div className="metric-card">
                <h3>Média</h3>
                <p className="metric-value">{ratingAverage.average ? ratingAverage.average.toFixed(2) : 'N/A'}{ratingAverage.average && <span className="metric-unit">⭐</span>}</p>
              </div>
            ) : (
              <div className="metric-card"><h3>Média</h3><p className="metric-value">N/A</p></div>
            )}
            <div className="metric-card"><h3>Rede mais Ativa</h3><p className="metric-value">{metrics.mostActiveNetwork || 'N/A'}</p></div>
          </div>
      )}
      {chartData && Plot && (
          <div className="charts-section">
            <div className="chart-container">
              <h3>Volume por Rede Social</h3>
              <Plot
                data={[{ x: chartData.networkVolume.map(i => i.socialNetwork), y: chartData.networkVolume.map(i => i.count), type: 'bar', marker: { color: '#1634FF' } }]}
                layout={{ title: '', xaxis: { title: 'Rede Social' }, yaxis: { title: 'Quantidade' }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }}
                style={{ width: '100%', height: '400px' }}
              />
            </div>
            <div className="chart-container">
              <h3>Motivos Frequentes</h3>
              <Plot
                data={[{ values: chartData.reasonFrequency.map(i => i.count), labels: chartData.reasonFrequency.map(i => i.reason), type: 'pie', hole: 0.4 }]}
                layout={{ title: '', paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }}
                style={{ width: '100%', height: '400px' }}
              />
            </div>
          </div>
      )}
      {chartData && !Plot && <div className="charts-section"><p>Carregando gráficos...</p></div>}
      <WordCloudInsights messages={messages} filters={appliedFilters} onWordClick={onWordClick} onWordsProcessed={handleWordsProcessed} />
    </div>
  );
};

export default Dashboard;

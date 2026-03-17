/**
 * VeloHub V3 - Reports (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

import { useState } from 'react';
import { DownloadOutlined, RocketLaunchOutlined } from '@mui/icons-material';
import { getTabulations, getChartData, generateReport } from '../../services/sociaisApi';
import { downloadReportPDF } from '../../utils/sociais/pdfGenerator';
import { downloadReportWord } from '../../utils/sociais/wordGenerator';
import { generateDashboardChartsImages, generateSentimentPieChart } from '../../utils/sociais/chartExporter';

const Reports = () => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [chartImages, setChartImages] = useState(null);
  const [sentimentChartImage, setSentimentChartImage] = useState(null);
  const [filters, setFilters] = useState({ socialNetwork: '', contactReason: '', dateFrom: '', dateTo: '' });

  const socialNetworks = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Messenger', 'YouTube', 'PlayStore'];
  const reasons = ['Produto', 'Suporte', 'Bug', 'Elogio', 'Reclamação', 'Oculto', 'Outro'];

  const handleFilterChange = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));

  const calculateSentimentByNetwork = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const networks = {};
    data.forEach(item => {
      const network = item.socialNetwork || 'Desconhecido';
      const sentiment = item.sentiment || 'Neutro';
      if (!networks[network]) networks[network] = { Positivo: 0, Neutro: 0, Negativo: 0, total: 0 };
      if (networks[network][sentiment] !== undefined) networks[network][sentiment]++;
      networks[network].total++;
    });
    const result = [];
    Object.keys(networks).forEach(network => {
      const nd = networks[network];
      ['Positivo', 'Neutro', 'Negativo'].forEach(sentiment => {
        const count = nd[sentiment] || 0;
        const percentage = nd.total > 0 ? (count / nd.total) * 100 : 0;
        if (count > 0) result.push({ network, sentiment, count, percentage });
      });
    });
    return result;
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport('');
    setChartImages(null);
    try {
      const tabulationsResult = await getTabulations(filters);
      if (!tabulationsResult.success) {
        setReport(`Erro ao buscar dados: ${tabulationsResult.error || 'Erro desconhecido'}`);
        setLoading(false);
        return;
      }
      if (tabulationsResult.count === 0) {
        setReport('Nenhum dado encontrado para os filtros selecionados. Tente remover os filtros ou ajustar as datas.');
        setLoading(false);
        return;
      }
      let chartResult = null;
      try {
        chartResult = await getChartData(filters);
      } catch (e) {
        console.warn('Erro ao buscar dados dos gráficos:', e);
      }
      if (chartResult?.data) {
        try {
          const imagesResult = await generateDashboardChartsImages(chartResult.data);
          if (imagesResult.success) setChartImages(imagesResult.charts);
        } catch (e) {
          console.error('Erro ao gerar imagens dos gráficos:', e);
        }
      }
      const data = tabulationsResult.data.map(item => ({
        socialNetwork: item.socialNetwork,
        contactReason: item.contactReason,
        sentiment: item.sentiment,
        messageText: item.messageText,
        rating: item.rating || null
      }));
      const sentimentData = calculateSentimentByNetwork(data);
      if (sentimentData.length > 0) {
        try {
          const sentimentChart = await generateSentimentPieChart(sentimentData);
          setSentimentChartImage(sentimentChart);
        } catch (e) {
          setSentimentChartImage(null);
        }
      } else setSentimentChartImage(null);
      const result = await generateReport(null, filters);
      if (result.success) setReport(result.data);
      else setReport(`Erro ao gerar relatório: ${result.error || 'Erro desconhecido'}`);
    } catch (error) {
      const apiError = error.response?.data?.error;
      setReport(`Erro ao gerar relatório: ${apiError || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloadingPDF(true);
    try {
      let imagesToUse = chartImages;
      if (!chartImages?.networkVolume || !chartImages?.reasonFrequency) {
        try {
          const chartResult = await getChartData(filters);
          if (chartResult?.data) {
            const imagesResult = await generateDashboardChartsImages(chartResult.data);
            if (imagesResult.success) { imagesToUse = imagesResult.charts; setChartImages(imagesResult.charts); }
          }
        } catch (e) {}
      }
      const result = await downloadReportPDF(report, imagesToUse, null, sentimentChartImage);
      if (!result.success) alert(`Erro ao gerar PDF: ${result.error || 'Erro desconhecido'}`);
    } catch (error) {
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!report) return;
    setDownloadingWord(true);
    try {
      const result = await downloadReportWord(report, null, sentimentChartImage);
      if (!result.success) alert(`Erro ao gerar Word: ${result.error || 'Erro desconhecido'}`);
    } catch (error) {
      alert('Erro ao gerar Word. Tente novamente.');
    } finally {
      setDownloadingWord(false);
    }
  };

  return (
    <div className="velohub-container">
      <h2 className="section-title">Relatório Executivo de CX</h2>
      <div className="filters-section">
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
      </div>
      <div className="report-actions">
        <button type="button" onClick={handleGenerateReport} className="velohub-btn" disabled={loading}>
          <RocketLaunchOutlined sx={{ fontSize: '0.875rem' }} />
          {loading ? 'Gerando relatório...' : 'Gerar Relatório com IA'}
        </button>
        {report && (
          <>
            <button type="button" onClick={handleDownloadPDF} className="velohub-btn secondary" disabled={downloadingPDF}>
              <DownloadOutlined sx={{ fontSize: '0.875rem' }} />
              {downloadingPDF ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>
            <button type="button" onClick={handleDownloadWord} className="velohub-btn secondary" disabled={downloadingWord}>
              <DownloadOutlined sx={{ fontSize: '0.875rem' }} />
              {downloadingWord ? 'Gerando Word...' : 'Baixar Word'}
            </button>
          </>
        )}
      </div>
      {loading && <div className="loading-message"><p>Consultor de CX analisando dados...</p></div>}
      {report && !loading && (
        <div className="report-content">
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{
              __html: report.split('\n').map(line => {
                if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
                if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
                if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
                if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
                if (line.trim() === '') return '<br/>';
                return `<p>${line}</p>`;
              }).join('')
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;

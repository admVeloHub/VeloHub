/**
 * VeloHub V3 - Chart Exporter (Sociais)
 * VERSION: v1.1.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.1.0:
 * - Gráfico de sentimento: pizza → barras empilhadas
 * - Barras: altura = total por rede; cores: Positivo (azul), Neutro (amarelo), Negativo (vermelho)
 */

const getPlotly = async () => {
  if (typeof window !== 'undefined' && window.Plotly) return window.Plotly;
  try {
    const plotlyModule = await import('plotly.js-dist-min');
    return plotlyModule.default || plotlyModule;
  } catch (error) {
    console.error('ChartExporter: Plotly não disponível', error);
    throw new Error('Plotly não está disponível.');
  }
};

export const exportChartToImage = async (chartData, chartType = 'bar') => {
  const Plotly = await getPlotly();
  let data, layout, config;
  if (chartType === 'bar') {
    data = [{
      x: chartData.networkVolume.map(item => item.socialNetwork),
      y: chartData.networkVolume.map(item => item.count),
      type: 'bar',
      marker: { color: '#1634FF', line: { color: '#0d28a3', width: 1 } }
    }];
    layout = {
      title: { text: 'Volume por Rede Social', font: { size: 18, color: '#ffffff' } },
      xaxis: { title: { text: 'Rede Social', font: { color: '#ffffff' } }, tickfont: { color: '#ffffff' } },
      yaxis: { title: { text: 'Quantidade', font: { color: '#ffffff' } }, tickfont: { color: '#ffffff' } },
      paper_bgcolor: '#1e2130', plot_bgcolor: '#1e2130', font: { color: '#ffffff' }, margin: { l: 60, r: 20, t: 60, b: 60 }
    };
  } else if (chartType === 'pie') {
    data = [{
      values: chartData.reasonFrequency.map(item => item.count),
      labels: chartData.reasonFrequency.map(item => item.reason),
      type: 'pie', hole: 0.4,
      marker: { colors: ['#1634FF', '#00d1b2', '#ff6b6b', '#ffd93d', '#6bcf7f', '#a29bfe'], line: { color: '#1e2130', width: 2 } },
      textfont: { color: '#ffffff', size: 14 }
    }];
    layout = {
      title: { text: 'Motivos Frequentes', font: { size: 18, color: '#ffffff' } },
      paper_bgcolor: '#1e2130', plot_bgcolor: '#1e2130', font: { color: '#ffffff' },
      margin: { l: 20, r: 20, t: 60, b: 20 }, showlegend: true,
      legend: { font: { color: '#ffffff' }, x: 1.1, y: 0.5 }
    };
  }
  config = { displayModeBar: false, responsive: true };
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = 'width:800px;height:500px;position:absolute;left:-9999px';
  document.body.appendChild(tempDiv);
  try {
    await Plotly.newPlot(tempDiv, data, layout, config);
    const imageDataUrl = await Plotly.toImage(tempDiv, { format: 'png', width: 800, height: 500, scale: 2 });
    document.body.removeChild(tempDiv);
    return { base64: imageDataUrl.split(',')[1], dataUrl: imageDataUrl, width: 800, height: 500 };
  } catch (err) {
    if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    throw err;
  }
};

export const generateDashboardChartsImages = async (chartData) => {
  try {
    if (!chartData?.networkVolume || !chartData?.reasonFrequency) {
      return { success: false, error: 'Dados de gráficos inválidos' };
    }
    const barChart = await exportChartToImage(chartData, 'bar');
    const pieChart = await exportChartToImage(chartData, 'pie');
    return { success: true, charts: { networkVolume: barChart, reasonFrequency: pieChart } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/** Cores: Positivo azul, Neutro amarelo, Negativo vermelho */
const SENTIMENT_COLORS = { 'Positivo': '#1634FF', 'Neutro': '#FCC200', 'Negativo': '#dc3545' };

/**
 * Gráfico de barras empilhadas: altura = total de registros por rede,
 * proporcionalmente Positivo (azul), Neutro (amarelo), Negativo (vermelho)
 */
export const generateSentimentStackedBarChart = async (sentimentData) => {
  if (!Array.isArray(sentimentData) || sentimentData.length === 0) {
    throw new Error('Dados de sentimento inválidos ou vazios');
  }
  const Plotly = await getPlotly();
  const byNetwork = {};
  sentimentData.forEach(item => {
    const n = item.network || 'Desconhecido';
    if (!byNetwork[n]) byNetwork[n] = { Positivo: 0, Neutro: 0, Negativo: 0 };
    if (item.sentiment in byNetwork[n]) byNetwork[n][item.sentiment] = item.count;
  });
  const networks = Object.keys(byNetwork);
  const positivo = networks.map(n => byNetwork[n].Positivo || 0);
  const neutro = networks.map(n => byNetwork[n].Neutro || 0);
  const negativo = networks.map(n => byNetwork[n].Negativo || 0);
  const data = [
    { x: networks, y: positivo, name: 'Positivo', type: 'bar', marker: { color: SENTIMENT_COLORS.Positivo } },
    { x: networks, y: neutro, name: 'Neutro', type: 'bar', marker: { color: SENTIMENT_COLORS.Neutro } },
    { x: networks, y: negativo, name: 'Negativo', type: 'bar', marker: { color: SENTIMENT_COLORS.Negativo } }
  ];
  const layout = {
    barmode: 'stack',
    title: { text: 'Análise de Sentimento por Rede Social', font: { family: 'Poppins', size: 18, color: '#1634FF', weight: 'bold' }, x: 0.5, xanchor: 'center' },
    xaxis: { title: { text: 'Rede Social' }, tickfont: { size: 11 } },
    yaxis: { title: { text: 'Quantidade de registros' } },
    paper_bgcolor: '#F3F7FC', plot_bgcolor: '#F3F7FC', font: { family: 'Poppins', size: 12, color: '#272A30' },
    legend: { orientation: 'v', x: 1.02, y: 0.5 }, margin: { l: 60, r: 120, t: 80, b: 60 }, showlegend: true
  };
  const config = { displayModeBar: false, responsive: true };
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = 'width:800px;height:500px;position:absolute;left:-9999px';
  document.body.appendChild(tempDiv);
  try {
    await Plotly.newPlot(tempDiv, data, layout, config);
    await new Promise(r => setTimeout(r, 500));
    const imageData = await Plotly.toImage(tempDiv, { format: 'png', width: 800, height: 500, scale: 2 });
    document.body.removeChild(tempDiv);
    return { dataUrl: imageData, width: 800, height: 500 };
  } catch (err) {
    if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    throw err;
  }
};

/** @deprecated Use generateSentimentStackedBarChart. Mantido para compatibilidade. */
export const generateSentimentPieChart = generateSentimentStackedBarChart;

/**
 * VeloHub V3 - Feed (Sociais)
 * VERSION: v1.2.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.2.0:
 * - Botão Filtrar; filtros aplicados apenas ao clicar
 *
 * Mudanças v1.1.0:
 * - Layout em linha para metadados (feed-card-row)
 * - Contorno do card por sentimento em vez de barra por rede social
 */

import { useState, useEffect, useCallback } from 'react';
import { getFeed } from '../../services/sociaisApi';
import KeywordFilter from './KeywordFilter';
import { exportFeedToExcel } from '../../utils/sociais/excelExporter';
import DownloadIcon from './icons/DownloadIcon';

const Feed = ({ selectedWord, wordCloudWords = [] }) => {
  const [feedData, setFeedData] = useState([]);
  const [filters, setFilters] = useState({
    socialNetwork: '',
    contactReason: '',
    sentiment: '',
    dateFrom: '',
    dateTo: '',
    keyword: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socialNetworks = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Messenger', 'YouTube', 'PlayStore'];
  const reasons = ['Produto', 'Suporte', 'Bug', 'Elogio', 'Reclamação', 'Oculto', 'Outro'];
  const sentiments = ['Positivo', 'Neutro', 'Negativo'];

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFeed(appliedFilters);
      if (result?.success && result.data) {
        setFeedData(result.data);
        setError(null);
      } else {
        setFeedData([]);
      }
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
      setFeedData([]);
      setError(err?.message || 'Erro ao carregar feed. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => { loadFeed(); }, [loadFeed]);
  useEffect(() => { if (selectedWord) setFilters(prev => ({ ...prev, keyword: selectedWord })); }, [selectedWord]);

  const handleFilterChange = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
  const handleApplyFilters = () => setAppliedFilters({ ...filters });
  const getSentimentClass = (sentiment) => `sentiment-${(sentiment || 'neutro').toLowerCase()}`;
  const getSentimentBorderClass = (sentiment) => {
    const s = (sentiment || '').toLowerCase();
    if (s === 'positivo') return 'feed-card-border-positivo';
    if (s === 'negativo') return 'feed-card-border-negativo';
    if (s === 'neutro') return 'feed-card-border-neutro';
    return 'feed-card-border-default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      let date = typeof dateString === 'string' ? (dateString.endsWith('Z') ? new Date(dateString) : dateString.includes('T') ? new Date(dateString + 'Z') : new Date(dateString)) : new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      return formatter.format(date);
    } catch (e) {
      return '';
    }
  };

  const filteredFeedData = feedData.filter(item => {
    if (!appliedFilters.keyword) return true;
    return (item.messageText || '').toLowerCase().includes(appliedFilters.keyword.toLowerCase());
  });
  const resultCount = filteredFeedData.length;
  const totalCount = feedData.length;

  const handleExportExcel = () => {
    if (filteredFeedData.length === 0) {
      alert('Não há dados para exportar. Aplique filtros ou aguarde o carregamento dos dados.');
      return;
    }
    const result = exportFeedToExcel(filteredFeedData, appliedFilters);
    if (result.success) console.log(`✅ Arquivo ${result.filename} exportado com sucesso!`);
    else alert(`Erro ao exportar: ${result.error}`);
  };

  if (loading) return <div className="velohub-container"><p>Carregando feed...</p></div>;
  if (error) {
    return (
      <div className="velohub-container">
        <div className="section-title" style={{ marginBottom: '16px' }}>Feed de Atendimento</div>
        <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
          <strong>Erro ao carregar feed:</strong> {error}<br />
          <small>Verifique se o servidor está online e tente novamente.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="velohub-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Feed de Atendimento</h2>
        <button onClick={handleExportExcel} disabled={feedData.length === 0} className="velohub-btn">
          <DownloadIcon size={16} color="#ffffff" strokeColor="#000000" backgroundColor="#1634FF" showBackground={false} />
          Exportar Excel
        </button>
      </div>
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
          <label>Sentimento</label>
          <select value={filters.sentiment} onChange={(e) => handleFilterChange('sentiment', e.target.value)} className="velohub-input">
            <option value="">Todos</option>
            {sentiments.map(sentiment => <option key={sentiment} value={sentiment}>{sentiment}</option>)}
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
        <div className="filter-group">
          <label>Palavra-Chave (Nuvem)</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <KeywordFilter value={filters.keyword} onChange={(value) => handleFilterChange('keyword', value)} options={wordCloudWords} placeholder="Digite ou selecione uma palavra da nuvem" />
            {filters.keyword && <button type="button" onClick={() => handleFilterChange('keyword', '')} className="velohub-btn-outline">Limpar</button>}
          </div>
        </div>
        <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
          <button type="button" onClick={handleApplyFilters} className="velohub-btn" disabled={loading}>
            {loading ? 'Carregando...' : 'Filtrar'}
          </button>
        </div>
      </div>
      {appliedFilters.keyword && (
        <div style={{ marginBottom: '15px', padding: '10px 15px', backgroundColor: '#1e2130', borderRadius: '4px', border: '1px solid #2d3142' }}>
          <p style={{ margin: 0, color: '#e0e0e0', fontSize: '14px' }}>
            {resultCount === 0 ? `Nenhuma mensagem encontrada com a palavra-chave "${appliedFilters.keyword}".` : `Mostrando ${resultCount} de ${totalCount} mensagem${totalCount !== 1 ? 's' : ''} com a palavra-chave "${appliedFilters.keyword}".`}
          </p>
        </div>
      )}
      {filteredFeedData.length === 0 ? (
        <div className="empty-feed">
          <p>{feedData.length === 0 ? 'O feed está vazio.' : `Nenhuma mensagem encontrada com a palavra-chave "${appliedFilters.keyword}".`}</p>
        </div>
      ) : (
        <div className="feed-list">
          {filteredFeedData.map((item) => (
            <div key={item._id} className={`velohub-card feed-card ${getSentimentBorderClass(item.sentiment)}`}>
              <div className="feed-card-row">
                <span><strong>{item.socialNetwork}</strong></span>
                <span><strong>{item.clientName}</strong></span>
                <span className="badge">{item.contactReason || 'N/A'}</span>
                {item.rating ? <span className="rating">⭐ {item.rating}</span> : <span>—</span>}
                <span>{formatDate(item.createdAt)}</span>
                <span className={getSentimentClass(item.sentiment)}>{item.sentiment || 'N/A'}</span>
              </div>
              <p className="feed-message">"{item.messageText}"</p>
              {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="feed-link">Ver link</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;

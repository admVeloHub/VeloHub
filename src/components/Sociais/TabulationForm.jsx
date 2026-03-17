/**
 * VeloHub V3 - TabulationForm (Sociais)
 * VERSION: v1.2.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.2.0:
 * - Removido checkbox "Usar Análise Expressa (IA)"
 * - Botão Analisar com IA sempre visível, na mesma linha que Salvar
 *
 * Mudanças v1.1.0:
 * - Nome, Rede social e Data na mesma linha (form-row-3)
 * - Labels: Nome *, Rede social, Data
 */

import { useState } from 'react';
import { createTabulation, analyzeText } from '../../services/sociaisApi';

const TabulationForm = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    socialNetwork: 'Instagram',
    messageText: '',
    rating: '',
    contactReason: '',
    sentiment: '',
    directedCenter: false,
    link: '',
    createdAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState('');

  const socialNetworks = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Messenger', 'YouTube', 'PlayStore'];
  const reasons = ['Produto', 'Suporte', 'Bug', 'Elogio', 'Reclamação', 'Oculto', 'Outro'];
  const sentiments = ['Positivo', 'Neutro', 'Negativo'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAIAnalysis = async () => {
    if (!formData.messageText.trim()) { setMessage('Por favor, insira o texto da mensagem para análise'); return; }
    setAiLoading(true);
    try {
      const result = await analyzeText(formData.messageText);
      if (result.success) {
        setFormData(prev => ({ ...prev, sentiment: result.data.sentiment, contactReason: result.data.reason }));
        setMessage('Análise realizada com sucesso!');
      } else if (result.fallback) {
        setFormData(prev => ({ ...prev, sentiment: result.fallback.sentiment, contactReason: result.fallback.reason }));
        setMessage('Análise realizada com valores padrão');
      }
    } catch (error) {
      setMessage(`Erro na análise: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.messageText) { setMessage('Preencha os campos obrigatórios'); return; }
    setLoading(true);
    setMessage('');
    try {
      let ratingValue = null;
      if (formData.rating && formData.rating !== '') {
        const ratingStr = formData.rating.replace('⭐', '').trim();
        if (ratingStr) {
          const parsed = parseInt(ratingStr, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) ratingValue = parsed;
        }
      }
      const data = {
        clientName: (formData.clientName || '').trim(),
        socialNetwork: formData.socialNetwork || '',
        messageText: (formData.messageText || '').trim(),
        rating: ratingValue,
        contactReason: (formData.contactReason && formData.contactReason.trim() !== '') ? formData.contactReason.trim() : null,
        sentiment: (formData.sentiment && formData.sentiment.trim() !== '') ? formData.sentiment.trim() : null,
        directedCenter: Boolean(formData.directedCenter),
        link: (formData.link && formData.link.trim() !== '') ? formData.link.trim() : null,
        createdAt: formData.createdAt && formData.createdAt.trim() !== '' ? formData.createdAt : null
      };
      if (!data.clientName || !data.socialNetwork || !data.messageText) {
        setMessage('Erro: Preencha todos os campos obrigatórios (Nome, Rede social e Mensagem)');
        setLoading(false);
        return;
      }
      const result = await createTabulation(data);
      if (result.success) {
        setMessage('Interação registrada com sucesso');
        setFormData({ clientName: '', socialNetwork: 'Instagram', messageText: '', rating: '', contactReason: '', sentiment: '', directedCenter: false, link: '', createdAt: '' });
      } else {
        setMessage(`Erro: ${result.error || 'Erro desconhecido ao criar tabulação'}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido ao criar tabulação';
      setMessage(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="velohub-container">
      <h2 className="section-title">Nova Interação</h2>
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</div>
      )}
      <form onSubmit={handleSubmit} className="tabulation-form">
        <div className="form-row form-row-3">
          <div className="form-group">
            <label htmlFor="clientName">Nome *</label>
            <input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} className="velohub-input" required />
          </div>
          <div className="form-group">
            <label htmlFor="socialNetwork">Rede social *</label>
            <select id="socialNetwork" name="socialNetwork" value={formData.socialNetwork} onChange={handleChange} className="velohub-input" required>
              {socialNetworks.map(network => <option key={network} value={network}>{network}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="createdAt">Data</label>
            <input type="date" id="createdAt" name="createdAt" value={formData.createdAt} onChange={handleChange} className="velohub-input" />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="messageText">Texto da Mensagem Principal *</label>
          <textarea id="messageText" name="messageText" value={formData.messageText} onChange={handleChange} className="velohub-input" rows="4" required />
        </div>
        {(formData.socialNetwork === 'YouTube' || formData.socialNetwork === 'TikTok') && (
          <div className="form-group">
            <label htmlFor="link">Link do Vídeo</label>
            <input type="url" id="link" name="link" value={formData.link} onChange={handleChange} className="velohub-input" placeholder="Ex: https://www.youtube.com/watch?v=..." />
          </div>
        )}
        {formData.socialNetwork === 'PlayStore' && (
          <div className="form-group">
            <label htmlFor="rating">Avaliação *</label>
            <select id="rating" name="rating" value={formData.rating} onChange={handleChange} className="velohub-input" required>
              <option value="">Selecione</option>
              <option value="1⭐">1⭐</option>
              <option value="2⭐">2⭐</option>
              <option value="3⭐">3⭐</option>
              <option value="4⭐">4⭐</option>
              <option value="5⭐">5⭐</option>
            </select>
          </div>
        )}
        <div className="form-row form-row-3">
          <div className="form-group">
            <label htmlFor="contactReason">Motivo do Contato</label>
            <select id="contactReason" name="contactReason" value={formData.contactReason} onChange={handleChange} className="velohub-input">
              <option value="">Selecione</option>
              {reasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="sentiment">Sentimento</label>
            <select id="sentiment" name="sentiment" value={formData.sentiment} onChange={handleChange} className="velohub-input">
              <option value="">Selecione</option>
              {sentiments.map(sentiment => <option key={sentiment} value={sentiment}>{sentiment}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label htmlFor="directedCenter" className="checkbox-label" style={{ fontSize: '1rem' }}>
              <input type="checkbox" id="directedCenter" name="directedCenter" checked={formData.directedCenter} onChange={handleChange} />
              Direcionado para Central
            </label>
          </div>
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
          <button type="button" onClick={handleAIAnalysis} className="velohub-btn secondary" disabled={loading || aiLoading || !formData.messageText.trim()}>
            {aiLoading ? 'Analisando...' : 'Analisar com IA'}
          </button>
          <button type="submit" className="velohub-btn" disabled={loading || aiLoading}>
            {loading ? 'Salvando...' : 'Salvar Interação'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TabulationForm;

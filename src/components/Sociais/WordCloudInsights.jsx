/**
 * VeloHub V3 - WordCloudInsights (Sociais)
 * VERSION: v1.2.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.2.1: Legenda vermelho — alerta / jurídico (léxico v1.1.1)
 * - v1.2.0: Cores por tipo (léxico PT via `getWordColor` + `wordCloudLexicon`)
 * - v1.1.1: Filtros de nuvem — ver `wordCloudProcessor` v1.1.x
 * - v1.1.0: @cp949/react-wordcloud (React 18)
 */

import { useMemo, useEffect, useRef } from 'react';
import { ReactWordcloud } from '@cp949/react-wordcloud';
import { processMessagesForWordCloud } from '../../utils/sociais/wordCloudProcessor';
import { getWordCloudTermColor, WORDCLOUD_COLORS } from '../../utils/sociais/wordCloudLexicon';

const WordCloudInsights = ({ messages = [], filters = {}, onWordClick, onWordsProcessed }) => {
  const prevWordsStringRef = useRef('');
  const wordCloudData = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    return processMessagesForWordCloud(messages, 50);
  }, [messages]);

  useEffect(() => {
    if (onWordsProcessed && wordCloudData.length > 0) {
      const words = wordCloudData.map(w => w.text);
      const wordsString = words.join(',');
      if (wordsString !== prevWordsStringRef.current) {
        prevWordsStringRef.current = wordsString;
        onWordsProcessed(words);
      }
    }
  }, [wordCloudData, onWordsProcessed]);

  const options = useMemo(() => ({
    colors: [WORDCLOUD_COLORS.verb, WORDCLOUD_COLORS.positive, WORDCLOUD_COLORS.negative, '#9333ea', '#0891b2'],
    fontSizes: [20, 60],
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    scale: 'sqrt',
    spiral: 'archimedean',
    transitionDuration: 1000,
    rotationAngles: [-45, 90],
  }), []);

  const callbacks = useMemo(() => {
    const c = {
      getWordColor: (word) => getWordCloudTermColor(word.text),
    };
    if (onWordClick) {
      c.onWordClick = (word) => onWordClick(word.text);
    }
    return c;
  }, [onWordClick]);

  if (wordCloudData.length === 0) {
    return (
      <div className="chart-container">
        <h3>☁️ Nuvem de Palavras (Insights)</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888', backgroundColor: '#1e2130', borderRadius: 'var(--velohub-radius-card)', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Nenhum dado disponível para gerar a nuvem de palavras.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>☁️ Nuvem de Palavras (Insights)</h3>
      <div style={{ width: '100%', height: '400px', backgroundColor: '#ffffff', borderRadius: 'var(--velohub-radius-card)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: onWordClick ? 'pointer' : 'default' }}>
        <ReactWordcloud
          words={wordCloudData}
          options={options}
          callbacks={callbacks}
          size={[800, 400]}
        />
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px' }}>
          {onWordClick ? 'Clique em uma palavra para filtrar o Feed de Atendimento.' : 'Termos mais frequentes (stopwords PT/EN, URLs e ruídos comuns removidos).'}
        </p>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          <span style={{ color: WORDCLOUD_COLORS.positive, fontWeight: 600 }}>Verde</span>
          {' = tom positivo · '}
          <span style={{ color: WORDCLOUD_COLORS.negative, fontWeight: 600 }}>Vermelho</span>
          {' = tom negativo e alerta (fraude, ameaça, justiça, etc.) · '}
          <span style={{ color: WORDCLOUD_COLORS.verb, fontWeight: 600 }}>Azul</span>
          {' = ação/verbo · outras cores = demais termos (léxico automático, não é análise gramatical completa).'}
        </p>
      </div>
    </div>
  );
};

export default WordCloudInsights;

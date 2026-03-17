/**
 * VeloHub V3 - WordCloudInsights (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

import { useMemo, useEffect, useRef } from 'react';
import WordCloud from 'react-wordcloud';
import { processMessagesForWordCloud } from '../../utils/sociais/wordCloudProcessor';

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

  const colors = ['#1634FF', '#00d1b2', '#ffd93d', '#ff6b6b', '#6bcf7f', '#a29bfe', '#ff9f43'];
  const rotation = () => {
    const angles = [0, 0, 0, 0, 0, 45, -45, 90, -90];
    return angles[Math.floor(Math.random() * angles.length)];
  };
  const options = {
    rotations: 3,
    rotationSteps: 2,
    rotation,
    fontSizes: [20, 60],
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    scale: 'sqrt',
    spiral: 'archimedean',
    transitionDuration: 1000,
    callbacks: { onWordClick: (word) => { if (onWordClick) onWordClick(word.text); } }
  };
  const getColor = (word, index) => colors[index % colors.length];

  if (wordCloudData.length === 0) {
    return (
      <div className="chart-container">
        <h3>☁️ Nuvem de Palavras (Insights)</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888', backgroundColor: '#1e2130', borderRadius: '8px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Nenhum dado disponível para gerar a nuvem de palavras.</p>
        </div>
      </div>
    );
  }

  const wordsWithColors = wordCloudData.map((word, index) => ({ ...word, color: getColor(word, index) }));

  return (
    <div className="chart-container">
      <h3>☁️ Nuvem de Palavras (Insights)</h3>
      <div style={{ width: '100%', height: '400px', backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: onWordClick ? 'pointer' : 'default' }}>
        <WordCloud words={wordsWithColors} options={options} size={[800, 400]} />
      </div>
      <p style={{ marginTop: '10px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
        {onWordClick ? 'Clique em uma palavra para filtrar o Feed de Atendimento' : 'Palavras mais frequentes nos textos de atendimento (stopwords removidas)'}
      </p>
    </div>
  );
};

export default WordCloudInsights;

/**
 * VeloHub V3 - SociaisPage (Módulo Sociais)
 * VERSION: v1.2.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Página principal do módulo Sociais com 4 abas:
 * Entrada de Dados, Dashboard, Feed de Atendimento, Relatórios
 *
 * Mudanças v1.2.0:
 * - Seletor de abas padronizado conforme Ouvidoria/Escalações
 * - Removidos wrappers app, tabs-container, tabs-wrapper, main-content
 */

import React, { useState } from 'react';
import TabulationForm from '../components/Sociais/TabulationForm';
import Dashboard from '../components/Sociais/Dashboard';
import Feed from '../components/Sociais/Feed';
import Reports from '../components/Sociais/Reports';

const SociaisPage = () => {
  const [activeTab, setActiveTab] = useState('tabulation');
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordCloudWords, setWordCloudWords] = useState([]);

  const tabs = [
    { id: 'tabulation', label: 'Entrada de Dados' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'feed', label: 'Feed de Atendimento' },
    { id: 'reports', label: 'Relatórios' }
  ];

  const handleWordSelect = (word) => {
    setSelectedWord(word);
    setActiveTab('feed');
  };

  return (
    <div className="w-full py-12" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      {/* Sistema de Abas */}
      <div className="mb-8" style={{ marginTop: '-15px' }}>
        <div className="flex justify-center mb-2" style={{ gap: '2rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === tab.id ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === tab.id ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="w-full" style={{ height: '1px', backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>
      </div>

      {activeTab === 'tabulation' && <TabulationForm />}
      {activeTab === 'dashboard' && (
        <Dashboard onWordClick={handleWordSelect} setWordCloudWords={setWordCloudWords} />
      )}
      {activeTab === 'feed' && (
        <Feed selectedWord={selectedWord} wordCloudWords={wordCloudWords} />
      )}
      {activeTab === 'reports' && <Reports />}
    </div>
  );
};

export default SociaisPage;

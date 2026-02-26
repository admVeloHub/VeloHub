/**
 * VeloHub V3 - Dashboard Ouvidoria Component
 * VERSION: v1.5.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.5.0:
 * - Adicionado filtro de data com campos dataInicio e dataFim
 * - Adicionados botões de período rápido (Hoje, Semana, Mês)
 * - Filtros são passados para a função onRefresh
 * 
 * Mudanças v1.4.0:
 * - Reorganizado dashboard para grid 4x3 (4 colunas, 3 linhas)
 * - Linha 1: Total de Reclamações, BACEN, Ouvidoria, Liquidação Antecipada
 * - Linha 2: Em Aberto, Concluída, Prazo Vencendo, Taxa de Resolução
 * - Linha 3: CA e Protocolos, Com Procon, Média de Prazo
 * - Adicionados cards para BACEN e Ouvidoria separados
 * - Adicionado card para CA e Protocolos
 * 
 * Mudanças v1.3.1:
 * - Removido título "Métricas Específicas"
 * 
 * Mudanças v1.3.0:
 * - Aplicado padrão de container secundário aos cards (bg-gray-50 dark:bg-gray-700)
 * - Removidos ícones das métricas
 * - Adequadas fontes conforme padrão do projeto (text-xs para labels, text-2xl para valores)
 * 
 * Mudanças v1.2.0:
 * - Removido cabeçalho do dashboard e seu container
 * - Botão atualizar removido (movido para sidebar)
 * 
 * Mudanças v1.1.0:
 * - Containers padronizados com classes velohub-card conforme LAYOUT_GUIDELINES.md
 * 
 * Componente de Dashboard do módulo de Ouvidoria
 */

import React, { useState, useEffect, useRef } from 'react';

const DashboardOuvidoria = ({ stats, loading, onRefresh }) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const isInitialMount = useRef(true);
  const onRefreshRef = useRef(onRefresh);

  // Atualizar ref quando onRefresh mudar
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  /**
   * Converter data para formato de input (YYYY-MM-DD)
   */
  const dateToInputStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  /**
   * Definir período rápido
   */
  const setQuickRange = (key) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (key === 'today') {
      const s = dateToInputStr(today);
      setDataInicio(s);
      setDataFim(s);
      return;
    }
    
    if (key === 'week') {
      const day = today.getDay(); // 0=Dom, 1=Seg
      const diffToMonday = (day + 6) % 7; // transforma: Seg=0, Dom=6
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);
      setDataInicio(dateToInputStr(monday));
      setDataFim(dateToInputStr(today));
      return;
    }
    
    if (key === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setDataInicio(dateToInputStr(first));
      setDataFim(dateToInputStr(today));
      return;
    }
  };

  /**
   * Limpar filtros
   */
  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
  };

  /**
   * Atualizar quando filtros mudarem (mas não na montagem inicial)
   */
  useEffect(() => {
    // Ignorar na montagem inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!onRefreshRef.current) return;
    
    // Aguardar um pequeno delay para evitar múltiplas chamadas durante digitação
    const timeoutId = setTimeout(() => {
      if (onRefreshRef.current) {
        onRefreshRef.current({ dataInicio, dataFim });
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [dataInicio, dataFim]);
  const statsData = stats?.data || stats || {
    total: 0,
    totalBacen: 0,
    totalOuvidoria: 0,
    emTratativa: 0,
    concluidas: 0,
    prazoVencendo: 0,
    taxaResolucao: 0,
    mediaPrazo: 0,
    comProcon: 0,
    liquidacaoAntecipada: 0,
    caEProtocolos: 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros de Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Data Início
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Data Fim
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="md:col-span-2 flex items-end">
          <div className="flex flex-wrap items-center gap-2 w-full">
            <span className="text-xs text-gray-600 dark:text-gray-400">Período rápido:</span>
            <button
              type="button"
              onClick={() => setQuickRange('today')}
              className="text-xs px-3 py-1.5 rounded border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('week')}
              className="text-xs px-3 py-1.5 rounded border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('month')}
              className="text-xs px-3 py-1.5 rounded border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
            >
              Mês
            </button>
            {(dataInicio || dataFim) && (
              <button
                type="button"
                onClick={limparFiltros}
                className="text-xs px-3 py-1.5 rounded border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid 4x3 de Cards (4 colunas, 3 linhas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Linha 1 */}
        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Total de Reclamações</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.total || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">BACEN</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.totalBacen || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">N2 Pix</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.totalOuvidoria || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Liquidação Antecipada</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.liquidacaoAntecipada || 0}
          </div>
        </div>

        {/* Linha 2 */}
        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Em Aberto</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.emTratativa || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Concluída</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.concluidas || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Prazo Vencendo</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.prazoVencendo || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Taxa de Resolução</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.taxaResolucao || 0}%
          </div>
        </div>

        {/* Linha 3 */}
        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">CA e Protocolos</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.caEProtocolos || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Com Procon</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.comProcon || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Média de Prazo</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.mediaPrazo || 0} dias
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOuvidoria;

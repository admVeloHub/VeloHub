/**
 * VeloHub V3 - Dashboard Ouvidoria Component
 * VERSION: v1.9.1 | DATE: 2026-03-04 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.9.1:
 * - Melhorado alinhamento dos botões de período rápido:
 *   - Alterado container interno de items-center para items-end para alinhar com inputs acima
 *   - Adicionado mb-0.5 no label "Período rápido:" para melhor alinhamento vertical
 *   - Garantido alinhamento consistente na mesma linha base com os inputs de data
 * 
 * Mudanças v1.9.0:
 * - Reposicionado botão "Filtrar" ao lado do campo "Data Fim" (removido da área de botões de período rápido)
 * - Aplicado padrão estético usado em outros componentes (ListaReclamacoes.js, AnaliseDiaria.js):
 *   - borderColor: '#006AB9', color: '#006AB9', background: 'transparent'
 *   - Efeitos hover com gradient (linear-gradient(135deg, #006AB9 0%, #006AB9 100%))
 *   - text-sm px-4 py-2 (tamanho maior que os botões de período rápido)
 * - Ajustado grid para acomodar o botão ao lado do campo Data Fim
 * 
 * Mudanças v1.8.0:
 * - Removido useEffect que atualizava automaticamente quando dataInicio ou dataFim mudavam
 * - Criados estados separados: dataInicioInput/dataFimInput (inputs) e dataInicio/dataFim (filtros aplicados)
 * - Adicionada função aplicarFiltro() para aplicar filtros manualmente
 * - Adicionado botão "Filtrar" ao lado dos botões de período rápido
 * - Botões de período rápido agora apenas atualizam os inputs (não aplicam automaticamente)
 * - Botão "Limpar" agora limpa inputs e aplica filtro vazio
 * 
 * Mudanças v1.7.0:
 * - Adicionados cards "Pix Liberado" e "Para Cobrança" na linha 3 após "Liquidação Antecipada"
 * - Adicionados campos pixLiberado e paraCobranca ao statsData default
 * 
 * Mudanças v1.6.0:
 * - Grid alterado de 4 colunas para 5 colunas
 * - Reorganizados cards conforme nova estrutura:
 *   - Linha 1: Bacen, N2 Pix, Reclame Aqui, Procon, Ação Judicial
 *   - Linha 2: Em Aberto, Resolvido (renomeado de Concluída), Prazo Vencendo, Total de Reclamações, Taxa de Resolução
 *   - Linha 3: CA e Protocolos, Prazo Médio (renomeado de Média de Prazo), Liquidação Antecipada (2 células vazias)
 * - Adicionados campos reclameAqui e acaoJudicial ao statsData default
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

import React, { useState } from 'react';

const DashboardOuvidoria = ({ stats, loading, onRefresh }) => {
  // Estados para os inputs (não disparam atualização automática)
  const [dataInicioInput, setDataInicioInput] = useState('');
  const [dataFimInput, setDataFimInput] = useState('');
  
  // Estados para filtros aplicados (são passados para onRefresh)
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

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
   * Definir período rápido (apenas atualiza os inputs, não aplica automaticamente)
   */
  const setQuickRange = (key) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (key === 'today') {
      const s = dateToInputStr(today);
      setDataInicioInput(s);
      setDataFimInput(s);
      return;
    }
    
    if (key === 'week') {
      const day = today.getDay(); // 0=Dom, 1=Seg
      const diffToMonday = (day + 6) % 7; // transforma: Seg=0, Dom=6
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);
      setDataInicioInput(dateToInputStr(monday));
      setDataFimInput(dateToInputStr(today));
      return;
    }
    
    if (key === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setDataInicioInput(dateToInputStr(first));
      setDataFimInput(dateToInputStr(today));
      return;
    }
  };

  /**
   * Aplicar filtros (atualiza filtros aplicados e chama onRefresh)
   */
  const aplicarFiltro = () => {
    setDataInicio(dataInicioInput);
    setDataFim(dataFimInput);
    if (onRefresh) {
      onRefresh({ dataInicio: dataInicioInput, dataFim: dataFimInput });
    }
  };

  /**
   * Limpar filtros (limpa inputs e aplica filtro vazio)
   */
  const limparFiltros = () => {
    setDataInicioInput('');
    setDataFimInput('');
    setDataInicio('');
    setDataFim('');
    if (onRefresh) {
      onRefresh({ dataInicio: '', dataFim: '' });
    }
  };
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
    reclameAqui: 0,
    acaoJudicial: 0,
    liquidacaoAntecipada: 0,
    caEProtocolos: 0,
    pixLiberado: 0,
    paraCobranca: 0,
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
            value={dataInicioInput}
            onChange={(e) => setDataInicioInput(e.target.value)}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Data Fim
          </label>
          <div className="flex gap-2 items-end">
            <input
              type="date"
              value={dataFimInput}
              onChange={(e) => setDataFimInput(e.target.value)}
              className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={aplicarFiltro}
              className="text-sm px-4 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
              Filtrar
            </button>
          </div>
        </div>

        <div className="md:col-span-2 flex items-end">
          <div className="flex flex-wrap items-end gap-2 w-full">
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Período rápido:</span>
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
            {(dataInicioInput || dataFimInput) && (
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

      {/* Grid 5x3 de Cards (5 colunas, 3 linhas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Linha 1: Bacen, N2 Pix, Reclame Aqui, Procon, Ação Judicial */}
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
          <div className="text-xs text-gray-600 dark:text-gray-400">Reclame Aqui</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.reclameAqui || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Procon</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.comProcon || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Ação Judicial</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.acaoJudicial || 0}
          </div>
        </div>

        {/* Linha 2: Em Aberto, Resolvido, Prazo Vencendo, Total de Reclamações, Taxa de Resolução */}
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
          <div className="text-xs text-gray-600 dark:text-gray-400">Resolvido</div>
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
          <div className="text-xs text-gray-600 dark:text-gray-400">Total de Reclamações</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.total || 0}
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

        {/* Linha 3: CA e Protocolos, Prazo Médio, Liquidação Antecipada, Pix Liberado, Para Cobrança */}
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
          <div className="text-xs text-gray-600 dark:text-gray-400">Prazo Médio</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.mediaPrazo || 0} dias
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

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Pix Liberado</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.pixLiberado || 0}
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
          style={{ borderColor: '#000058' }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">Para Cobrança</div>
          <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {statsData.paraCobranca || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOuvidoria;

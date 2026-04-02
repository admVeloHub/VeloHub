/**
 * VeloHub V3 - Dashboard Ouvidoria Component
 * VERSION: v2.7.0 | DATE: 2026-04-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.7.0:
 * - PRODUTOS_OPCOES: união de todos os value de produto dos forms BACEN/N2/RA/Procon/Judicial (FormReclamacao/Edit) para filtro multiselect
 * 
 * Mudanças v2.6.0:
 * - Filtro produto: value/label Empréstimo Pessoal e Crédito Trabalhador (alinhado FormReclamacao v3.38)
 * 
 * Mudanças v2.5.0:
 * - Adicionada categoria Judicial no dashboard
 * - Adicionado card "Ped. Liberação" (solLiberacao) nos grids por tipo
 * - Grids por tipo: N2, Reclame Aqui, Bacen, Procon, Judicial, Total
 * 
 * Mudanças v2.4.1:
 * - Opacidade do wrapping reduzida para 15%
 * 
 * Mudanças v2.4.0:
 * - Produto: "Antecipação" exibe "Antecipação Outros Anos"; novo "Antecipação 2026"
 * 
 * Mudanças v2.3.0:
 * - Removido tipo Judicial do dashboard (apenas N2, Reclame Aqui, Bacen, Procon) - REVERTIDO em v2.5.0
 * 
 * Mudanças v2.2.0:
 * - Adicionado card "% de Retenção" (percentual de ocorrências com pix retido)
 * - Grids aumentados: 7→8 colunas nos tipos, 4→5 no Total
 * 
 * Mudanças v2.1.1:
 * - Labels dos cards em preto (text-black)
 * 
 * Mudanças v2.1.0:
 * - Adicionado filtro Produto com seleção múltipla (dropdown multiselect)
 * - Produtos passados para onRefresh e aplicados no backend
 * - Lista de produtos alinhada ao FormReclamacaoEdit
 * 
 * Mudanças v2.0.3:
 * - Títulos em azul escuro (#000058) e fonte maior (text-lg)
 * 
 * Mudanças v2.0.2:
 * - Opacidade do wrapping reduzida para 30%; títulos em branco
 * 
 * Mudanças v2.0.1:
 * - Wrapping com preenchimento na cor do tipo (50% opacidade) ao invés de contorno
 * 
 * Mudanças v2.0.0:
 * - Refatoração completa: 6 grids com wrapping colorido por tipo
 * - 5 grids (1Lx7C): N2, Reclame Aqui, Bacen, Procon, Judicial
 * - 1 grid Total (2Lx4C): Ocorrências, Em Aberto, Resolvido, Prazo Médio, CA e Protocolos, Pix Liberado, Pix Retido, Taxa de Resolução
 * - Consome data.porTipo da API /stats
 * - Fallback para API antiga (exibe grid vazio ou mensagem)
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

import React, { useState, useRef, useEffect } from 'react';

/**
 * Produtos do módulo reclamações: value idêntico ao salvo no Mongo (FormReclamacao / FormReclamacaoEdit).
 * Label: exibição no filtro; value "Antecipação" usa "Antecipação Outros Anos" (como BACEN/Procon/Judicial).
 */
const PRODUTOS_OPCOES = [
  { value: 'Antecipação 2026', label: 'Antecipação 2026' },
  { value: 'Antecipação', label: 'Antecipação Outros Anos' },
  { value: 'Empréstimo Pessoal', label: 'Empréstimo Pessoal' },
  { value: 'Crédito Trabalhador', label: 'Crédito Trabalhador' },
  { value: 'Conta Celcoin', label: 'Conta Celcoin' },
  { value: 'Seguros', label: 'Seguros' },
  { value: 'Aplicativo', label: 'Aplicativo' },
  { value: 'Clube Velotax', label: 'Clube Velotax' },
  { value: 'Cupom', label: 'Cupom' },
  { value: 'Veloprime', label: 'Veloprime' },
  { value: 'Desativado', label: 'Desativado' },
  { value: 'Cupons Velotax', label: 'Cupons Velotax' },
  { value: 'QueroQuitar', label: 'QueroQuitar' },
  { value: 'Seguro DividaZero', label: 'Seguro DividaZero' },
  { value: 'Seguro Celular', label: 'Seguro Celular' },
  { value: 'Seguro Prestamista', label: 'Seguro Prestamista' },
  { value: 'Seguro Saúde', label: 'Seguro Saúde' },
  { value: 'Calculadora', label: 'Calculadora' },
  { value: 'App', label: 'App' },
  { value: 'Outras Ocorrências', label: 'Outras Ocorrências' },
];

const DashboardOuvidoria = ({ stats, loading, onRefresh }) => {
  // Estados para os inputs (não disparam atualização automática)
  const [dataInicioInput, setDataInicioInput] = useState('');
  const [dataFimInput, setDataFimInput] = useState('');
  
  // Estados para filtros aplicados (são passados para onRefresh)
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Produto: seleção múltipla
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoDropdownAberto, setProdutoDropdownAberto] = useState(false);
  const produtoDropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (produtoDropdownRef.current && !produtoDropdownRef.current.contains(e.target)) {
        setProdutoDropdownAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const toggleProduto = (produto) => {
    setProdutosSelecionados((prev) =>
      prev.includes(produto) ? prev.filter((p) => p !== produto) : [...prev, produto]
    );
  };

  const selecionarTodosProdutos = () => {
    setProdutosSelecionados(PRODUTOS_OPCOES.map((p) => p.value));
  };

  const limparProdutos = () => {
    setProdutosSelecionados([]);
  };

  /**
   * Aplicar filtros (atualiza filtros aplicados e chama onRefresh)
   */
  const aplicarFiltro = () => {
    setDataInicio(dataInicioInput);
    setDataFim(dataFimInput);
    if (onRefresh) {
      onRefresh({
        dataInicio: dataInicioInput,
        dataFim: dataFimInput,
        produtos: produtosSelecionados.length > 0 ? produtosSelecionados : undefined,
      });
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
    setProdutosSelecionados([]);
    if (onRefresh) {
      onRefresh({ dataInicio: '', dataFim: '', produtos: undefined });
    }
  };
  const statsData = stats?.data || stats || {};
  const porTipo = statsData.porTipo || {};

  const CORES = {
    N2: '#1694FF',
    'Reclame Aqui': '#15A237',
    Bacen: '#1634FF',
    Procon: '#FCC200',
    Judicial: '#000058',
    Total: '#006AB9',
  };

  const hexToRgba = (hex, alpha = 0.15) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const CardMetric = ({ label, value, suffix = '' }) => (
    <div
      className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border hover:-translate-y-0.5 transition-transform"
      style={{ borderColor: '#000058' }}
    >
      <div className="text-xs text-black">{label}</div>
      <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
        {value ?? 0}{suffix}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros de Data e Produto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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

        <div className="relative" ref={produtoDropdownRef}>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Produto
          </label>
          <button
            type="button"
            onClick={() => setProdutoDropdownAberto((v) => !v)}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <span className="truncate">
              {produtosSelecionados.length === 0
                ? 'Todos os produtos'
                : produtosSelecionados.length === 1
                  ? (PRODUTOS_OPCOES.find((o) => o.value === produtosSelecionados[0])?.label || produtosSelecionados[0])
                  : `${produtosSelecionados.length} produtos selecionados`}
            </span>
            <svg
              className={`w-4 h-4 shrink-0 transition-transform ${produtoDropdownAberto ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {produtoDropdownAberto && (
            <div
              className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 shadow-lg py-1"
              style={{ minWidth: '200px' }}
            >
              <div className="flex gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={selecionarTodosProdutos}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  onClick={limparProdutos}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Limpar
                </button>
              </div>
              {PRODUTOS_OPCOES.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={produtosSelecionados.includes(p.value)}
                    onChange={() => toggleProduto(p.value)}
                    className="w-4 h-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{p.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex items-end">
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
            {(dataInicioInput || dataFimInput || produtosSelecionados.length > 0) && (
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

      {/* Grids por tipo (6 grids: 5 de 1Lx7C + 1 Total de 2Lx4C) */}
      {Object.keys(porTipo).length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
          Nenhum dado disponível. Use os filtros e clique em Filtrar para carregar.
        </div>
      ) : (
        <div className="space-y-4">
          {['N2', 'Reclame Aqui', 'Bacen', 'Procon', 'Judicial'].map((tipo) => (
            <div
              key={tipo}
              className="p-4 rounded-xl"
              style={{ backgroundColor: hexToRgba(CORES[tipo] || '#000058') }}
            >
              <div className="text-lg font-semibold mb-3" style={{ color: '#000058' }}>
                {tipo}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
                <CardMetric label="Ocorrências" value={porTipo[tipo]?.ocorrencias} />
                <CardMetric label="Em Aberto" value={porTipo[tipo]?.emAberto} />
                <CardMetric label="Resolvido" value={porTipo[tipo]?.resolvido} />
                <CardMetric label="Prazo Médio" value={porTipo[tipo]?.prazoMedio} suffix=" dias" />
                <CardMetric label="CA e Protocolos" value={porTipo[tipo]?.caEProtocolos} />
                <CardMetric label="Ped. Liberação" value={porTipo[tipo]?.solLiberacao} />
                <CardMetric label="Liberados" value={porTipo[tipo]?.pixLiberado} />
                <CardMetric label="Retidos" value={porTipo[tipo]?.pixRetido} />
                <CardMetric label="% Retenção" value={porTipo[tipo]?.percRetencao} suffix="%" />
              </div>
            </div>
          ))}

          {/* Grid Total: 2 linhas x 5 colunas */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: hexToRgba(CORES.Total || '#006AB9') }}
          >
            <div className="text-lg font-semibold mb-3" style={{ color: '#000058' }}>
              Total
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <CardMetric label="Ocorrências" value={porTipo.Total?.ocorrencias} />
              <CardMetric label="Em Aberto" value={porTipo.Total?.emAberto} />
              <CardMetric label="Resolvido" value={porTipo.Total?.resolvido} />
              <CardMetric label="Prazo Médio" value={porTipo.Total?.prazoMedio} suffix=" dias" />
              <CardMetric label="CA e Protocolos" value={porTipo.Total?.caEProtocolos} />
              <CardMetric label="Ped. Liberação" value={porTipo.Total?.solLiberacao} />
              <CardMetric label="Liberados" value={porTipo.Total?.pixLiberado} />
              <CardMetric label="Retidos" value={porTipo.Total?.pixRetido} />
              <CardMetric label="% Retenção" value={porTipo.Total?.percRetencao} suffix="%" />
              <CardMetric label="Taxa de Resolução" value={porTipo.Total?.taxaResolucao} suffix="%" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOuvidoria;

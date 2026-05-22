/**
 * VeloHub V3 - Dashboard Ouvidoria Component
 * VERSION: v2.10.6 | DATE: 2026-05-18 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v2.10.6: Painel executivo — label e valor dos mostradores alinhados à direita (`MetricPillPainelAdministrativo`)
 * - v2.10.5: Mostradores dos cards — linha única (`flex-nowrap`), ocupam largura igual; label/valor à direita; sem 2ª linha de pills (scroll horizontal em telas estreitas)
 * - v2.10.4: Ícone Lucide + tamanho uniforme só em `MetricPillPainelAdministrativo` (topo); nos cards volta `MetricPill` compacta + `flex-wrap`
 * - v2.10.3: Lucide v0.263 — ícone «reclamações» via `AlertTriangle` (`MessageSquareWarning` não exportado nesta versão)
 * - v2.10.2: `MetricPill` com label + ícone (Lucide); caixa uniforme (`min-h`/largura cheia nas grades); painel 5×2 com células esticadas
 * - v2.10.1: Painel exec. (`porTipo.Total` 5×2) sem IIFE; `RingPercDashboard` mantido nos cards expandidos
 * - v2.10.0: Painel exec. — apenas `MetricPill` `porTipo.Total` em grade 5×2; pills compactas (`w-fit`); canal em grade 2 col.; card Total removido; mostradores em `flex-wrap`
 * - v2.9.3: Removidas curvas tipo sparkline sob as pills de métricas (sem referência visual a gráficos)
 * - v2.9.2: KPIs e cards de canal sem subtítulo secundário; anel de retenção só com `aria-label`
 * - v2.9.1: Removido parágrafo explicativo sob o título «Desempenho por canal»
 * - v2.7.4: PRODUTOS_OPCOES centralizado em `utils/ouvidoriaProdutoOpcoes` (OUVIDORIA_PRODUTO_OPCOES)
 * - v2.7.0: PRODUTOS_OPCOES: união de todos os value de produto dos forms BACEN/N2/RA/Procon/Judicial (FormReclamacao/Edit) para filtro multiselect
 * - v2.6.0: Filtro produto: value/label Empréstimo Pessoal e Crédito Trabalhador (alinhado FormReclamacao v3.38)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Globe2,
  Inbox,
  KeyRound,
  Lock,
  Percent,
  Send,
  TrendingUp,
} from 'lucide-react';
import { OUVIDORIA_PRODUTO_OPCOES } from '../../utils/ouvidoriaProdutoOpcoes';

/** Alias local — mesma lista que Dashboard e FormChargeback */
const PRODUTOS_OPCOES = OUVIDORIA_PRODUTO_OPCOES;

/** Ordens dos canais na lista principal */
const CANAIS_DASHBOARD = ['N2', 'Reclame Aqui', 'Bacen', 'Procon', 'Judicial'];

/** PNG em `public/icones dash/` — nome do arquivo por canal */
const CANAL_ICONE_ARQUIVO = {
  N2: 'icon n2.png',
  'Reclame Aqui': 'icon RA.png',
  Bacen: 'icon bacen.png',
  Procon: 'icon procon.png',
  Judicial: 'icon judicial.png',
};

/** Ícone Lucide por rótulo — apenas no painel administrativo (total no topo). */
function metricIconForLabel(label) {
  const raw = String(label || '').trim();
  const low = raw.toLowerCase();
  if (low.includes('consumidor')) return Globe2;
  if (low === 'procon' || (low.includes('procon') && !low.includes('consumidor'))) return Building2;
  if (/\btaxa\b/.test(low) && /resolu/.test(low)) return TrendingUp;
  if ((/%/.test(low) || /perc/i.test(low)) && /reten/.test(low)) return Percent;
  if (/^liberados$/i.test(raw)) return Send;
  if (/ped/i.test(low) && /liber/.test(low)) return KeyRound;
  if (/prazo/.test(low) && /m[eé]dio/.test(low)) return Clock;
  if (/ca\s+e\s+prot/i.test(low)) return FileText;
  if (/em\s+aberto/.test(low)) return Inbox;
  if (/liberad/.test(low)) return Send;
  if (/retid/.test(low)) return Lock;
  if (/resolv/.test(low)) return CheckCircle2;
  if (/reclama/.test(low)) return AlertTriangle;
  return BarChart3;
}

/** URL pública codificada (espaços na pasta «icones dash») */
function urlIconeDashboard(arquivo) {
  const root = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const rel = `/icones dash/${arquivo}`;
  return encodeURI(`${root}${rel}`);
}

/** Indicador circular de % (métricas expandidas; sem rótulo visível — só aria) */
function RingPercDashboard({ percent }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const size = 56;
  const stroke = 5;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2 - 3;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  const pctStr = `${p.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  return (
    <div
      className="flex flex-col items-center px-2 py-1"
      role="img"
      aria-label={`Retenção: ${pctStr}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-600"
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="stroke-[#006AB9] dark:stroke-[#93c5fd]"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold tabular-nums text-[#000058] dark:text-gray-100">
          {pctStr}
        </span>
      </div>
    </div>
  );
}

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
  /** @type {Record<string, boolean>} */
  const [cardsExpandidos, setCardsExpandidos] = useState({});

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

  /** Exibição numérica nas pills (inteiro | decimal | já com sufixo %) */
  const fmtValorMetrica = (val, modo = 'int') => {
    if (val === '' || val == null || Number.isNaN(Number(val))) return '—';
    const n = Number(val);
    if (modo === 'decimal') {
      return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return Math.round(n).toLocaleString('pt-BR');
  };

  /** Mostradores dos cards — uma linha, largura igual, conteúdo à direita, sem segunda linha de pills (scroll horizontal só em telas estreitas). */
  const MetricPill = ({ label, value, suffix = '', valorModo = 'int' }) => (
    <div className="flex min-h-[3.625rem] min-w-0 flex-1 basis-0 flex-col justify-center rounded-xl border border-gray-100 bg-gradient-to-b from-white to-[#f4f7fb] px-3 py-2.5 shadow-sm dark:border-gray-600 dark:from-gray-800 dark:to-gray-900/80 md:min-h-[3.875rem] md:px-4 md:py-3">
      <span className="truncate whitespace-nowrap text-right text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 dark:text-gray-400 sm:text-[11px]">
        {label}
      </span>
      <span className="truncate whitespace-nowrap text-right text-lg font-bold tabular-nums leading-tight text-[#000058] dark:text-[#93c5fd] sm:text-xl md:text-[1.35rem]">
        {fmtValorMetrica(value, valorModo)}
        {suffix}
      </span>
    </div>
  );

  /** Painel administrativo (topo — agregado Total): label + ícone + mesmo tamanho na grade 5×2. */
  const MetricPillPainelAdministrativo = ({ label, value, suffix = '', valorModo = 'int' }) => {
    const IconGlyph = metricIconForLabel(label);
    return (
      <div className="flex h-full min-h-[4.75rem] w-full min-w-0 flex-row items-stretch gap-2.5 rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2 shadow-sm hover:-translate-y-0.5 dark:border-gray-600 dark:bg-gray-800/90 dark:shadow-none md:gap-3 md:px-3.5 md:py-2.5">
        <div
          className="flex h-auto min-h-[2.5rem] w-11 shrink-0 flex-col justify-center rounded-lg border border-[#000058]/35 bg-[#000058]/6 px-2 dark:border-[#93c5fd]/35 dark:bg-[#93c5fd]/12"
          aria-hidden
        >
          <IconGlyph className="mx-auto h-5 w-5 text-[#000058] dark:text-[#93c5fd]" strokeWidth={2} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-right">
          <span className="truncate whitespace-nowrap text-right text-[11px] font-semibold uppercase leading-snug tracking-wide text-gray-600 dark:text-gray-400">
            {label}
          </span>
          <span className="truncate whitespace-nowrap text-right text-xl font-semibold tabular-nums leading-tight text-[#000058] dark:text-gray-100 sm:text-2xl">
            {fmtValorMetrica(value, valorModo)}
            {suffix}
          </span>
        </div>
      </div>
    );
  };

  const toggleCardExpand = (chave) => {
    setCardsExpandidos((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  /**
   * Cartão por canal (métricas resumidas / expandidas).
   * @param {{ chave: string, titulo: string, dados?: object, iconeArquivo?: string, proconDual?: boolean }} p
   */
  function CanalCard({ chave, titulo, dados, iconeArquivo, proconDual }) {
    const expandido = Boolean(cardsExpandidos[chave]);
    const iconeSrc = iconeArquivo ? urlIconeDashboard(iconeArquivo) : null;
    const accent = CORES[chave] || CORES.Total || '#006AB9';

    const proconDualDisponivel =
      Boolean(proconDual) &&
      dados &&
      ('ocorrenciasProcon' in dados || 'ocorrenciasConsumidorGov' in dados);

    const collapsedCommonTail = (
      <>
        <MetricPill label="Resolvidas" value={dados?.resolvido} />
        <MetricPill label="Liberados" value={dados?.pixLiberado} />
        <MetricPill label="Retidos" value={dados?.pixRetido} />
      </>
    );

    return (
      <div
        className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900/95"
        style={{ boxShadow: '0 4px 28px rgba(0, 0, 0, 0.07)' }}
      >
        <div
          className="flex flex-col gap-4 p-4 md:flex-row md:items-stretch md:gap-5 md:p-5"
          style={{ borderLeftWidth: 5, borderLeftStyle: 'solid', borderLeftColor: accent }}
        >
          {/* Identidade do canal */}
          <div className="flex shrink-0 flex-row items-center gap-3 md:flex-col md:items-start md:justify-center lg:flex-row lg:items-center">
            <div
              className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: hexToRgba(accent, 0.35) }}
            >
              {iconeSrc ? (
                <img src={iconeSrc} alt="" className="h-11 w-11 object-contain" aria-hidden />
              ) : (
                <svg viewBox="0 0 24 24" className="h-9 w-9 text-[#000058] dark:text-[#93c5fd]" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0 md:text-center lg:text-left">
              <h3 className="text-lg font-bold leading-tight text-[#000058] dark:text-gray-100">{titulo}</h3>
            </div>
          </div>

          {/* Métricas principais + expansão */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-start">
            <div
              id={`dash-canal-metrics-${chave}`}
              className="flex min-w-0 flex-1 flex-nowrap items-stretch gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:thin]"
            >
              {proconDualDisponivel ? (
                <>
                  <MetricPill label="Procon" value={dados.ocorrenciasProcon ?? 0} />
                  <MetricPill
                    label="Consumidor.gov.br"
                    value={dados.ocorrenciasConsumidorGov ?? 0}
                  />
                  {collapsedCommonTail}
                </>
              ) : (
                <>
                  <MetricPill label="Reclamações" value={dados?.ocorrencias} />
                  {collapsedCommonTail}
                </>
              )}
            </div>

            <div className="flex shrink-0 items-start justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700 md:border-l md:border-t-0 md:pl-3 md:pt-0">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[#000058] shadow-sm transition hover:bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                aria-expanded={expandido}
                aria-controls={`dash-canal-expand-panel-${chave}`}
                id={`dash-canal-expand-${chave}`}
                onClick={() => toggleCardExpand(chave)}
                title={expandido ? 'Recolher indicadores' : 'Expandir indicadores'}
              >
                <svg
                  className={`h-5 w-5 transition-transform ${expandido ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {expandido ? (
          <div
            id={`dash-canal-expand-panel-${chave}`}
            className="border-t border-gray-200/80 bg-gradient-to-r from-[#f6f9fc] to-white px-4 py-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-900/90 md:px-5"
          >
            <div className="flex flex-col gap-4 min-w-0 lg:flex-row lg:items-start">
              <div className="flex min-w-0 w-full flex-1 flex-nowrap items-stretch gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:thin] lg:min-w-0 lg:overflow-x-visible">
                <MetricPill label="Em Aberto" value={dados?.emAberto} />
                <MetricPill
                  label="Prazo médio"
                  value={dados?.prazoMedio}
                  suffix=" dias"
                  valorModo="decimal"
                />
                <MetricPill label="CA e protocolos" value={dados?.caEProtocolos} />
                <MetricPill label="Ped. liberação" value={dados?.solLiberacao} />
                <MetricPill
                  label="% retenção"
                  value={dados?.percRetencao}
                  suffix="%"
                  valorModo="decimal"
                />
              </div>
              <div className="flex justify-center lg:justify-end">
                <RingPercDashboard percent={dados?.percRetencao} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

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

      {/* Cards por canal + Total — recolhido: métricas-chave; expandido: demais indicadores */}
      {Object.keys(porTipo).length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
          Nenhum dado disponível. Use os filtros e clique em Filtrar para carregar.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-x-2 gap-y-2 sm:gap-3 md:grid-cols-5 md:grid-rows-2 [&>*]:min-h-0 [&>*]:min-w-0 [&>*]:w-full">
            <MetricPillPainelAdministrativo label="Reclamações" value={porTipo.Total?.ocorrencias} />
            <MetricPillPainelAdministrativo label="Resolvidas" value={porTipo.Total?.resolvido} />
            <MetricPillPainelAdministrativo label="Liberados" value={porTipo.Total?.pixLiberado} />
            <MetricPillPainelAdministrativo label="Retidos" value={porTipo.Total?.pixRetido} />
            <MetricPillPainelAdministrativo label="Em aberto" value={porTipo.Total?.emAberto} />
            <MetricPillPainelAdministrativo
              label="Prazo médio"
              value={porTipo.Total?.prazoMedio}
              suffix=" dias"
              valorModo="decimal"
            />
            <MetricPillPainelAdministrativo label="CA e protocolos" value={porTipo.Total?.caEProtocolos} />
            <MetricPillPainelAdministrativo label="Ped. liberação" value={porTipo.Total?.solLiberacao} />
            <MetricPillPainelAdministrativo
              label="% retenção"
              value={porTipo.Total?.percRetencao}
              suffix="%"
              valorModo="decimal"
            />
            <MetricPillPainelAdministrativo
              label="Taxa resolução"
              value={porTipo.Total?.taxaResolucao}
              suffix="%"
              valorModo="decimal"
            />
          </div>

          <div>
            <h2 className="velohub-title mb-4 text-lg font-semibold text-[#006AB9] dark:text-[#93c5fd]">
              Desempenho por canal
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {CANAIS_DASHBOARD.map((tipo) => (
                <CanalCard
                  key={tipo}
                  chave={tipo}
                  titulo={tipo}
                  dados={porTipo[tipo]}
                  iconeArquivo={CANAL_ICONE_ARQUIVO[tipo]}
                  proconDual={tipo === 'Procon'}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOuvidoria;

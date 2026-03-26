/**
 * VeloHub V3 - EscalacoesPage (Escalações Module)
 * VERSION: v1.15.5 | DATE: 2026-03-26 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.15.5:
 * - Após cancelar (ou salvar N1) no modal: mescla documento retornado em requestsRaw/searchResults para o card refletir status imediatamente (getStatusChamado corrigido em helpers)
 * 
 * Mudanças v1.15.4:
 * - Notificação do navegador para msg Produtos não lida quando a aba Solicitações está ativa mas o navegador está em segundo plano (dedup com Header)
 * 
 * Mudanças v1.15.3:
 * - Destaque msg Produtos não lida: gradiente só no card correspondente (busca + log), não no container da sidebar
 * 
 * Mudanças v1.15.2:
 * - Cards (busca CPF + log na sidebar): solicitação cancelada → CPF e tipo (motivo no card) com line-through
 * 
 * Mudanças v1.15.1:
 * - Log da sidebar: lista do servidor (filtrada) + extras do cache local só para ids ainda não na lista — não substituir o histórico do Mongo por N linhas do localStorage
 * 
 * Mudanças v1.15.0:
 * - loadStats só na aba Solicitações + intervalo só nessa aba; GET com filtro colaborador quando houver agente na sessão (menos payload)
 * - Chat lateral (VeloChat) só montado na aba Solicitações — outras abas não disparam loadContacts
 * - Log da sidebar: fallback a partir de requestsRaw quando cache local vazio (contador e cards alinhados)
 * - FormSolicitacao recebe lista do servidor + refresh do pai — evita GET /solicitacoes duplicado no mount/intervalo do form
 * 
 * Mudanças v1.14.9:
 * - abrirModalDesdeLogLocal: resolve documento por normalizeMongoId + findSolicitacaoForLocalLogItem antes do GET (evita 404 com vários envios mesmo CPF/tipo)
 * 
 * Mudanças v1.14.8:
 * - Helpers do modal / reply / msgProdutos lidos extraídos para `utils/escalacoesModalHelpers.js` (reuso Erros/Bugs)
 * 
 * Mudanças v1.14.7:
 * - Modal de respostas: altura maior (min-h ~72vh, max-h 96vh)
 * 
 * Mudanças v1.14.6:
 * - Modal: payload 100% dinâmico — só chaves com valor relevante (sem mapa fixo de campos); booleanos só se true; Agente só se preenchido
 * 
 * Mudanças v1.14.5:
 * - Modal: bloco de dados em grid 3 colunas — 1ª linha CPF, Tipo, Data; demais campos do payload nas linhas seguintes
 * 
 * Mudanças v1.14.4:
 * - Modal: removido subtítulo abaixo de “Respostas do time”
 * 
 * Mudanças v1.14.3:
 * - Modal: status do chamado na mesma linha do título no cabeçalho (flex-wrap em telas estreitas)
 * 
 * Mudanças v1.14.2:
 * - Modal: textarea N1 com metade da altura (rows/min-height); rótulos sem sufixo “(Atendimento)”
 * 
 * Mudanças v1.14.1:
 * - Modal: status do chamado no cabeçalho; seção “Respostas do time” como diálogo Produtos × N1 (msgProdutos / msgN1), sem repetir status por item
 * 
 * Mudanças v1.14.0:
 * - Sidebar “Busca e acompanhamento”: borda em gradiente azul/amarelo quando há msgProdutos não lida (marca leitura em localStorage ao abrir o modal)
 * - Documentação em código: reply do time Produtos = msgProdutos preenchido, msgN1 null, at (API já gravava assim)
 * 
 * Mudanças v1.13.0:
 * - Modal de acompanhamento: textarea N1 + Salvar (reply enviado/msgN1) e Cancelar Solicitação (reply Cancelado)
 * - getStatusChamado reconhece último reply com status Cancelado
 * 
 * Mudanças v1.12.11:
 * - Sidebar: limite inferior alinhado ao card principal — altura da sidebar = altura do card (ResizeObserver), items-start, sem esticar o card
 * 
 * Mudanças v1.12.10:
 * - (Revertido em v1.12.11) stretch flex que alterava o comportamento desejado
 * 
 * Mudanças v1.12.9:
 * - Removido título “Formulário de Solicitação” acima do FormSolicitacao
 * 
 * Mudanças v1.12.8:
 * - Seletor de abas (Solicitações / Erros-Bugs / Calculadora) centralizado horizontalmente
 * 
 * Mudanças v1.12.7:
 * - Removido rótulo “CPF” acima do campo de busca na sidebar (placeholder + aria-label mantidos)
 * 
 * Mudanças v1.12.6:
 * - Linha formulário + sidebar com items-start (evita esticar a coluna principal à altura da sidebar — fim da “sobra” após Enviar)
 * - Padding inferior do card principal e margem do bloco do formulário reduzidos
 * 
 * Mudanças v1.12.5:
 * - Sidebar: uma única área de rolagem com resultados da busca e logs em sequência; CPF + Buscar + Atualizar na mesma linha
 * 
 * Mudanças v1.12.4:
 * - Removidos rótulos "Busca por CPF" e "Envios recentes" na sidebar (mantidos campo, listas e Atualizar agora)
 * 
 * Mudanças v1.12.3:
 * - Removida linha divisória (border) entre resultados da busca e envios recentes na sidebar
 * 
 * Mudanças v1.12.2:
 * - Sidebar com um só cabeçalho de destaque; CPF e envios como subseções (sem segundo “quadro” visual)
 * 
 * Mudanças v1.12.1:
 * - Sidebar única: Consulta de CPF e Log de envio no mesmo painel (seções com divisor)
 * 
 * Mudanças v1.12.0:
 * - Removido quadro "Histórico do agente" (redundante com busca CPF e logs locais)
 * - Logs de envio exibidos na sidebar; clique no card abre modal de respostas (GET por ID ou match em cache)
 * 
 * Mudanças v1.11.0:
 * - Adicionados logs de debug no modal para rastrear replies recebidas
 * - Normalização do campo replies no modal para garantir exibição correta
 * - Verificação melhorada de replies antes de exibir no modal
 * 
 * Mudanças v1.10.0:
 * - TODOS os cards são SEMPRE clicáveis e SEMPRE abrem modal quando clicados
 * - Modal mostra todas as informações: básicas, anexos (se houver) e respostas (se houver)
 * - Removida lógica condicional - cards sempre têm cursor-pointer e hover
 * - Modal unificado mostra tudo em um único lugar
 * 
 * Mudanças v1.8.0:
 * - Corrigido modal de respostas não abrindo quando há respostas e anexos
 * - Ajustado stopPropagation para não bloquear clique do card quando há respostas
 * - Adicionado z-index explícito (9999) no modal para garantir visibilidade
 * - Adicionados logs de debug para rastrear cliques e abertura do modal
 * - Priorização de respostas sobre anexos quando ambos existem
 * 
 * Mudanças v1.7.0:
 * - Cards agora são clicáveis para abrir modal de respostas diretamente quando há respostas
 * - Removido botão "Ver em modal" - card inteiro abre o modal
 * - Aplicado tanto em resultados de busca quanto no histórico do agente
 * 
 * Mudanças v1.6.0:
 * - Adicionado modal para visualização de respostas (replies)
 * - Botão "Ver em modal" em cada card expandido com respostas
 * - Modal exibe todas as respostas com melhor formatação e espaço
 * - Possibilidade de confirmar visualização diretamente do modal
 * 
 * Mudanças v1.5.0:
 * - Implementada visualização de respostas (replies) do WhatsApp nos resultados de busca
 * - Implementada visualização de respostas no histórico do agente
 * - Adicionado botão para confirmar visualização de respostas (envia reação ✓ no WhatsApp)
 * - Adicionados estados expandedSearchKeys e expandedAgentCards para controlar expansão de cards
 * - Adicionada função confirmarResposta que chama API para confirmar visualização
 * 
 * Mudanças v1.4.2:
 * - Corrigido container de consulta de CPF para conter resultados e permitir scroll quando necessário
 * - Adicionado overflow-hidden no container pai e estrutura flex para garantir contenção
 * - Removido limite de 8 resultados, agora mostra todos com scroll
 * 
 * Mudanças v1.4.1:
 * - Removido bypass de Lucas Gravina - todos os usuários têm acesso ao chat
 * 
 * Mudanças v1.4.0:
 * - Adicionado sidebar direito com widget de chat (recolhido por padrão)
 * - Integrado VeloChatWidget com todas as funcionalidades (Conversas, Contatos, Salas)
 * - Implementado sistema de retração/expansão do sidebar direito
 * Branch: escalacoes
 * 
 * Esta página contém o módulo de Escalações completo (Painel de Serviços migrado).
 * Imports do código compartilhado devem vir da main.
 * 
 * Mudanças v1.3.2:
 * - Histórico do agente com altura fixa (70% da largura) e scrollável
 * 
 * Mudanças v1.3.1:
 * - Integrado ping de sessão no refresh automático (loadStats) para evitar sessões órfãs
 * 
 * Mudanças v1.3.0:
 * - Implementada Calculadora de Restituição completa com cálculo de lotes
 * - Adicionado componente CalculadoraRestituicao com persistência em localStorage
 * 
 * Mudanças v1.2.0:
 * - Reorganizado layout com duas sidebars no lado direito
 * - Sidebar superior: Consulta de CPF com campo Tipo de Solicitação (altura 400px)
 * - Sidebar inferior: Histórico do agente (largura 400px)
 * - Removida seção Consulta de CPF do container principal
 * - Adicionado filtro por tipo na busca de CPF
 * 
 * Mudanças v1.1.0:
 * - Adicionado sistema de abas (Solicitações e Erros/Bugs)
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FormSolicitacao from '../components/Escalacoes/FormSolicitacao';
import ErrosBugsTab from '../components/Escalacoes/ErrosBugsTab';
import VeloChatWidget from '../components/VeloChatWidget';
import ChatStatusSelector from '../components/ChatStatusSelector';
import { solicitacoesAPI } from '../services/escalacoesApi';
import { API_BASE_URL } from '../config/api-config';
import toast from 'react-hot-toast';
import {
  STORAGE_PROD_READ_SOLICITACOES,
  getStatusChamado,
  lastProdutosReplyAtMs,
  setProdutosReadMs,
  hasUnreadProdutosInReplies,
  buildProdutosN1Dialogue,
  statusChamadoBadgeClass,
  buildModalExtraPayloadCells,
  ModalInfoGridCell,
  normalizeMongoId,
  findSolicitacaoForLocalLogItem,
  listUnreadProdutosDocs,
  produtosUnreadNotifySig,
  hasProdutosNotificationBeenSent,
  markProdutosNotificationSent,
} from '../utils/escalacoesModalHelpers';

/**
 * Componente Calculadora de Restituição
 * Calcula os valores dos lotes de restituição com acréscimos
 */
const CalculadoraRestituicao = () => {
  const [valorStr, setValorStr] = useState('');

  /**
   * Converter string para centavos (remove tudo exceto dígitos)
   * @param {string} s - String com valor
   * @returns {number} Valor em centavos
   */
  const parseCents = (s) => {
    const digits = String(s || '').replace(/[^0-9]/g, '');
    return Number(digits || 0);
  };

  /**
   * Formatar centavos para BRL
   * @param {number} c - Valor em centavos
   * @returns {string} Valor formatado em BRL
   */
  const formatBRLFromCents = (c) => (c/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const baseCents = useMemo(() => parseCents(valorStr), [valorStr]);
  const lotesCents = useMemo(() => {
    const base = Number.isFinite(baseCents) ? baseCents : 0;
    const l1 = base; // base
    const l2 = Math.round(base * 101 / 100); // +1%
    const l3 = Math.round(base * 10179 / 10000); // +1,79%
    return [l1, l2, l3];
  }, [baseCents]);

  /**
   * Formatar valor no blur do input
   */
  const onBlur = () => {
    try { 
      setValorStr(formatBRLFromCents(baseCents)); 
    } catch (err) {
      console.error('Erro ao formatar valor:', err);
    }
  };

  // Carregar valor do cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_restituicao_valor');
      if (cached) setValorStr(cached);
    } catch (err) {
      console.error('Erro ao carregar cache:', err);
    }
  }, []);

  // Salvar valor no cache
  useEffect(() => {
    try { 
      localStorage.setItem('velotax_restituicao_valor', valorStr); 
    } catch (err) {
      console.error('Erro ao salvar cache:', err);
    }
  }, [valorStr]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:-translate-y-0.5 transition-transform">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Calculadora de Restituição
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Informe o valor base e veja os lotes com acréscimos.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Valor base</label>
          <input
            className="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            onBlur={onBlur}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">1º Lote (base)</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {formatBRLFromCents(lotesCents[0] || 0)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">2º Lote (+1%)</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {formatBRLFromCents(lotesCents[1] || 0)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">3º Lote (+1,79%)</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {formatBRLFromCents(lotesCents[2] || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Página principal do módulo de Escalações
 */
const EscalacoesPage = () => {
  const [activeTab, setActiveTab] = useState('solicitacoes');
  const [logs, setLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchCpfError, setSearchCpfError] = useState('');
  const [stats, setStats] = useState({ today: 0, pending: 0, done: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [requestsRaw, setRequestsRaw] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [sidebarLocalLogs, setSidebarLocalLogs] = useState([]);
  const formSolicitacaoRef = useRef(null);
  /** Altura do card principal (aba Solicitações) para igualar base da sidebar sem flex stretch */
  const solicitacoesMainCardRef = useRef(null);
  const [solicitacoesSidebarHeightPx, setSolicitacoesSidebarHeightPx] = useState(null);
  const prevRequestsRef = useRef([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [replies, setReplies] = useState([]);
  const [myAgent, setMyAgent] = useState('');
  // Estados para controlar expansão de cards com replies
  // Estado para modal de respostas
  const [selectedRepliesRequest, setSelectedRepliesRequest] = useState(null);
  // Estado para formulário de adicionar reply
  const [addReplyOrigem, setAddReplyOrigem] = useState('produtos');
  const [addReplyStatus, setAddReplyStatus] = useState('enviado');
  const [addReplyText, setAddReplyText] = useState('');
  const [addReplyLoading, setAddReplyLoading] = useState(false);
  const [modalN1Draft, setModalN1Draft] = useState('');
  const [modalSalvarN1Loading, setModalSalvarN1Loading] = useState(false);
  const [modalCancelarSolicLoading, setModalCancelarSolicLoading] = useState(false);
  /** Força recálculo do destaque da sidebar após marcar leitura de msgProdutos (localStorage) */
  const [prodReadEpoch, setProdReadEpoch] = useState(0);
  
  // Igualar altura da sidebar à do card do formulário (bases alinhadas; conteúdo extra rola dentro da sidebar)
  useLayoutEffect(() => {
    if (activeTab !== 'solicitacoes') {
      setSolicitacoesSidebarHeightPx(null);
      return;
    }
    const el = solicitacoesMainCardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const sync = () => {
      const h = el.offsetHeight;
      if (h > 0) setSolicitacoesSidebarHeightPx(h);
    };
    sync();
    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [activeTab]);

  useEffect(() => {
    setModalN1Draft('');
  }, [selectedRepliesRequest?._id, selectedRepliesRequest?.id]);

  useEffect(() => {
    const doc = selectedRepliesRequest;
    if (!doc) return;
    const id = doc._id ?? doc.id;
    if (id == null || id === '') return;
    const t = lastProdutosReplyAtMs(doc.reply);
    if (t > 0) {
      setProdutosReadMs(String(id), t, STORAGE_PROD_READ_SOLICITACOES);
      setProdReadEpoch((e) => e + 1);
    }
  }, [selectedRepliesRequest]);
  
  // Estados do sidebar direito com chat
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true); // Recolhido por padrão
  const [chatActiveTab, setChatActiveTab] = useState('conversations');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('velochat_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    try {
      localStorage.setItem('velochat_sound_enabled', newState.toString());
    } catch (error) {
      console.error('Erro ao salvar preferência de som:', error);
    }
  };

  // Função para confirmar visualização de resposta
  const confirmarResposta = async (requestId, replyMessageId, confirmedBy = null) => {
    try {
      const result = await solicitacoesAPI.confirmarResposta(requestId, replyMessageId, confirmedBy);
      if (result && result.ok) {
        toast.success('Confirmado! Reação ✓ enviada no WhatsApp.');
        // Recarregar dados após confirmação
        await loadStats();
        // Recarregar busca se houver CPF pesquisado
        if (searchCpf) {
          buscarCpf();
        }
      } else {
        throw new Error(result?.error || 'Erro ao confirmar resposta');
      }
      return result;
    } catch (error) {
      console.error('[EscalacoesPage confirmarResposta] Erro:', error);
      toast.error(error.message || 'Erro ao confirmar resposta');
      throw error;
    }
  };
  
  // Função para calcular grid columns
  const getGridColumns = (rightCollapsed, chatColumnActive) => {
    if (chatColumnActive === false) {
      return '1fr';
    }
    if (rightCollapsed) {
      return '1fr 10px';
    }
    return 'minmax(0, 1fr) minmax(0, 35%)';
  };
  
  // Função helper para renderizar sidebar direito com chat
  const renderRightSidebarChat = () => {
    if (isRightSidebarCollapsed) {
      return (
        <div 
          style={{
            position: 'relative',
            width: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12px'
          }}
          onClick={() => setIsRightSidebarCollapsed(false)}
        >
          <ChevronLeft 
            size={22} 
            style={{
              color: 'var(--blue-dark)',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue-opaque)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--blue-dark)'}
          />
        </div>
      );
    }

    return (
      <aside 
        className="rounded-lg shadow-sm flex flex-col velohub-container" 
        style={{
          borderRadius: '9.6px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
          padding: '19.0px', 
          position: 'relative', 
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '700px',
          maxHeight: '700px',
          overflow: 'hidden',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}
      >
        {/* Botão de retração */}
        <button
          onClick={() => setIsRightSidebarCollapsed(true)}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector('svg').style.color = 'var(--blue-opaque)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector('svg').style.color = 'rgba(128, 128, 128, 0.5)';
          }}
        >
          <ChevronRight 
            size={18} 
            style={{
              color: 'rgba(128, 128, 128, 0.5)',
              transition: 'color 0.3s ease'
            }}
          />
        </button>
        
        {/* Widget VeloChat */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="flex items-center mb-4" style={{ gap: '8px', position: 'relative', flexShrink: 0 }}>
            {isSearchExpanded ? (
              <>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className="flex-1 px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--blue-opaque)',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Poppins, sans-serif',
                    marginLeft: '40px'
                  }}
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                  className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  style={{ color: 'var(--blue-dark)', minWidth: '32px', height: '32px' }}
                  title="Fechar busca"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                  <ChatStatusSelector 
                    sessionId={localStorage.getItem('velohub_session_id')} 
                    onStatusChange={() => {}}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <h3 className="font-bold text-xl velohub-title" style={{ 
                    color: 'var(--blue-dark)', 
                    margin: 0,
                    textAlign: 'center',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}>
                    Chat
                  </h3>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    onClick={toggleSound}
                    className="flex items-center justify-center p-1 rounded transition-colors"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                  >
                    {soundEnabled ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(128, 128, 128, 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)' }}
                    title="Buscar contato"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Seletor de Abas */}
          <div className="flex border-b mb-2" style={{ borderColor: 'var(--blue-opaque)', flexShrink: 0 }}>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('conversations')}
              style={chatActiveTab === 'conversations' ? {
                color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Conversas
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('contacts')}
              style={chatActiveTab === 'contacts' ? {
                color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Contatos
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('salas')}
              style={chatActiveTab === 'salas' ? {
                color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Salas
            </button>
          </div>
              
          {/* Container scrollável */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {(() => {
              const isProduction = typeof window !== 'undefined' && 
                !window.location.hostname.includes('localhost') && 
                !window.location.hostname.includes('127.0.0.1');
              
              let userName = '';
              try {
                const sessionData = localStorage.getItem('velohub_user_session');
                if (sessionData) {
                  const session = JSON.parse(sessionData);
                  userName = session?.user?.name || '';
                }
              } catch (err) {
                console.error('Erro ao obter nome do usuário:', err);
              }
              
              // Removido bypass - todos os usuários têm acesso ao chat
              
              return (
                <VeloChatWidget activeTab={chatActiveTab} searchQuery={searchQuery} />
              );
            })()}
          </div>
        </div>
      </aside>
    );
  };

  /**
   * Normalizar string para comparação
   * @param {string} s - String a normalizar
   * @returns {string} String normalizada
   */
  const norm = (s = '') => String(s).toLowerCase().trim().replace(/\s+/g, ' ');

  /**
   * Cards do log na sidebar: base = tudo que já veio do servidor (mesmo filtro do contador), ordenado por data;
   * acrescenta só itens do cache local cujo requestId ainda não está nessa lista (ex.: envio recém-criado antes do próximo loadStats).
   * Nunca substituir o histórico completo do GET por só o que couber no localStorage.
   */
  const solicitacoesSidebarDisplayLogs = useMemo(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const base = selectedAgent
      ? arr.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : arr;
    const sortedServer = [...base].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    const fromServer = sortedServer.slice(0, 100).map((r) => ({
      requestId: normalizeMongoId(r._id ?? r.id) || undefined,
      cpf: String(r.cpf || '').replace(/\D/g, ''),
      tipo: r.tipo,
      status: getStatusChamado(r),
      createdAt: r.createdAt,
      reply: Array.isArray(r.reply) ? r.reply : undefined,
      enviado: true,
    }));
    const seen = new Set(
      fromServer
        .map((x) => normalizeMongoId(x.requestId))
        .filter((id) => /^[a-f0-9]{24}$/.test(id))
    );
    const extras = [];
    for (const l of Array.isArray(sidebarLocalLogs) ? sidebarLocalLogs : []) {
      const rid = normalizeMongoId(l?.requestId);
      if (rid && /^[a-f0-9]{24}$/.test(rid)) {
        if (seen.has(rid)) continue;
        seen.add(rid);
      }
      extras.push(l);
    }
    const merged = [...fromServer, ...extras];
    merged.sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    return merged.slice(0, 100);
  }, [sidebarLocalLogs, requestsRaw, selectedAgent]);

  /**
   * Registrar log local
   * @param {string} msg - Mensagem do log
   */
  const registrarLog = (msg) => {
    setLogs((prev) => [{ msg, time: new Date().toLocaleString('pt-BR') }, ...prev]);
  };

  /**
   * Carregar estatísticas e solicitações (aba Solicitações; filtro por colaborador quando possível)
   */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const agentName = String(selectedAgent || myAgent || '').trim();
      const result = agentName
        ? await solicitacoesAPI.getByColaborador(agentName)
        : await solicitacoesAPI.getAll();
      const list = Array.isArray(result.data) ? result.data : [];
      setRequestsRaw(list);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
    setStatsLoading(false);
  }, [selectedAgent, myAgent]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão de notificação:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'solicitacoes') return undefined;
    loadStats();
    const refreshInterval = setInterval(loadStats, 3 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [activeTab, loadStats]);

  // Carregar nome do agente da sessão do usuário
  useEffect(() => {
    try {
      // Tentar obter da sessão do VeloHub primeiro
      const sessionData = localStorage.getItem('velohub_user_session');
      let agentName = '';
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session?.user?.name) {
            agentName = session.user.name;
          }
        } catch (err) {
          console.error('Erro ao decodificar sessão:', err);
        }
      }
      
      // Fallback para localStorage antigo se não houver sessão
      if (!agentName) {
        agentName = localStorage.getItem('velotax_agent') || '';
      }
      
      if (agentName) {
        setSelectedAgent(agentName);
        setMyAgent(agentName);
        // Salvar também no localStorage para compatibilidade
        try {
          localStorage.setItem('velotax_agent', agentName);
        } catch (err) {
          console.error('Erro ao salvar agente:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
    }
  }, []);

  // Configurar URL do backend (será configurado via variáveis de ambiente)
  useEffect(() => {
    try {
      // A URL será obtida do backend via API_BASE_URL
      setBackendUrl(API_BASE_URL.replace('/api', ''));
    } catch (err) {
      console.error('Erro ao configurar backend URL:', err);
    }
  }, []);

  // EventSource para receber respostas em tempo real (quando implementado)
  useEffect(() => {
    if (!backendUrl) return;
    let es;
    try {
      const q = myAgent ? `?agent=${encodeURIComponent(myAgent)}` : '';
      // EventSource será implementado quando o backend suportar
      // es = new EventSource(`${backendUrl}/stream/replies${q}`);
      // Por enquanto, comentado até implementação do backend
    } catch (err) {
      console.error('Erro ao conectar EventSource:', err);
    }
    return () => {
      try {
        if (es) es.close();
      } catch (err) {
        console.error('Erro ao fechar EventSource:', err);
      }
    };
  }, [backendUrl, myAgent]);

  // Calcular estatísticas baseadas nas solicitações
  useEffect(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const base = selectedAgent
      ? arr.filter((r) => norm(r?.colaboradorNome || r?.agente || '') === norm(selectedAgent))
      : arr;
    const todayStr = new Date().toDateString();
    const today = base.filter(
      (r) => new Date(r?.createdAt || 0).toDateString() === todayStr
    ).length;
    const done = base.filter(
      (r) => String(getStatusChamado(r) || '').toLowerCase() === 'feito'
    ).length;
    const pending = base.length - done;
    setStats({ today, pending, done });

    // Notificações de mudança de status (status derivado de reply[].status)
    try {
      const prev = Array.isArray(prevRequestsRef.current) ? prevRequestsRef.current : [];
      const mapPrev = new Map(prev.map((r) => [r.id, String(r.status || '')]));
      const changed = base.filter((r) => {
        const prevSt = mapPrev.get(r._id || r.id);
        const curSt = String(getStatusChamado(r) || '').toLowerCase();
        if (!prevSt) return false;
        return (
          prevSt.toLowerCase() !== curSt &&
          (curSt === 'feito' || curSt === 'não feito')
        );
      });
      if (changed.length) {
        const play = async () => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            o.start();
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            o.stop(ctx.currentTime + 0.4);
          } catch (err) {
            console.error('Erro ao tocar som:', err);
          }
        };
        const notify = (title, body) => {
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, { body });
            }
          } catch (err) {
            console.error('Erro ao exibir notificação:', err);
          }
        };
        changed.forEach((r) => {
          const st = String(getStatusChamado(r) || '').toLowerCase();
          notify(
            st === 'feito' ? 'Solicitação concluída' : 'Solicitação marcada como não feita',
            `${r.tipo} — ${r.cpf}`
          );
        });
        play();
      }
      prevRequestsRef.current = base.map((r) => ({
        id: r._id || r.id,
        status: getStatusChamado(r),
      }));
    } catch (err) {
      console.error('Erro ao processar mudanças:', err);
    }

    // Msg Produtos não lida: notificação quando a aba do navegador está em segundo plano (aba Solicitações ativa; dedup com Header)
    try {
      if (typeof document !== 'undefined' && document.hidden && activeTab === 'solicitacoes') {
        const unread = listUnreadProdutosDocs(base, STORAGE_PROD_READ_SOLICITACOES);
        for (const it of unread) {
          const sig = produtosUnreadNotifySig('sol', it.id, it.lastAt);
          if (hasProdutosNotificationBeenSent(sig)) continue;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('VeloHub — Time Produtos', {
              body: `${it.tipo} — CPF ${it.cpf}\n${it.preview || 'Nova mensagem'}`,
            });
            markProdutosNotificationSent(sig);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao notificar Produtos (Solicitações):', err);
    }
  }, [requestsRaw, selectedAgent, activeTab]);

  /**
   * Abrir modal de respostas a partir de um item do log de envio (sidebar)
   */
  const abrirModalDesdeLogLocal = async (logItem) => {
    const lid = normalizeMongoId(logItem?.requestId);
    try {
      const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
      if (lid && /^[a-f0-9]{24}$/.test(lid)) {
        const byId = arr.find((r) => normalizeMongoId(r._id ?? r.id) === lid);
        if (byId) {
          setSelectedRepliesRequest(byId);
          return;
        }
      }
      const fuzzy = findSolicitacaoForLocalLogItem(arr, logItem);
      if (fuzzy) {
        setSelectedRepliesRequest(fuzzy);
        return;
      }
      if (lid && /^[a-f0-9]{24}$/.test(lid)) {
        const result = await solicitacoesAPI.getById(lid);
        const doc = result?.data;
        if (doc) {
          setSelectedRepliesRequest(doc);
          return;
        }
      }
      toast.error('Não foi possível carregar esta solicitação. Use "Atualizar agora" nos logs ou busque por CPF.');
    } catch (err) {
      console.error('[EscalacoesPage] abrirModalDesdeLogLocal:', err);
      toast.error(err.message || 'Erro ao abrir detalhes da solicitação');
    }
  };

  /**
   * Buscar solicitações por CPF
   */
  const buscarCpf = async () => {
    const digits = String(searchCpf || '').replace(/\D/g, '');
    if (!digits) {
      setSearchResults([]);
      setSearchCpfError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    if (digits.length !== 11) {
      setSearchResults([]);
      setSearchCpfError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    setSearchCpfError('');
    setSearchLoading(true);
    try {
      const result = await solicitacoesAPI.getByCpf(digits);
      setSearchResults(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Erro ao buscar CPF:', err);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const mergeSolicitacaoDocIntoCaches = useCallback((doc) => {
    if (!doc) return;
    const sid = normalizeMongoId(doc._id ?? doc.id);
    if (!sid) return;
    const patch = (list) => {
      if (!Array.isArray(list)) return list;
      const idx = list.findIndex((r) => normalizeMongoId(r._id ?? r.id) === sid);
      if (idx === -1) return list;
      const next = [...list];
      next[idx] = { ...list[idx], ...doc };
      return next;
    };
    setRequestsRaw((prev) => patch(prev));
    setSearchResults((prev) => patch(prev));
  }, []);

  const atualizarSolicitacaoNoModal = async (solicitacaoId) => {
    const id = solicitacaoId || selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return null;
    try {
      const res = await solicitacoesAPI.getById(id);
      if (res?.data) {
        setSelectedRepliesRequest(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('[EscalacoesPage] atualizarSolicitacaoNoModal:', err);
    }
    return null;
  };

  const handleModalSalvarRespostaN1 = async () => {
    const texto = String(modalN1Draft || '').trim();
    if (!texto) {
      toast.error('Digite a resposta do N1 antes de salvar.');
      return;
    }
    const id = selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return;
    setModalSalvarN1Loading(true);
    try {
      await solicitacoesAPI.addReply(id, {
        origem: 'n1',
        status: 'enviado',
        msgProdutos: null,
        msgN1: texto,
      });
      const docN1 = await atualizarSolicitacaoNoModal(id);
      if (docN1) mergeSolicitacaoDocIntoCaches(docN1);
      setModalN1Draft('');
      toast.success('Resposta N1 registrada.');
      await loadStats();
      if (searchCpf) await buscarCpf();
    } catch (err) {
      console.error('[EscalacoesPage] handleModalSalvarRespostaN1:', err);
      toast.error(err.message || 'Erro ao salvar resposta');
    } finally {
      setModalSalvarN1Loading(false);
    }
  };

  const handleModalCancelarSolicitacao = async () => {
    if (!window.confirm('Cancelar esta solicitação? O status será gravado como Cancelado no histórico.')) {
      return;
    }
    const id = selectedRepliesRequest?._id || selectedRepliesRequest?.id;
    if (!id) return;
    setModalCancelarSolicLoading(true);
    try {
      await solicitacoesAPI.cancelarSolicitacao(id);
      const docCancel = await atualizarSolicitacaoNoModal(id);
      if (docCancel) mergeSolicitacaoDocIntoCaches(docCancel);
      toast.success('Solicitação cancelada.');
      await loadStats();
      if (searchCpf) await buscarCpf();
    } catch (err) {
      console.error('[EscalacoesPage] handleModalCancelarSolicitacao:', err);
      toast.error(err.message || 'Erro ao cancelar solicitação');
    } finally {
      setModalCancelarSolicLoading(false);
    }
  };

  return (
    <div className="w-full py-12" style={{paddingLeft: '20px', paddingRight: '20px'}}>
        <div 
          className="grid gap-4" 
          style={{
            gridTemplateColumns: getGridColumns(
              isRightSidebarCollapsed,
              activeTab === 'solicitacoes'
            ),
            transition: 'grid-template-columns 0.3s ease'
          }}
        >
          {/* Conteúdo principal */}
          <div style={{ minWidth: 0 }}>
            {/* Sistema de Abas */}
            <div className="mb-8" style={{marginTop: '-15px'}}>
          {/* Abas */}
          <div className="flex justify-center flex-wrap mb-2" style={{ gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('solicitacoes')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'solicitacoes' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'solicitacoes' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Solicitações
            </button>
            <button
              onClick={() => setActiveTab('erros-bugs')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'erros-bugs' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'erros-bugs' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Erros/Bugs
            </button>
            <button
              onClick={() => setActiveTab('calculadora-restituicao')}
              className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'calculadora-restituicao' ? '' : 'opacity-50'}`}
              style={{
                color: activeTab === 'calculadora-restituicao' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
              }}
            >
              Calculadora de Restituição
            </button>
          </div>
          
          {/* Linha divisória */}
          <div className="w-full" style={{ height: '1px', backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'solicitacoes' && (
          <div className="flex gap-8 items-start">
          {/* Card principal: define a altura de referência; sidebar copia via ResizeObserver (bases alinhadas) */}
          <div
            ref={solicitacoesMainCardRef}
            className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg pt-6 px-6 pb-4 hover:-translate-y-0.5 transition-transform"
          >
            <div className="mb-6 flex items-center justify-between gap-3 relative">
              <div
                className="grid grid-cols-3 gap-3 w-full max-w-xl"
                aria-busy={statsLoading}
                aria-live="polite"
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Hoje</div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {statsLoading ? (
                      <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    ) : (
                      stats.today
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pendentes</div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {statsLoading ? (
                      <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    ) : (
                      stats.pending
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Feitas</div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {statsLoading ? (
                      <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    ) : (
                      stats.done
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-gray-600 dark:text-gray-400 min-w-[120px] text-right">
                  {lastUpdated
                    ? `Atualizado às ${new Date(lastUpdated).toLocaleTimeString()}`
                    : ''}
                </div>
                <button
                  onClick={loadStats}
                  disabled={statsLoading}
                  className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                  style={{
                    borderColor: '#006AB9',
                    color: '#006AB9',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!statsLoading) {
                      e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                      e.target.style.color = '#F3F7FC';
                      e.target.style.borderColor = '#006AB9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!statsLoading) {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#006AB9';
                      e.target.style.borderColor = '#006AB9';
                    }
                  }}
                >
                  {statsLoading ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    'Atualizar agora'
                  )}
                </button>
              </div>
            </div>

            <FormSolicitacao
              ref={formSolicitacaoRef}
              registrarLog={registrarLog}
              onLocalLogsChange={setSidebarLocalLogs}
              solicitacoesServerList={requestsRaw}
              solicitacoesStatsLoading={statsLoading}
              onRefreshSolicitacoesForLogs={loadStats}
            />
          </div>

          {/* Sidebar: altura = card principal (rodapés alinhados); não aumenta o card */}
          <div
            className="w-[400px] flex-shrink-0 self-start flex flex-col min-h-0 rounded-2xl hover:-translate-y-0.5 transition-transform"
            style={{
              ...(solicitacoesSidebarHeightPx != null && solicitacoesSidebarHeightPx > 0
                ? { height: solicitacoesSidebarHeightPx }
                : {}),
            }}
            aria-label="Busca e acompanhamento"
          >
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-800 shadow-lg p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500 flex-shrink-0" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  Busca e acompanhamento
                </h2>
              </div>

              <div
                className="flex flex-col gap-2 flex-shrink-0"
                aria-busy={searchLoading}
                aria-live="polite"
              >
                <div className="flex flex-wrap gap-2 items-stretch">
                  <input
                    className="min-w-0 flex-1 basis-[160px] border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Digite o CPF"
                    aria-label="CPF para busca"
                    value={searchCpf}
                    onChange={(e) => {
                      setSearchCpf(e.target.value);
                      if (searchCpfError) setSearchCpfError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        buscarCpf();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={buscarCpf}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-700 flex-shrink-0"
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Buscando...
                      </>
                    ) : (
                      'Buscar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => formSolicitacaoRef.current?.refreshLocalLogs?.()}
                    className="text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex-shrink-0"
                  >
                    Atualizar
                  </button>
                </div>
                {searchCpfError && (
                  <div className="text-xs text-red-600">{searchCpfError}</div>
                )}
              </div>

              <div
                className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2"
                data-prod-read-epoch={prodReadEpoch}
              >
                {searchCpf && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 py-1 z-[1]">
                    {searchResults.length} registro(s) nesta busca
                  </div>
                )}
                {searchLoading && (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-between animate-pulse"
                      >
                        <div>
                          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
                          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded" />
                        </div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
                      </div>
                    ))}
                  </div>
                )}
                {searchResults && searchResults.length > 0 && !searchLoading && (
                  <div className="space-y-2">
                    {searchResults.map((r) => {
                      const imgCount = Array.isArray(r?.payload?.previews)
                        ? r.payload.previews.length
                        : Array.isArray(r?.payload?.imagens)
                        ? r.payload.imagens.length
                        : 0;
                      const videoCount = Array.isArray(r?.payload?.videos)
                        ? r.payload.videos.length
                        : 0;
                      const total = imgCount + videoCount;
                      const replyArr = Array.isArray(r.reply) ? r.reply : [];
                      const repliesList = Array.isArray(r.replies) ? r.replies : [];
                      const totalReplies = replyArr.length + repliesList.length;
                      const requestId = r._id || r.id;
                      const buscaCancelada = getStatusChamado(r) === 'Cancelado';
                      const strikeCancel = buscaCancelada ? 'line-through decoration-gray-500 dark:decoration-gray-400' : '';
                      const buscaCardProdUnread =
                        requestId != null &&
                        requestId !== '' &&
                        hasUnreadProdutosInReplies(String(requestId), r.reply, STORAGE_PROD_READ_SOLICITACOES);
                      const handleCardClick = (e) => {
                        // Se o clique foi em um botão ou link, não fazer nada
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[EscalacoesPage] Card clicado - SEMPRE abrir modal:', r);
                        // SEMPRE abrir modal quando card é clicado
                        setSelectedRepliesRequest(r);
                      };
                      const buscaCardBody = (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={handleCardClick}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleCardClick(e);
                            }
                          }}
                          className={`p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer transition-colors ${
                            buscaCardProdUnread
                              ? 'rounded-[12px] border border-transparent hover:border-blue-300 dark:hover:border-blue-500'
                              : 'rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                          aria-label={
                            buscaCardProdUnread
                              ? 'Há mensagem do time Produtos não lida neste chamado'
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                              <div>
                                <div className="font-medium flex items-center gap-2 flex-wrap text-gray-800 dark:text-gray-200 text-sm">
                                  <span>
                                    <span className={strikeCancel}>{r.tipo}</span>
                                    <span className="mx-0.5">—</span>
                                    <span className={strikeCancel}>{r.cpf}</span>
                                  </span>
                                  {total > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-800 dark:text-fuchsia-200 text-xs">
                                      Anexos:{' '}
                                      {imgCount > 0 ? `${imgCount} img` : ''}
                                      {imgCount > 0 && videoCount > 0 ? ' + ' : ''}
                                      {videoCount > 0 ? `${videoCount} vid` : ''}
                                    </span>
                                  )}
                                  {totalReplies > 0 && (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {totalReplies} resposta{totalReplies !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Agente: {r.colaboradorNome || r.agente || '—'} • Status: {getStatusChamado(r)}
                                </div>
                              </div>
                            </div>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => {
                                if (totalReplies === 0) {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      return (
                        <div key={`cpf-${requestId}`} className="shrink-0">
                          {buscaCardProdUnread ? (
                            <div
                              className="p-[2px] rounded-[14px]"
                              style={{
                                background:
                                  'linear-gradient(135deg, #006AB9 0%, #FACC15 42%, #1D4ED8 100%)',
                              }}
                            >
                              {buscaCardBody}
                            </div>
                          ) : (
                            buscaCardBody
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {solicitacoesSidebarDisplayLogs && solicitacoesSidebarDisplayLogs.length > 0 && (
                  <div className="space-y-2">
                    {solicitacoesSidebarDisplayLogs.map((l, idx) => {
                      const s = String(l.status || '').toLowerCase();
                      const isCanceladoLog = getStatusChamado(l) === 'Cancelado';
                      const strikeLogCancel = isCanceladoLog
                        ? 'line-through decoration-gray-500 dark:decoration-gray-400'
                        : '';
                      const isDoneFail = s === 'não feito' || s === 'nao feito';
                      const isDoneOk = s === 'feito';
                      const sentOnly = !isDoneOk && !isDoneFail && (s === 'enviado' || l.enviado === true);
                      const bar1 = (sentOnly || isDoneOk || isDoneFail) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600';
                      const bar2 = isDoneOk ? 'bg-emerald-500' : (isDoneFail ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600');
                      const icon = isDoneOk ? '✅' : (isDoneFail ? '❌' : (sentOnly ? '📨' : '⏳'));
                      const logKey = l.requestId || l.waMessageId || `log-${idx}-${String(l.createdAt)}`;
                      const logCardProdUnread =
                        l?.requestId &&
                        hasUnreadProdutosInReplies(
                          String(l.requestId),
                          l.reply,
                          STORAGE_PROD_READ_SOLICITACOES
                        );
                      const open = (e) => {
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                        e.preventDefault();
                        abrirModalDesdeLogLocal(l);
                      };
                      const logCardBody = (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={open}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              open(e);
                            }
                          }}
                          className={`p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer transition-colors ${
                            logCardProdUnread
                              ? 'rounded-[12px] border border-transparent hover:border-blue-300 dark:hover:border-blue-500'
                              : 'rounded border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                          }`}
                          aria-label={
                            logCardProdUnread
                              ? 'Há mensagem do time Produtos não lida neste chamado'
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl flex-shrink-0">{icon}</span>
                              <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                <span className={strikeLogCancel}>{l.cpf}</span>
                                <span className="mx-0.5">—</span>
                                <span className={strikeLogCancel}>{l.tipo}</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400 flex-shrink-0 text-right">
                              {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5" aria-label={`progresso: ${s || 'em aberto'}`}>
                            <span className={`h-1.5 w-8 rounded-full ${bar1}`} />
                            <span className={`h-1.5 w-8 rounded-full ${bar2}`} />
                            <span className="text-[11px] opacity-60 ml-2 text-gray-600 dark:text-gray-400">
                              {s || 'em aberto'}
                            </span>
                          </div>
                        </div>
                      );
                      return (
                        <div key={`envio-${logKey}`} className="shrink-0">
                          {logCardProdUnread ? (
                            <div
                              className="p-[2px] rounded-[14px]"
                              style={{
                                background:
                                  'linear-gradient(135deg, #006AB9 0%, #FACC15 42%, #1D4ED8 100%)',
                              }}
                            >
                              {logCardBody}
                            </div>
                          ) : (
                            logCardBody
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!searchLoading &&
                  (!searchResults || searchResults.length === 0) &&
                  (!solicitacoesSidebarDisplayLogs || solicitacoesSidebarDisplayLogs.length === 0) &&
                  !String(searchCpf || '').trim() && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">
                    Busque por CPF ou envie uma solicitação; os itens aparecem aqui.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'erros-bugs' && (
          <ErrosBugsTab />
        )}

            {activeTab === 'calculadora-restituicao' && (
              <CalculadoraRestituicao />
            )}
          </div>
          
          {/* Chat só na aba Solicitações — evita loadContacts / polling ao usar Calculadora ou Erros-Bugs */}
          {activeTab === 'solicitacoes' ? renderRightSidebarChat() : null}
        </div>

        {/* Modal de Visualização de Respostas */}
        {selectedRepliesRequest && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => {
              console.log('[EscalacoesPage] Fechando modal de respostas');
              setSelectedRepliesRequest(null);
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full min-h-[72vh] max-h-[96vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="min-w-0 flex-1 pr-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                    Respostas — {selectedRepliesRequest.tipo || '—'} — {selectedRepliesRequest.cpf || '—'}
                  </h3>
                  <span
                    className="text-gray-300 dark:text-gray-600 select-none hidden sm:inline"
                    aria-hidden
                  >
                    |
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      Status do chamado
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                        getStatusChamado(selectedRepliesRequest)
                      )}`}
                    >
                      {getStatusChamado(selectedRepliesRequest)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRepliesRequest(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none transition-colors flex-shrink-0"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Informações: 1ª linha fixa CPF | Tipo | Data; demais células = só chaves do payload com valor relevante (grid 3 colunas) */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-x-3 gap-y-3">
                      <ModalInfoGridCell label="CPF" value={selectedRepliesRequest.cpf || '—'} />
                      <ModalInfoGridCell label="Tipo" value={selectedRepliesRequest.tipo || '—'} />
                      <ModalInfoGridCell
                        label="Data"
                        value={
                          selectedRepliesRequest.createdAt
                            ? new Date(selectedRepliesRequest.createdAt).toLocaleString('pt-BR')
                            : '—'
                        }
                      />
                      {buildModalExtraPayloadCells(selectedRepliesRequest).map((c) => (
                        <ModalInfoGridCell key={c.key} label={c.label} value={c.value} />
                      ))}
                    </div>
                  </div>

                  {/* Anexos */}
                  {(() => {
                    const imgCount = Array.isArray(selectedRepliesRequest?.payload?.previews) 
                      ? selectedRepliesRequest.payload.previews.length 
                      : Array.isArray(selectedRepliesRequest?.payload?.imagens) 
                      ? selectedRepliesRequest.payload.imagens.length 
                      : 0;
                    const videoCount = Array.isArray(selectedRepliesRequest?.payload?.videos) 
                      ? selectedRepliesRequest.payload.videos.length 
                      : 0;
                    const totalAnexos = imgCount + videoCount;
                    
                    if (totalAnexos > 0) {
                      return (
                        <div>
                          <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                            Anexos ({totalAnexos})
                          </h4>
                          {imgCount > 0 && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Imagens ({imgCount}):</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(selectedRepliesRequest.payload.previews || selectedRepliesRequest.payload.imagens || []).map((preview, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={preview}
                                      alt={`anexo-${idx}`}
                                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(preview, '_blank')}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => window.open(preview, '_blank')}
                                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      Abrir
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {videoCount > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vídeos ({videoCount}):</div>
                              <div className="space-y-2">
                                {(selectedRepliesRequest.payload.videos || []).map((video, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="relative">
                                      {selectedRepliesRequest.payload.videoThumbnails?.[idx] && (
                                        <img
                                          src={selectedRepliesRequest.payload.videoThumbnails[idx]}
                                          alt={`video-thumb-${idx}`}
                                          className="w-20 h-14 object-cover rounded border"
                                        />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                        <span className="text-white text-xs">▶</span>
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{video.name || `Vídeo ${idx + 1}`}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{video.type || 'video/mp4'}</div>
                                    </div>
                                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                                      Vídeo não disponível
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Lista de respostas - suporta reply (novo) e replies (legado) */}
                  {(() => {
                    const replyArray = Array.isArray(selectedRepliesRequest.reply) ? selectedRepliesRequest.reply : [];
                    const replies = Array.isArray(selectedRepliesRequest.replies) ? selectedRepliesRequest.replies : [];
                    const hasReply = replyArray.length > 0;
                    const hasReplies = replies.length > 0;
                    if (hasReply) {
                      const dialogue = buildProdutosN1Dialogue(replyArray);
                      return (
                        <div>
                          <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                            Respostas do time
                            {dialogue.length > 0 && (
                              <span className="text-gray-500 dark:text-gray-400 font-normal text-sm ml-1">
                                ({dialogue.length}{' '}
                                {dialogue.length === 1 ? 'mensagem' : 'mensagens'})
                              </span>
                            )}
                          </h4>
                          {dialogue.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 py-4 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
                              Ainda não há mensagens de Produtos ou N1 registradas neste chamado (apenas eventos de status, se houver).
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {dialogue.map((b) => {
                                if (b.role === 'produtos') {
                                  return (
                                    <div key={b.key} className="flex justify-start">
                                      <div className="max-w-[min(100%,28rem)] rounded-xl px-3 py-2.5 border-l-4 border-[#006AB9] bg-sky-50 dark:bg-sky-950/35 dark:border-sky-500 shadow-sm">
                                        <div className="text-xs font-semibold text-[#006AB9] dark:text-sky-300 mb-1">
                                          Time Produtos
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                          {b.text}
                                        </div>
                                        {b.at ? (
                                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">{b.at}</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                }
                                if (b.role === 'n1') {
                                  return (
                                    <div key={b.key} className="flex justify-end">
                                      <div className="max-w-[min(100%,28rem)] rounded-xl px-3 py-2.5 border-r-4 border-amber-500 bg-amber-50 dark:bg-amber-950/35 dark:border-amber-400 shadow-sm">
                                        <div className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1 text-right">
                                          N1
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words text-left">
                                          {b.text}
                                        </div>
                                        {b.at ? (
                                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-left">{b.at}</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={b.key} className="flex justify-center">
                                    <div className="text-xs text-center text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                      {b.text}
                                      {b.at ? <span className="block text-[10px] text-gray-500 mt-0.5">{b.at}</span> : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (hasReplies) {
                      return (
                      <div>
                        <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                          Menções / Respostas no grupo ({replies.length})
                        </h4>
                        <div className="space-y-3">
                          {[...replies].reverse().map((rep, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {rep.reactor || '—'}
                              </div>
                              {rep.at && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {new Date(rep.at).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words mb-3">
                              {(rep.text || '—').trim() || '—'}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {rep.replyMessageId ? (
                                  rep.confirmedAt ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      ✓ Confirmado{rep.confirmedBy ? ` por ${rep.confirmedBy}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Aguardando confirmação
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Check no WhatsApp disponível só para respostas novas
                                  </span>
                                )}
                              </span>
                              {rep.replyMessageId && !rep.confirmedAt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    confirmarResposta(
                                      selectedRepliesRequest._id || selectedRepliesRequest.id,
                                      rep.replyMessageId,
                                      myAgent
                                    ).then(() => {
                                      // Atualizar o request no modal
                                      const updatedReplies = replies.map(r => 
                                        r.replyMessageId === rep.replyMessageId 
                                          ? { ...r, confirmedAt: new Date(), confirmedBy: myAgent }
                                          : r
                                      );
                                      setSelectedRepliesRequest({
                                        ...selectedRepliesRequest,
                                        replies: updatedReplies
                                      });
                                      // Recarregar dados
                                      buscarCpf();
                                      loadStats();
                                    }).catch(() => {
                                      toast.error('Falha ao confirmar');
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors text-sm"
                                >
                                  Confirmar visto (✓ no WhatsApp)
                                </button>
                              )}
                            </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                    }
                    return (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Nenhuma resposta disponível para esta solicitação.
                      </div>
                    );
                  })()}
                </div>
              </div>
              {(() => {
                const cancelada = getStatusChamado(selectedRepliesRequest) === 'Cancelado';
                const bloqueado = modalSalvarN1Loading || modalCancelarSolicLoading;
                return (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
                    <label htmlFor="modal-n1-resposta" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      Resposta N1
                    </label>
                    <textarea
                      id="modal-n1-resposta"
                      rows={2}
                      className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[44px] disabled:opacity-60"
                      placeholder="Digite a mensagem do agente N1…"
                      value={modalN1Draft}
                      onChange={(e) => setModalN1Draft(e.target.value)}
                      disabled={cancelada || bloqueado}
                    />
                    {cancelada && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Esta solicitação está cancelada; não é possível nova resposta ou novo cancelamento.</p>
                    )}
                    <div className="flex justify-between items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleModalCancelarSolicitacao}
                        disabled={cancelada || bloqueado}
                        className="text-sm px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {modalCancelarSolicLoading ? 'Cancelando…' : 'Cancelar Solicitação'}
                      </button>
                      <button
                        type="button"
                        onClick={handleModalSalvarRespostaN1}
                        disabled={cancelada || bloqueado}
                        className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {modalSalvarN1Loading ? 'Salvando…' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
    </div>
  );
};

export default EscalacoesPage;


/**
 * VeloHub V3 - MinhasReclamacoes Component
 * VERSION: v1.19.3 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.19.3: Removidos fetch ingest/debug da lista Minhas (sessão debug concluída)
 * - v1.19.2: getByColaborador com responsavelEmail (sessão) — evita lista «Minhas» cruzando contas por nome/substring na lista (paginação client-side já existente por fatia); fragment JSX explícito
 * - v1.19.0: Paginação client-side na lista (20 por página) quando há muitas ocorrências filtradas
 * - v1.18.1: Gradientes moldura Req/Fusão com stops 70/30 mais explícitos
 * - v1.18.0: Gradientes Req/Fusão mais finos; alvo fusão badge «Resolvido»; bolha header (velohub:ouvid-minhas-loaded)
 * - v1.11.0: Badge de SLA nas linhas (prazoBacen / prazoOuvidoria via dateUtils.getSlaBadgeReclamacao) para BACEN e N2 Pix
 * - v1.10.0: Filtro por situação: Todos, Em andamento, Resolvido (Finalizado.Resolvido, client-side)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { reclamacoesAPI } from '../../services/ouvidoriaApi';
import { formatDateRegistro, getSlaBadgeReclamacao } from '../../utils/dateUtils';
import FormReclamacaoEdit from './FormReclamacaoEdit';
import FusaoFundidoBadge from './FusaoFundidoBadge';
import toast from 'react-hot-toast';
import {
  isUnreadFeitoOuvidReqProd,
  markOuvidReqProdFeitoRead,
} from '../../utils/ouvidoriaReqProdNotif';
import {
  isFusaoAbsorvoAlvo,
  isUnreadFusaoAbsorvoAlvo,
  markFusaoAbsAckReadFromItem,
} from '../../utils/ouvidoriaFusaoNotif';

/** Moldura absorvido (fusão não lida): ~70 % vermelho → ~30 % azul escuro */
const GRAD_MOLDURA_FUSAO_ABS =
  'linear-gradient(135deg, #b91c1c 0%, #991b1b 70%, #1e3a8a 70%, #0f172a 100%)';
/** Req_Prod «Feito» não lido: ~70 % verde → ~30 % azul médio (inclui papel parent/receptor na fusão) */
const GRAD_MOLDURA_REQ_FUS_PARENT =
  'linear-gradient(135deg, #22c55e 0%, #16a34a 70%, #006AB9 70%, #1694FF 100%)';

/** Tamanho da página na aba Minhas reclamações (client-side). */
const MINHAS_REC_PAGE_SIZE = 20;

const MinhasReclamacoes = ({
  colaboradorNome,
  userEmail,
  onFusaoConsultaChange,
  minhasReloadSignal = 0,
  fusaoConsultaCtx = null,
  onAbrirModalFusao,
  fusaoLiberacaoAnteriorSignal = 0,
}) => {
  const [reclamacoes, setReclamacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReclamacao, setSelectedReclamacao] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  /** '' = todos | em_andamento | resolvido */
  const [filtroStatus, setFiltroStatus] = useState('');
  /** Página atual da grade (lista filtrada em memória). */
  const [paginaLista, setPaginaLista] = useState(1);
  useEffect(() => {
    if (colaboradorNome) {
      loadMinhasReclamacoes();
    }
  }, [colaboradorNome, userEmail]);

  useEffect(() => {
    if (minhasReloadSignal > 0 && colaboradorNome) {
      loadMinhasReclamacoes();
    }
  }, [minhasReloadSignal]);

  useEffect(() => {
    if (!selectedReclamacao) return;

    if (isUnreadFeitoOuvidReqProd(selectedReclamacao)) {
      const lib = selectedReclamacao.reqProdLiberacaoPix;
      const libId = lib?._id != null ? String(lib._id) : '';
      if (libId) {
        const at = selectedReclamacao.reqProdStatusAt;
        const atMs = at ? new Date(at).getTime() : 0;
        if (Number.isFinite(atMs) && atMs > 0) {
          markOuvidReqProdFeitoRead(libId, atMs);
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('velohub:ouvid-reqprod-read'));
            }
          } catch {
            /* ignore */
          }
        }
      }
    }

    if (isUnreadFusaoAbsorvoAlvo(selectedReclamacao)) {
      markFusaoAbsAckReadFromItem(selectedReclamacao);
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('velohub:ouvid-fusao-read'));
        }
      } catch {
        /* ignore */
      }
    }
  }, [selectedReclamacao]);

  const fecharModalEdicao = () => {
    if (typeof onFusaoConsultaChange === 'function') {
      onFusaoConsultaChange(null);
    }
    setSelectedReclamacao(null);
  };

  const podeFundirNoModalEdicao =
    Boolean(fusaoConsultaCtx?.showButton) &&
    fusaoConsultaCtx?.source === 'minhas' &&
    selectedReclamacao &&
    String(fusaoConsultaCtx?.currentId ?? '') ===
      String(selectedReclamacao?._id ?? selectedReclamacao?.id ?? '') &&
    String(fusaoConsultaCtx?.cpf ?? '').replace(/\D/g, '') ===
      String(selectedReclamacao?.cpf ?? '').replace(/\D/g, '');

  useEffect(() => {
    if (menuOpenId == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpenId(null);
    };
    const onDown = (e) => {
      if (!e.target.closest?.('[data-minhas-reclamacao-menu-root]')) setMenuOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [menuOpenId]);

  const solicitarExcluirReclamacao = async (reclamacao) => {
    const idStr = reclamacao?._id != null ? String(reclamacao._id) : '';
    const tipo = reclamacao?.tipo;
    if (!idStr || tipo == null || String(tipo).trim() === '') {
      toast.error('Não foi possível identificar o registro para exclusão.');
      return;
    }
    if (!window.confirm('Excluir este registro permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await reclamacoesAPI.remove(idStr, tipo);
      toast.success('Registro excluído');
      setMenuOpenId(null);
      setSelectedReclamacao((cur) => (cur && String(cur._id) === idStr ? null : cur));
      await loadMinhasReclamacoes();
    } catch (err) {
      console.error('Erro ao excluir reclamação:', err);
      toast.error(err?.message || 'Erro ao excluir registro');
    }
  };

  /**
   * Carregar minhas reclamações
   */
  const loadMinhasReclamacoes = async () => {
    if (!colaboradorNome) {
      toast.error('Nome do colaborador não encontrado');
      return;
    }

    setLoading(true);
    try {
      const emailLc =
        userEmail != null ? String(userEmail || '').trim().toLowerCase() : '';
      const resultado = await reclamacoesAPI.getByColaborador(colaboradorNome, {
        colaboradorEmail: emailLc || undefined,
      });
      const dados = resultado.data || resultado || [];
      setReclamacoes(dados);
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('velohub:ouvid-minhas-loaded'));
        }
      } catch {
        /* ignore */
      }
    } catch (error) {
      console.error('Erro ao carregar minhas reclamações:', error);
      toast.error('Erro ao carregar suas reclamações');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatar CPF
   */
  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  /**
   * Obter status baseado em Finalizado.Resolvido
   */
  const getStatusInfo = (reclamacao) => {
    if (reclamacao.Finalizado?.Resolvido === true) {
      return {
        texto: 'Resolvido',
        cor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200',
      };
    }
    if (isFusaoAbsorvoAlvo(reclamacao)) {
      return {
        texto: 'Resolvido',
        cor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200',
      };
    }
    return {
      texto: 'Em Andamento',
      cor: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200',
    };
  };

  const reclamacoesFiltradas = useMemo(() => {
    if (!filtroStatus) return reclamacoes;
    return reclamacoes.filter((r) => {
      const resolvido = r.Finalizado?.Resolvido === true;
      const absorvidoFusao = isFusaoAbsorvoAlvo(r);
      if (filtroStatus === 'resolvido') return resolvido || absorvidoFusao;
      if (filtroStatus === 'em_andamento') return !resolvido && !absorvidoFusao;
      if (filtroStatus === 'fundido') return absorvidoFusao;
      return true;
    });
  }, [reclamacoes, filtroStatus]);

  const totalPaginasMinhas = Math.max(
    1,
    Math.ceil(reclamacoesFiltradas.length / MINHAS_REC_PAGE_SIZE),
  );

  useEffect(() => {
    setPaginaLista(1);
  }, [filtroStatus, reclamacoes.length]);

  useEffect(() => {
    if (minhasReloadSignal > 0) setPaginaLista(1);
  }, [minhasReloadSignal]);

  useEffect(() => {
    setPaginaLista((p) => Math.min(Math.max(1, p), totalPaginasMinhas));
  }, [totalPaginasMinhas]);

  const reclamacoesNaPagina = useMemo(() => {
    const p = Math.min(Math.max(1, paginaLista), totalPaginasMinhas);
    const start = (p - 1) * MINHAS_REC_PAGE_SIZE;
    return reclamacoesFiltradas.slice(start, start + MINHAS_REC_PAGE_SIZE);
  }, [reclamacoesFiltradas, paginaLista, totalPaginasMinhas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando suas reclamações...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="velohub-card mb-4 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Situação</span>
        <select
          id="minhas-filtro-status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="text-sm border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white min-w-[11rem]"
          aria-label="Filtrar por situação"
        >
          <option value="">Todos</option>
          <option value="em_andamento">Em andamento</option>
          <option value="fundido">Fundido</option>
          <option value="resolvido">Resolvido</option>
        </select>
        {reclamacoes.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {reclamacoesFiltradas.length !== reclamacoes.length
              ? `Filtradas ${reclamacoesFiltradas.length} de ${reclamacoes.length}`
              : `${reclamacoes.length} atribuída(s)`}
          </span>
        )}
      </div>

      {/* Lista de reclamações */}
      <div className="space-y-4">
        {reclamacoes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Você não possui reclamações atribuídas
            </p>
          </div>
        ) : reclamacoesFiltradas.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma reclamação corresponde ao filtro selecionado
            </p>
          </div>
        ) : (
          <>
            {reclamacoesNaPagina.map((reclamacao, index) => {
            const rowId = reclamacao._id != null ? String(reclamacao._id) : '';
            const menuOpen = menuOpenId === rowId;
            const comFusUnread = isUnreadFusaoAbsorvoAlvo(reclamacao);
            const comFeitoUnread = isUnreadFeitoOuvidReqProd(reclamacao);
            const comMolduraExternaFusao = comFusUnread;
            /** Liberação «Feito» não lida ou receptor de fusão — gradiente verde/azul (prioridade abaixo da fusão absorvida unread) */
            const comMolduraReqFeito = !comMolduraExternaFusao && comFeitoUnread;
            const comMoldura = comMolduraExternaFusao || comMolduraReqFeito;
            return (
              <div
                key={rowId || `minhas-row-${index}`}
                className={
                  comMoldura
                    ? 'rounded-[13px] p-px flex gap-2 items-start'
                    : 'p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors flex gap-2 items-start'
                }
                style={
                  comMolduraExternaFusao
                    ? { background: GRAD_MOLDURA_FUSAO_ABS }
                    : comMolduraReqFeito
                      ? { background: GRAD_MOLDURA_REQ_FUS_PARENT }
                      : undefined
                }
              >
                <div
                  className={
                    comMoldura
                      ? 'flex flex-1 min-w-0 gap-2 items-start rounded-[12px] border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-500 transition-colors'
                      : 'contents'
                  }
                >
                <div
                  role="button"
                  tabIndex={0}
                  className="flex-1 min-w-0 cursor-pointer text-left"
                  onClick={() => setSelectedReclamacao(reclamacao)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedReclamacao(reclamacao);
                    }
                  }}
                >
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2 flex-wrap">
                    <span>
                      {reclamacao.nome || 'Sem nome'} — {formatCPF(reclamacao.cpf)}
                    </span>
                    {(() => {
                      const statusInfo = getStatusInfo(reclamacao);
                      return (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusInfo.cor}`}>
                          {statusInfo.texto}
                        </span>
                      );
                    })()}
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">
                      {reclamacao.tipo || 'BACEN'}
                    </span>
                    {(() => {
                      const sla = getSlaBadgeReclamacao(reclamacao);
                      if (!sla) return null;
                      return (
                        <span
                          title={sla.title}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${sla.corClasses}`}
                        >
                          {sla.texto}
                        </span>
                      );
                    })()}
                    <FusaoFundidoBadge fusao={reclamacao.Fusao} />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1 flex-wrap">
                    <span>Data: {formatDateRegistro(reclamacao.dataEntrada || reclamacao.dataEntradaN2 || reclamacao.createdAt)}</span>
                    {reclamacao.motivoReduzido && (
                      <span>• {Array.isArray(reclamacao.motivoReduzido) ? reclamacao.motivoReduzido.filter(Boolean).join(', ') : reclamacao.motivoReduzido}</span>
                    )}
                  </div>
                </div>
                <div className="relative shrink-0" data-minhas-reclamacao-menu-root>
                  <button
                    type="button"
                    aria-label="Opções do registro"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId((prev) => (prev === rowId ? null : rowId));
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 py-1 min-w-[11rem] rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg z-[20]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => solicitarExcluirReclamacao(reclamacao)}
                      >
                        Excluir registro
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </div>
            );
            })}

            {totalPaginasMinhas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {(paginaLista - 1) * MINHAS_REC_PAGE_SIZE + 1} a{' '}
                  {Math.min(paginaLista * MINHAS_REC_PAGE_SIZE, reclamacoesFiltradas.length)} de{' '}
                  {reclamacoesFiltradas.length}{' '}
                  reclamação(ões)
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPaginaLista((p) => Math.max(1, p - 1))}
                    disabled={paginaLista <= 1}
                    className="text-sm px-3 py-2 rounded border transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: paginaLista <= 1 ? '#9ca3af' : '#006AB9',
                      color: paginaLista <= 1 ? '#9ca3af' : '#006AB9',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (paginaLista > 1) {
                        e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                        e.target.style.color = '#F3F7FC';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaLista > 1) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#006AB9';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-2 tabular-nums">
                    Página {Math.min(Math.max(1, paginaLista), totalPaginasMinhas)} de {totalPaginasMinhas}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaLista((p) => Math.min(totalPaginasMinhas, p + 1))}
                    disabled={paginaLista >= totalPaginasMinhas}
                    className="text-sm px-3 py-2 rounded border transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor:
                        paginaLista >= totalPaginasMinhas ? '#9ca3af' : '#006AB9',
                      color: paginaLista >= totalPaginasMinhas ? '#9ca3af' : '#006AB9',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (paginaLista < totalPaginasMinhas) {
                        e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                        e.target.style.color = '#F3F7FC';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaLista < totalPaginasMinhas) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#006AB9';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de edição — mesmo padrão que ListaReclamacoes (FormReclamacaoEdit) */}
      {selectedReclamacao && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ zIndex: 9999 }}
          onClick={fecharModalEdicao}
        >
          <div
            className="rounded-lg shadow-xl w-full max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: 'var(--velohub-radius-container)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              backgroundColor: 'var(--cor-container)',
              border: '1px solid var(--cor-borda)',
              zIndex: 10000,
              position: 'relative'
            }}
          >
            <div
              className="flex items-center justify-between p-6 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--cor-borda)' }}
            >
              <h2 className="text-2xl font-semibold velohub-title">Editar Reclamação</h2>
              <button
                type="button"
                onClick={fecharModalEdicao}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ fontSize: '28px', lineHeight: '1' }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 p-6">
              <FormReclamacaoEdit
                reclamacao={selectedReclamacao}
                onFusaoConsultaChange={onFusaoConsultaChange}
                fundirInlineAtivo={podeFundirNoModalEdicao}
                onAbrirModalFusao={onAbrirModalFusao}
                fusaoLiberacaoAnteriorSignal={fusaoLiberacaoAnteriorSignal}
                onClose={fecharModalEdicao}
                onSuccess={() => {
                  fecharModalEdicao();
                  loadMinhasReclamacoes();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasReclamacoes;

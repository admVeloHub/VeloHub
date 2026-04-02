/**
 * VeloHub V3 - MinhasReclamacoes Component
 * VERSION: v1.11.0 | DATE: 2026-03-30 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.11.0:
 * - Badge de SLA nas linhas (prazoBacen / prazoOuvidoria via dateUtils.getSlaBadgeReclamacao) para BACEN e N2 Pix
 * 
 * Mudanças v1.10.0:
 * - Filtro por situação: Todos, Em andamento, Resolvido (Finalizado.Resolvido, client-side)
 * 
 * Mudanças v1.9.0:
 * - Cards: botão de opções (⋮) à direita; menu "Excluir registro" (reclamacoesAPI.remove + confirmação), alinhado à Lista de Reclamações
 * 
 * Mudanças v1.8.0:
 * - Data exibida: usa formatDateRegistro (data do registro, sem adaptação de fuso)
 * 
 * Mudanças v1.7.0:
 * - dataEntradaAtendimento → dataEntradaN2 (schema LISTA_SCHEMAS.rb: apenas dataEntradaN2)
 * 
 * Mudanças v1.5.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido campo mes da exibição
 * - Removido suporte para filtro por idSecao
 * 
 * Mudanças v1.6.0:
 * - Removidas todas as referências restantes a idSecao (variável não definida causava erro)
 * 
 * Mudanças v1.4.0:
 * - Readequado modal de detalhes para seguir o mesmo padrão de ListaReclamacoes
 * - Modal agora tem header fixo e conteúdo com scroll
 * - Campos organizados em cards com fundo cinza (bg-gray-50 dark:bg-gray-700)
 * - Melhor formatação e espaçamento das seções
 * - Removido campo RDR (vestígio do sistema antigo)
 * 
 * Mudanças v1.2.0:
 * - Removido header com gradiente e ícone
 * - Aplicado padrão de container secundário aos cards (bg-gray-50 dark:bg-gray-700)
 * - Adequadas fontes conforme padrão do projeto (text-sm para títulos, text-xs para info)
 * 
 * Mudanças v1.1.0:
 * - Containers padronizados com classes velohub-card e velohub-container conforme LAYOUT_GUIDELINES.md
 * 
 * Componente para listagem de reclamações do colaborador logado
 */

import React, { useState, useEffect, useMemo } from 'react';
import { reclamacoesAPI } from '../../services/ouvidoriaApi';
import { formatDateRegistro, getSlaBadgeReclamacao } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const MinhasReclamacoes = ({ colaboradorNome, userEmail }) => {
  const [reclamacoes, setReclamacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReclamacao, setSelectedReclamacao] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  /** '' = todos | em_andamento | resolvido */
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    if (colaboradorNome) {
      loadMinhasReclamacoes();
    }
  }, [colaboradorNome]);

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
      const resultado = await reclamacoesAPI.getByColaborador(colaboradorNome);
      const dados = resultado.data || resultado || [];
      setReclamacoes(dados);
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
        cor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
      };
    }
    return {
      texto: 'Em Andamento',
      cor: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
    };
  };

  const reclamacoesFiltradas = useMemo(() => {
    if (!filtroStatus) return reclamacoes;
    return reclamacoes.filter((r) => {
      const resolvido = r.Finalizado?.Resolvido === true;
      if (filtroStatus === 'resolvido') return resolvido;
      if (filtroStatus === 'em_andamento') return !resolvido;
      return true;
    });
  }, [reclamacoes, filtroStatus]);

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
          <option value="resolvido">Resolvido</option>
        </select>
        {reclamacoes.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Exibindo {reclamacoesFiltradas.length} de {reclamacoes.length}
          </span>
        )}
      </div>

      {/* Lista de Reclamações */}
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
          reclamacoesFiltradas.map((reclamacao, index) => {
            const rowId = reclamacao._id != null ? String(reclamacao._id) : '';
            const menuOpen = menuOpenId === rowId;
            return (
              <div
                key={rowId || `minhas-row-${index}`}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors flex gap-2 items-start"
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
            );
          })
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedReclamacao && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setSelectedReclamacao(null)}
        >
          <div
            className="rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              backgroundColor: 'var(--cor-container)',
              border: '1px solid var(--cor-borda)',
              zIndex: 10000,
              position: 'relative'
            }}
          >
            {/* Header do Modal */}
            <div
              className="flex items-center justify-between p-6 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--cor-borda)' }}
            >
              <h2 className="text-2xl font-semibold velohub-title">Detalhes da Reclamação</h2>
              <button
                onClick={() => setSelectedReclamacao(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ fontSize: '28px', lineHeight: '1' }}
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Modal com scroll */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                {/* Dados Básicos */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                    Dados Básicos
                  </h3>
                  <div className="space-y-4">
                    {/* Linha 1: Nome e CPF */}
                    <div className="grid grid-cols-2 gap-4 text-base text-gray-800 dark:text-gray-200">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Nome:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.nome || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">CPF:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{formatCPF(selectedReclamacao.cpf)}</span>
                      </div>
                    </div>

                    {/* Linha 2: Data Entrada, Tipo, Status */}
                    <div className="grid grid-cols-3 gap-4 text-base text-gray-800 dark:text-gray-200">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Data Entrada:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{formatDateRegistro(selectedReclamacao.dataEntrada || selectedReclamacao.dataEntradaAtendimento || selectedReclamacao.createdAt)}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Tipo:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.tipo || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Status:</strong>
                        {(() => {
                          const statusInfo = getStatusInfo(selectedReclamacao);
                          return (
                            <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${statusInfo.cor}`}>
                              {statusInfo.texto}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Linha 3: Origem e Responsável */}
                    {(selectedReclamacao.origem || selectedReclamacao.responsavel) && (
                      <div className="grid grid-cols-2 gap-4 text-base text-gray-800 dark:text-gray-200">
                        {selectedReclamacao.origem && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Origem:</strong>
                            <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.origem}</span>
                          </div>
                        )}
                        {selectedReclamacao.responsavel && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Responsável:</strong>
                            <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.responsavel}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Motivo */}
                {selectedReclamacao.motivoReduzido && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                      Motivo
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-base text-gray-800 dark:text-gray-200" style={{ color: 'var(--cor-texto-principal)' }}>
                        {selectedReclamacao.motivoReduzido}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detalhes */}
                {selectedReclamacao.motivoDetalhado && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                      Detalhes
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-base whitespace-pre-wrap text-gray-800 dark:text-gray-200" style={{ color: 'var(--cor-texto-principal)' }}>
                        {selectedReclamacao.motivoDetalhado}
                      </p>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {selectedReclamacao.observacoes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                      Observações
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-base whitespace-pre-wrap text-gray-800 dark:text-gray-200" style={{ color: 'var(--cor-texto-principal)' }}>
                        {selectedReclamacao.observacoes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasReclamacoes;

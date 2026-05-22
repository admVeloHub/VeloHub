/**
 * VeloHub V3 - DevRequisicoesTab (resposta produto para solicitações)
 * VERSION: v1.1.0 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * - v1.1.0: Paginação (10 por página) com navegação na API (page/limit), reduzindo tempo de abertura da aba
 * - v1.0.4: Correção sintaxe — declarar `export default function DevRequisicoesTab()` (tinha ficado omitida na edição anterior)
 * - v1.0.3: Lista usa o GET mesclado completo (`solicitacoes_tecnicas` + `liberacao_pix_prod`); removido filtro que ocultava «Exclusão de Chave PIX» (casos só na coleção liberacao)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { solicitacoesAPI } from '../../services/requisicoesApi';
import {
  getStatusChamado,
  getStatusChamadoAssignedAt,
  isTerminalChamadoStatusForHeader,
  statusChamadoBadgeClass,
  buildProdutosN1Dialogue,
  normalizeMongoId,
} from '../../utils/requisicoesModalHelpers';

const PAGE_SIZE = 10;

function formatarCPF(valor) {
  const digits = String(valor || '').replace(/\D/g, '');
  const limited = digits.slice(0, 11);
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
}

export default function DevRequisicoesTab() {
  const [loading, setLoading] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [allRows, setAllRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [respostaProduto, setRespostaProduto] = useState('');
  const [saving, setSaving] = useState(false);

  const carregarTodos = useCallback(async (pageTarget = 1) => {
    setLoading(true);
    try {
      const res = await solicitacoesAPI.getAll({ page: pageTarget, limit: PAGE_SIZE });
      const list = Array.isArray(res?.data) ? res.data : [];
      setAllRows(list);
      const pg = res?.pagination || {};
      setCurrentPage(Number(pg.page) > 0 ? Number(pg.page) : pageTarget);
      setTotalItems(Number(pg.total) >= 0 ? Number(pg.total) : list.length);
      setTotalPages(Number(pg.totalPages) > 0 ? Number(pg.totalPages) : 1);
    } catch (err) {
      console.error('[DevRequisicoesTab] carregarTodos:', err);
      toast.error(err?.message || 'Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarCpf = useCallback(async (pageTarget = 1, cpfOverride = null) => {
    const cpfInput = cpfOverride != null ? cpfOverride : searchCpf;
    const digits = String(cpfInput || '').replace(/\D/g, '');
    if (digits.length !== 11) {
      toast.error('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await solicitacoesAPI.getByCpf(digits, { page: pageTarget, limit: PAGE_SIZE });
      setSearchResults(Array.isArray(res?.data) ? res.data : []);
      const pg = res?.pagination || {};
      setCurrentPage(Number(pg.page) > 0 ? Number(pg.page) : pageTarget);
      setTotalItems(Number(pg.total) >= 0 ? Number(pg.total) : 0);
      setTotalPages(Number(pg.totalPages) > 0 ? Number(pg.totalPages) : 1);
    } catch (err) {
      console.error('[DevRequisicoesTab] buscarCpf:', err);
      toast.error(err?.message || 'Erro na busca por CPF');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchCpf]);

  const limparBusca = useCallback(() => {
    setSearchCpf('');
    setSearchResults([]);
    setSearched(false);
    setCurrentPage(1);
    setTotalItems(0);
    setTotalPages(1);
    void carregarTodos(1);
  }, [carregarTodos]);

  const abrirModal = useCallback(async (row) => {
    const rawId = row?._id ?? row?.id;
    const id = normalizeMongoId(rawId) || String(rawId || '').trim();
    if (!id) return;
    try {
      const res = await solicitacoesAPI.getById(id);
      setSelectedDoc(res?.data || row);
      setRespostaProduto('');
    } catch (err) {
      console.error('[DevRequisicoesTab] abrirModal:', err);
      setSelectedDoc(row);
      setRespostaProduto('');
    }
  }, []);

  const recarregarListas = useCallback(async () => {
    const digits = String(searchCpf || '').replace(/\D/g, '');
    if (searched && digits.length === 11) {
      await buscarCpf(currentPage, digits);
      return;
    }
    await carregarTodos(currentPage);
  }, [carregarTodos, buscarCpf, currentPage, searchCpf, searched]);

  const enviarRespostaProduto = useCallback(
    async (statusAlvo) => {
      const texto = String(respostaProduto || '').trim();
      if (!texto) {
        toast.error('Preencha a resposta do time de produto.');
        return;
      }
      const rawId = selectedDoc?._id ?? selectedDoc?.id;
      const id = normalizeMongoId(rawId) || String(rawId || '').trim();
      if (!id) return;

      setSaving(true);
      try {
        await solicitacoesAPI.addReply(id, {
          origem: 'produtos',
          status: statusAlvo,
          msgProdutos: texto,
          msgN1: null,
        });
        const updated = await solicitacoesAPI.getById(id);
        setSelectedDoc(updated?.data || selectedDoc);
        setRespostaProduto('');
        await recarregarListas();
        if (statusAlvo === 'enviado') {
          toast.success('Mensagem salva.');
        } else {
          toast.success(`Status aplicado: ${statusAlvo}`);
        }
      } catch (err) {
        console.error('[DevRequisicoesTab] enviarRespostaProduto:', err);
        toast.error(err?.message || 'Falha ao aplicar status');
      } finally {
        setSaving(false);
      }
    },
    [respostaProduto, selectedDoc, recarregarListas],
  );

  const rows = useMemo(() => {
    if (searched) return searchResults;
    return allRows;
  }, [searched, searchResults, allRows]);

  const irParaPagina = useCallback(
    async (pageTarget) => {
      const page = Math.max(1, Math.min(Number(pageTarget) || 1, totalPages || 1));
      if (searched) {
        await buscarCpf(page);
        return;
      }
      await carregarTodos(page);
    },
    [buscarCpf, carregarTodos, searched, totalPages],
  );

  useEffect(() => {
    carregarTodos();
  }, [carregarTodos]);

  const statusSelecionado = getStatusChamado(selectedDoc);
  const statusAt = getStatusChamadoAssignedAt(selectedDoc);
  const dialogue = buildProdutosN1Dialogue(Array.isArray(selectedDoc?.reply) ? selectedDoc.reply : []);
  const selectedDocId = normalizeMongoId(selectedDoc?._id ?? selectedDoc?.id) || '—';
  const selectedDocAgente = String(
    selectedDoc?.colaboradorNome ||
      selectedDoc?.agente ||
      selectedDoc?.payload?.agente ||
      selectedDoc?.payload?.colaboradorNome ||
      '',
  ).trim() || '—';
  const selectedDocDataHora = selectedDoc?.createdAt
    ? new Date(selectedDoc.createdAt).toLocaleString('pt-BR')
    : '—';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-vh-card shadow-lg p-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          className="min-w-0 flex-1 basis-[180px] border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="CPF"
          value={formatarCPF(searchCpf)}
          onChange={(e) => setSearchCpf(formatarCPF(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              buscarCpf();
            }
          }}
        />
        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          onClick={buscarCpf}
          disabled={loading}
        >
          Buscar
        </button>
        <button
          type="button"
          className="text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          onClick={limparBusca}
          disabled={loading}
        >
          Limpar
        </button>
        <button
          type="button"
          className="text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          onClick={carregarTodos}
          disabled={loading}
        >
          Atualizar
        </button>
      </div>

      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Carregando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const rid = normalizeMongoId(r._id ?? r.id) || String(r._id ?? r.id);
                const status = getStatusChamado(r);
                return (
                  <tr
                    key={rid}
                    className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => abrirModal(r)}
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.tipo || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{formatarCPF(r.cpf || '') || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                          status,
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {totalItems > 0 ? `${totalItems} registro(s) encontrados` : 'Nenhum registro'}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            onClick={() => irParaPagina(currentPage - 1)}
            disabled={loading || currentPage <= 1}
          >
            Anterior
          </button>
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Página {currentPage} de {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            onClick={() => irParaPagina(currentPage + 1)}
            disabled={loading || currentPage >= totalPages}
          >
            Próxima
          </button>
        </div>
      </div>

      {selectedDoc ? (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setSelectedDoc(null)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-vh-container max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dev-requisicoes-modal-title"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 id="dev-requisicoes-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {selectedDoc.tipo || '—'} — {formatarCPF(selectedDoc.cpf || '') || '—'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                      statusSelecionado,
                    )}`}
                  >
                    {statusSelecionado}
                  </span>
                  {isTerminalChamadoStatusForHeader(statusSelecionado) && statusAt ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{statusAt.toLocaleString('pt-BR')}</span>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60">
                    <span className="font-medium text-gray-600 dark:text-gray-300">Agente solicitante:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-100">{selectedDocAgente}</span>
                  </div>
                  <div className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60">
                    <span className="font-medium text-gray-600 dark:text-gray-300">Data/hora:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-100">{selectedDocDataHora}</span>
                  </div>
                  <div className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60">
                    <span className="font-medium text-gray-600 dark:text-gray-300">ID MongoDB:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-100 font-mono break-all">{selectedDocId}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Respostas do time</h4>
                {dialogue.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-4 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
                    Nenhuma mensagem registrada.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dialogue.map((b) => (
                      <div key={b.key} className="text-sm text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700/50">
                        <div className="font-semibold mb-1">
                          {b.role === 'produtos' ? 'Time Produtos' : b.role === 'n1' ? 'N1' : 'Evento'}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{b.text}</div>
                        {b.at ? <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{b.at}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
              <label htmlFor="dev-resposta-produto" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Resposta do time de produto
              </label>
              <textarea
                id="dev-resposta-produto"
                rows={3}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[72px] disabled:opacity-60"
                value={respostaProduto}
                onChange={(e) => setRespostaProduto(e.target.value)}
                disabled={saving}
              />
              <div className="flex justify-end items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => enviarRespostaProduto('enviado')}
                  disabled={saving}
                  className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => enviarRespostaProduto('feito')}
                  disabled={saving}
                  className="text-sm px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors disabled:opacity-50"
                >
                  Feito
                </button>
                <button
                  type="button"
                  onClick={() => enviarRespostaProduto('não feito')}
                  disabled={saving}
                  className="text-sm px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                >
                  Não feito
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

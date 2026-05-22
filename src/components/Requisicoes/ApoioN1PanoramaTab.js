/**
 * VeloHub V3 - ApoioN1PanoramaTab (Req_Prod — visão geral, credencial Apoio N1)
 * VERSION: v1.0.12 | DATE: 2026-05-22 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.12: Paginação da tabela (50/página) + subcomponentes em arquivos separados (evita stack overflow React Refresh)
 * - v1.0.11: CPF na listagem com `text-sm` (alinhado à tabela; antes `text-xs`)
 * - v1.0.10: Ícone copiar CPF com SVG inline (evita stack overflow do Fast Refresh com lucide Copy)
 * - v1.0.9: Ícone copiar CPF na coluna da listagem (visão geral)
 */

// @refresh reset

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FloatingLabelField } from '../shared/FloatingLabelField';
import { apoioN1API } from '../../services/requisicoesApi';
import { getUserSession } from '../../services/auth';
import toast from 'react-hot-toast';
import { getStatusChamado, statusChamadoBadgeClass } from '../../utils/requisicoesModalHelpers';
import { panoramaTipoLabel, PanoramaDetailModal } from './ApoioN1PanoramaModal';
import { ApoioN1PanoramaCpfCell } from './ApoioN1PanoramaCpfCell';

const PAGE_SIZE = 50;

const inputClass =
  'border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white';

const getUserEmail = () => {
  try {
    const session = getUserSession();
    if (session?.user?.email) return session.user.email;
  } catch {
    /* ignore */
  }
  return null;
};

const panoramaTipoColunaValor = (r) => {
  if (r?.panoramaRegistroTipo === 'liberacao-chave-pix') return 'Liberação chave PIX';
  return r?.tipo || '—';
};

function ApoioN1PanoramaTab() {
  const [email, setEmail] = useState('');
  const [origem, setOrigem] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [colaboradorNome, setColaboradorNome] = useState('');
  const [statusChamado, setStatusChamado] = useState('');
  const [agentes, setAgentes] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agentesLoading, setAgentesLoading] = useState(false);
  const [detailDoc, setDetailDoc] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const em = getUserEmail();
    setEmail(em || '');
  }, []);

  const loadAgentes = useCallback(async () => {
    const em = email || getUserEmail();
    if (!em) return;
    setAgentesLoading(true);
    try {
      const res = await apoioN1API.getAgentes(em);
      setAgentes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('[ApoioN1PanoramaTab] agentes:', e);
      toast.error(e.message || 'Erro ao carregar lista de agentes');
      setAgentes([]);
    } finally {
      setAgentesLoading(false);
    }
  }, [email]);

  const loadOverview = useCallback(async () => {
    const em = email || getUserEmail();
    if (!em) {
      toast.error('Sessão sem e-mail. Faça login novamente.');
      return;
    }
    setLoading(true);
    try {
      const res = await apoioN1API.getOverview(
        {
          origem,
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
          colaboradorNome: colaboradorNome || undefined,
          statusChamado: statusChamado || undefined,
        },
        em
      );
      setRows(Array.isArray(res.data) ? res.data : []);
      setPage(0);
    } catch (e) {
      console.error('[ApoioN1PanoramaTab] overview:', e);
      toast.error(e.message || 'Erro ao carregar visão geral');
      setRows([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, [email, origem, dataInicio, dataFim, colaboradorNome, statusChamado]);

  useEffect(() => {
    if (!email) return;
    loadAgentes();
  }, [email, loadAgentes]);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apoioN1API.getOverview(
          {
            origem: 'todos',
            dataInicio: undefined,
            dataFim: undefined,
            colaboradorNome: undefined,
            statusChamado: undefined,
          },
          email
        );
        if (!cancelled) {
          setRows(Array.isArray(res.data) ? res.data : []);
          setPage(0);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[ApoioN1PanoramaTab] overview inicial:', e);
          toast.error(e.message || 'Erro ao carregar visão geral');
          setRows([]);
          setPage(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
    [rows.length]
  );

  const safePage = page >= totalPages ? Math.max(0, totalPages - 1) : page;

  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  const onSubmitFilters = (e) => {
    e.preventDefault();
    loadOverview();
  };

  const showPagination = !loading && rows.length > PAGE_SIZE;

  return (
    <div className="w-full min-w-0">
      <form onSubmit={onSubmitFilters} className="mb-6">
        <div className="flex flex-nowrap items-end gap-4 overflow-x-auto pb-1">
          <div className="shrink-0 min-w-[280px]">
            <FloatingLabelField
              label="Tipo"
              value={origem}
              helperText="Solicitações, Erros/Bugs ou Liberação chave PIX"
            >
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className={`${inputClass} w-full min-w-[280px]`}
              >
                <option value="todos">Todos — Solicitações, Erros/Bugs e Liberação chave PIX</option>
                <option value="solicitacoes">Solicitações</option>
                <option value="erros-bugs">Erros/Bugs</option>
                <option value="liberacao-chave-pix">Liberação chave PIX</option>
              </select>
            </FloatingLabelField>
          </div>
          <div className="shrink-0 flex flex-nowrap items-end gap-2">
            <FloatingLabelField id="apoio-n1-data-inicio" label="Data inicial" value={dataInicio}>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`${inputClass} min-w-[9.5rem]`}
              />
            </FloatingLabelField>
            <span className="text-gray-500 text-sm shrink-0 pb-2.5">até</span>
            <FloatingLabelField id="apoio-n1-data-fim" label="Data final" value={dataFim}>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={`${inputClass} min-w-[9.5rem]`}
              />
            </FloatingLabelField>
          </div>
          <div className="shrink-0 min-w-[200px]">
            <FloatingLabelField label="Agente" value={colaboradorNome}>
              <select
                value={colaboradorNome}
                onChange={(e) => setColaboradorNome(e.target.value)}
                className={`${inputClass} w-full min-w-[200px]`}
                disabled={agentesLoading}
              >
                <option value="">Todos</option>
                {agentes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FloatingLabelField>
          </div>
          <div className="shrink-0 min-w-[160px]">
            <FloatingLabelField label="Status do chamado" value={statusChamado}>
              <select
                value={statusChamado}
                onChange={(e) => setStatusChamado(e.target.value)}
                className={`${inputClass} w-full min-w-[160px]`}
              >
                <option value="">Todos</option>
                <option value="enviado">Enviado</option>
                <option value="feito">Feito</option>
                <option value="não feito">Não feito</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </FloatingLabelField>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando…' : 'Aplicar filtros'}
          </button>
          <button
            type="button"
            onClick={() => {
              loadAgentes();
              loadOverview();
            }}
            className="shrink-0 px-4 py-2 rounded-lg border border-gray-400 dark:border-gray-500 text-sm text-gray-800 dark:text-gray-200"
          >
            Atualizar
          </button>
        </div>
      </form>

      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium">Registro</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">Agente</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              pageRows.map((r) => {
                const id = r._id ?? r.id;
                const keyId = `${r.panoramaRegistroTipo ?? r.origem}-${id}`;
                const st = r.statusChamado || getStatusChamado(r);
                return (
                  <tr
                    key={keyId}
                    className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setDetailDoc(r)}
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{panoramaTipoLabel(r)}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={panoramaTipoColunaValor(r)}>
                      {panoramaTipoColunaValor(r)}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-sm text-gray-800 dark:text-gray-200"
                      onClick={(e) => {
                        if (e.target.closest('[data-copy-cpf]')) e.stopPropagation();
                      }}
                    >
                      <ApoioN1PanoramaCpfCell cpf={r.cpf} />
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{r.colaboradorNome || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                          st
                        )}`}
                      >
                        {st}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-300">
          <span>
            {rows.length} registro{rows.length !== 1 ? 's' : ''} — página {safePage + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-400 dark:border-gray-500 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-400 dark:border-gray-500 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {detailDoc ? <PanoramaDetailModal doc={detailDoc} onClose={() => setDetailDoc(null)} /> : null}
    </div>
  );
}

export default ApoioN1PanoramaTab;

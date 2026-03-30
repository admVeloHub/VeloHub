/**
 * VeloHub V3 - ApoioN1PanoramaTab (Req_Prod — visão geral, credencial Apoio N1)
 * VERSION: v1.0.2 | DATE: 2026-03-30 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.0.2:
 * - Removidos wrappers de card (sombra/arredondamento) e flex-wrap na barra de filtros (linha única com scroll horizontal)
 *
 * Mudanças v1.0.1:
 * - Título do painel: "Visão geral" (sem N1 no rótulo visível)
 *
 * Listagem filtrada de solicitações e erros/bugs (todos os agentes), somente leitura.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { apoioN1API } from '../../services/escalacoesApi';
import { getUserSession } from '../../services/auth';
import toast from 'react-hot-toast';
import {
  buildModalExtraPayloadCells,
  buildProdutosN1Dialogue,
  getStatusChamado,
  ModalInfoGridCell,
  statusChamadoBadgeClass,
} from '../../utils/escalacoesModalHelpers';

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

const origemLabel = (o) => (o === 'erros-bugs' ? 'Erros/Bugs' : 'Solicitações');

const AnexosReadonly = ({ doc }) => {
  const imgs = Array.isArray(doc?.payload?.imagens) ? doc.payload.imagens : [];
  const vids = Array.isArray(doc?.payload?.videos) ? doc.payload.videos : [];
  const legacyPreviews = Array.isArray(doc?.payload?.previews) ? doc.payload.previews : [];
  const urlsFromImagens = imgs.map((i) => i?.imagemUrl || i?.url).filter(Boolean);
  const imageSrcs = [...legacyPreviews, ...urlsFromImagens].filter(Boolean);
  if (imageSrcs.length === 0 && vids.length === 0) return null;
  return (
    <div>
      <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Anexos</h4>
      {imageSrcs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {imageSrcs.map((src, idx) => (
            <button
              key={`img-${idx}`}
              type="button"
              className="p-0 border-0 bg-transparent cursor-pointer"
              onClick={() => window.open(src, '_blank')}
            >
              <img
                src={src}
                alt={`anexo-${idx}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
            </button>
          ))}
        </div>
      )}
      {vids.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {vids.length} vídeo(s) — abrir registro no sistema de origem para reprodução se necessário.
        </div>
      )}
    </div>
  );
};

const PanoramaDetailModal = ({ doc, onClose }) => {
  if (!doc) return null;
  const replyArray = Array.isArray(doc.reply) ? doc.reply : [];
  const dialogue = buildProdutosN1Dialogue(replyArray);
  const status = getStatusChamado(doc);
  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full min-h-[50vh] max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apoio-n1-modal-title"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3
              id="apoio-n1-modal-title"
              className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-snug"
            >
              {origemLabel(doc.origem)} — {doc.tipo || '—'} — {doc.cpf || '—'}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                status
              )}`}
            >
              {status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-3">
              <ModalInfoGridCell label="CPF" value={doc.cpf || '—'} />
              <ModalInfoGridCell label="Tipo" value={doc.tipo || '—'} />
              <ModalInfoGridCell
                label="Data"
                value={doc.createdAt ? new Date(doc.createdAt).toLocaleString('pt-BR') : '—'}
              />
              <ModalInfoGridCell label="Agente" value={doc.colaboradorNome || doc?.payload?.agente || '—'} />
              {buildModalExtraPayloadCells(doc).map((c) => (
                <ModalInfoGridCell key={c.key} label={c.label} value={c.value} />
              ))}
            </div>
          </div>
          <AnexosReadonly doc={doc} />
          <div>
            <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Respostas do time</h4>
            {dialogue.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-4 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
                Nenhuma mensagem de Produtos ou N1 registrada.
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
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 p-3 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Visualização somente leitura (Apoio N1). Ações de resposta usam as abas Solicitações ou Erros/Bugs.
          </p>
        </div>
      </div>
    </div>
  );
};

const ApoioN1PanoramaTab = () => {
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
    } catch (e) {
      console.error('[ApoioN1PanoramaTab] overview:', e);
      toast.error(e.message || 'Erro ao carregar visão geral');
      setRows([]);
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
        if (!cancelled) setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) {
          console.error('[ApoioN1PanoramaTab] overview inicial:', e);
          toast.error(e.message || 'Erro ao carregar visão geral');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const onSubmitFilters = (e) => {
    e.preventDefault();
    loadOverview();
  };

  return (
    <div className="w-full min-w-0">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Visão geral
      </h2>
      <form onSubmit={onSubmitFilters} className="mb-6">
        <div className="flex flex-nowrap items-end gap-4 overflow-x-auto pb-1">
          <div className="shrink-0">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo</label>
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className={`${inputClass} min-w-[180px]`}
            >
              <option value="todos">Solicitações e Erros/Bugs</option>
              <option value="solicitacoes">Solicitações</option>
              <option value="erros-bugs">Erros/Bugs</option>
            </select>
          </div>
          <div className="shrink-0">
            <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Período</span>
            <div className="flex flex-nowrap items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={inputClass}
                aria-label="Data inicial"
              />
              <span className="text-gray-500 text-sm shrink-0">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={inputClass}
                aria-label="Data final"
              />
            </div>
          </div>
          <div className="shrink-0">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Agente</label>
            <select
              value={colaboradorNome}
              onChange={(e) => setColaboradorNome(e.target.value)}
              className={`${inputClass} min-w-[200px]`}
              disabled={agentesLoading}
            >
              <option value="">Todos</option>
              {agentes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="shrink-0">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status do chamado
            </label>
            <select
              value={statusChamado}
              onChange={(e) => setStatusChamado(e.target.value)}
              className={`${inputClass} min-w-[160px]`}
            >
              <option value="">Todos</option>
              <option value="enviado">Enviado</option>
              <option value="feito">Feito</option>
              <option value="não feito">Não feito</option>
              <option value="Cancelado">Cancelado</option>
            </select>
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
                rows.map((r) => {
                  const id = r._id ?? r.id;
                  const key = `${r.origem}-${id}`;
                  const st = r.statusChamado || getStatusChamado(r);
                  return (
                    <tr
                      key={key}
                      className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setDetailDoc(r)}
                    >
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{origemLabel(r.origem)}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={r.tipo}>
                        {r.tipo || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.cpf || '—'}</td>
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

      {detailDoc ? <PanoramaDetailModal doc={detailDoc} onClose={() => setDetailDoc(null)} /> : null}
    </div>
  );
};

export default ApoioN1PanoramaTab;

/**
 * VeloHub V3 — Aba Chargeback (módulo Ouvidoria / Reclamações)
 * VERSION: v1.7.4 | DATE: 2026-05-12 | AUTHOR: VeloHub Development Team
 *
 * Layout em duas colunas (lg+): formulário à esquerda; sidebar à direita com a mesma altura da coluna do form (base alinhada ao rodapé do formulário); lista rolável.
 *
 * Referência:
 * - v1.7.4: Card «Protocolo» na sidebar — mesmo pill visual das reclamações (rounded-vh-card / azul institucional)
 * - v1.7.3: Rótulo do card — «Protocolo» (alinhado ao form)
 * - v1.7.2: Sidebar — rótulo «Protocolo Chargeback» + valor (`numeroProtocolo` ou fallback legível)
 * - v1.7.1: Cards da sidebar só protocolo, CPF e data; card inteiro clicável (`aria-label`); sem produto/valor/status/texto «Abrir tratamento»
 * - v1.7.0: Sidebar em cards clicáveis; abre modal «Continuar tratamento» (`FormChargebackOuvidoria` modo edição / PUT)
 * - v1.6.0: Sidebar — busca por CPF (`GET .../chargeback?cpf=`); Botão «Atualizar lista» mantém o filtro aplicado
 * - v1.5.1: Sidebar sem altura em `100vh`; `lg:items-stretch` + `overflow-hidden`/`min-h-0` para igualar altura ao formulário e rolar só a lista
 * - v1.5.0: Sidebar largura fixa (`lg:w-96`), altura `calc(100vh - 6rem)`; conteúdo da lista em `overflow-y-auto` (não expande o layout)
 * - v1.4.2: Removido texto técnico de coleção/banco da sidebar (não é conteúdo de interface para o usuário)
 * - v1.4.1: Removida faixa decorativa (gradiente) acima de «Registros recentes»
 * - v1.4.0: Lista «Registros recentes» como sidebar (direita em desktop; empilhada em mobile)
 * - v1.3.0: Card/borda só na seção «Registros recentes»; form direto no layout da página (sem fundo de container)
 * - v1.2.0: Formulário + lista hub_ouvidoria.reclamacoes_chargeback
 */

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { chargebackAPI } from '../../services/ouvidoriaApi';
import FormChargebackOuvidoria from './FormChargebackOuvidoria';
import ModalChargebackTratamento from './ModalChargebackTratamento';
import { FloatingLabelField } from '../shared/FloatingLabelField';

function formatCPF(val) {
  const cleaned = String(val || '').replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return String(val || '');
}

function cpfValido11(cpf) {
  return String(cpf || '').replace(/\D/g, '').length === 11;
}

function fmtDate(val) {
  if (val == null || val === '') return '—';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString('pt-BR');
  } catch {
    return String(val);
  }
}

/**
 * @param {object} [props]
 * @param {string} [props.responsavel]
 */
export default function ChargebackOuvidoria({ responsavel = '' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cpfBuscaLista, setCpfBuscaLista] = useState('');
  /** CPF só dígitos aplicado na API (11) ou string vazia = todos */
  const [cpfListaAplicado, setCpfListaAplicado] = useState('');
  /** ID MongoDB do chargeback para o modal de tratamento */
  const [tratamentoRecordId, setTratamentoRecordId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 200 };
      if (cpfListaAplicado.length === 11) params.cpf = cpfListaAplicado;
      const res = await chargebackAPI.list(params);
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar chargeback');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cpfListaAplicado]);

  useEffect(() => {
    load();
  }, [load]);

  const aplicarBuscaCpfLista = () => {
    const d = cpfBuscaLista.replace(/\D/g, '');
    if (d.length === 0) {
      setCpfListaAplicado('');
      return;
    }
    if (!cpfValido11(d)) {
      toast.error('Informe um CPF com 11 dígitos para filtrar.');
      return;
    }
    setCpfListaAplicado(d);
  };

  const limparBuscaCpfLista = () => {
    setCpfBuscaLista('');
    setCpfListaAplicado('');
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-8">
      <div className="min-w-0 flex-1 lg:min-h-0">
        <FormChargebackOuvidoria responsavel={responsavel} onSaved={load} />
      </div>

      <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden lg:w-96 lg:self-stretch">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-vh-card border border-[var(--cor-borda,#e5e7eb)] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 shrink-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Registros recentes</h2>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {loading ? 'Carregando…' : 'Atualizar lista'}
              </button>
            </div>

            <div className="min-w-0">
              <FloatingLabelField id="cbk-lista-cpf" label="Buscar por CPF" value={cpfBuscaLista} className="min-w-0">
                <input
                  id="cbk-lista-cpf"
                  type="text"
                  autoComplete="off"
                  value={cpfBuscaLista}
                  onChange={(e) => setCpfBuscaLista(formatCPF(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      aplicarBuscaCpfLista();
                    }
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`box-border min-h-12 w-full rounded-lg border px-3 text-sm outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                    cpfValido11(cpfBuscaLista)
                      ? 'border-2 border-green-500'
                      : 'border border-gray-400 dark:border-gray-500'
                  } focus:ring-1 focus:ring-blue-500`}
                />
              </FloatingLabelField>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={aplicarBuscaCpfLista}
                  disabled={loading}
                  className="rounded-lg border border-[#006AB9] bg-transparent px-3 py-2 text-sm font-medium text-[#006AB9] transition-colors hover:bg-[#006AB9] hover:text-[#F3F7FC] disabled:opacity-50 dark:bg-gray-800"
                >
                  Buscar
                </button>
                {cpfListaAplicado.length === 11 ? (
                  <button
                    type="button"
                    onClick={limparBuscaCpfLista}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Limpar filtro
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            {error ? (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </div>
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum registro encontrado.</p>
            ) : null}

            {items.length > 0 ? (
              <ul className="space-y-3 pb-2">
                {items.map((row, idx) => {
                  const id = row._id != null ? String(row._id) : '';
                  const protoCbk =
                    row.numeroProtocolo != null && String(row.numeroProtocolo).trim()
                      ? String(row.numeroProtocolo).trim()
                      : row.protocolo != null && String(row.protocolo).trim()
                        ? String(row.protocolo).trim()
                        : '';
                  const cpfFmt =
                    row.cpf != null && String(row.cpf).replace(/\D/g, '').length >= 11
                      ? formatCPF(String(row.cpf).replace(/\D/g, ''))
                      : row.cpf != null
                        ? String(row.cpf)
                        : '—';
                  return (
                    <li key={id || `row-${idx}`}>
                      <button
                        type="button"
                        disabled={!id}
                        onClick={() => id && setTratamentoRecordId(id)}
                        aria-label={`Abrir chargeback ${protoCbk || id}`}
                        className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-3 text-left text-sm transition-colors hover:border-[#006AB9] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900/30 dark:hover:bg-gray-800"
                      >
                        <div className="flex h-10 min-h-10 w-fit max-w-full shrink-0 flex-nowrap items-center gap-2 rounded-vh-card border border-gray-300/80 bg-[#E8EEF5]/90 px-2.5 dark:border-gray-600 dark:bg-[#323a42]">
                          <span className="whitespace-nowrap text-xs font-medium text-gray-600 dark:text-gray-300">
                            Protocolo
                          </span>
                          <span className="velohub-title min-w-0 max-w-[14rem] truncate text-xs font-semibold tabular-nums text-[#006AB9] dark:text-[#93c5fd]">
                            {protoCbk || '—'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{cpfFmt}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">{fmtDate(row.createdAt)}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </aside>

      <ModalChargebackTratamento
        open={Boolean(tratamentoRecordId)}
        recordId={tratamentoRecordId}
        responsavel={responsavel}
        onClose={() => setTratamentoRecordId(null)}
        onSuccess={load}
      />
    </div>
  );
}

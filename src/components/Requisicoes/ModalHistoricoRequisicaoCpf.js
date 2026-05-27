/**
 * VeloHub V3 — Modal histórico Req_Prod por CPF (antes de novo envio / Solicitar Liberação)
 * VERSION: v1.0.2 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.2: Subtexto no cabeçalho — «Certifique-se de não ser uma requisição redundante»
 * - v1.0.1: Título do histórico — «Histórico de requisições para o CPF» (sem «nesta aba»)
 * - v1.0.0: Paridade visual com FormSolicitacao (abertas / resolvidas, confirmar ou fechar)
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { formatDataAberturaRequisicaoModal } from '../../utils/requisicoesModalHelpers';

/**
 * @param {object} props
 * @param {{ cpfDisplay?: string, abertas: Array<object>, resolvidas: Array<object> }|null} props.data
 * @param {() => void} props.onClose
 * @param {() => void} props.onConfirm
 * @param {string} [props.confirmLabel]
 * @param {boolean} [props.confirmDisabled]
 * @param {string} [props.titleId]
 * @param {string} [props.subtitulo]
 */
export default function ModalHistoricoRequisicaoCpf({
  data,
  onClose,
  onConfirm,
  confirmLabel = 'Confirmar envio',
  confirmDisabled = false,
  titleId = 'modal-historico-requisicao-cpf-title',
  subtitulo = 'Certifique-se de não ser uma requisição redundante',
}) {
  if (!data || typeof document === 'undefined') return null;

  const titulo =
    data.abertas.length > 0
      ? `Requisição em aberto para o CPF ${data.cpfDisplay || '—'}`
      : `Histórico de requisições para o CPF ${data.cpfDisplay || '—'}`;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10060 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitulo ? `${titleId}-sub` : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/60"
        onClick={onClose}
        aria-label="Fechar sem continuar"
      />
      <div
        className="relative w-full max-w-lg max-h-[min(92vh,640px)] flex flex-col rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
        style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
      >
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-[#000058]/5 dark:bg-gray-900/40">
          <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {titulo}
          </h2>
          {subtitulo ? (
            <p
              id={`${titleId}-sub`}
              className="mt-1 text-sm text-gray-600 dark:text-gray-400"
            >
              {subtitulo}
            </p>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Solicitações abertas
            </h3>
            <div
              className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
              style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
            >
              {data.abertas.length === 0 ? (
                <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma encontrada nesta lista.</p>
              ) : (
                data.abertas.map((row) => (
                  <div key={row.key} className="p-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{row.tipo}</div>
                    {row.origemLabel ? (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Origem: {row.origemLabel}
                      </div>
                    ) : null}
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Status: {row.statusChamado === 'enviado' ? 'enviado' : row.statusChamado}
                      {' · '}
                      Data de abertura: {formatDataAberturaRequisicaoModal(row.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Solicitações resolvidas
            </h3>
            <div
              className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
              style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
            >
              {data.resolvidas.length === 0 ? (
                <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma encontrada nesta lista.</p>
              ) : (
                data.resolvidas.map((row) => (
                  <div key={row.key} className="p-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{row.tipo}</div>
                    {row.origemLabel ? (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Origem: {row.origemLabel}
                      </div>
                    ) : null}
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Status: {row.statusChamado}
                      {' · '}
                      Data de abertura: {formatDataAberturaRequisicaoModal(row.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
            style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
          >
            Fechar
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

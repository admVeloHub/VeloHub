/**
 * VeloHub V3 - Corpo do modal «Fundir ocorrências»
 * VERSION: v1.1.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * - v1.1.0: Seleção clicável de tickets (abertas/fechadas) — linha azul médio e texto branco
 * - v1.0.4: Lista sem tickets já absorvidos por fusão (inferior)
 */

import React from 'react';
import {
  formatCpfFusaoModal,
  partitionFusaoModalDocs,
} from '../../utils/ouvidoriaFusaoModalDisplay';

const FUSAO_ROW_SELECTED_BG = '#3b82f6';

/** @param {object} props */
function FusaoOcorrenciasTabela({
  rows,
  emptyLabel,
  selectedTicketIds,
  onToggleTicketId,
  selectable = false,
}) {
  if (!rows.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>;
  }
  const cell = 'py-1.5 align-top px-1.5 first:pl-0 last:pr-0';
  const selectedSet =
    selectedTicketIds instanceof Set
      ? selectedTicketIds
      : new Set(Array.isArray(selectedTicketIds) ? selectedTicketIds : []);

  return (
    <table className="w-full border-collapse text-left text-sm table-auto">
      <thead>
        <tr className="border-b border-gray-300 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-600 dark:text-gray-400">
          <th className={`${cell} whitespace-nowrap`}>Tipo</th>
          <th className={`${cell} whitespace-nowrap`}>Protocolo</th>
          <th className={cell}>Motivo</th>
          <th className={`${cell} whitespace-nowrap`}>Data</th>
          <th className={`${cell} whitespace-nowrap`}>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const docId = row.docId != null ? String(row.docId) : '';
          const canSelect = selectable && Boolean(docId);
          const isSelected = canSelect && selectedSet.has(docId);
          const rowClass = [
            'border-b border-gray-200 dark:border-gray-700',
            canSelect ? 'cursor-pointer' : '',
            isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200',
          ]
            .filter(Boolean)
            .join(' ');

          const handleActivate = () => {
            if (canSelect && onToggleTicketId) onToggleTicketId(docId);
          };

          return (
            <tr
              key={row.key}
              className={rowClass}
              style={isSelected ? { backgroundColor: FUSAO_ROW_SELECTED_BG } : undefined}
              role={canSelect ? 'button' : undefined}
              tabIndex={canSelect ? 0 : undefined}
              onClick={canSelect ? handleActivate : undefined}
              onKeyDown={
                canSelect
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleActivate();
                      }
                    }
                  : undefined
              }
            >
              <td className={`${cell} whitespace-nowrap`}>{row.tipoLabel}</td>
              <td className={`${cell} whitespace-nowrap`}>{row.protocolo}</td>
              <td className={`${cell} break-words`}>{row.motivo}</td>
              <td className={`${cell} whitespace-nowrap`}>{row.data}</td>
              <td className={`${cell} whitespace-nowrap font-medium`}>{row.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * @param {object} props
 */
export default function ModalFusaoOcorrencias({
  fusaoConsultaCtx,
  redundantePapel,
  selectedTicketIds,
  onToggleTicketId,
  children,
}) {
  const { currentRow, abertas, fechadas } = partitionFusaoModalDocs(fusaoConsultaCtx, {
    redundantePapel,
  });

  return (
    <>
      <header className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 id="modal-fusao-titulo" className="velohub-title text-xl font-semibold">
          Fundir ocorrências
        </h2>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          CPF: {formatCpfFusaoModal(fusaoConsultaCtx.cpf)}
        </p>
      </header>

      <section className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Ocorrência atual</h3>
        {currentRow ? (
          <FusaoOcorrenciasTabela rows={[currentRow]} emptyLabel="—" />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
        )}
      </section>

      <section className="mb-4 rounded-lg border border-gray-300 p-2 dark:border-gray-600">
        <h3 className="mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">Ocorrências abertas</h3>
        <FusaoOcorrenciasTabela
          rows={abertas}
          emptyLabel="Nenhuma"
          selectable
          selectedTicketIds={selectedTicketIds}
          onToggleTicketId={onToggleTicketId}
        />
      </section>

      <section className="mb-4 rounded-lg border border-gray-300 p-2 dark:border-gray-600">
        <h3 className="mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">Ocorrências fechadas</h3>
        <FusaoOcorrenciasTabela
          rows={fechadas}
          emptyLabel="Nenhuma"
          selectable
          selectedTicketIds={selectedTicketIds}
          onToggleTicketId={onToggleTicketId}
        />
      </section>

      {children}
    </>
  );
}

/**
 * VeloHub V3 — Modal continuar tratamento Chargeback
 * VERSION: v1.0.0 | DATE: 2026-05-12 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import FormChargebackOuvidoria from './FormChargebackOuvidoria';

/**
 * @param {object} p
 * @param {boolean} p.open
 * @param {string|null} p.recordId
 * @param {string} [p.responsavel]
 * @param {() => void} p.onClose
 * @param {() => void} [p.onSuccess]
 */
export default function ModalChargebackTratamento({ open, recordId, responsavel = '', onClose, onSuccess }) {
  if (!open || !recordId) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[min(95vh,56rem)] max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg shadow-xl"
        style={{
          borderRadius: 'var(--velohub-radius-container)',
          backgroundColor: 'var(--cor-container)',
          border: '1px solid var(--cor-borda)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-chargeback-tratamento-titulo"
      >
        <div
          className="flex flex-shrink-0 items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--cor-borda)' }}
        >
          <h2 id="modal-chargeback-tratamento-titulo" className="text-xl font-semibold velohub-title">
            Continuar tratamento — Chargeback
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-2xl leading-none text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <FormChargebackOuvidoria
            key={recordId}
            mode="edit"
            recordId={recordId}
            embedded
            responsavel={responsavel}
            onSaved={() => {
              onSuccess?.();
              onClose?.();
            }}
          />
        </div>
      </div>
    </div>
  );
}

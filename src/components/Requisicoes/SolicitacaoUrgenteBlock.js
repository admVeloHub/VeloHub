/**
 * VeloHub V3 — Bloco «Solicitação Urgente» (Req_Prod / Erros-Bugs)
 * VERSION: v1.0.1 | DATE: 2026-05-15 | AUTHOR: VeloHub Development Team
 *
 * Referência:
 * - v1.0.1: Componente na pasta `src/components/Requisicoes/` (rename do módulo)
 *
 * Botão que expande checkboxes N2, RA, Bacen, ProCon — valores true viram campos no payload (urgenciaN2, urgenciaRa, urgenciaBacen, urgenciaProcon).
 */

import React from 'react';

const CHAVES = [
  { key: 'urgenciaN2', label: 'N2' },
  { key: 'urgenciaRa', label: 'RA' },
  { key: 'urgenciaBacen', label: 'Bacen' },
  { key: 'urgenciaProcon', label: 'ProCon' },
];

/**
 * @param {Object} props
 * @param {boolean} props.painelAberto
 * @param {() => void} props.onTogglePainel
 * @param {Record<string, boolean>} props.values — chaves: urgenciaN2, urgenciaRa, urgenciaBacen, urgenciaProcon
 * @param {(chave: string, marcado: boolean) => void} props.onCheckedChange
 */
export default function SolicitacaoUrgenteBlock({
  painelAberto,
  onTogglePainel,
  values = {},
  onCheckedChange,
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onTogglePainel}
        className="text-sm px-4 py-2 rounded-lg border inline-flex items-center gap-2 transition-colors dark:bg-gray-700/80"
        style={{
          borderColor: '#b45309',
          color: '#b45309',
        }}
        aria-expanded={painelAberto}
      >
        Solicitação Urgente
      </button>
      {painelAberto ? (
        <div
          role="region"
          aria-label="Critérios de solicitação urgente"
          className="bg-amber-50/80 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3"
        >
          <p className="text-xs text-gray-700 dark:text-gray-300">
            Somente os itens marcados entram no envio (valor literal true no payload).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHAVES.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 shrink-0"
                  checked={values[key] === true}
                  onChange={(e) => onCheckedChange(key, e.target.checked)}
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

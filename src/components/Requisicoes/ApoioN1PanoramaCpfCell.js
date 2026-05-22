/**
 * VeloHub V3 - Célula CPF (Visão geral Req_Prod)
 * VERSION: v1.0.0 | DATE: 2026-05-22 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import toast from 'react-hot-toast';

export async function copyPanoramaCpfToClipboard(cpf, e) {
  e?.stopPropagation();
  e?.preventDefault();
  const text = String(cpf || '').trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success('CPF copiado');
  } catch {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('CPF copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  }
}

export function ApoioN1PanoramaCpfCell({ cpf }) {
  const display = cpf || '—';
  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums">{display}</span>
      {cpf ? (
        <button
          type="button"
          data-copy-cpf="1"
          onClick={(e) => copyPanoramaCpfToClipboard(cpf, e)}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 rounded text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
          aria-label="Copiar CPF"
          title="Copiar CPF"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

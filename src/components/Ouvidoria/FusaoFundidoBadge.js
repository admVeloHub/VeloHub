/**
 * VeloHub V3 - Badge "Fundido" por Fusao.hierarquia
 * VERSION: v1.1.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Mesmo peso visual dos badges de linha em Minhas (px-2 py-0.5 text-[11px] font-medium rounded, sem contorno).
 */
import React from 'react';

/**
 * @param {{ fusao?: { fundido?: boolean, hierarquia?: string } } | null | undefined} props
 */
export default function FusaoFundidoBadge({ fusao }) {
  if (!fusao || fusao.fundido !== true) return null;
  const h = String(fusao.hierarquia || '').toLowerCase();
  let cls =
    'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100';
  if (h === 'inferior') {
    cls = 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200';
  } else if (h === 'superior') {
    cls = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200';
  } else if (h === 'redundante') {
    cls = 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100';
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}
      title={h ? `Fusão: ${h}` : 'Fundido'}
    >
      Fundido
    </span>
  );
}

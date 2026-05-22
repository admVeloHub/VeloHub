/**
 * Botões DEV visíveis: Feito / Não feito (rede local + env — ver devMarcacaoChamadoLocal + backend VELOHUB_DEV_*)
 * VERSION: v1.1.2 | DATE: 2026-05-15 | AUTHOR: VeloHub Development Team
 *
 * Referência:
 * - v1.1.2: Import atualizado para `requisicoesApi.js`
 */

import React, { useState } from 'react';
import { solicitacoesAPI } from '../../services/requisicoesApi';
import toast from 'react-hot-toast';

export default function DevChamadoOpcoesMenu({ solicitacaoMongoId, onSuccess, compact = false }) {
  const [carregando, setCarregando] = useState(false);
  const id = String(solicitacaoMongoId || '').trim();
  if (!id) return null;

  const disparar = async (statusNorm) => {
    setCarregando(true);
    try {
      await solicitacoesAPI.devMarcacaoChamarStatus(id, statusNorm);
      toast.success(`Marcado como «${statusNorm}»`);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || 'Falha na marcação dev — confira VELOHUB_DEV_* no backend e .env.local do React');
    }
    setCarregando(false);
  };

  const wrap = compact ? 'gap-0' : 'gap-1.5';
  const btnBase =
    'rounded-md text-xs font-semibold px-3 py-1.5 disabled:opacity-50 transition-colors border';

  return (
    <div
      className={`inline-flex flex-col ${wrap}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {!compact ? (
        <span className="text-[9px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
          Dev · chamado
        </span>
      ) : null}
      <div className="inline-flex flex-wrap gap-1.5 items-stretch justify-end">
        <button
          type="button"
          disabled={carregando}
          onClick={(e) => {
            e.stopPropagation();
            disparar('feito');
          }}
          className={`${btnBase} border-emerald-500/70 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-100 dark:hover:bg-emerald-900`}
        >
          Feito
        </button>
        <button
          type="button"
          disabled={carregando}
          onClick={(e) => {
            e.stopPropagation();
            disparar('não feito');
          }}
          className={`${btnBase} border-red-400/70 bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-100 dark:hover:bg-red-900`}
        >
          Não feito
        </button>
      </div>
    </div>
  );
}

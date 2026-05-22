/**
 * Chips de fusão ao lado do protocolo (absorvido / receptor).
 * VERSION: v1.0.2 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * Referência:
 * - v1.0.2: Alinhamento à direita no container pai (justify-end)
 * - v1.0.1: Parent/receptor — rótulo «Fundidos»; apenas lista de protocolos (sem «Filhos»).
 */
import React, { useMemo } from 'react';
import {
  isFusaoAbsorvoAlvo,
  isFusaoReceptor,
} from '../../utils/ouvidoriaFusaoNotif';

/**
 * @param {object} p
 * @param {Record<string, unknown>|null|undefined} p.fusao
 * @param {Record<string, unknown>|null|undefined} p.finalizado
 */
export default function FusaoProtocoloIndicadores({ fusao: fusaoRaw, finalizado }) {
  const item = useMemo(
    () => ({ Fusao: fusaoRaw, Finalizado: finalizado }),
    [fusaoRaw, finalizado]
  );

  const fusao = fusaoRaw && typeof fusaoRaw === 'object' ? fusaoRaw : null;
  const absorvo = isFusaoAbsorvoAlvo(item);
  const receptor = isFusaoReceptor(item);

  const parentProto = String(fusao?.parentProtocolo || '').trim();

  const filhos = useMemo(() => {
    const set = new Set();
    if (Array.isArray(fusao?.childProtocolos)) {
      for (const x of fusao.childProtocolos) {
        const s = String(x || '').trim();
        if (s) set.add(s);
      }
    }
    const one = String(fusao?.childProtocolo || '').trim();
    if (one) set.add(one);
    return Array.from(set);
  }, [fusao]);

  if (!absorvo && !receptor) return null;

  return (
    <div
      className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1.5"
      aria-label="Indicadores de fusão de protocolos"
    >
      {absorvo && (
        <span
          className="inline-flex max-w-[min(100%,18rem)] flex-col gap-0.5 rounded-vh-card border border-red-800/70 bg-[#b91c1c] px-2 py-1 text-xs text-white shadow-sm dark:border-red-900/80"
          title={parentProto ? `Fundido no protocolo ${parentProto}` : 'Registro absorvido por fusão'}
        >
          <span className="font-semibold leading-tight">Fundido</span>
          <span className="truncate leading-tight opacity-95 tabular-nums">
            {parentProto ? `Pai: ${parentProto}` : 'Pai: —'}
          </span>
        </span>
      )}
      {receptor && (
        <span
          className="inline-flex max-w-[min(100%,22rem)] flex-col gap-0.5 rounded-vh-card border border-gray-400/70 bg-gray-200/95 px-2 py-1 text-xs text-gray-800 shadow-sm dark:border-gray-600 dark:bg-[#3d4650] dark:text-gray-100"
          title={filhos.length ? filhos.join(', ') : 'Nenhum protocolo absorvido listado nesta fusão'}
        >
          <span className="font-semibold leading-tight text-gray-700 dark:text-gray-200">
            Fundidos
          </span>
          <span className="tabular-nums leading-tight break-words">
            {filhos.length ? filhos.join(', ') : '—'}
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Barra Gerar Ticket + Ticket Registro (Octadesk) — formulários Ouvidoria.
 * VERSION: v1.1.0 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 */

import React, { useState } from 'react';
import { FloatingLabelField } from '../shared/FloatingLabelField';

/**
 * @param {Object} props
 * @param {string} props.ticketRegistro
 * @param {boolean} props.gerando
 * @param {boolean} props.disabledGerar
 * @param {string} props.disabledHint
 * @param {() => void} props.onGerarTicket
 */
const OuvidoriaOctadeskTicketBar = ({
  ticketRegistro,
  gerando,
  disabledGerar,
  disabledHint,
  onGerarTicket,
}) => {
  const [showBlockedTooltip, setShowBlockedTooltip] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const buttonBlocked = Boolean(disabledGerar || gerando);
  const blockedMessage = gerando
    ? 'Gerando ticket...'
    : String(disabledHint || '').trim();

  const handleHoverStart = (event) => {
    if (!buttonBlocked || !blockedMessage) return;
    setCursorPos({ x: event.clientX, y: event.clientY });
    setShowBlockedTooltip(true);
  };

  const handleHoverMove = (event) => {
    if (!showBlockedTooltip) return;
    setCursorPos({ x: event.clientX, y: event.clientY });
  };

  const handleHoverEnd = () => {
    if (!showBlockedTooltip) return;
    setShowBlockedTooltip(false);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 md:max-w-lg">
      <div
        onMouseEnter={handleHoverStart}
        onMouseMove={handleHoverMove}
        onMouseLeave={handleHoverEnd}
      >
        <button
          type="button"
          onClick={onGerarTicket}
          disabled={buttonBlocked}
          className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 border-[#006AB9] text-[#006AB9] bg-transparent hover:bg-[#006AB9] hover:text-[#F3F7FC] dark:bg-gray-800"
        >
          {gerando ? 'Gerando...' : 'Gerar Ticket'}
        </button>
      </div>
      {showBlockedTooltip && blockedMessage ? (
        <div
          className="fixed z-[90] pointer-events-none rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: cursorPos.x + 14, top: cursorPos.y + 14 }}
        >
          {blockedMessage}
        </div>
      ) : null}
    <div className="min-w-[10rem] flex-1">
      <FloatingLabelField label="Ticket Registro" value={ticketRegistro || ''}>
        <input
          type="text"
          readOnly
          value={ticketRegistro || ''}
          className="min-h-12 box-border w-full cursor-not-allowed rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-700 outline-none dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200"
        />
      </FloatingLabelField>
    </div>
  </div>
  );
};

export default OuvidoriaOctadeskTicketBar;

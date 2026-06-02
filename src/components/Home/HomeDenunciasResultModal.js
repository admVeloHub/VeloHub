/**
 * VeloHub V3 — Modal resultado envio denúncias
 * VERSION: v1.0.0 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import { createPortal } from 'react-dom';

const HomeDenunciasResultModal = ({ open, type, message, onPrimary }) => {
  if (!open || typeof document === 'undefined') return null;

  const isSuccess = type === 'success';
  const title = isSuccess ? 'Envio realizado' : 'Falha no envio';
  const primaryLabel = isSuccess ? 'OK' : 'Fechar';

  return createPortal(
    <div
      className="home-denuncias-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-denuncias-modal-title"
      aria-describedby="home-denuncias-modal-message"
    >
      <div className="home-denuncias-modal__panel">
        <h2
          id="home-denuncias-modal-title"
          className={
            isSuccess
              ? 'home-denuncias-modal__title home-denuncias-modal__title--success'
              : 'home-denuncias-modal__title home-denuncias-modal__title--error'
          }
        >
          {title}
        </h2>
        <p id="home-denuncias-modal-message" className="home-denuncias-modal__message">
          {message}
        </p>
        <div className="home-denuncias-modal__actions">
          <button type="button" className="home-denuncias-modal__btn" onClick={onPrimary}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HomeDenunciasResultModal;

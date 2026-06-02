/**
 * VeloHub V3 — Modal bloqueante de compliance corporativo (Home)
 * VERSION: v1.2.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.2.0: Título do item = acordeão com ciência faltante (accordionId)
 * - v1.1.1: «Ler depois» — exibido apenas 1 vez por ciclo de pendências
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { navigateHeroPage } from '../../pages/home/heroPagesIndex';

const CorporateComplianceModal = ({ open, pending = [], setActivePage, onReadLater, showReadLater = true }) => {
  if (!open || !pending.length || typeof document === 'undefined') return null;

  const handleNavigate = (item) => {
    if (!item?.path || !item?.activePageKey) return;
    navigateHeroPage(
      {
        id: item.type,
        path: item.path,
        activePageKey: item.activePageKey,
      },
      setActivePage
    );
  };

  return createPortal(
    <div
      className="home-compliance-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-compliance-modal-title"
    >
      <div className="home-compliance-modal__backdrop" aria-hidden="true" />
      <div className="home-compliance-modal__panel">
        <h2 id="home-compliance-modal-title" className="home-compliance-modal__title velohub-title">
          Itens que precisam da sua atenção!
        </h2>
        <p className="home-compliance-modal__intro">
          Para continuar utilizando o VeloHub, confirme a ciência dos documentos abaixo.
        </p>
        <div className="home-compliance-modal__items">
          {pending.map((item) => (
            <div
              key={`${item.type}-${item.accordionId || item.versaoId || item.label}`}
              className="container-secondary home-compliance-modal__item"
            >
              <div className="home-compliance-modal__item-row">
                <p className="home-compliance-modal__item-label">{item.label}</p>
                <button
                  type="button"
                  className="velohub-btn home-compliance-modal__item-btn"
                  onClick={() => handleNavigate(item)}
                >
                  Ler e confirmar ciência
                </button>
              </div>
            </div>
          ))}
        </div>
        {showReadLater ? (
          <footer className="home-compliance-modal__footer">
            <button
              type="button"
              className="home-compliance-modal__read-later-btn"
              onClick={() => {
                if (typeof onReadLater === 'function') {
                  onReadLater();
                }
              }}
            >
              Ler depois
            </button>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

export default CorporateComplianceModal;

/**
 * VeloHub V3 — Acordeão das páginas do hero (container 1)
 * VERSION: v1.0.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.0: Acordeões independentes para Políticas, Normas e LGPD
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const HomeHeroAccordion = ({ titulo, children, defaultOpen = false }) => {
  const [aberto, setAberto] = useState(defaultOpen);

  return (
    <div className="home-hero-accordion">
      <button
        type="button"
        className="home-hero-accordion__trigger"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
      >
        <ChevronDown
          className={`home-hero-accordion__icon${aberto ? ' home-hero-accordion__icon--open' : ''}`}
          size={20}
          aria-hidden
        />
        <span className="home-hero-accordion__title">{titulo}</span>
      </button>
      {aberto ? <div className="home-hero-accordion__panel">{children}</div> : null}
    </div>
  );
};

export default HomeHeroAccordion;

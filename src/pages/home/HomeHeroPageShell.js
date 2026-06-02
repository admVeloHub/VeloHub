/**
 * VeloHub V3 — Shell das páginas do hero (container 1)
 * VERSION: v1.1.0 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.0: hidePageTitle e className opcionais no shell
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

const HomeHeroPageShell = ({
  title,
  setActivePage,
  children,
  hidePageTitle = false,
  className = '',
}) => (
  <div className={`home-hero-content${className ? ` ${className}` : ''}`}>
    <div className="home-hero-content__inner">
      <button
        type="button"
        className="home-hero-content__back"
        onClick={() => setActivePage('Home')}
      >
        <ArrowLeft size={18} aria-hidden />
        Voltar
      </button>
      {!hidePageTitle && title ? (
        <h1 className="home-hero-content__title velohub-title">{title}</h1>
      ) : null}
      <div className="home-hero-content__body">{children}</div>
    </div>
  </div>
);

export default HomeHeroPageShell;

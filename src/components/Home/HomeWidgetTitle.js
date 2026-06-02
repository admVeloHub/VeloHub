/**
 * VeloHub V3 — Título PNG dos widgets da Home / sidebar
 * VERSION: v1.0.1 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 *
 * variant banner: PNGs remodelados (~200px altura — serviços, atualizações, pra vc, agenda, destaques)
 * variant legacy: PNGs antigos (~92–114px — atalhos, velonews, faq)
 * - v1.0.1: Altura banner 2,75rem (+10% sobre 2,5rem)
 */

import React from 'react';
import { homeTitleLogoSrc } from './homeAssets';

const HomeWidgetTitle = ({ fileName, alt, variant = 'banner' }) => (
  <div className="home-widget-title velohub-title">
    <img
      src={homeTitleLogoSrc(fileName)}
      alt={alt}
      decoding="async"
      className={
        variant === 'legacy'
          ? 'home-widget-title__img home-widget-title__img--legacy'
          : 'home-widget-title__img'
      }
    />
  </div>
);

export default HomeWidgetTitle;

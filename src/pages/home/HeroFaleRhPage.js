/**
 * VeloHub V3 — Hero: Fale com o RH
 * VERSION: v1.0.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import HomeHeroPageShell from './HomeHeroPageShell';

const HeroFaleRhPage = ({ setActivePage }) => (
  <HomeHeroPageShell title="Fale com o RH" setActivePage={setActivePage}>
    <section className="home-hero-content__section">
      <h2 className="home-hero-content__section-title">Canais de contato</h2>
      <div className="home-hero-content__block" />
    </section>
    <section className="home-hero-content__section">
      <h2 className="home-hero-content__section-title">Assuntos frequentes</h2>
      <div className="home-hero-content__block" />
    </section>
  </HomeHeroPageShell>
);

export default HeroFaleRhPage;

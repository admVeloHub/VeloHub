/**
 * VeloHub V3 — HomePage (nova homepage)
 * VERSION: v1.5.2 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.5.2: Caixa de Sugestões oculta na Home (card e modal removidos)
 * - v1.5.1: Modal compliance — sempre visível no login quando há pendências (sem snooze herdado)
 * - v1.4.9: Modal compliance — snooze «Ler depois» (reabre em 10 min)
 * - v1.4.8: CorporateComplianceModal na Home quando há pendências
 * - v1.4.7: Fale com o RH — modal SupportModal na Home (gênero RH fixo)
 * - v1.4.6: Caixa de Sugestões — modal SupportModal na Home (sem ir ao Apoio)
 * - v1.4.5: Destaques — título via PNG destaques.png (HomeWidgetTitle)
 */

import React, { useState, useEffect } from 'react';
import { homeHeroImgSrc, homeHeroIconSrc } from '../components/Home/homeAssets';
import HomeServicesStatus from '../components/Home/HomeServicesStatus';
import HomePortalRecentUpdates from '../components/Home/HomePortalRecentUpdates';
import HomeDestaquesCarousel from '../components/Home/HomeDestaquesCarousel';
import HomeDestaquesFeed from '../components/Home/HomeDestaquesFeed';
import HomeAgendaVelotax from '../components/Home/HomeAgendaVelotax';
import HomeServicosParaVoce from '../components/Home/HomeServicosParaVoce';
import HomeWidgetTitle from '../components/Home/HomeWidgetTitle';
import SupportModal from '../components/SupportModal';
import CorporateComplianceModal from '../components/Home/CorporateComplianceModal';
import { HERO_QUICK_LINKS, navigateHeroPage } from './home/heroPagesIndex';
import { getUserSession } from '../services/auth';
import {
  getComplianceModalSnoozeUntil,
  isComplianceModalSnoozed,
  isComplianceReadLaterUsed,
  snoozeComplianceModal,
} from '../services/corporateCompliance';

const HomePage = ({ setActivePage, compliancePending = [] }) => {
  const [faleRhOpen, setFaleRhOpen] = useState(false);
  const [complianceSnoozeTick, setComplianceSnoozeTick] = useState(0);

  const userEmail = getUserSession()?.user?.email;
  const complianceModalSnoozed = isComplianceModalSnoozed(userEmail);
  const readLaterAlreadyUsed = isComplianceReadLaterUsed(userEmail);
  const complianceModalOpen =
    compliancePending.length > 0 && !complianceModalSnoozed;

  useEffect(() => {
    const onSnoozeChanged = () => setComplianceSnoozeTick((tick) => tick + 1);
    window.addEventListener('velohub:compliance-snooze-changed', onSnoozeChanged);
    return () => window.removeEventListener('velohub:compliance-snooze-changed', onSnoozeChanged);
  }, []);

  useEffect(() => {
    if (!compliancePending.length || !userEmail) return undefined;
    const until = getComplianceModalSnoozeUntil(userEmail);
    const remaining = until - Date.now();
    if (remaining <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setComplianceSnoozeTick((tick) => tick + 1);
      window.dispatchEvent(new CustomEvent('velohub:compliance-snooze-changed'));
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [compliancePending.length, userEmail, complianceSnoozeTick]);

  const handleComplianceReadLater = () => {
    if (!userEmail || readLaterAlreadyUsed) return;
    snoozeComplianceModal(userEmail);
    setComplianceSnoozeTick((tick) => tick + 1);
  };

  const handleQuickLinkClick = (link) => {
    if (link.id === 'fale-rh') {
      setFaleRhOpen(true);
      return;
    }
    navigateHeroPage(link, setActivePage);
  };

  const renderQuickLink = (link) => (
    <button
      type="button"
      className="home-hero__link-btn"
      onClick={() => handleQuickLinkClick(link)}
      aria-label={link.label}
    >
      <span className="home-hero__link-btn-icon">
        <img
          src={homeHeroIconSrc(link.iconFile)}
          alt=""
          decoding="async"
        />
      </span>
      <span className="home-hero__link-btn-label">{link.label}</span>
    </button>
  );

  return (
    <div className="home-page">
      <div className="home-hero__image-wrap" aria-hidden="true">
        <img
          src={homeHeroImgSrc('office mockup.webp')}
          alt=""
          className="home-hero__image"
          decoding="async"
        />
      </div>

      <section className="home-hero" aria-label="Boas-vindas">
        <div className="home-hero__col-spacer" aria-hidden="true" />
        <div className="home-hero__panel">
          <div className="home-hero__welcome">
            <h1 className="home-hero__title velohub-title">Bem vindo ao Velohub, o portal do Velotax!</h1>
            <p className="home-hero__text">
              Agora você tem um novo canal de informações e acessos. Tudo o que você precisa em um só lugar!
            </p>
            <button type="button" className="home-hero__saiba-mais">
              Saiba Mais
            </button>
          </div>
          <div className="home-hero__links">
            {HERO_QUICK_LINKS.map((link) => (
              <div key={link.id} className="home-hero__link-cell">
                {renderQuickLink(link)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="home-body">
        <aside className="home-body__left" aria-label="Sidebar esquerda">
          <div className="home-body__left-gap" aria-hidden="true" />
          <div className="home-body__left-scroll">
            <HomeServicesStatus columns={2} />
            <HomePortalRecentUpdates />
          </div>
        </aside>
        <section className="home-body__destaques" aria-label="Destaques">
          <div className="home-destaques">
            <div className="home-destaques__title">
              <HomeWidgetTitle fileName="destaques.png" alt="Destaques" />
            </div>
            <HomeDestaquesCarousel />
            <HomeDestaquesFeed />
          </div>
        </section>
        <aside className="home-body__right" aria-label="Sidebar direita">
          <HomeServicosParaVoce
            className="home-body__right-widget"
            setActivePage={setActivePage}
          />
          <HomeAgendaVelotax className="home-body__right-widget" />
        </aside>
      </div>

      <SupportModal
        isOpen={faleRhOpen}
        onClose={() => setFaleRhOpen(false)}
        mode="fale_rh"
        title="Fale com o RH"
      />
      <CorporateComplianceModal
        open={complianceModalOpen}
        pending={compliancePending}
        setActivePage={setActivePage}
        onReadLater={handleComplianceReadLater}
        showReadLater={!readLaterAlreadyUsed}
      />
    </div>
  );
};

export default HomePage;

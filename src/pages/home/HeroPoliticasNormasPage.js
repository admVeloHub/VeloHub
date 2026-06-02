/**
 * VeloHub V3 — Hero: Políticas e Normas
 * VERSION: v1.7.1 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.7.1: Definições de acordeão centralizadas (politicasNormasAccordions.js)
 * - v1.6.0: Acordeão «Código de Ética e Conduta» + API corpo_etica&conduta
 */

import React, { useEffect, useMemo, useState } from 'react';
import HomeHeroPageShell from './HomeHeroPageShell';
import HomeHeroAccordion from './HomeHeroAccordion';
import CorporateAcknowledgmentBlock from '../../components/Home/CorporateAcknowledgmentBlock';
import CorporateHeroSectionsView from '../../components/Home/CorporateHeroSectionsView';
import { corporateAPI } from '../../services/api';
import { getUserSession } from '../../services/auth';
import { POLITICAS_NORMAS_ACCORDION_DEFS } from '../../config/politicasNormasAccordions';

const POLITICAS_ACCORDIONS = POLITICAS_NORMAS_ACCORDION_DEFS.map((accordion) => ({
  ...accordion,
  resolveSections: (doc) => doc?.corpo,
  resolveVersaoId: (doc) => doc?._id,
  fetchLatest: () => corporateAPI.getEticaCondutaLatest(),
  fetchAcknowledgments: (email) => corporateAPI.getEticaCondutaAcknowledgments(email),
}));

const HeroPoliticasNormasPage = ({ setActivePage, onComplianceAcknowledged }) => {
  const [docsByAccordion, setDocsByAccordion] = useState({});
  const [showAckByAccordion, setShowAckByAccordion] = useState({});
  const [loading, setLoading] = useState(true);

  const accordionConfigs = useMemo(() => POLITICAS_ACCORDIONS, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const session = getUserSession();
      const email = session?.user?.email;

      const results = await Promise.all(
        accordionConfigs.map(async (accordion) => {
          const [latestRes, ackRes] = await Promise.all([
            accordion.fetchLatest(),
            email
              ? accordion.fetchAcknowledgments(email)
              : Promise.resolve({ acknowledgedVersaoIds: [] }),
          ]);

          const latestDoc = latestRes?.data || null;
          const versaoId = accordion.resolveVersaoId(latestDoc);
          const ackIds = ackRes?.acknowledgedVersaoIds || [];
          const needsAck = versaoId
            ? !ackIds.some((id) => String(id) === String(versaoId))
            : false;

          return {
            id: accordion.id,
            doc: latestDoc,
            showAck: needsAck,
          };
        })
      );

      const nextDocs = {};
      const nextShowAck = {};
      results.forEach(({ id, doc, showAck }) => {
        nextDocs[id] = doc;
        nextShowAck[id] = showAck;
      });

      setDocsByAccordion(nextDocs);
      setShowAckByAccordion(nextShowAck);
    } catch (error) {
      console.error('HeroPoliticasNormasPage:', error);
      setDocsByAccordion({});
      setShowAckByAccordion({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleAccordionAcknowledged = async (accordionId) => {
    let allAcknowledged = false;
    setShowAckByAccordion((prev) => {
      const next = { ...prev, [accordionId]: false };
      allAcknowledged = accordionConfigs.every((accordion) => !next[accordion.id]);
      return next;
    });
    if (allAcknowledged && typeof onComplianceAcknowledged === 'function') {
      await onComplianceAcknowledged();
    }
  };

  return (
    <HomeHeroPageShell
      setActivePage={setActivePage}
      hidePageTitle
      className="home-hero-content--politicas-normas"
    >
      <section className="home-hero-content__section home-hero-content__section--etica-conduta">
        <h2 className="home-hero-content__section-title">Políticas e Normas</h2>
        <div className="home-hero-content__block home-hero-content__accordions">
          {accordionConfigs.map((accordion) => {
            const doc = docsByAccordion[accordion.id];
            const versaoId = accordion.resolveVersaoId(doc);
            const showAck = Boolean(showAckByAccordion[accordion.id] && versaoId);

            return (
              <HomeHeroAccordion
                key={accordion.id}
                titulo={accordion.titulo}
                defaultOpen={accordion.defaultOpen}
              >
                <CorporateHeroSectionsView
                  sections={accordion.resolveSections(doc)}
                  loading={loading}
                  searchPlaceholder={accordion.searchPlaceholder}
                  className="home-corporate-sections--embedded"
                />
                {showAck ? (
                  <CorporateAcknowledgmentBlock
                    type={accordion.ackType}
                    ackKey={accordion.id}
                    versaoId={String(versaoId)}
                    className="home-corporate-ack--accordion"
                    onAcknowledged={() => handleAccordionAcknowledged(accordion.id)}
                  />
                ) : null}
              </HomeHeroAccordion>
            );
          })}
        </div>
      </section>
    </HomeHeroPageShell>
  );
};

export default HeroPoliticasNormasPage;

/**
 * VeloHub V3 — Hero: Termos de Uso (autenticado)
 * VERSION: v1.1.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.0: Seções planas com busca por título/conteúdo (sem acordeão)
 * - v1.0.0: Conteúdo via API + bloco de ciência
 */

import React, { useEffect, useState } from 'react';
import HomeHeroPageShell from './HomeHeroPageShell';
import CorporateAcknowledgmentBlock from '../../components/Home/CorporateAcknowledgmentBlock';
import CorporateHeroSectionsView from '../../components/Home/CorporateHeroSectionsView';
import { corporateAPI } from '../../services/api';
import { getUserSession } from '../../services/auth';

const HeroTermoUsuarioPage = ({ setActivePage, onComplianceAcknowledged }) => {
  const [doc, setDoc] = useState(null);
  const [showAck, setShowAck] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContent = async () => {
    try {
      setLoading(true);
      const session = getUserSession();
      const email = session?.user?.email;
      const [latestRes, ackRes] = await Promise.all([
        corporateAPI.getTermoUsuarioLatest(),
        email
          ? corporateAPI.getTermoUsuarioAcknowledgments(email)
          : Promise.resolve({ acknowledgedVersaoIds: [] }),
      ]);
      const latestDoc = latestRes?.data || null;
      setDoc(latestDoc);
      if (latestDoc?._id) {
        const ackIds = ackRes?.acknowledgedVersaoIds || [];
        setShowAck(!ackIds.some((id) => String(id) === String(latestDoc._id)));
      } else {
        setShowAck(false);
      }
    } catch (error) {
      console.error('HeroTermoUsuarioPage:', error);
      setDoc(null);
      setShowAck(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleAcknowledged = async () => {
    setShowAck(false);
    if (typeof onComplianceAcknowledged === 'function') {
      await onComplianceAcknowledged();
    }
  };

  return (
    <HomeHeroPageShell
      setActivePage={setActivePage}
      hidePageTitle
      className="home-hero-content--termo-usuario"
    >
      <CorporateHeroSectionsView
        sectionTitle="Termos de Uso"
        sections={doc?.corpo}
        loading={loading}
      />
      {showAck && doc?._id ? (
        <CorporateAcknowledgmentBlock
          type="termo-usuario"
          versaoId={String(doc._id)}
          onAcknowledged={handleAcknowledged}
        />
      ) : null}
    </HomeHeroPageShell>
  );
};

export default HeroTermoUsuarioPage;

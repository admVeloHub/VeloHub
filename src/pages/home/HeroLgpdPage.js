/**
 * VeloHub V3 — Hero: LGPD
 * VERSION: v1.4.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.4.0: Seções planas Pública/Corporativa + busca por título/conteúdo (sem acordeão)
 * - v1.3.0: Pública/Corporativa via API + ciência; layout 1 ou 2 colunas
 */

import React, { useEffect, useMemo, useState } from 'react';
import HomeHeroPageShell from './HomeHeroPageShell';
import CorporateAcknowledgmentBlock from '../../components/Home/CorporateAcknowledgmentBlock';
import CorporateHeroSectionsView from '../../components/Home/CorporateHeroSectionsView';
import { corporateAPI } from '../../services/api';
import { getUserSession } from '../../services/auth';

const HeroLgpdPage = ({ setActivePage, onComplianceAcknowledged }) => {
  const [doc, setDoc] = useState(null);
  const [showAck, setShowAck] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContent = async () => {
    try {
      setLoading(true);
      const session = getUserSession();
      const email = session?.user?.email;
      const [latestRes, ackRes] = await Promise.all([
        corporateAPI.getLgpdLatest(),
        email ? corporateAPI.getLgpdAcknowledgments(email) : Promise.resolve({ acknowledgedVersaoIds: [] }),
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
      console.error('HeroLgpdPage:', error);
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

  const groups = useMemo(() => {
    const publica = Array.isArray(doc?.publica) ? doc.publica : [];
    const corporativo = Array.isArray(doc?.corporativo) ? doc.corporativo : [];
    return [
      { label: 'Pública', sections: publica },
      { label: 'Corporativa', sections: corporativo },
    ].filter((group) => group.sections.length > 0);
  }, [doc]);

  return (
    <HomeHeroPageShell setActivePage={setActivePage} hidePageTitle className="home-hero-content--lgpd">
      <CorporateHeroSectionsView groups={groups} loading={loading} />
      {showAck && doc?._id ? (
        <CorporateAcknowledgmentBlock
          type="lgpd"
          versaoId={String(doc._id)}
          onAcknowledged={handleAcknowledged}
        />
      ) : null}
    </HomeHeroPageShell>
  );
};

export default HeroLgpdPage;

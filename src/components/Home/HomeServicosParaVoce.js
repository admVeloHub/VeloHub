/**
 * VeloHub V3 — Container 5: Serviços pra você (sidebar direita Home)
 * VERSION: v1.3.1 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.3.1: Caixa de sugestões oculta (card removido da sidebar)
 * - v1.3.0: Atalhos filtrados por permissoesVelohub (mesma regra do header)
 * - v1.1.0: Atalhos — Apoio, Conhecimento e aba Arquivo
 */

import React, { useMemo } from 'react';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import HomeSidebarWidget from './HomeSidebarWidget';
import { getPermissoesVelohub, navItemPermitidoVelohub } from '../../services/auth';

const SERVICOS_PARA_VOCE_CARDS = [
  {
    id: 'solicitacoes-internas',
    title: 'Solicitações Internas',
    subtitle: 'RH, financeiro, facilities, gestão e muito mais',
    Icon: AssignmentOutlined,
    page: 'Apoio',
    intent: { apoioTab: 'solicitar' },
  },
  {
    id: 'documentos-corporativos',
    title: 'Documentos corporativos',
    subtitle: 'Acesse termos, declarações e outros documentos úteis',
    Icon: FolderOpenOutlined,
    page: 'Conhecimento',
    intent: { knowledgeTab: 'arquivo' },
  },
  {
    id: 'conhecimento',
    title: 'Conhecimento',
    subtitle: 'Encontre vídeos, artigos, e tire suas dúvidas num centro de informações rápido e acessível.',
    Icon: MenuBookOutlined,
    page: 'Conhecimento',
    intent: null,
  },
];

const HomeServicosParaVoce = ({ className = '', setActivePage }) => {
  const visibleCards = useMemo(() => {
    const permissoes = getPermissoesVelohub();
    return SERVICOS_PARA_VOCE_CARDS.filter((card) => {
      if (!card.page) return true;
      return navItemPermitidoVelohub(card.page, permissoes);
    });
  }, []);

  const handleCardClick = (card) => {
    if (typeof setActivePage !== 'function') return;
    if (card.intent) {
      setActivePage(card.page, card.intent);
      return;
    }
    setActivePage(card.page);
  };

  return (
    <HomeSidebarWidget
      className={className}
      titleFile="pra vc.png"
      titleAlt="Serviços pra você"
    >
      <div className="home-servicos-cards">
        {visibleCards.map((card) => {
          const Icon = card.Icon;
          return (
          <button
            key={card.id}
            type="button"
            className="home-servicos-card"
            onClick={() => handleCardClick(card)}
          >
            <span className="home-servicos-card__icon" aria-hidden>
              <Icon fontSize="medium" />
            </span>
            <span className="home-servicos-card__text">
              <span className="home-servicos-card__title">{card.title}</span>
              <span className="home-servicos-card__subtitle">{card.subtitle}</span>
            </span>
          </button>
          );
        })}
      </div>
    </HomeSidebarWidget>
  );
};

export default HomeServicosParaVoce;

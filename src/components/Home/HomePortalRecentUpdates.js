/**
 * VeloHub V3 — Últimas atualizações da Home (sidebar — Conhecimento / artigos)
 * VERSION: v1.2.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.2.0: Artigos Conhecimento (articlesAPI) — não confundir com feed de avisos (hub_avisos)
 * - v1.0.2: Título via HomeWidgetTitle (PNG remodelado atualizações.png)
 */

import React, { useEffect, useState } from 'react';
import { articlesAPI } from '../../services/api';
import HomeWidgetTitle from './HomeWidgetTitle';
import HomeArticleModal from './HomeArticleModal';

const LIMITE = 4;

const HomePortalRecentUpdates = ({ className = '' }) => {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const articlesResponse = await articlesAPI.getAll();
        if (cancelled) return;
        if (articlesResponse.data?.length > 0) {
          const sorted = articlesResponse.data
            .filter((article) => article.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, LIMITE);
          setRecentItems(sorted);
        } else {
          setRecentItems([]);
        }
      } catch (err) {
        console.error('HomePortalRecentUpdates:', err);
        if (!cancelled) setRecentItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className={`home-widget home-portal-updates ${className}`.trim()}>
        <HomeWidgetTitle fileName="atualizações.png" alt="Últimas atualizações" />
        <div className="home-portal-updates__list">
          {loading ? (
            <p className="home-portal-updates__empty">Carregando…</p>
          ) : recentItems.length === 0 ? (
            <p className="home-portal-updates__empty">Nenhuma novidade recente.</p>
          ) : (
            recentItems.map((item) => (
              <button
                key={String(item._id || item.id)}
                type="button"
                className="home-portal-updates__item home-portal-updates__item--clickable"
                onClick={() => setSelectedArticle(item)}
              >
                <div className="home-portal-updates__meta">
                  <span className="home-portal-updates__badge">Artigo</span>
                  <span className="home-portal-updates__date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : ''}
                  </span>
                </div>
                <div className="home-portal-updates__title">
                  {item.title || item.artigo_titulo || 'Sem título'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      {selectedArticle ? (
        <HomeArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      ) : null}
    </>
  );
};

export default HomePortalRecentUpdates;

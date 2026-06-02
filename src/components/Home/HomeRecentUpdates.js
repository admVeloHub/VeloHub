/**
 * VeloHub V3 — Últimas atualizações (Atendimento — artigos / Conhecimento)
 * VERSION: v1.0.2 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.2: Título via HomeWidgetTitle (PNG remodelado atualizações.png)
 */

import React, { useEffect, useState } from 'react';
import { articlesAPI } from '../../services/api';
import HomeWidgetTitle from './HomeWidgetTitle';
import HomeArticleModal from './HomeArticleModal';

const HomeRecentUpdates = ({ className = '', limit = 2 }) => {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        setLoading(true);
        const articlesResponse = await articlesAPI.getAll();
        if (articlesResponse.data?.length > 0) {
          const recentArticles = articlesResponse.data
            .filter((article) => article.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
          setRecentItems(recentArticles);
        } else {
          setRecentItems([]);
        }
      } catch (error) {
        console.error('HomeRecentUpdates: erro ao buscar artigos:', error);
        setRecentItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentItems();
  }, [limit]);

  return (
    <>
      <div className={`home-widget ${className}`.trim()}>
        <HomeWidgetTitle fileName="atualizações.png" alt="Últimas atualizações" />
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
          </div>
        ) : recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div key={item._id || item.id} className="border-b dark:border-gray-700 pb-3 last:border-b-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                      Artigo
                    </span>
                    {item.category && (
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h4
                  className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  onClick={() => setSelectedArticle(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedArticle(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {item.title}
                </h4>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum item recente</p>
          </div>
        )}
      </div>
      {selectedArticle && (
        <HomeArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </>
  );
};

export default HomeRecentUpdates;

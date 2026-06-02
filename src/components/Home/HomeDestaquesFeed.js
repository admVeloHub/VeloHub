/**
 * VeloHub V3 — Feed de avisos (Home — coluna central abaixo do carrossel)
 * VERSION: v1.1.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.0: GET /api/home/avisos/feed (hub_avisos); removido DNA VeloNews (ack/crítico/solved)
 * - v1.0.1: «Ver anteriores» no fim do scroll do feed
 */

import React, { useEffect, useState } from 'react';
import { homeAvisosAPI } from '../../services/api';
import { formatResponseText } from '../../utils/textFormatter';
import { processContentHtml } from '../../utils/processContentHtml';
import { getImageUrl, getYouTubeThumbnail } from '../../utils/mediaContentHelpers';
import HomeDestaquesFeedModal from './HomeDestaquesFeedModal';
import HomeDestaquesHistoryModal from './HomeDestaquesHistoryModal';

const FEED_LIMIT = 4;

const HomeDestaquesFeed = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const feedRes = await homeAvisosAPI.getRecent(FEED_LIMIT);
        setItems(feedRes?.data || []);
      } catch (err) {
        console.error('HomeDestaquesFeed:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpen = (item) => {
    setSelectedItem(item);
  };

  const historyButton = (
    <div className="home-destaques__feed-footer">
      <button type="button" className="home-destaques__history-btn velohub-btn" onClick={() => setShowHistory(true)}>
        Ver anteriores
      </button>
    </div>
  );

  return (
    <>
      <div className="home-destaques__feed">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="space-y-4">
              {items.map((item) => {
                const imageUrl = getImageUrl(item);
                const thumbnailUrl = getYouTubeThumbnail(item);

                return (
                  <div
                    key={item._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpen(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpen(item);
                      }
                    }}
                    className="rounded-xl px-2 py-2 cursor-pointer transition-colors hover:bg-gray-100/90 dark:hover:bg-gray-800/50 border-b dark:border-gray-700 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{item.title}</h3>
                    </div>
                    {imageUrl && (
                      <div className="mb-3">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full max-w-[280px] h-auto object-cover rounded-lg pointer-events-none"
                          style={{ maxHeight: '120px' }}
                        />
                      </div>
                    )}
                    {!imageUrl && thumbnailUrl && (
                      <div className="mb-3 max-w-[280px]">
                        <img
                          src={thumbnailUrl}
                          alt={item.title}
                          className="w-full h-auto object-cover rounded-lg"
                          style={{ maxHeight: '120px' }}
                        />
                      </div>
                    )}
                    <div
                      className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-2 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: processContentHtml(formatResponseText(item.content || '', 'velonews')),
                      }}
                    />
                    {item.createdAt && (
                      <div className="flex justify-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {historyButton}
          </>
        ) : (
          <>
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Nenhum aviso publicado</p>
            </div>
            {historyButton}
          </>
        )}
      </div>
      {selectedItem && <HomeDestaquesFeedModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {showHistory && (
        <HomeDestaquesHistoryModal
          onClose={() => setShowHistory(false)}
          onSelectItem={(item) => setSelectedItem(item)}
        />
      )}
    </>
  );
};

export default HomeDestaquesFeed;

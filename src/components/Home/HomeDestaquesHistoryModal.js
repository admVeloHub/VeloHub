/**
 * VeloHub V3 — Histórico do feed Destaques
 * VERSION: v1.0.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { homeAvisosAPI } from '../../services/api';
import { formatResponseText } from '../../utils/textFormatter';
import { processContentHtml } from '../../utils/processContentHtml';

const PAGE_SIZE = 10;

const HomeDestaquesHistoryModal = ({ onClose, onSelectItem }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await homeAvisosAPI.getFeed(PAGE_SIZE, skip);
        const batch = res?.data || [];
        if (!cancelled) {
          setItems((prev) => (skip === 0 ? batch : [...prev, ...batch]));
          setHasMore(res?.pagination?.hasMore ?? batch.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error('HomeDestaquesHistoryModal:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [skip]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col w-full max-w-2xl max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 'var(--velohub-radius-container)' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold velohub-title">Destaques anteriores</h2>
          <button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800 dark:hover:text-white">
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              className="w-full text-left border-b dark:border-gray-700 pb-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 rounded px-2 py-1"
              onClick={() => {
                onSelectItem?.(item);
                onClose();
              }}
            >
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</h3>
              {item.createdAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              <div
                className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1"
                dangerouslySetInnerHTML={{
                  __html: processContentHtml(formatResponseText(item.content || '', 'velonews')),
                }}
              />
            </button>
          ))}
          {loading && <p className="text-center text-sm text-gray-500">Carregando...</p>}
          {!loading && items.length === 0 && <p className="text-center text-sm text-gray-500">Nenhum item encontrado</p>}
        </div>
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <button type="button" className="velohub-btn" onClick={() => setSkip((s) => s + PAGE_SIZE)}>
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default HomeDestaquesHistoryModal;

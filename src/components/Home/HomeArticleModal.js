/**
 * VeloHub V3 — Modal de artigo (Home / Atendimento)
 * VERSION: v1.0.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatResponseText } from '../../utils/textFormatter';
import { processContentHtml } from '../../utils/processContentHtml';
import {
  getAllImages,
  convertYouTubeUrlToEmbed,
  isYouTubeShorts,
} from '../../utils/mediaContentHelpers';

const HomeArticleModal = ({ article, onClose }) => {
  const [expandedImage, setExpandedImage] = useState(null);

  if (!article || typeof document === 'undefined') return null;

  const videos = article?.media?.videos || article?.videos || [];
  const youtubeVideos = videos
    .map((v) => {
      if (typeof v === 'string') {
        if (v.includes('youtube.com') || v.includes('youtu.be')) {
          return { url: v, embed: convertYouTubeUrlToEmbed(v) };
        }
        return null;
      }
      if (v && typeof v === 'object' && (v.type === 'youtube' || v.embed || v.url)) {
        return {
          url: v.url || v.embed || '',
          embed: v.embed || convertYouTubeUrlToEmbed(v.url || v.embed || ''),
        };
      }
      return null;
    })
    .filter((v) => v && v.embed);

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2147483646,
          padding: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          className="rounded-lg shadow-2xl bg-white dark:bg-gray-800 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            borderRadius: 'var(--velohub-radius-container)',
            maxWidth: '56rem',
            width: 'calc(100% - 32px)',
            height: 'calc(100vh - 160px)',
            maxHeight: 'calc(100vh - 160px)',
          }}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 pr-4 flex-1">
              {article.title || article.titulo}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-3xl flex-shrink-0"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {getAllImages(article).length > 0 && (
              <div className="mb-4 space-y-3">
                {getAllImages(article).map((imgUrl, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={imgUrl}
                      alt={`${article.title || article.titulo} - Imagem ${idx + 1}`}
                      className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                      onClick={() => setExpandedImage(imgUrl)}
                    />
                  </div>
                ))}
              </div>
            )}
            {youtubeVideos.length > 0 && (
              <div className="mb-4 space-y-3">
                {youtubeVideos.map((vid, idx) => {
                  if (!vid.embed) return null;
                  if (isYouTubeShorts(vid.url)) {
                    return (
                      <div key={idx} className="flex justify-center">
                        <div className="relative rounded-lg overflow-hidden" style={{ width: '225px', maxWidth: '100%', height: '400px', maxHeight: '50vh' }}>
                          <iframe
                            src={vid.embed}
                            className="w-full h-full rounded-lg"
                            title={`Vídeo ${idx + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={vid.embed}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        title={`Vídeo ${idx + 1}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: processContentHtml(formatResponseText(article.content || '', 'article')),
              }}
            />
          </div>
        </div>
      </div>
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <img src={expandedImage} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>,
    document.body
  );
};

export default HomeArticleModal;

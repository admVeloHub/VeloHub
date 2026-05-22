/**
 * VeloHub V3 - Modal detalhe (Visão geral Req_Prod)
 * VERSION: v1.0.0 | DATE: 2026-05-22 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import {
  buildModalExtraPayloadCells,
  buildProdutosN1Dialogue,
  getStatusChamado,
  ModalInfoGridCell,
  statusChamadoBadgeClass,
} from '../../utils/requisicoesModalHelpers';

export const panoramaTipoLabel = (row) => {
  const t = row?.panoramaRegistroTipo ?? row?.origem;
  if (t === 'erros-bugs') return 'Erros/Bugs';
  if (t === 'liberacao-chave-pix') return 'Liberação chave PIX';
  if (t === 'solicitacoes') return 'Solicitações';
  return typeof t === 'string' && t.trim() !== '' ? t : '—';
};

function AnexosReadonly({ doc }) {
  const imgs = Array.isArray(doc?.payload?.imagens) ? doc.payload.imagens : [];
  const vids = Array.isArray(doc?.payload?.videos) ? doc.payload.videos : [];
  const legacyPreviews = Array.isArray(doc?.payload?.previews) ? doc.payload.previews : [];
  const urlsFromImagens = imgs.map((i) => i?.imagemUrl || i?.url).filter(Boolean);
  const imageSrcs = [...legacyPreviews, ...urlsFromImagens].filter(Boolean);
  if (imageSrcs.length === 0 && vids.length === 0) return null;
  return (
    <div>
      <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Anexos</h4>
      {imageSrcs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {imageSrcs.map((src, idx) => (
            <button
              key={`img-${idx}`}
              type="button"
              className="p-0 border-0 bg-transparent cursor-pointer"
              onClick={() => window.open(src, '_blank')}
            >
              <img
                src={src}
                alt={`anexo-${idx}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
            </button>
          ))}
        </div>
      )}
      {vids.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {vids.length} vídeo(s) — abrir registro no sistema de origem para reprodução se necessário.
        </div>
      )}
    </div>
  );
}

export function PanoramaDetailModal({ doc, onClose }) {
  if (!doc) return null;
  const replyArray = Array.isArray(doc.reply) ? doc.reply : [];
  const dialogue = buildProdutosN1Dialogue(replyArray);
  const status = getStatusChamado(doc);
  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-vh-container max-w-4xl w-full min-h-[50vh] max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apoio-n1-modal-title"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3
              id="apoio-n1-modal-title"
              className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-snug"
            >
              {panoramaTipoLabel(doc)} — {doc.tipo || '—'} — {doc.cpf || '—'}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusChamadoBadgeClass(
                status
              )}`}
            >
              {status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-3">
              <ModalInfoGridCell label="CPF" value={doc.cpf || '—'} />
              <ModalInfoGridCell label="Tipo" value={doc.tipo || '—'} />
              <ModalInfoGridCell
                label="Data"
                value={doc.createdAt ? new Date(doc.createdAt).toLocaleString('pt-BR') : '—'}
              />
              <ModalInfoGridCell label="Agente" value={doc.colaboradorNome || doc?.payload?.agente || '—'} />
              {buildModalExtraPayloadCells(doc).map((c) => (
                <ModalInfoGridCell key={c.key} label={c.label} value={c.value} />
              ))}
            </div>
          </div>
          <AnexosReadonly doc={doc} />
          <div>
            <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Respostas do time</h4>
            {dialogue.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-4 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
                Nenhuma mensagem de Produtos ou N1 registrada.
              </div>
            ) : (
              <div className="space-y-3">
                {dialogue.map((b) => {
                  if (b.role === 'produtos') {
                    return (
                      <div key={b.key} className="flex justify-start">
                        <div className="max-w-[min(100%,28rem)] rounded-vh-card px-3 py-2.5 border-l-4 border-[#006AB9] bg-sky-50 dark:bg-sky-950/35 dark:border-sky-500 shadow-sm">
                          <div className="text-xs font-semibold text-[#006AB9] dark:text-sky-300 mb-1">
                            Time Produtos
                          </div>
                          <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                            {b.text}
                          </div>
                          {b.at ? (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">{b.at}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  if (b.role === 'n1') {
                    return (
                      <div key={b.key} className="flex justify-end">
                        <div className="max-w-[min(100%,28rem)] rounded-vh-card px-3 py-2.5 border-r-4 border-amber-500 bg-amber-50 dark:bg-amber-950/35 dark:border-amber-400 shadow-sm">
                          <div className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1 text-right">
                            N1
                          </div>
                          <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words text-left">
                            {b.text}
                          </div>
                          {b.at ? (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-left">{b.at}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={b.key} className="flex justify-center">
                      <div className="text-xs text-center text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        {b.text}
                        {b.at ? <span className="block text-[10px] text-gray-500 mt-0.5">{b.at}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 p-3 flex-shrink-0 bg-gray-50 dark:bg-gray-900/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Visualização somente leitura (Apoio N1). Ações de resposta usam as abas Solicitações, Erros/Bugs ou Liberação chave PIX.
          </p>
        </div>
      </div>
    </div>
  );
}

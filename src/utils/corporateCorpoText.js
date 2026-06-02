/**
 * VeloHub V3 — Utilitário de renderização de corpo corporativo
 * VERSION: v1.1.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.0: getSectionBody (corpo/conteudo) e slugifySectionId para busca
 */

import React from 'react';

/**
 * @param {{ corpo?: string, conteudo?: string }} section
 * @returns {string}
 */
export function getSectionBody(section) {
  if (!section || typeof section !== 'object') return '';
  return section.corpo || section.conteudo || '';
}

/**
 * @param {string} titulo
 * @param {number} index
 */
export function slugifySectionId(titulo, index) {
  const base = String(titulo || `secao-${index + 1}`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `corporate-section-${base || index}`;
}

/**
 * Divide texto longo em parágrafos (blocos separados por linha em branco).
 * @param {string} text
 * @returns {React.ReactNode[]}
 */
export function renderCorpoParagraphs(text) {
  if (!text || typeof text !== 'string') return null;
  return text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => (
      <p key={index} className="home-hero-content__text">
        {block}
      </p>
    ));
}

/**
 * @param {{ titulo?: string, corpo?: string, conteudo?: string }} section
 * @param {number} index
 */
export function normalizeCorporateSection(section, index) {
  const titulo = section?.titulo || `Seção ${index + 1}`;
  const groupPrefix = section?.group ? `${section.group}-` : '';
  return {
    titulo,
    corpo: getSectionBody(section),
    group: section?.group || '',
    sectionId: slugifySectionId(`${groupPrefix}${titulo}`, index),
  };
}

/**
 * @param {{ titulo: string, corpo?: string }} section
 * @param {string} query
 */
export function sectionMatchesQuery(section, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return true;
  return (
    section.titulo.toLowerCase().includes(normalizedQuery) ||
    (section.corpo && section.corpo.toLowerCase().includes(normalizedQuery))
  );
}

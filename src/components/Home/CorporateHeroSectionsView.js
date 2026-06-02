/**
 * VeloHub V3 — Seções corporativas (Políticas, LGPD) com busca por título/conteúdo
 * VERSION: v1.0.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  normalizeCorporateSection,
  renderCorpoParagraphs,
  sectionMatchesQuery,
} from '../../utils/corporateCorpoText';

const CorporateHeroSectionsView = ({
  sections,
  groups,
  sectionTitle,
  searchPlaceholder = 'Buscar por título ou conteúdo…',
  emptyMessage = 'Nenhuma seção encontrada para esta busca.',
  unavailableMessage = 'Conteúdo indisponível no momento.',
  loading = false,
  loadingMessage = 'Carregando conteúdo…',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sectionGroups = useMemo(() => {
    if (Array.isArray(groups) && groups.length > 0) {
      return groups
        .filter((group) => Array.isArray(group.sections) && group.sections.length > 0)
        .map((group) => ({
          label: group.label || '',
          items: group.sections.map((section, index) =>
            normalizeCorporateSection({ ...section, group: group.label }, index)
          ),
        }));
    }
    if (Array.isArray(sections) && sections.length > 0) {
      return [
        {
          label: '',
          items: sections.map((section, index) => normalizeCorporateSection(section, index)),
        },
      ];
    }
    return [];
  }, [sections, groups]);

  const allItems = useMemo(
    () => sectionGroups.flatMap((group) => group.items),
    [sectionGroups]
  );

  const titleOptions = useMemo(
    () => allItems.map((item) => item.titulo).filter(Boolean),
    [allItems]
  );

  const filteredGroups = useMemo(
    () =>
      sectionGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => sectionMatchesQuery(item, searchQuery)),
        }))
        .filter((group) => group.items.length > 0),
    [sectionGroups, searchQuery]
  );

  const useTwoColumns =
    sectionGroups.length > 1 && !String(searchQuery || '').trim() && filteredGroups.length > 1;

  const datalistId = useMemo(() => {
    const key = sectionTitle || sectionGroups.map((group) => group.label).join('-') || 'corporate';
    return `corporate-titles-${key.replace(/\s+/g, '-').toLowerCase()}`;
  }, [sectionTitle, sectionGroups]);

  useEffect(() => {
    const query = String(searchQuery || '').trim().toLowerCase();
    if (!query) return;

    const exactMatch = allItems.find((item) => item.titulo.toLowerCase() === query);
    const target = exactMatch || filteredGroups.flatMap((group) => group.items)[0];
    if (!target?.sectionId) return;

    const element = document.getElementById(target.sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchQuery, allItems, filteredGroups]);

  if (loading) {
    return <p className="home-hero-content__text">{loadingMessage}</p>;
  }

  if (allItems.length === 0) {
    return <p className="home-hero-content__text">{unavailableMessage}</p>;
  }

  return (
    <div className={`home-corporate-sections${className ? ` ${className}` : ''}`}>
      {sectionTitle ? (
        <h2 className="home-hero-content__section-title">{sectionTitle}</h2>
      ) : null}

      <div className="home-corporate-sections__search-wrap">
        <Search size={18} className="home-corporate-sections__search-icon" aria-hidden />
        <input
          type="search"
          className="home-corporate-sections__search"
          list={datalistId}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Buscar seções por título ou conteúdo"
        />
        <datalist id={datalistId}>
          {titleOptions.map((titulo) => (
            <option key={titulo} value={titulo} />
          ))}
        </datalist>
      </div>

      {filteredGroups.length > 0 ? (
        <div
          className={
            useTwoColumns
              ? 'home-hero-content__grid--lgpd home-hero-content__grid--lgpd-two-cols home-corporate-sections__groups'
              : 'home-corporate-sections__groups'
          }
        >
          {filteredGroups.map((group) => (
            <section
              key={group.label || 'default'}
              className="home-hero-content__section home-corporate-sections__group"
            >
              {group.label ? (
                <h2 className="home-hero-content__section-title">{group.label}</h2>
              ) : null}
              <div className="home-corporate-sections__list">
                {group.items.map((item, index) => (
                  <article
                    key={`${item.sectionId}-${index}`}
                    id={item.sectionId}
                    className="home-corporate-sections__item"
                  >
                    <h3 className="home-hero-content__subsection-title">{item.titulo}</h3>
                    <div className="home-corporate-sections__item-body">
                      {renderCorpoParagraphs(item.corpo)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="home-hero-content__text">{emptyMessage}</p>
      )}
    </div>
  );
};

export default CorporateHeroSectionsView;

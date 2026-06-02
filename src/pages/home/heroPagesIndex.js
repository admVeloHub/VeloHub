/**
 * VeloHub V3 — Índice das páginas do hero (container 1)
 * VERSION: v1.1.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.0: Hero Termos de Uso (/portal/termo-usuario); quick links sem termo
 * - v1.0.2: Label do hero «Missão e Visão» → «Nossos Valores»
 */

import HeroMissaoVisaoPage from './HeroMissaoVisaoPage';
import HeroPoliticasNormasPage from './HeroPoliticasNormasPage';
import HeroLgpdPage from './HeroLgpdPage';
import HeroTermoUsuarioPage from './HeroTermoUsuarioPage';
import HeroFaleRhPage from './HeroFaleRhPage';
import HeroDenunciasPage from './HeroDenunciasPage';

export const HERO_PAGES = [
  {
    id: 'missao-visao',
    label: 'Nossos Valores',
    title: 'Nossos Valores',
    path: '/portal/missao-visao',
    activePageKey: 'Hero_MissaoVisao',
    iconFile: 'missao.png',
  },
  {
    id: 'politicas-normas',
    label: 'Políticas e Normas',
    title: 'Políticas e Normas',
    path: '/portal/politicas-normas',
    activePageKey: 'Hero_PoliticasNormas',
    iconFile: 'politica.png',
  },
  {
    id: 'lgpd',
    label: 'LGPD',
    title: 'LGPD',
    path: '/portal/lgpd',
    activePageKey: 'Hero_Lgpd',
    iconFile: 'lgpd.png',
  },
  {
    id: 'termo-usuario',
    label: 'Termos de Uso',
    title: 'Termos de Uso',
    path: '/portal/termo-usuario',
    activePageKey: 'Hero_TermoUsuario',
    iconFile: 'termos.png',
  },
  {
    id: 'fale-rh',
    label: 'Fale com o RH',
    title: 'Fale com o RH',
    path: '/portal/fale-rh',
    activePageKey: 'Hero_FaleRh',
    iconFile: 'rh.png',
  },
  {
    id: 'denuncias',
    label: 'Denúncias',
    title: 'Denúncias',
    path: '/portal/denuncias',
    activePageKey: 'Hero_Denuncias',
    iconFile: 'denuncia.png',
  },
];

export const HERO_QUICK_LINKS = HERO_PAGES.filter((page) => page.id !== 'termo-usuario').map(
  ({ id, label, path, activePageKey, iconFile }) => ({
    id,
    label,
    path,
    activePageKey,
    iconFile,
  })
);

export const HERO_PAGE_BY_ACTIVE_KEY = {
  Hero_MissaoVisao: HeroMissaoVisaoPage,
  Hero_PoliticasNormas: HeroPoliticasNormasPage,
  Hero_Lgpd: HeroLgpdPage,
  Hero_TermoUsuario: HeroTermoUsuarioPage,
  Hero_FaleRh: HeroFaleRhPage,
  Hero_Denuncias: HeroDenunciasPage,
};

const HERO_PAGE_BY_PATH = HERO_PAGES.reduce((acc, page) => {
  acc[page.path] = page;
  return acc;
}, {});

export function resolveHeroPageFromPath(pathname) {
  const normalized = (pathname || '').replace(/\.html$/i, '').replace(/\/$/, '') || '/';
  return HERO_PAGE_BY_PATH[normalized] || null;
}

export function isHeroActivePage(activePage) {
  return Boolean(HERO_PAGE_BY_ACTIVE_KEY[activePage]);
}

export function navigateHeroPage(link, setActivePage) {
  if (!link?.path || !link?.activePageKey || typeof setActivePage !== 'function') return;
  window.history.pushState({ heroPage: link.id }, '', link.path);
  setActivePage(link.activePageKey);
}

export function navigateHome(setActivePage) {
  if (typeof setActivePage !== 'function') return;
  window.history.pushState({}, '', '/');
  setActivePage('Home');
}

export function syncActivePageFromPath(pathname, setActivePage) {
  const heroPage = resolveHeroPageFromPath(pathname);
  if (heroPage) {
    setActivePage(heroPage.activePageKey);
    return true;
  }
  if (pathname === '/' || pathname === '') {
    setActivePage('Home');
    return true;
  }
  return false;
}

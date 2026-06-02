/**
 * VeloHub V3 — Assets compartilhados da Home / Atendimento
 * VERSION: v1.0.2 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.2: HOME_SIDEBAR_TITLE_IMG_CLASS legado; títulos novos via HomeWidgetTitle + home.css
 */

export function homeTitleLogoSrc(fileName) {
  const root = process.env.PUBLIC_URL || '';
  const relPath = `/titles and logos/${fileName}`;
  return encodeURI(`${root}${relPath}`);
}

export function homeHeroImgSrc(fileName) {
  const root = process.env.PUBLIC_URL || '';
  return encodeURI(`${root}/${fileName}`);
}

export function homePublicAtalhoImgSrc(fileName) {
  const root = process.env.PUBLIC_URL || '';
  return encodeURI(`${root}/${fileName}`);
}

export function homeHeroIconSrc(fileName) {
  const root = process.env.PUBLIC_URL || '';
  return encodeURI(`${root}/icone/${fileName}`);
}

export const HOME_SIDEBAR_TITLE_IMG_CLASS =
  'home-widget-title__img home-widget-title__img--legacy';

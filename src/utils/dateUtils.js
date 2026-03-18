/**
 * VeloHub V3 - dateUtils
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Regra: a data exibida deve ser SEMPRE a data no registro (sem adaptação de fuso).
 * Evita deslocamento por timezone (ex: 2026-03-01T00:00:00Z em pt-BR virava 28/02).
 */

/**
 * Formatar data para exibição (DD/MM/YYYY)
 * Exibe a data registrada como está, sem conversão de timezone.
 * @param {string|Date} dateInput - Data em string ISO, YYYY-MM-DD, ou objeto Date
 * @param {string} fallback - Valor quando data é null/undefined (default: '-')
 * @returns {string} Data formatada DD/MM/YYYY ou fallback
 */
export const formatDateRegistro = (dateInput, fallback = '-') => {
  if (!dateInput) return fallback;
  try {
    let str = String(dateInput);
    if (dateInput instanceof Date) {
      str = dateInput.toISOString().slice(0, 10);
    }
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
    const date = new Date(dateInput + (str.includes('T') ? '' : 'T12:00:00'));
    return isNaN(date.getTime()) ? str : date.toLocaleDateString('pt-BR');
  } catch {
    return String(dateInput);
  }
};

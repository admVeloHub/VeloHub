/**
 * VeloHub - Utility Functions
 * VERSION: v1.0.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
 * 
 * Funções utilitárias para normalização de dados
 * 
 * Funções:
 * - toTitleCase(): Normaliza nomes para Title Case
 * - normStatus(): Normaliza status para formato padrão
 * - normCpf(): Normaliza CPF removendo caracteres não numéricos
 */

/**
 * Converte string para Title Case
 * Mantém palavras como "da", "de", "do", "das", "dos", "e" em minúsculas (exceto no início)
 * 
 * @param {string} s - String a ser normalizada
 * @returns {string} String em Title Case
 * 
 * @example
 * toTitleCase('joão da silva') // 'João da Silva'
 * toTitleCase('MARIA DOS SANTOS') // 'Maria dos Santos'
 */
export function toTitleCase(s = '') {
  const lower = String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const keepLower = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
  return lower
    .split(' ')
    .filter(Boolean)
    .map((p, i) => {
      if (i > 0 && keepLower.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza status para formato padrão
 * 
 * @param {string} s - Status a ser normalizado
 * @returns {string} Status normalizado
 * 
 * @example
 * normStatus('nao feito') // 'não feito'
 * normStatus('NÃO FEITO') // 'não feito'
 * normStatus('feito') // 'feito'
 */
export function normStatus(s) {
  const t = String(s || '').toLowerCase().trim();
  if (t === 'nao feito' || t === 'não feito') return 'não feito';
  return t;
}

/**
 * Normaliza CPF removendo caracteres não numéricos
 * 
 * @param {string} s - CPF a ser normalizado
 * @returns {string} CPF apenas com dígitos
 * 
 * @example
 * normCpf('123.456.789-00') // '12345678900'
 * normCpf('123 456 789 00') // '12345678900'
 */
export function normCpf(s) {
  return String(s || '').replace(/\D/g, '');
}

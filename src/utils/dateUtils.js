/**
 * VeloHub V3 - dateUtils
 * VERSION: v1.1.0 | DATE: 2026-03-30 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.1.0:
 * - SLA Ouvidoria: helpers para badge nas listagens (prazoBacen / prazoOuvidoria), comparação por dia civil local
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

/**
 * Extrai YYYY-MM-DD do valor de prazo (mesma lógica de leitura de calendário que formatDateRegistro).
 * @param {string|Date|null|undefined} dateInput
 * @returns {string|null}
 */
export const toYyyyMmDdRegistro = (dateInput) => {
  if (!dateInput) return null;
  try {
    let str = String(dateInput);
    if (dateInput instanceof Date) {
      str = dateInput.toISOString().slice(0, 10);
    }
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
  } catch {
    return null;
  }
};

/** Data de hoje no fuso local como YYYY-MM-DD (comparação com prazo como dia civil). */
export const hojeYyyyMmDdLocal = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/** BACEN e N2 Pix possuem prazo no schema (prazoBacen / prazoOuvidoria). */
export const reclamacaoTemCampoPrazoSla = (tipo) => {
  const raw = String(tipo || '').trim();
  const u = raw.toUpperCase();
  if (u === 'BACEN') return true;
  if (u === 'N2 PIX' || u === 'OUVIDORIA') return true;
  if (u === 'N2' || u === 'N2 & PIX' || u === 'N2&PIX') return true;
  if (raw === 'N2 Pix' || raw === 'Ouvidoria') return true;
  return false;
};

export const getPrazoRawReclamacao = (r) => {
  if (!r) return null;
  return r.prazoBacen || r.prazoOuvidoria || null;
};

/**
 * Badge de SLA para listagens (Lista / Minhas reclamações).
 * @returns {null | { texto: string, corClasses: string, title: string }}
 */
export const getSlaBadgeReclamacao = (reclamacao) => {
  if (!reclamacao || !reclamacaoTemCampoPrazoSla(reclamacao.tipo)) return null;
  const raw = getPrazoRawReclamacao(reclamacao);
  if (!raw) return null;
  const prazoYmd = toYyyyMmDdRegistro(raw);
  if (!prazoYmd) return null;
  const hoje = hojeYyyyMmDdLocal();
  const dataFmt = formatDateRegistro(raw);
  const resolvido = reclamacao.Finalizado?.Resolvido === true;

  if (resolvido) {
    return {
      texto: `SLA ${dataFmt}`,
      corClasses: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
      title: `Prazo ${dataFmt} — reclamação concluída`,
    };
  }
  if (prazoYmd < hoje) {
    return {
      texto: `SLA vencido · ${dataFmt}`,
      corClasses: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      title: `Prazo ${dataFmt} — em atraso`,
    };
  }
  if (prazoYmd === hoje) {
    return {
      texto: `SLA vence hoje · ${dataFmt}`,
      corClasses: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100',
      title: `Prazo ${dataFmt} — vence hoje`,
    };
  }
  return {
    texto: `SLA ${dataFmt}`,
    corClasses: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200',
    title: `Prazo ${dataFmt} — dentro do prazo`,
  };
};

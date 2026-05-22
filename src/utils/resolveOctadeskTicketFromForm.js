/**
 * Resolve número de ticket Octadesk a partir do formulário de reclamação.
 * VERSION: v1.0.1 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * - v1.0.1: Inclui protocoloOctadesk (Time Portabilidade) — liberação antes de salvar
 * Prioridade: ticketRegistro → protocoloOctadesk → protocolosCentral[0] → protocolosN2[0]
 */

/**
 * @param {Record<string, unknown>|null|undefined} formData
 * @returns {string}
 */
export function resolveOctadeskTicketFromForm(formData) {
  if (!formData || typeof formData !== 'object') return '';
  const reg = String(formData.ticketRegistro != null ? formData.ticketRegistro : '').trim();
  if (reg) return reg;
  const octa = String(
    formData.protocoloOctadesk != null ? formData.protocoloOctadesk : ''
  ).trim();
  if (octa) return octa;
  const central = Array.isArray(formData.protocolosCentral) ? formData.protocolosCentral : [];
  for (const p of central) {
    const s = String(p != null ? p : '').trim();
    if (s) return s;
  }
  const n2 = Array.isArray(formData.protocolosN2) ? formData.protocolosN2 : [];
  for (const p of n2) {
    const s = String(p != null ? p : '').trim();
    if (s) return s;
  }
  return '';
}

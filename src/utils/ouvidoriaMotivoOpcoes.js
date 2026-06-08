/**
 * VeloHub V3 — Opções canônicas de motivoReduzido (módulo Ouvidoria / reclamações)
 * VERSION: v1.3.0 | DATE: 2026-06-08 | AUTHOR: VeloHub Development Team
 *
 * v1.3.0: «Quitação automática sem chave pix» (todos os grupos); «Quitação de contrato» também em Ação Judicial
 * v1.2.0: Remove «Chave pix»; canônico «Portabilidade chave pix»; Ação Judicial — Liberação + Portabilidade chave pix
 * v1.1.0: MOTIVOS_REDUZIDOS — Encerramento cta Celcoin / Encerramento cta App (canônico único)
 *
 * Fonte única para FormReclamacao, FormReclamacaoEdit e filtros (Lista, Dashboard).
 * Ordem preservada por grupo; MOTIVOS_FILTRO_LISTA = união deduplicada para selects de filtro.
 */

/** BACEN / N2 Pix / Procon */
export const MOTIVOS_REDUZIDOS = [
  'Liberação chave pix',
  'Portabilidade chave pix',
  'Abatimento de juros',
  'Juros abusivos',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Quitação de contrato',
  'Quitação automática sem chave pix',
  'Em cobrança',
  'Alega fraude',
  'Erro app',
  'Elegibilidade',
  'Encerramento cta Celcoin',
  'Encerramento cta App',
  'Superendividamento',
];

/** Ação Judicial */
export const MOTIVOS_ACAO_JUDICIAL = [
  'Juros',
  'Liberação chave pix',
  'Portabilidade chave pix',
  'Quitação de contrato',
  'Quitação automática sem chave pix',
  'Restituição BB',
  'Relatório',
  'Repetição indébito',
  'Superendividamento',
  'Desconhece contratação',
];

/** Reclame Aqui */
export const MOTIVOS_RECLAME_AQUI = [
  'Reativação do cadastro',
  'Alteração cadastral',
  'Abatimento de juros',
  'Juros abusivos',
  'Valor mínimo para contratação',
  'Limite baixo do pix',
  'Portabilidade chave pix',
  'Em cobrança',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Quitação de contrato',
  'Quitação automática sem chave pix',
  'Erro gov',
  'Não elegível a crédito',
  'Alega fraude',
  'Desativado',
  'Dívida prescrita',
  'Dúvidas gerais',
  'Encerramento cta App',
  'Encerramento cta Celcoin',
  'Erro app',
  'Elegibilidade',
  'Liberação chave pix',
];

/** União deduplicada, ordenada — filtro Motivo na Lista de Reclamações */
export const MOTIVOS_FILTRO_LISTA = Array.from(
  new Set([...MOTIVOS_REDUZIDOS, ...MOTIVOS_ACAO_JUDICIAL, ...MOTIVOS_RECLAME_AQUI])
).sort((a, b) => a.localeCompare(b, 'pt-BR'));

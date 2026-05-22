/**
 * VeloHub V3 — Opções canônicas do campo produto (módulo Ouvidoria / reclamações)
 * VERSION: v1.0.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * `value`: valor persistido no Mongo (alinhado FormReclamacao / filtros Dashboard e Lista).
 * `label`: texto na UI (ex.: Antecipação → «Antecipação Outros Anos»).
 */

export const OUVIDORIA_PRODUTO_OPCOES = [
  { value: 'Antecipação 2026', label: 'Antecipação 2026' },
  { value: 'Antecipação', label: 'Antecipação Outros Anos' },
  { value: 'Empréstimo Pessoal', label: 'Empréstimo Pessoal' },
  { value: 'Crédito Trabalhador', label: 'Crédito Trabalhador' },
  { value: 'Conta Celcoin', label: 'Conta Celcoin' },
  { value: 'Seguros', label: 'Seguros' },
  { value: 'Aplicativo', label: 'Aplicativo' },
  { value: 'Clube Velotax', label: 'Clube Velotax' },
  { value: 'Cupom', label: 'Cupom' },
  { value: 'Veloprime', label: 'Veloprime' },
  { value: 'Desativado', label: 'Desativado' },
  { value: 'Cupons Velotax', label: 'Cupons Velotax' },
  { value: 'QueroQuitar', label: 'QueroQuitar' },
  { value: 'Seguro DividaZero', label: 'Seguro DividaZero' },
  { value: 'Seguro Celular', label: 'Seguro Celular' },
  { value: 'Seguro Prestamista', label: 'Seguro Prestamista' },
  { value: 'Seguro Saúde', label: 'Seguro Saúde' },
  { value: 'Calculadora', label: 'Calculadora' },
  { value: 'App', label: 'App' },
  { value: 'Outras Reclamações', label: 'Outras Reclamações' },
];

/**
 * VeloHub — FloatingLabelField / FloatingLabelShell
 * VERSION: v1.0.5 | DATE: 2026-05-06 | AUTHOR: VeloHub Development Team
 *
 * v1.0.5:
 * - input `date` / `datetime-local` / `month` / `week` / `time`: `h-12 max-h-12` além de `min-h-12` (UA costuma forçar altura maior que selects/text só com min-height — ex.: «Data de Entrada»)
 *
 * v1.0.4:
 * - input/select de linha única: `min-h-12 box-border` após FLOAT_PAD (alinhamento com faixa de formulário Ouvidoria/Reclamações; referência campo Nome)
 *
 * Regra do portal: **todos** os campos nativos passam por aqui (salvo exceções documentadas no guia); **sem máscara/hint
 * visível** com o rótulo “dentro” (vazio + sem foco).
 *
 * - input/textarea: `placeholder` suprimido nesse estado (inclui type date, month, time, etc.; só não repassamos em
 *   file/hidden/checkbox/radio onde não se aplica).
 * - input date/datetime-local/month/week/time: classe `velohub-fl-datetime-collapsed` + CSS global (WebKit) esconde
 *   o texto fantasma do campo vazio.
 * - select: texto das options com value "" ou null fica invisível na caixa fechada (ZWSP) até focar ou haver valor.
 * FloatingLabelShell: filhos não-input (ex.: seletor de motivos custom).
 */

import React, { useState, Children, cloneElement, isValidElement } from 'react';

export function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !Number.isNaN(value);
  return String(value).trim() !== '';
}

function stripVerticalPadding(className) {
  if (!className || typeof className !== 'string') return '';
  return className
    .split(/\s+/)
    .filter((t) => t && !/^(py|pt|pb)(-|$)/.test(t))
    .join(' ')
    .trim();
}

const FLOAT_PAD = 'pt-4 pb-2.5';

/** Altura mínima do controle (Tailwind `min-h-12` = 3rem), alinhada à faixa dos formulários de Reclamações (referência: Nome). */
const SINGLE_LINE_FIELD_MIN_H = 'min-h-12 box-border';

/** Hint nativo (WebKit) de data/hora vazio — esconder com CSS quando o rótulo está “dentro”. */
const DATETIME_TYPES_COLLAPSED_MASK = new Set(['date', 'datetime-local', 'month', 'week', 'time']);

/** Data/hora nativos: o navegador impõe altura intrínseca; travamos em 3rem como os demais campos. */
const SINGLE_LINE_DATETIME_FIXED_H = 'min-h-12 h-12 max-h-12 box-border';

/**
 * Aplica altura mínima só em input/select de uma linha (exclui textarea, checkbox, file, etc.).
 * @param {React.ReactElement} child
 */
function singleLineFieldMinHeightClass(child) {
  if (!isValidElement(child)) return '';
  const t = typeof child.type === 'string' ? child.type.toLowerCase() : '';
  if (t === 'textarea') return '';
  if (t === 'select') return SINGLE_LINE_FIELD_MIN_H;
  if (t === 'input') {
    const inputType = String(child.props?.type || 'text').toLowerCase();
    if (
      ['hidden', 'file', 'checkbox', 'radio', 'button', 'submit', 'reset', 'image'].includes(inputType)
    ) {
      return '';
    }
    if (DATETIME_TYPES_COLLAPSED_MASK.has(inputType)) {
      return SINGLE_LINE_DATETIME_FIXED_H;
    }
    return SINGLE_LINE_FIELD_MIN_H;
  }
  return '';
}

/** Tipos em que não se repassa `placeholder` ao clone (atributo inexistente ou sem efeito útil). */
const INPUT_TYPES_SKIP_PLACEHOLDER_TOGGLE = new Set(['file', 'hidden', 'checkbox', 'radio']);

function shouldClearPlaceholderWhenCollapsed(child) {
  const t = typeof child.type === 'string' ? child.type.toLowerCase() : '';
  if (t === 'textarea') return true;
  if (t !== 'input') return false;
  const inputType = String(child.props?.type || 'text').toLowerCase();
  return !INPUT_TYPES_SKIP_PLACEHOLDER_TOGGLE.has(inputType);
}

function collapsedDatetimeMaskClass(child, raised, fieldValue) {
  const t = typeof child.type === 'string' ? child.type.toLowerCase() : '';
  if (t !== 'input') return '';
  const inputType = String(child.props?.type || 'text').toLowerCase();
  if (!DATETIME_TYPES_COLLAPSED_MASK.has(inputType)) return '';
  if (raised || isFilled(fieldValue)) return '';
  return 'velohub-fl-datetime-collapsed';
}

/** ZWSP: mantém altura da linha sem mostrar «Selecione…» / «Todos» na caixa fechada */
const SELECT_COLLAPSED_EMPTY_LABEL = '\u200b';

function isOptionEmptyValue(ov) {
  return ov === '' || ov === null;
}

/**
 * Em select vazio e sem foco, esconde o rótulo visível das options placeholder (value "" ou null).
 * Preserva optgroup e options com valor definido.
 */
function mapSelectChildrenBlankEmptyOptionLabel(nodes, selectValue) {
  if (isFilled(selectValue)) return nodes;

  return Children.map(nodes, (node) => {
    if (!isValidElement(node)) return node;
    const t = typeof node.type === 'string' ? node.type.toLowerCase() : '';
    if (t === 'optgroup') {
      return cloneElement(node, {
        children: mapSelectChildrenBlankEmptyOptionLabel(node.props.children, selectValue),
      });
    }
    if (t !== 'option') return node;
    const ov = node.props.value;
    if (!isOptionEmptyValue(ov)) return node;
    return cloneElement(node, {}, SELECT_COLLAPSED_EMPTY_LABEL);
  });
}

const labelBase =
  'pointer-events-none absolute left-3 z-10 max-w-[calc(100%-1.5rem)] origin-left truncate transition-all duration-200 ease-out px-0.5';

/**
 * @param {object} props
 * @param {string} [props.id] — htmlFor do rótulo; repassado ao filho quando FloatingLabelField
 * @param {string} props.label — texto (sem *; use required)
 * @param {boolean} [props.required]
 * @param {boolean} props.raised — rótulo na borda quando true
 * @param {boolean} [props.focused] — realça cor do rótulo (foco)
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function FloatingLabelShell({
  id,
  label,
  required,
  raised,
  focused,
  error,
  helperText,
  className = '',
  children,
}) {
  const display = required ? `${label} *` : label;
  const accent = focused && raised;
  const labelClass = `${labelBase} ${
    raised
      ? `top-0 -translate-y-1/2 text-[11px] leading-tight bg-[var(--cor-card)] dark:bg-[#323a42] ${
          accent ? 'text-[#006AB9] dark:text-[#1694FF]' : 'text-gray-700 dark:text-gray-200'
        }`
      : 'top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400'
  }`;

  const Tag = id ? 'label' : 'span';

  return (
    <div className={`relative w-full min-w-0 ${className}`.trim()}>
      {children}
      <Tag {...(id ? { htmlFor: id } : {})} className={labelClass}>
        {display}
      </Tag>
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
      {!error && helperText ? (
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{helperText}</span>
      ) : null}
    </div>
  );
}

/**
 * Um único filho: input, select ou textarea.
 */
export function FloatingLabelField({
  id,
  label,
  required,
  value,
  error,
  helperText,
  className = '',
  children,
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || isFilled(value);
  const child = Children.only(children);

  if (!isValidElement(child)) {
    throw new Error('FloatingLabelField espera um único elemento React filho.');
  }

  const inputId = id || child.props.id;
  const origPlaceholder = child.props.placeholder;
  const managePh = shouldClearPlaceholderWhenCollapsed(child);
  const placeholder =
    managePh && !raised ? '' : origPlaceholder !== undefined && origPlaceholder !== null ? origPlaceholder : undefined;

  const childType = typeof child.type === 'string' ? child.type.toLowerCase() : '';
  const isSelect = childType === 'select';
  const selectChildren =
    isSelect && !raised && !isFilled(value)
      ? mapSelectChildrenBlankEmptyOptionLabel(child.props.children, value)
      : undefined;

  const merged = cloneElement(child, {
    id: inputId,
    ...(managePh ? { placeholder } : {}),
    ...(isSelect && selectChildren !== undefined ? { children: selectChildren } : {}),
    onFocus: (e) => {
      setFocused(true);
      if (typeof child.props.onFocus === 'function') child.props.onFocus(e);
    },
    onBlur: (e) => {
      setFocused(false);
      if (typeof child.props.onBlur === 'function') child.props.onBlur(e);
    },
    className: [
      stripVerticalPadding(child.props.className),
      FLOAT_PAD,
      singleLineFieldMinHeightClass(child),
      collapsedDatetimeMaskClass(child, raised, value),
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  });

  return (
    <FloatingLabelShell
      id={inputId}
      label={label}
      required={required}
      raised={raised}
      focused={focused}
      error={error}
      helperText={helperText}
      className={className}
    >
      {merged}
    </FloatingLabelShell>
  );
}

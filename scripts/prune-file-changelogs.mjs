/**
 * Normaliza cabeçalhos VERSION + «Mudanças» para no máximo 2 entradas de referência (política App_v6).
 * Uso: node scripts/prune-file-changelogs.mjs
 * VERSION: v1.0.1 | DATE: 2026-05-11
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATE = '2026-05-11';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage',
]);

function walkJsCss(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJsCss(p, out);
    else if (/\.(js|jsx|css)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

function bumpPatch(ver) {
  const v = ver.startsWith('v') ? ver.slice(1) : ver;
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return ver.startsWith('v') ? ver : `v${ver}`;
  return `v${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

// innerLines: linhas internas do comentário inicial (prefixo "* " já removido).
function parseMudancasSections(innerLines) {
  const sections = [];
  let i = 0;
  while (i < innerLines.length) {
    const m = innerLines[i].match(/^Mudanças (v\d+\.\d+\.\d+):\s*$/);
    if (m) {
      const ver = m[1];
      i++;
      const bullets = [];
      while (i < innerLines.length) {
        if (/^Mudanças v\d+\.\d+\.\d+:/.test(innerLines[i])) break;
        const t = innerLines[i].trim();
        if (t.startsWith('-')) bullets.push(t.replace(/^\-\s*/, ''));
        i++;
      }
      sections.push({ ver, bullets });
    } else {
      i++;
    }
  }
  return sections;
}

function buildRefs(sections, max = 2) {
  const usable = sections.filter((s) => s.bullets.length > 0);
  /* Changelog do projeto: entradas mais recentes primeiro — refs = primeiras do arquivo */
  const pick = usable.slice(0, max);
  return pick.map((s) => {
    const text = s.bullets[0].replace(/\s+/g, ' ').trim();
    return `${s.ver}: ${text}`;
  });
}

function processBlockFile(absPath, raw) {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('/**')) return null;
  const close = trimmed.indexOf('*/');
  if (close === -1) return null;
  const block = trimmed.slice(0, close + 2);
  const rest = trimmed.slice(close + 2);

  const lines = block.split(/\r?\n/);
  const innerRaw = lines.slice(1, -1);
  const inner = innerRaw.map((l) => {
    if (/^\s*\*/.test(l)) return l.replace(/^\s*\*\s?/, '');
    return l;
  });

  let vLineIdx = inner.findIndex((l) => /^VERSION:/i.test(l));
  if (vLineIdx === -1) return null;

  const titlePart = inner.slice(0, vLineIdx).filter((l) => l.trim() !== '');
  const versionLine = inner[vLineIdx];
  const vm = versionLine.match(/VERSION:\s*(v\d+\.\d+\.\d+)/i);
  const oldVer = vm ? vm[1] : null;
  if (!oldVer) return null;

  const authorMatch = versionLine.match(/\|\s*AUTHOR:\s*(.+)$/i);
  const author = authorMatch ? authorMatch[1].trim() : 'VeloHub Development Team';

  let i = vLineIdx + 1;
  while (i < inner.length && inner[i].trim() === '') i++;

  const extraDesc = [];
  while (i < inner.length && !/^Mudanças v\d+\.\d+\.\d+:/.test(inner[i])) {
    if (inner[i].trim() !== '') extraDesc.push(inner[i]);
    i++;
  }

  const tail = inner.slice(i);
  const sections = parseMudancasSections(tail);
  if (sections.length === 0) return null;

  const newVer = bumpPatch(oldVer);
  const refs = buildRefs(sections, 2);

  const titleLines = titlePart.length
    ? titlePart
    : [`Arquivo ${path.basename(absPath)}`];

  const out = [];
  out.push('/**');
  for (const t of titleLines) out.push(` * ${t}`);
  out.push(` * VERSION: ${newVer} | DATE: ${DATE} | AUTHOR: ${author}`);
  out.push(' *');
  for (const d of extraDesc) out.push(` * ${d}`);
  if (extraDesc.length > 0) out.push(' *');
  out.push(' * Referência (duas entradas; detalhes no Git):');
  for (const r of refs) out.push(` * - ${r}`);
  out.push(' */');

  const newContent = `${out.join('\n')}${rest}`;
  if (newContent === raw) return null;
  return newContent;
}

function processLineCommentHeader(absPath, raw) {
  const base = path.basename(absPath);
  if (base !== 'aiService.js') return null;
  if (!raw.startsWith('// AI Service')) return null;

  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].startsWith('//')) i++;
  const headerLines = lines.slice(0, i);
  const body = headerLines.join('\n');
  if (!body.includes('VERSION:') || !body.includes('Mudanças')) return null;

  const firstVer = body.match(/VERSION:\s*(v\d+\.\d+\.\d+)/i);
  if (!firstVer) return null;
  const oldVer = firstVer[1];
  const authorMatch = body.match(/\|\s*AUTHOR:\s*([^\n|]+)/i);
  const author = authorMatch ? authorMatch[1].trim() : 'VeloHub Development Team';

  const refs = [];
  for (const line of headerLines) {
    const mm = line.match(/^\/\/ Mudanças (v\d+\.\d+\.\d+):\s*(.+)$/);
    if (mm) refs.push({ ver: mm[1], text: mm[2].trim() });
  }
  refs.sort((a, b) => {
    const pa = a.ver.slice(1).split('.').map(Number);
    const pb = b.ver.slice(1).split('.').map(Number);
    for (let k = 0; k < 3; k++) if (pa[k] !== pb[k]) return pb[k] - pa[k];
    return 0;
  });
  const pick = refs.slice(0, 2);
  const newVer = bumpPatch(oldVer);

  const out = [];
  out.push(`// AI Service - Integração híbrida com IA para respostas inteligentes`);
  out.push(`// VERSION: ${newVer} | DATE: ${DATE} | AUTHOR: ${author}`);
  out.push(`//`);
  out.push(`// Referência (duas entradas; detalhes no Git):`);
  for (const p of pick) out.push(`// - ${p.ver}: ${p.text}`);
  out.push('');
  const newContent = `${out.join('\n')}${lines.slice(i).join('\n')}`;
  if (newContent === raw) return null;
  return newContent;
}

function main() {
  const files = walkJsCss(ROOT);
  let n = 0;
  for (const abs of files) {
    let raw;
    try {
      raw = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    let next = processLineCommentHeader(abs, raw);
    if (next == null) next = processBlockFile(abs, raw);
    if (next != null && next !== raw) {
      fs.writeFileSync(abs, next, 'utf8');
      n++;
      console.log('OK', path.relative(ROOT, abs));
    }
  }
  console.error(`Atualizados ${n} arquivos.`);
}

main();

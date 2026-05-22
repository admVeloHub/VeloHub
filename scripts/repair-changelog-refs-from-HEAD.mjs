/**
 * Recalcula as duas linhas «Referência» usando o cabeçalho Mudanças do último commit (HEAD),
 * pois a primeira execução de prune usou slice(-2) em changelog ordenado do novo → antigo.
 * Uso: node scripts/repair-changelog-refs-from-HEAD.mjs
 * VERSION: v1.0.0 | DATE: 2026-05-11
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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
  const pick = usable.slice(0, max);
  return pick.map((s) => {
    const text = s.bullets[0].replace(/\s+/g, ' ').trim();
    return `${s.ver}: ${text}`;
  });
}

function extractFirstBlockComment(raw) {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('/**')) return null;
  const close = trimmed.indexOf('*/');
  if (close === -1) return null;
  return trimmed.slice(0, close + 2);
}

function refsFromBlock(block) {
  const lines = block.split(/\r?\n/);
  const innerRaw = lines.slice(1, -1);
  const inner = innerRaw.map((l) => {
    if (/^\s*\*/.test(l)) return l.replace(/^\s*\*\s?/, '');
    return l;
  });
  const tailStart = inner.findIndex((l) => /^Mudanças v\d+\.\d+\.\d+:/.test(l));
  if (tailStart === -1) return null;
  const refs = buildRefs(parseMudancasSections(inner.slice(tailStart)), 2);
  return refs.length ? refs : null;
}

function semverDesc(a, b) {
  const pa = a.ver.slice(1).split('.').map(Number);
  const pb = b.ver.slice(1).split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i];
  return 0;
}

function refsFromAiServiceHeader(headerChunk) {
  const refs = [];
  for (const line of headerChunk.split(/\r?\n/)) {
    const mm = line.match(/^[/][/] Mudanças (v\d+\.\d+\.\d+):\s*(.+)$/);
    if (mm) refs.push({ ver: mm[1], text: mm[2].trim() });
  }
  refs.sort(semverDesc);
  const pick = refs.slice(0, 2);
  if (!pick.length) return null;
  return pick.map((p) => `${p.ver}: ${p.text}`);
}

function gitShowHead(relPath) {
  try {
    return execSync(`git show HEAD:${relPath.replace(/\\/g, '/')}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function patchBlockFile(raw, refs) {
  const refBlock =
    ` * Referência (duas entradas; detalhes no Git):\n` +
    refs.map((r) => ` * - ${r}`).join('\n') + '\n';
  const re = / \* Referência \(duas entradas; detalhes no Git\):\r?\n(?: \* - [^\r\n]+\r?\n)+/;
  if (!re.test(raw)) return null;
  return raw.replace(re, refBlock);
}

function patchAiService(raw, refs) {
  const refBlock =
    `// Referência (duas entradas; detalhes no Git):\n` +
    refs.map((r) => `// - ${r}`).join('\n');
  const re = /\/\/ Referência \(duas entradas; detalhes no Git\):\r?\n(?:\/\/ - [^\r\n]+\r?\n)+/;
  if (!re.test(raw)) return null;
  return raw.replace(re, refBlock + '\n');
}

function main() {
  const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter((f) => /\.(js|jsx|css)$/i.test(f));

  let n = 0;
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    let raw;
    try {
      raw = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    if (!raw.includes('Referência (duas entradas; detalhes no Git)')) continue;

    const headRaw = gitShowHead(rel);
    if (!headRaw) continue;

    let refs = null;
    if (path.basename(rel) === 'aiService.js' && headRaw.startsWith('// AI Service')) {
      const hLines = headRaw.split(/\r?\n/);
      let hi = 0;
      while (hi < hLines.length && hLines[hi].startsWith('//')) hi++;
      refs = refsFromAiServiceHeader(hLines.slice(0, hi).join('\n'));
    } else {
      const block = extractFirstBlockComment(headRaw);
      if (block) refs = refsFromBlock(block);
    }
    if (!refs || refs.length === 0) continue;

    let next =
      path.basename(rel) === 'aiService.js' ? patchAiService(raw, refs) : patchBlockFile(raw, refs);
    if (next && next !== raw) {
      fs.writeFileSync(abs, next, 'utf8');
      n++;
      console.log('OK', rel);
    }
  }
  console.error(`Referências corrigidas em ${n} arquivos (fonte: git show HEAD).`);
}

main();

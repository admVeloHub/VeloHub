// VERSION: v1.0.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Extrai parágrafos de um .docx (word/document.xml).
 * @param {string} docxPath
 * @returns {string[]}
 */
function extractDocxParagraphs(docxPath) {
  const abs = path.resolve(docxPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Arquivo não encontrado: ${abs}`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'velohub-docx-'));
  const zipPath = path.join(tmpDir, 'doc.zip');
  fs.copyFileSync(abs, zipPath);

  try {
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${tmpDir.replace(/'/g, "''")}' -Force"`, {
        stdio: 'pipe',
      });
    } else {
      execSync(`unzip -q -o "${zipPath}" -d "${tmpDir}"`, { stdio: 'pipe' });
    }
  } catch (err) {
    throw new Error(`Falha ao extrair docx: ${err.message}`);
  }

  const xmlPath = path.join(tmpDir, 'word', 'document.xml');
  if (!fs.existsSync(xmlPath)) {
    throw new Error('word/document.xml não encontrado no docx');
  }

  const xml = fs.readFileSync(xmlPath, 'utf8');
  const paragraphs = [];
  const paraRe = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let match;
  while ((match = paraRe.exec(xml))) {
    const texts = [...match[1].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) =>
      m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    );
    const line = texts.join('').trim();
    if (line) paragraphs.push(line);
  }

  return paragraphs;
}

/**
 * Agrupa parágrafos em seções quando o título casa com isHeading.
 * @param {string[]} paragraphs
 * @param {(line: string) => boolean} isHeading
 * @returns {{ titulo: string, corpo: string }[]}
 */
function groupParagraphsIntoSections(paragraphs, isHeading) {
  const sections = [];
  let current = null;

  for (const line of paragraphs) {
    if (isHeading(line)) {
      if (current && current.corpo.trim()) {
        sections.push({ titulo: current.titulo, corpo: current.corpo.trim() });
      }
      current = { titulo: line.trim(), corpo: '' };
    } else if (current) {
      current.corpo += (current.corpo ? '\n\n' : '') + line;
    }
  }

  if (current && current.corpo.trim()) {
    sections.push({ titulo: current.titulo, corpo: current.corpo.trim() });
  }

  return sections;
}

/**
 * Seções numeradas do Código de Ética (1. … 13. …).
 * @param {string} docxPath
 */
function parsePoliticasNormasDocx(docxPath) {
  const paragraphs = extractDocxParagraphs(docxPath);
  const startIdx = paragraphs.findIndex((p) => /^1\.\s/.test(p) || p.startsWith('1. Objetivo'));
  const slice = startIdx >= 0 ? paragraphs.slice(startIdx) : paragraphs;

  return groupParagraphsIntoSections(slice, (line) => /^\d+\.\s/.test(line));
}

/** Títulos principais conhecidos do LGPD001.docx */
const LGPD_PUBLIC_HEADINGS = new Set([
  'Introdução',
  'Definições',
  'Meios de coleta de dados',
  'Finalidades',
  'Dados coletados',
  'Uso de cookies',
  'Compartilhamento de dados',
  'Armazenamento de dados',
  'Direitos do titular',
  'Como exercer seus direitos',
  'Encarregado de dados (DPO)',
  'Alterações nesta política',
  'Contato',
  'Disposições finais',
]);

/**
 * @param {string} docxPath
 */
function parseLgpdPublicaDocx(docxPath) {
  const paragraphs = extractDocxParagraphs(docxPath);
  const skipPrefixes = [
    'Política de',
    'Última modificação',
    'Este documento é aplicável',
  ];
  const filtered = paragraphs.filter(
    (p) => !skipPrefixes.some((pref) => p.startsWith(pref))
  );

  return groupParagraphsIntoSections(filtered, (line) => {
    if (LGPD_PUBLIC_HEADINGS.has(line)) return true;
    if (line.length <= 55 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(line) && !line.endsWith(';') && !line.endsWith('.')) {
      return LGPD_PUBLIC_HEADINGS.has(line) || /^Direitos|^Encarregado|^Alterações|^Contato|^Disposições/.test(line);
    }
    return false;
  });
}

module.exports = {
  extractDocxParagraphs,
  groupParagraphsIntoSections,
  parsePoliticasNormasDocx,
  parseLgpdPublicaDocx,
};

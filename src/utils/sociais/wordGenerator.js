/**
 * VeloHub V3 - Word Generator (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

const removeCitationCodes = (text) => {
  if (!text) return '';
  return text.replace(/\[cite_start\][\s\S]*?\[cite:\s*\]/g, '')
    .replace(/\[cite_start\]/g, '').replace(/\[cite:\s*\]/g, '')
    .replace(/\[cite:\s*[^\]]+\]/g, '');
};

const processMarkdownInline = (text) => {
  if (!text) return '';
  return text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>').replace(/\*\*/g, '').replace(/\*/g, '');
};

const markdownToDocxElements = (markdown) => {
  if (!markdown) return [];
  const elements = [];
  const lines = markdown.split('\n');
  let currentListItems = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanedLine = removeCitationCodes(line);
    if (cleanedLine.includes('[QUEBRA DE PÁGINA') || cleanedLine.includes('[QUEBRA DE PAGINA')) {
      if (currentListItems.length > 0) { elements.push(...currentListItems); currentListItems = []; }
      elements.push(new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true }));
      continue;
    }
    if (cleanedLine.startsWith('# ')) {
      if (currentListItems.length > 0) { elements.push(...currentListItems); currentListItems = []; }
      const content = processMarkdownInline(cleanedLine.substring(2));
      elements.push(new Paragraph({ children: [new TextRun({ text: content })], heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    } else if (cleanedLine.startsWith('## ')) {
      if (currentListItems.length > 0) { elements.push(...currentListItems); currentListItems = []; }
      const content = processMarkdownInline(cleanedLine.substring(3));
      elements.push(new Paragraph({ children: [new TextRun({ text: content })], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
    } else if (cleanedLine.startsWith('### ')) {
      if (currentListItems.length > 0) { elements.push(...currentListItems); currentListItems = []; }
      const content = processMarkdownInline(cleanedLine.substring(4));
      elements.push(new Paragraph({ children: [new TextRun({ text: content })], heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
    } else if (cleanedLine.match(/^\s*[-*]\s/)) {
      const content = processMarkdownInline(cleanedLine.replace(/^\s*[-*]\s+/, ''));
      currentListItems.push(new Paragraph({ children: [new TextRun({ text: content })], bullet: { level: 0 }, spacing: { after: 100 } }));
    } else if (cleanedLine.trim() === '') {
      if (currentListItems.length > 0) { elements.push(...currentListItems); currentListItems = []; }
      elements.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
    } else {
      if (currentListItems.length > 0) { elements.push(...currentListItems); currentListItems = []; }
      const content = processMarkdownInline(cleanedLine);
      elements.push(new Paragraph({ children: [new TextRun({ text: content })], spacing: { after: 150 } }));
    }
  }
  if (currentListItems.length > 0) elements.push(...currentListItems);
  return elements;
};

export const generateReportWord = async (reportMarkdown, sentimentChartImage = null) => {
  const elements = [];
  elements.push(new Paragraph({
    children: [new TextRun({ text: 'Relatório Executivo de CX', bold: true })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 }
  }));
  elements.push(new Paragraph({
    children: [new TextRun({ text: `Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` })],
    spacing: { after: 300 }
  }));
  elements.push(...markdownToDocxElements(reportMarkdown));
  if (sentimentChartImage?.dataUrl) {
    elements.push(new Paragraph({
      children: [new TextRun({ text: '[Gráfico de Análise de Sentimento incluído]' })],
      spacing: { before: 200, after: 200 }
    }));
  }
  return new Document({
    sections: [{ properties: {}, children: elements }],
    styles: {
      default: {
        document: { run: { font: 'Poppins', size: 22, color: '272A30' }, paragraph: { spacing: { line: 276, lineRule: 'auto' } } }
      },
      heading1: { run: { font: 'Poppins', size: 48, color: '1634FF', bold: true } },
      heading2: { run: { font: 'Poppins', size: 40, color: '1634FF', bold: true } },
      heading3: { run: { font: 'Poppins', size: 36, color: '1634FF', bold: true } }
    }
  });
};

export const downloadReportWord = async (reportMarkdown, filename = null, sentimentChartImage = null) => {
  try {
    const doc = await generateReportWord(reportMarkdown, sentimentChartImage);
    const blob = await Packer.toBlob(doc);
    const fileName = filename || `relatorio_cx_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar Word:', error);
    return { success: false, error: error.message };
  }
};

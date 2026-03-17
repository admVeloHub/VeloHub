/**
 * VeloHub V3 - PDF Generator (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

let jsPDFCache = null;
let html2canvasCache = null;

const loadPDFLibraries = async () => {
  if (!jsPDFCache) {
    const jspdfModule = await import('jspdf');
    jsPDFCache = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
    if (typeof jsPDFCache === 'object' && jsPDFCache.jsPDF) jsPDFCache = jsPDFCache.jsPDF;
  }
  if (!html2canvasCache) {
    const html2canvasModule = await import('html2canvas');
    html2canvasCache = html2canvasModule.default || html2canvasModule;
  }
  if (!jsPDFCache || !html2canvasCache) throw new Error('Não foi possível carregar as bibliotecas PDF');
  return { jsPDF: jsPDFCache, html2canvas: html2canvasCache };
};

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

const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  const htmlParts = [];
  let inList = false;
  let currentListItems = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanedLine = removeCitationCodes(line);
    if (cleanedLine.includes('[QUEBRA DE PÁGINA') || cleanedLine.includes('[QUEBRA DE PAGINA')) {
      if (inList) { htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`); currentListItems = []; inList = false; }
      continue;
    }
    if (cleanedLine.startsWith('# ')) {
      if (inList) { htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`); currentListItems = []; inList = false; }
      htmlParts.push(`<h1 style="color:#1634FF;font-size:24px;margin-top:20px;margin-bottom:10px;font-weight:bold;">${processMarkdownInline(cleanedLine.substring(2))}</h1>`);
    } else if (cleanedLine.startsWith('## ')) {
      if (inList) { htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`); currentListItems = []; inList = false; }
      htmlParts.push(`<h2 style="color:#1634FF;font-size:20px;margin-top:18px;margin-bottom:8px;font-weight:bold;">${processMarkdownInline(cleanedLine.substring(3))}</h2>`);
    } else if (cleanedLine.startsWith('### ')) {
      if (inList) { htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`); currentListItems = []; inList = false; }
      htmlParts.push(`<h3 style="color:#1634FF;font-size:18px;margin-top:16px;margin-bottom:6px;font-weight:bold;">${processMarkdownInline(cleanedLine.substring(4))}</h3>`);
    } else if (cleanedLine.match(/^\s*[-*]\s/)) {
      if (!inList) inList = true;
      currentListItems.push(`<li style="margin-bottom:6px;line-height:1.6;color:#272A30;">${processMarkdownInline(cleanedLine.replace(/^\s*[-*]\s+/, ''))}</li>`);
    } else if (cleanedLine.trim() === '') {
      if (inList) { htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`); currentListItems = []; inList = false; }
      htmlParts.push('<br/>');
    } else {
      if (inList) { htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`); currentListItems = []; inList = false; }
      htmlParts.push(`<p style="margin-bottom:10px;line-height:1.6;color:#272A30;">${processMarkdownInline(cleanedLine)}</p>`);
    }
  }
  if (inList) htmlParts.push(`<ul style="margin:10px 0;padding-left:20px;list-style-type:disc;">${currentListItems.join('')}</ul>`);
  return htmlParts.filter(h => h !== '').join('');
};

export const generateReportPDF = async (reportMarkdown, chartImages = null, sentimentChartImage = null) => {
  const { jsPDF: PDF, html2canvas: canvas } = await loadPDFLibraries();
  const pdf = new PDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  const checkNewPage = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - margin) { pdf.addPage(); yPosition = margin; return true; }
    return false;
  };
  pdf.setFontSize(22);
  pdf.setTextColor(22, 52, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório Executivo de CX', margin, yPosition);
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, margin, yPosition);
  yPosition += 8;
  pdf.setDrawColor(22, 52, 255);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  const lines = reportMarkdown.split('\n');
  const sections = [];
  let currentSection = [];
  let nextPageBreak = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[QUEBRA DE PÁGINA') || line.includes('[QUEBRA DE PAGINA')) {
      if (currentSection.length > 0) { sections.push({ content: currentSection.join('\n'), pageBreak: false }); currentSection = []; }
      nextPageBreak = true;
    } else {
      if (nextPageBreak && currentSection.length === 0 && line.trim() !== '') { sections.push({ content: '', pageBreak: true }); nextPageBreak = false; }
      currentSection.push(line);
    }
  }
  if (currentSection.length > 0) sections.push({ content: currentSection.join('\n'), pageBreak: false });
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.pageBreak && i > 0) { pdf.addPage(); yPosition = margin; continue; }
    if (section.pageBreak && i === 0) continue;
    const htmlContent = markdownToHtml(section.content);
    if (!htmlContent.trim()) continue;
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `width:${maxWidth}mm;padding:20px;position:absolute;left:-9999px;background:#fff;font-family:Poppins,Arial;font-size:12px;color:#272A30;line-height:1.6`;
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    try {
      const canvasResult = await canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvasResult.toDataURL('image/png');
      const imgWidth = maxWidth;
      const imgHeight = (canvasResult.height * imgWidth) / canvasResult.width;
      if (i > 0) checkNewPage(imgHeight);
      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (e) {
      const textLines = pdf.splitTextToSize(removeCitationCodes(section.content), maxWidth);
      textLines.forEach(l => { checkNewPage(7); pdf.text(l, margin, yPosition); yPosition += 7; });
    }
    document.body.removeChild(tempDiv);
  }
  if (sentimentChartImage?.dataUrl) {
    checkNewPage(100);
    yPosition += 10;
    if (sentimentChartImage.dataUrl.startsWith('data:image')) {
      pdf.addImage(sentimentChartImage.dataUrl, 'PNG', margin, yPosition, maxWidth, 80);
      yPosition += 90;
    }
  }
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }
  return pdf;
};

export const downloadReportPDF = async (reportMarkdown, chartImages = null, filename = null, sentimentChartImage = null) => {
  try {
    const pdf = await generateReportPDF(reportMarkdown, chartImages, sentimentChartImage);
    const fileName = filename || `relatorio_cx_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return { success: false, error: error.message };
  }
};

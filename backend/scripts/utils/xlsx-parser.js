/**
 * Utilitários para Parser XLSX
 * VERSION: v1.0.0 | DATE: 2026-02-24 | AUTHOR: VeloHub Development Team
 * 
 * Funções auxiliares compartilhadas para processamento de arquivos XLSX
 */

const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Ler arquivo XLSX e retornar dados de uma aba específica
 */
function parseXLSXFile(caminhoArquivo, nomeAba) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  // Ler arquivo XLSX
  const workbook = XLSX.readFile(caminhoArquivo);
  
  // Encontrar a aba pelo nome (case-insensitive)
  let sheetName = null;
  for (const name of workbook.SheetNames) {
    if (name.toLowerCase() === nomeAba.toLowerCase()) {
      sheetName = name;
      break;
    }
  }
  
  if (!sheetName) {
    throw new Error(`Aba "${nomeAba}" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`);
  }
  
  // Converter aba para JSON (primeira linha como cabeçalho)
  const worksheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(worksheet, {
    raw: false, // Converter valores para strings
    defval: '', // Valor padrão para células vazias
    blankrows: false // Não incluir linhas vazias
  });
  
  return dados;
}

/**
 * Converter data do formato brasileiro (DD/MM/YYYY) para Date
 */
function parseDataBR(dataStr) {
  if (!dataStr || dataStr.trim() === '') return null;
  
  // Se já é um objeto Date
  if (dataStr instanceof Date) {
    return dataStr;
  }
  
  // Se é um número (serial do Excel)
  if (typeof dataStr === 'number') {
    // Excel armazena datas como número de dias desde 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const days = dataStr - 2; // Excel tem bug: conta 1900 como ano bissexto
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  }
  
  // Tentar parsear como string DD/MM/YYYY
  const partes = String(dataStr).split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
    const ano = parseInt(partes[2], 10);
    
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
      return new Date(ano, mes, dia);
    }
  }
  
  // Tentar parsear como Date ISO
  const dateObj = new Date(dataStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj;
  }
  
  return null;
}

/**
 * Normalizar CPF: remover caracteres não numéricos e garantir 11 dígitos
 */
function normalizarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  return apenasNumeros.length === 11 ? apenasNumeros : '';
}

/**
 * Buscar campo no objeto usando diferentes variações de nome
 */
function buscarCampo(row, variacoes) {
  if (!row || typeof row !== 'object') return '';
  
  for (const variacao of variacoes) {
    // Tentar exato
    if (row[variacao] !== undefined && row[variacao] !== null && row[variacao] !== '') {
      return String(row[variacao]).trim();
    }
    
    // Tentar case-insensitive
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === variacao.toLowerCase()) {
        const valor = row[key];
        if (valor !== undefined && valor !== null && valor !== '') {
          return String(valor).trim();
        }
      }
    }
  }
  
  return '';
}

/**
 * Converter telefone para formato esperado
 */
function converterTelefones(telefoneStr) {
  if (!telefoneStr || typeof telefoneStr !== 'string') {
    return { principal: '', lista: [] };
  }
  
  const telefones = telefoneStr
    .split(/[,;]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => {
      // Remover caracteres não numéricos exceto + no início
      return t.replace(/[^\d+]/g, '').replace(/^\+/, '');
    })
    .filter(t => t.length >= 10);
  
  return {
    principal: telefones[0] || '',
    lista: telefones
  };
}

/**
 * Converter tentativas de contato
 */
function converterTentativas(tentativa1, tentativa2, tentativa3) {
  const tentativas = [];
  
  const t1 = parseDataBR(tentativa1);
  if (t1) tentativas.push(t1);
  
  const t2 = parseDataBR(tentativa2);
  if (t2) tentativas.push(t2);
  
  const t3 = parseDataBR(tentativa3);
  if (t3) tentativas.push(t3);
  
  return tentativas;
}

/**
 * Converter string para boolean
 */
function converterBoolean(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor !== 0;
  
  const str = String(valor).toUpperCase().trim();
  return str === 'TRUE' || str === 'SIM' || str === 'S' || str === '1' || str === 'YES' || str === 'Y';
}

/**
 * Converter protocolos (string separada por vírgulas)
 */
function converterProtocolos(protocolosStr) {
  if (!protocolosStr || typeof protocolosStr !== 'string') return [];
  
  return protocolosStr
    .split(/[,;]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Converter status PIX
 */
function converterPixStatus(statusStr) {
  if (!statusStr || typeof statusStr !== 'string') return 'Pendente';
  
  const str = statusStr.toUpperCase().trim();
  
  if (str.includes('LIBERADO') || str.includes('LIBERADA')) return 'Liberado';
  if (str.includes('EXCLUÍDO') || str.includes('EXCLUIDO') || str.includes('EXCLUÍDA') || str.includes('EXCLUIDA')) return 'Excluído';
  if (str.includes('TRUE')) return 'Liberado';
  if (str.includes('FALSE')) return 'Pendente';
  
  return 'Pendente';
}

module.exports = {
  parseXLSXFile,
  parseDataBR,
  normalizarCPF,
  buscarCampo,
  converterTelefones,
  converterTentativas,
  converterBoolean,
  converterProtocolos,
  converterPixStatus
};

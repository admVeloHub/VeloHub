/**
 * Script de teste: Verificar como CPFs são lidos do Excel
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = path.join(__dirname, '../../../dados procon/RA.xlsx');

function normalizarCPF(cpf) {
  if (!cpf && cpf !== 0) return '';
  
  let cpfStr;
  if (typeof cpf === 'number') {
    cpfStr = String(cpf);
    // Se tiver menos de 11 dígitos, adicionar zeros à esquerda
    while (cpfStr.length < 11) {
      cpfStr = '0' + cpfStr;
    }
  } else {
    cpfStr = String(cpf);
  }
  
  const apenasNumeros = cpfStr.replace(/\D/g, '');
  
  if (apenasNumeros.length < 9) {
    return '';
  }
  
  if (apenasNumeros.length >= 9 && apenasNumeros.length < 11) {
    return apenasNumeros.padStart(11, '0');
  }
  
  return apenasNumeros.substring(0, 11);
}

const workbook = XLSX.readFile(XLSX_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Ler usando método 1: sheet_to_json com raw: false
const dados1 = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  raw: false
});

// Ler usando método 2: sheet_to_json com raw: true
const dados2 = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  raw: true
});

// Ler usando método 3: ler células diretamente
const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
const dados3 = [];
for (let R = range.s.r; R <= Math.min(range.e.r, 10); R++) {
  const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
  const cell = worksheet[cellAddress];
  if (cell) {
    dados3.push({
      linha: R + 1,
      valor: cell.v,
      tipo: typeof cell.v,
      formatado: cell.w,
      t: cell.t
    });
  }
}

console.log('=== TESTE DE LEITURA DE CPFs DO EXCEL ===\n');

// CPFs de teste que começam com 0
const cpfsTeste = ['03446919775', '07040092425', '09141442350', '06287962690', '02801298077'];

console.log('Método 1 (raw: false):');
cpfsTeste.forEach(cpfTeste => {
  const encontrado = dados1.find(row => {
    const cpfNormalizado = normalizarCPF(row[0]);
    return cpfNormalizado === cpfTeste || cpfNormalizado === cpfTeste.replace(/^0/, '');
  });
  if (encontrado) {
    console.log(`  CPF ${cpfTeste}: encontrado como ${encontrado[0]} (tipo: ${typeof encontrado[0]})`);
  }
});

console.log('\nMétodo 2 (raw: true):');
cpfsTeste.forEach(cpfTeste => {
  const encontrado = dados2.find(row => {
    const cpfNormalizado = normalizarCPF(row[0]);
    return cpfNormalizado === cpfTeste || cpfNormalizado === cpfTeste.replace(/^0/, '');
  });
  if (encontrado) {
    console.log(`  CPF ${cpfTeste}: encontrado como ${encontrado[0]} (tipo: ${typeof encontrado[0]})`);
  }
});

console.log('\nMétodo 3 (leitura direta de células - primeiras 10 linhas):');
dados3.forEach(item => {
  const cpfNormalizado = normalizarCPF(item.valor);
  console.log(`  Linha ${item.linha}: valor=${item.valor}, tipo=${item.tipo}, formatado=${item.formatado || 'N/A'}, normalizado=${cpfNormalizado}`);
});

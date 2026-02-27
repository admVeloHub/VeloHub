/**
 * Script para verificar cabeçalhos do Excel Ouvidoria 2025
 */

const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const XLSX_PATH = path.join(__dirname, '../../../update bacen/Copy of Ação Bacen e Ouvidoria.xlsx');
const ABA_NOME = 'Base Ouvidoria 2025';

const workbook = XLSX.readFile(XLSX_PATH);
const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === ABA_NOME.toLowerCase());

if (!sheetName) {
  console.error('Aba não encontrada');
  process.exit(1);
}

const worksheet = workbook.Sheets[sheetName];
const range = XLSX.utils.decode_range(worksheet['!ref']);

console.log('📋 CABEÇALHOS DA ABA "Base Ouvidoria 2025":\n');
console.log('Coluna | Cabeçalho');
console.log('-'.repeat(80));

for (let col = 0; col <= Math.min(range.e.c, 30); col++) {
  const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
  if (cell) {
    const header = String(cell.w || cell.v).trim();
    const letraColuna = String.fromCharCode(65 + col);
    console.log(`${letraColuna.padEnd(6)} | ${header}`);
  }
}

console.log('\n📊 PRIMEIRA LINHA DE DADOS (exemplo):\n');
for (let col = 0; col <= Math.min(range.e.c, 30); col++) {
  const cell = worksheet[XLSX.utils.encode_cell({ r: 1, c: col })];
  if (cell) {
    const valor = String(cell.w || cell.v).substring(0, 50);
    const letraColuna = String.fromCharCode(65 + col);
    console.log(`${letraColuna}: ${valor}`);
  }
}

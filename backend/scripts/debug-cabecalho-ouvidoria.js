/**
 * Debug cabeçalho Ouvidoria 2025
 * VERSION: v1.0.0 | DATE: 2026-02-24
 */

const path = require('path');
const fs = require('fs');
const {parseCSVLine} = require('./utils/csv-parser');

const caminhoArquivo = path.join(__dirname, '../../../update bacen/Ouvidoria 2025.csv');
const conteudo = fs.readFileSync(caminhoArquivo, 'latin1');
const linhas = conteudo.split(/\r?\n/);

console.log('=== CABEÇALHO REAL ===');
const linhaCabecalho = linhas[0];
console.log('Linha completa (primeiros 500 chars):');
console.log(linhaCabecalho.substring(0, 500));
console.log('\n');

// Remover aspas externas
let cabecalhoLimpo = linhaCabecalho;
if (cabecalhoLimpo.startsWith('"') && cabecalhoLimpo.endsWith('"')) {
  cabecalhoLimpo = cabecalhoLimpo.slice(1, -1);
}

// Remover ponto e vírgula no final
cabecalhoLimpo = cabecalhoLimpo.replace(/;+$/, '');

console.log('Cabeçalho limpo (primeiros 500 chars):');
console.log(cabecalhoLimpo.substring(0, 500));
console.log('\n');

// Parsear
const campos = parseCSVLine(cabecalhoLimpo);
console.log(`Total de campos: ${campos.length}\n`);

campos.forEach((campo, idx) => {
  const campoLimpo = campo.replace(/^"|"$/g, '').trim();
  console.log(`${idx}. "${campoLimpo}"`);
});

console.log('\n=== PRIMEIRA LINHA DE DADOS ===');
const linhaDados = linhas[1];
console.log('Linha completa (primeiros 300 chars):');
console.log(linhaDados.substring(0, 300));
console.log('\n');

const valores = parseCSVLine(linhaDados);
console.log(`Total de valores: ${valores.length}\n`);

valores.forEach((valor, idx) => {
  const valorLimpo = valor.replace(/^"|"$/g, '').trim();
  const campoCorrespondente = campos[idx] ? campos[idx].replace(/^"|"$/g, '').trim() : 'N/A';
  console.log(`${idx}. Campo: "${campoCorrespondente.substring(0, 30)}" = Valor: "${valorLimpo.substring(0, 50)}"`);
});

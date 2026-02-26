/**
 * Debug detalhado do parsing - ver o que está sendo extraído
 * VERSION: v1.0.0 | DATE: 2026-02-24
 */

const path = require('path');
const fs = require('fs');
const {parseCSVFile, normalizarCPF, buscarCampo} = require('./utils/csv-parser');

function debugArquivo(nomeArquivo, caminhoArquivo, numLinhas = 5) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DEBUG: ${nomeArquivo}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const dados = parseCSVFile(caminhoArquivo);
  
  console.log(`Total parseado: ${dados.length} registros\n`);
  
  // Mostrar primeiras linhas parseadas
  for (let i = 0; i < Math.min(numLinhas, dados.length); i++) {
    const row = dados[i];
    console.log(`\n--- REGISTRO ${i + 1} ---`);
    console.log(`Total de campos: ${Object.keys(row).length}`);
    
    // Mostrar todos os campos
    console.log('\nCampos encontrados:');
    Object.keys(row).forEach((key, idx) => {
      const valor = String(row[key] || '').substring(0, 50);
      console.log(`  ${idx + 1}. "${key}": "${valor}"`);
    });
    
    // Tentar encontrar CPF e nome
    const cpfTratado = buscarCampo(row, ['CPF Tratado']);
    const cpf = buscarCampo(row, ['CPF']);
    const nome = buscarCampo(row, ['Nome completo', 'Nome']);
    
    console.log(`\nCPF Tratado: "${cpfTratado}"`);
    console.log(`CPF: "${cpf}"`);
    console.log(`Nome: "${nome}"`);
    
    const cpfLimpo = normalizarCPF(cpfTratado || cpf || '');
    console.log(`CPF Limpo: "${cpfLimpo}"`);
    console.log(`Válido: ${cpfLimpo && cpfLimpo.length === 11 && cpfLimpo !== '00000000000' && nome && nome.trim() ? 'SIM' : 'NÃO'}`);
  }
}

// Debug Bacen 2025
debugArquivo('Bacen 2025.csv', path.join(__dirname, '../../../update bacen/Bacen 2025.csv'), 3);

// Debug Ouvidoria 2025
debugArquivo('Ouvidoria 2025.csv', path.join(__dirname, '../../../update bacen/Ouvidoria 2025.csv'), 3);

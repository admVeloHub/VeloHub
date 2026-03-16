/**
 * Script de Diagnóstico: Verificar quantos registros da planilha RA.xlsx serão processados
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 */

require('dotenv').config();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = path.join(__dirname, '../../../dados procon/RA.xlsx');

function normalizarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  return apenasNumeros;
}

function lerXLSXPorColunas(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  const workbook = XLSX.readFile(caminhoArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: null,
    raw: false
  });
  
  return dados;
}

async function diagnosticar() {
  console.log('🔍 Diagnóstico: Análise da planilha RA.xlsx\n');
  
  const dados = lerXLSXPorColunas(XLSX_PATH);
  console.log(`📊 Total de linhas na planilha: ${dados.length}\n`);
  
  let totalLinhasComDados = 0;
  let linhasComCPFValido = 0;
  let linhasSemCPF = 0;
  let linhasComCPFIncompleto = 0;
  let linhasIgnoradas = 0;
  const linhasProblema = [];
  
  // Processar todas as linhas (planilha não tem cabeçalho)
  for (let i = 0; i < dados.length; i++) {
    const row = dados[i];
    
    // Verificar se linha tem dados (colunas A, B ou C)
    if (!row || row.length === 0 || (!row[0] && !row[1] && !row[2])) {
      linhasIgnoradas++;
      continue;
    }
    
    totalLinhasComDados++;
    
    const cpfRaw = row[0];
    const cpfNormalizado = normalizarCPF(cpfRaw);
    
    const idEntrada = row[1] ? String(row[1]).trim() : '';
    
    // Lógica atualizada: aceitar CPF com 9+ dígitos OU registros com idEntrada
    if (!cpfRaw || cpfNormalizado.length === 0) {
      // Sem CPF, mas pode ter idEntrada
      if (idEntrada) {
        linhasComCPFValido++; // Será processado usando idEntrada
      } else {
        linhasSemCPF++;
        linhasProblema.push({
          linha: i + 1,
          motivo: 'Sem CPF e sem idEntrada',
          cpfRaw: cpfRaw,
          idEntrada: idEntrada,
          dataReclam: row[2]
        });
      }
    } else if (cpfNormalizado.length < 9) {
      // CPF muito curto (< 9 dígitos)
      if (idEntrada) {
        linhasComCPFValido++; // Será processado usando idEntrada
      } else {
        linhasComCPFIncompleto++;
        linhasProblema.push({
          linha: i + 1,
          motivo: `CPF com ${cpfNormalizado.length} dígitos (muito curto) e sem idEntrada`,
          cpfRaw: cpfRaw,
          cpfNormalizado: cpfNormalizado,
          idEntrada: idEntrada,
          dataReclam: row[2]
        });
      }
    } else {
      // CPF com 9+ dígitos (aceito) OU tem idEntrada
      linhasComCPFValido++;
      if (cpfNormalizado.length !== 11) {
        // Avisar mas ainda contar como válido
        linhasProblema.push({
          linha: i + 1,
          motivo: `CPF com ${cpfNormalizado.length} dígitos (será aceito, mas idealmente deveria ter 11)`,
          cpfRaw: cpfRaw,
          cpfNormalizado: cpfNormalizado,
          idEntrada: idEntrada,
          dataReclam: row[2]
        });
      }
    }
  }
  
  console.log('============================================================');
  console.log('📊 RESUMO DO DIAGNÓSTICO');
  console.log('============================================================');
  console.log(`✅ Total de linhas com dados: ${totalLinhasComDados}`);
  console.log(`✅ Linhas que SERÃO processadas: ${linhasComCPFValido}`);
  console.log(`   (CPF com 9+ dígitos OU registros com idEntrada)`);
  console.log(`⚠️  Linhas sem CPF válido e sem idEntrada: ${linhasSemCPF}`);
  console.log(`⚠️  Linhas com CPF muito curto (< 9 dígitos) e sem idEntrada: ${linhasComCPFIncompleto}`);
  console.log(`❌ Linhas ignoradas (vazias): ${linhasIgnoradas}`);
  console.log(`\n📊 Total que SERÁ processado: ${linhasComCPFValido}`);
  console.log(`📊 Total que NÃO SERÁ processado: ${linhasSemCPF + linhasComCPFIncompleto + linhasIgnoradas}`);
  
  if (linhasProblema.length > 0) {
    console.log('\n============================================================');
    console.log('⚠️  REGISTROS COM PROBLEMAS (primeiros 20)');
    console.log('============================================================');
    linhasProblema.slice(0, 20).forEach(item => {
      console.log(`Linha ${item.linha}: ${item.motivo}`);
      console.log(`  CPF Raw: ${item.cpfRaw || '(vazio)'}`);
      if (item.cpfNormalizado) {
        console.log(`  CPF Normalizado: ${item.cpfNormalizado}`);
      }
      console.log(`  ID Entrada: ${item.idEntrada || '(vazio)'}`);
      console.log(`  Data Reclamação: ${item.dataReclam || '(vazio)'}`);
      console.log('');
    });
    
    if (linhasProblema.length > 20) {
      console.log(`... e mais ${linhasProblema.length - 20} registros com problemas`);
    }
  }
}

diagnosticar().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});

/**
 * Verificar TODOS os registros linha por linha
 * VERSION: v1.0.0 | DATE: 2026-02-24
 */

const path = require('path');
const fs = require('fs');
const {parseCSVFile, normalizarCPF, buscarCampo} = require('./utils/csv-parser');

function verificarArquivo(nomeArquivo, caminhoArquivo, esperado) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`VERIFICAÇÃO: ${nomeArquivo}`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Ler arquivo raw
  const conteudo = fs.readFileSync(caminhoArquivo, 'latin1');
  const linhasRaw = conteudo.split(/\r?\n/);
  
  console.log(`Total de linhas no arquivo: ${linhasRaw.length}`);
  
  // Parsear com o parser atual
  const dados = parseCSVFile(caminhoArquivo);
  console.log(`Total parseado pelo parser: ${dados.length}`);
  
  // Verificar linha por linha manualmente
  const nomeArq = caminhoArquivo.toLowerCase();
  let cabecalhosEsperados = [];
  
  if (nomeArq.includes('bacen') && nomeArq.includes('2025')) {
    cabecalhosEsperados = ['CPF Tratado', 'Data entrada', 'Finalizado em ', 'Enviar para cobrança?', 'Responsável', 'Nome completo', 'CPF'];
  } else if (nomeArq.includes('bacen') && nomeArq.includes('2026')) {
    cabecalhosEsperados = ['CPF Tratado', 'Data entrada', 'Finalizado em ', 'Enviar para cobrança?', 'Responsável', 'Nome completo', 'CPF'];
  } else if (nomeArq.includes('ouvidoria') && nomeArq.includes('2025')) {
    cabecalhosEsperados = ['Data de entrada', 'Atendimento', 'Data Entrada N2', 'Finalizado em ', 'Enviar para cobrança?', 'Responsável', 'Nome completo', 'CPF'];
  } else if (nomeArq.includes('ouvidoria') && nomeArq.includes('2026')) {
    cabecalhosEsperados = ['Data de entrada', 'Atendimento', 'Data Entrada N2', 'Finalizado em ', 'Enviar para cobrança?', 'Responsável', 'Nome completo', 'CPF'];
  }
  
  // Contar linhas que parecem ser registros válidos (começam com CPF ou data)
  let linhasValidasRaw = 0;
  let primeiraLinhaDados = -1;
  
  for (let i = 0; i < linhasRaw.length; i++) {
    const linha = linhasRaw[i].trim();
    if (!linha || linha === ';' || /^;+$/.test(linha)) continue;
    
    const linhaSemAspas = linha.replace(/^"+/, '').replace(/"+$/, '');
    const primeiroCampo = linhaSemAspas.split(',')[0].trim();
    const primeiroCampoSemAspas = primeiroCampo.replace(/^"|"$/g, '');
    const pareceCPF = primeiroCampoSemAspas.match(/^\d{11}$/);
    const pareceData = primeiroCampoSemAspas.match(/^\d{2}\/\d{2}\/\d{4}/);
    
    if (pareceCPF || pareceData) {
      linhasValidasRaw++;
      if (primeiraLinhaDados === -1) {
        primeiraLinhaDados = i;
      }
    }
  }
  
  console.log(`Linhas que parecem registros válidos (começam com CPF/data): ${linhasValidasRaw}`);
  console.log(`Primeira linha de dados encontrada na linha: ${primeiraLinhaDados + 1}`);
  
  // Verificar registros parseados
  const registrosValidos = [];
  const registrosInvalidos = [];
  
  for (let i = 0; i < dados.length; i++) {
    const row = dados[i];
    
    // Buscar CPF
    let cpfLimpo = normalizarCPF(buscarCampo(row, ['CPF Tratado']) || '');
    if (!cpfLimpo) {
      cpfLimpo = normalizarCPF(buscarCampo(row, ['CPF']) || '');
    }
    
    // Buscar nome
    let nome = buscarCampo(row, ['Nome completo', 'Nome']) || '';
    
    if (cpfLimpo && cpfLimpo.length === 11 && cpfLimpo !== '00000000000' && nome.trim()) {
      registrosValidos.push({ cpf: cpfLimpo, nome: nome.trim(), indice: i + 1 });
    } else {
      registrosInvalidos.push({ indice: i + 1, cpf: cpfLimpo || 'N/A', nome: nome || 'N/A', motivo: !cpfLimpo ? 'SEM_CPF' : !nome.trim() ? 'SEM_NOME' : 'CPF_INVALIDO' });
    }
  }
  
  console.log(`\n✅ Registros válidos parseados: ${registrosValidos.length}`);
  console.log(`❌ Registros inválidos: ${registrosInvalidos.length}`);
  console.log(`📉 Diferença: ${esperado - registrosValidos.length} faltando`);
  
  if (registrosInvalidos.length > 0 && registrosInvalidos.length <= 20) {
    console.log(`\nPrimeiros registros inválidos:`);
    registrosInvalidos.slice(0, 10).forEach((reg, idx) => {
      console.log(`  ${idx + 1}. Linha ${reg.indice} - ${reg.motivo} - CPF: ${reg.cpf.substring(0, 3)}*** - Nome: ${reg.nome.substring(0, 30)}`);
    });
  }
  
  return {
    esperado,
    encontrados: registrosValidos.length,
    invalidos: registrosInvalidos.length,
    linhasRaw: linhasValidasRaw
  };
}

console.log('🔍 VERIFICAÇÃO COMPLETA DE TODOS OS REGISTROS');
console.log('='.repeat(80));

const resultados = [];

resultados.push(verificarArquivo(
  'Bacen 2025.csv',
  path.join(__dirname, '../../../update bacen/Bacen 2025.csv'),
  542
));

resultados.push(verificarArquivo(
  'Bacen 2026.csv',
  path.join(__dirname, '../../../update bacen/Bacen 2026.csv'),
  53
));

resultados.push(verificarArquivo(
  'Ouvidoria 2025.csv',
  path.join(__dirname, '../../../update bacen/Ouvidoria 2025.csv'),
  919
));

resultados.push(verificarArquivo(
  'Ouvidoria 2026.csv',
  path.join(__dirname, '../../../update bacen/Ouvidoria 2026.csv'),
  266
));

console.log(`\n${'='.repeat(80)}`);
console.log('📊 RESUMO FINAL');
console.log(`${'='.repeat(80)}\n`);

const arquivos = ['Bacen 2025', 'Bacen 2026', 'Ouvidoria 2025', 'Ouvidoria 2026'];
arquivos.forEach((nome, idx) => {
  const res = resultados[idx];
  const diferenca = res.esperado - res.encontrados;
  console.log(`${nome}: ${res.encontrados}/${res.esperado} (${diferenca > 0 ? `-${diferenca} FALTANDO` : `OK`}) - Linhas raw válidas: ${res.linhasRaw}`);
});

const totalEsperado = resultados.reduce((sum, r) => sum + r.esperado, 0);
const totalEncontrados = resultados.reduce((sum, r) => sum + r.encontrados, 0);
const totalFaltando = totalEsperado - totalEncontrados;

console.log(`\n🚨 TOTAL: ${totalEncontrados}/${totalEsperado} - FALTANDO: ${totalFaltando} registros`);

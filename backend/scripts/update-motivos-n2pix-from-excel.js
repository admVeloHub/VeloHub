/**
 * Script de Atualização: Atualizar motivoReduzido na collection reclamacoes_n2Pix
 * VERSION: v1.1.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.1.0:
 * - Normalização de motivos para padrão "Aaaaa Aaaaa" (primeira maiúscula apenas)
 * - Remoção de duplicatas (ex: "Chave Pix" e "CHAVE PIX" → "Chave Pix")
 * - Preposições (do, da, de, ao) não são capitalizadas exceto no início
 * - Siglas (PIX, EP) são preservadas em maiúsculas
 * - Motivos compostos (separados por "/") são divididos e ambos incluídos no array
 * 
 * Atualiza o campo motivoReduzido na collection reclamacoes_n2Pix usando dados da planilha Excel.
 * Usa CPF (coluna G) para fazer match com o campo cpf no MongoDB.
 * 
 * Mapeamento:
 * - Coluna G: CPF (usado para match com cpf no MongoDB)
 * - Coluna I: Motivo reduzido (atualiza campo motivoReduzido como array)
 * 
 * Uso:
 *   node backend/scripts/update-motivos-n2pix-from-excel.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_n2Pix';

// Modo dry-run (apenas validação, sem atualizar)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo XLSX e abas
const XLSX_PATH = path.join(__dirname, '../../../dados procon/Atualização Bacen e N2.xlsx');
const ABAS = ['Base ouvidoria 2025', 'Base Ouvidoria 2026'];

/**
 * Normalizar CPF (remover caracteres não numéricos)
 */
function normalizarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  return apenasNumeros.length === 11 ? apenasNumeros : '';
}

/**
 * Normalizar motivo para padrão "Aaaaa Aaaaa" (primeira maiúscula apenas, resto minúscula)
 * Mesma função usada no script extract-motivos-from-excel.js
 */
function normalizarMotivo(motivo) {
  if (!motivo || typeof motivo !== 'string') return '';
  
  let normalizado = motivo
    .trim()
    .replace(/\s+/g, ' ') // Múltiplos espaços em um único espaço
    .replace(/\.+/g, '.') // Múltiplos pontos em um único ponto
    .trim();
  
  if (!normalizado) return '';
  
  // Preposições que não devem ser capitalizadas (exceto no início)
  const preposicoes = ['do', 'da', 'de', 'ao', 'à', 'dos', 'das', 'das'];
  
  // Siglas que devem ser preservadas em maiúsculas
  const siglas = ['PIX', 'EP', 'BB', 'N/A'];
  
  // Converter para title case: primeira letra de cada palavra maiúscula, resto minúscula
  // Mas preservar siglas e não capitalizar preposições (exceto no início)
  const palavras = normalizado.split(' ');
  const palavrasNormalizadas = palavras.map((palavra, index) => {
    if (!palavra) return '';
    
    // Verificar se está dentro de parênteses (preservar siglas)
    const dentroParenteses = palavra.startsWith('(') && palavra.endsWith(')');
    const palavraSemParenteses = dentroParenteses ? palavra.slice(1, -1) : palavra;
    
    // Preservar siglas conhecidas
    const palavraUpper = palavraSemParenteses.toUpperCase();
    if (siglas.includes(palavraUpper)) {
      return dentroParenteses ? `(${palavraUpper})` : palavraUpper;
    }
    
    // Se contém ponto (abreviação), preservar estrutura
    if (palavraSemParenteses.includes('.')) {
      const partes = palavraSemParenteses.split('.');
      const partesNormalizadas = partes.map((parte) => {
        if (!parte) return '';
        return parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase();
      });
      const resultado = partesNormalizadas.join('.');
      return dentroParenteses ? `(${resultado})` : resultado;
    }
    
    // Verificar se é preposição (não capitalizar exceto no início)
    const palavraLower = palavraSemParenteses.toLowerCase();
    if (preposicoes.includes(palavraLower) && index > 0) {
      return dentroParenteses ? `(${palavraLower})` : palavraLower;
    }
    
    // Normal: primeira maiúscula, resto minúscula
    const resultado = palavraSemParenteses.charAt(0).toUpperCase() + palavraSemParenteses.slice(1).toLowerCase();
    return dentroParenteses ? `(${resultado})` : resultado;
  });
  
  normalizado = palavrasNormalizadas.join(' ');
  
  // Normalizar variações conhecidas específicas
  // "Prob. App" e "Probl. App" → "Probl. App"
  if (normalizado.toLowerCase().includes('prob') && normalizado.toLowerCase().includes('app')) {
    normalizado = normalizado.replace(/Prob\.?\s*App/gi, 'Probl. App');
  }
  
  // "Chave Pix", "CHAVE PIX", "Chave PIX" → "Chave Pix"
  const motivoLower = normalizado.toLowerCase();
  if (motivoLower === 'chave pix' || motivoLower === 'chave pix') {
    normalizado = 'Chave Pix';
  }
  
  // "Liberação Chave PIX" → "Liberação Chave Pix"
  if (motivoLower.includes('liberação chave pix')) {
    normalizado = normalizado.replace(/Liberação\s+Chave\s+PIX/gi, 'Liberação Chave Pix');
  }
  
  // Normalizar "Encerramento da conta" e "Encerramento de conta" → "Encerramento de Conta"
  if (motivoLower.includes('encerramento') && motivoLower.includes('conta')) {
    if (motivoLower.includes('encerramento da conta') || motivoLower.includes('encerramento de conta')) {
      normalizado = 'Encerramento de Conta';
    }
  }
  
  // Normalizar "Bloqueio De Conta" e "BLOQUEIO DE CONTA" → "Bloqueio de Conta"
  if (motivoLower === 'bloqueio de conta' || motivoLower === 'bloqueio de conta') {
    normalizado = 'Bloqueio de Conta';
  }
  
  // Normalizar "Não Recebeu Restituição" variações
  if (motivoLower.includes('não recebeu restituição') || motivoLower.includes('não recebeu restituição')) {
    normalizado = 'Não Recebeu Restituição';
  }
  
  return normalizado;
}

/**
 * Processar motivo composto (se contém "/", dividir em array de motivos individuais únicos)
 * Para N2Pix, motivoReduzido é [String] (array, múltipla escolha)
 */
function processarMotivoParaN2Pix(motivo) {
  if (!motivo || typeof motivo !== 'string') return [];
  
  const motivoTrim = motivo.trim();
  if (!motivoTrim) return [];
  
  // Se contém "/", dividir por "/" e processar cada parte
  if (motivoTrim.includes('/')) {
    const partes = motivoTrim.split('/')
      .map(p => normalizarMotivo(p))
      .filter(p => p.length > 0);
    
    // Remover duplicatas mantendo ordem
    const motivosUnicos = [];
    const motivosVistos = new Set();
    
    for (const parte of partes) {
      const parteLower = parte.toLowerCase();
      if (!motivosVistos.has(parteLower)) {
        motivosVistos.add(parteLower);
        motivosUnicos.push(parte);
      }
    }
    
    return motivosUnicos;
  }
  
  // Motivo simples
  return [normalizarMotivo(motivoTrim)];
}

/**
 * Ler XLSX e retornar dados das abas especificadas
 */
function lerDadosXLSX(caminhoArquivo, abas) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  const workbook = XLSX.readFile(caminhoArquivo);
  const todosDados = [];
  
  for (const nomeAba of abas) {
    // Encontrar aba (case-insensitive)
    let sheetName = null;
    for (const name of workbook.SheetNames) {
      if (name.toLowerCase() === nomeAba.toLowerCase()) {
        sheetName = name;
        break;
      }
    }
    
    if (!sheetName) {
      console.warn(`⚠️  Aba "${nomeAba}" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`);
      continue;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Processar linhas de dados (começar da linha 1, pois linha 0 é cabeçalho)
    for (let row = 1; row <= range.e.r; row++) {
      const cellCPF = worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]; // Coluna G (índice 6)
      const cellMotivo = worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]; // Coluna I (índice 8)
      
      if (cellCPF && cellMotivo) {
        const cpf = String(cellCPF.w || cellCPF.v || '').trim();
        const motivo = String(cellMotivo.w || cellMotivo.v || '').trim();
        
        if (cpf && motivo) {
          const cpfNormalizado = normalizarCPF(cpf);
          const motivosProcessados = processarMotivoParaN2Pix(motivo);
          
          if (cpfNormalizado && motivosProcessados.length > 0) {
            todosDados.push({
              cpf: cpfNormalizado,
              motivos: motivosProcessados,
              aba: nomeAba,
              linha: row + 1
            });
          }
        }
      }
    }
  }
  
  return todosDados;
}

/**
 * Comparar arrays de motivos (ignorando ordem)
 */
function arraysIguais(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  
  const arr1Sorted = [...arr1].sort();
  const arr2Sorted = [...arr2].sort();
  
  return arr1Sorted.every((val, idx) => val === arr2Sorted[idx]);
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Script de Atualização: motivoReduzido em reclamacoes_n2Pix\n');
  console.log(`📁 Arquivo: ${XLSX_PATH}`);
  console.log(`📋 Abas: ${ABAS.join(', ')}`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'ATUALIZAÇÃO REAL'}\n`);
  
  let client;
  
  try {
    // Ler dados do XLSX
    console.log('📂 Lendo dados da planilha Excel...');
    const dadosXLSX = lerDadosXLSX(XLSX_PATH, ABAS);
    console.log(`✅ ${dadosXLSX.length} registros lidos da planilha\n`);
    
    if (dadosXLSX.length === 0) {
      console.log('⚠️  Nenhum dado encontrado para processar.');
      return;
    }
    
    // Conectar ao MongoDB
    console.log('🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Estatísticas
    let atualizados = 0;
    let naoEncontrados = 0;
    let erros = 0;
    const errosDetalhes = [];
    
    // Processar cada registro
    console.log('🔄 Processando atualizações...\n');
    
    for (const registro of dadosXLSX) {
      try {
        // Buscar documento por CPF
        const documento = await collection.findOne({ cpf: registro.cpf });
        
        if (!documento) {
          naoEncontrados++;
          if (naoEncontrados <= 5) {
            console.log(`⚠️  CPF não encontrado: ${registro.cpf} (aba: ${registro.aba}, linha: ${registro.linha})`);
          }
          continue;
        }
        
        // Verificar se os motivos já estão atualizados
        const motivosAtuais = Array.isArray(documento.motivoReduzido) 
          ? documento.motivoReduzido 
          : (documento.motivoReduzido ? [documento.motivoReduzido] : []);
        
        if (arraysIguais(motivosAtuais, registro.motivos)) {
          continue; // Já está atualizado, pular
        }
        
        // Atualizar documento
        if (!DRY_RUN) {
          await collection.updateOne(
            { _id: documento._id },
            { 
              $set: { 
                motivoReduzido: registro.motivos,
                updatedAt: new Date()
              } 
            }
          );
        }
        
        atualizados++;
        
        if (atualizados <= 10) {
          const motivosAtuaisStr = motivosAtuais.length > 0 ? `[${motivosAtuais.join(', ')}]` : '(vazio)';
          const motivosNovosStr = `[${registro.motivos.join(', ')}]`;
          console.log(`✅ CPF ${registro.cpf}: ${motivosAtuaisStr} → ${motivosNovosStr}`);
        }
        
      } catch (error) {
        erros++;
        errosDetalhes.push({
          cpf: registro.cpf,
          erro: error.message,
          aba: registro.aba,
          linha: registro.linha
        });
        console.error(`❌ Erro ao processar CPF ${registro.cpf}:`, error.message);
      }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de registros na planilha: ${dadosXLSX.length}`);
    console.log(`✅ Atualizados: ${atualizados}`);
    console.log(`⚠️  Não encontrados: ${naoEncontrados}`);
    console.log(`❌ Erros: ${erros}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi feita no banco de dados.');
      console.log('   Execute sem --dry-run para aplicar as atualizações.');
    } else {
      console.log('\n✅ Atualizações concluídas!');
    }
    
    if (errosDetalhes.length > 0) {
      console.log('\n❌ Detalhes dos erros:');
      errosDetalhes.forEach(erro => {
        console.log(`   CPF ${erro.cpf} (${erro.aba}, linha ${erro.linha}): ${erro.erro}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão com MongoDB fechada.');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, lerDadosXLSX, processarMotivoParaN2Pix };

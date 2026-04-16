/**
 * Script Auxiliar: Extrair Motivos Únicos da Planilha Excel
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
(function loadVelohubFonteEnv(here) {
  const path = require('path');
  const fs = require('fs');
  let d = here;
  for (let i = 0; i < 14; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(__dirname);

 * 
 * Extrai motivos únicos da coluna I das abas especificadas da planilha Excel.
 * Processa motivos compostos (separados por "/") e mantém apenas motivos individuais únicos.
 * 
 * Uso:
 *   node backend/scripts/extract-motivos-from-excel.js [--tipo BACEN|N2]
 */

const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

// Caminho do arquivo XLSX
const XLSX_PATH = path.join(__dirname, '../../../dados procon/Atualização Bacen e N2.xlsx');

// Configuração por tipo
const CONFIG = {
  BACEN: {
    abas: ['Base Bacen 2025', 'Base Bacen 2026'],
    colunaMotivo: 8, // Coluna I (índice 8, 0-based)
    nome: 'BACEN'
  },
  N2: {
    abas: ['Base ouvidoria 2025', 'Base Ouvidoria 2026'],
    colunaMotivo: 8, // Coluna I (índice 8, 0-based)
    nome: 'N2Pix'
  }
};

/**
 * Normalizar CPF (remover caracteres não numéricos)
 */
function normalizarCPF(cpf) {
  if (!cpf) return '';
  return String(cpf).replace(/\D/g, '');
}

/**
 * Normalizar motivo (case-insensitive, remover espaços extras, normalizar variações)
 * @param {string} motivo - Motivo a normalizar
 * @returns {string} - Motivo normalizado
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
  
  // "Chave Pix", "CHAVE PIX", "Chave PIX" → "Chave Pix" (quando for o motivo completo ou parte de outro)
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
 * Verificar se motivo é válido (filtrar valores inválidos)
 * @param {string} motivo - Motivo a validar
 * @returns {boolean} - Se o motivo é válido
 */
function isValidMotivo(motivo) {
  if (!motivo || motivo.length < 2) return false;
  
  // Filtrar valores inválidos conhecidos
  const invalidValues = [
    '#N', '#N/A', '#REF!', '#VALUE!', '#DIV/0!', '#NAME?',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'Gov.', 'Gov', 'Bacen Celcoin', 'Bacen Via Capital', 'Consumidor.Gov',
    'N/A', 'N/A.', 'NA', 'NULL', 'null', 'undefined'
  ];
  
  const motivoLower = motivo.toLowerCase().trim();
  return !invalidValues.some(invalid => motivoLower === invalid.toLowerCase());
}

/**
 * Processar motivo composto e extrair motivos individuais únicos
 * @param {string} motivo - Motivo da célula (pode ser composto)
 * @param {Map<string, string>} motivosNormalizados - Map com motivos normalizados (chave: normalizado, valor: original)
 * @returns {Array<string>} - Array de motivos individuais novos encontrados (valores originais)
 */
function processarMotivo(motivo, motivosNormalizados) {
  if (!motivo || typeof motivo !== 'string') return [];
  
  const motivoTrim = motivo.trim();
  if (!motivoTrim || !isValidMotivo(motivoTrim)) return [];
  
  const motivosNovos = [];
  
  // Se contém "/", dividir por "/"
  if (motivoTrim.includes('/')) {
    const partes = motivoTrim.split('/').map(p => normalizarMotivo(p)).filter(p => p.length > 0 && isValidMotivo(p));
    
    for (const parte of partes) {
      const parteNormalizada = parte.toLowerCase();
      
      // Verificar se já foi adicionado (usando normalização case-insensitive)
      if (!motivosNormalizados.has(parteNormalizada)) {
        // Usar valor normalizado (padrão "Aaaaa Aaaaa")
        motivosNormalizados.set(parteNormalizada, parte);
        motivosNovos.push(parte);
      }
    }
  } else {
    // Motivo simples - normalizar antes de adicionar
    const motivoNormalizado = normalizarMotivo(motivoTrim);
    if (!motivoNormalizado || !isValidMotivo(motivoNormalizado)) return [];
    
    const motivoKey = motivoNormalizado.toLowerCase();
    if (!motivosNormalizados.has(motivoKey)) {
      motivosNormalizados.set(motivoKey, motivoNormalizado);
      motivosNovos.push(motivoNormalizado);
    }
  }
  
  return motivosNovos;
}

/**
 * Ler XLSX e extrair motivos únicos da coluna especificada
 */
function extrairMotivos(caminhoArquivo, abas, colunaMotivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  const workbook = XLSX.readFile(caminhoArquivo);
  // Map: chave = motivo normalizado (lowercase), valor = motivo original (primeira ocorrência)
  const motivosNormalizados = new Map();
  const motivosPorAba = {};
  const todosMotivos = [];
  
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
      motivosPorAba[nomeAba] = [];
      continue;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const motivosAba = [];
    
    // Processar linhas de dados (começar da linha 1, pois linha 0 é cabeçalho)
    for (let row = 1; row <= range.e.r; row++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: colunaMotivo })];
      
      if (cell) {
        const valor = cell.w || cell.v;
        const motivosNovos = processarMotivo(valor, motivosNormalizados);
        
        if (motivosNovos.length > 0) {
          motivosAba.push(...motivosNovos);
          todosMotivos.push(...motivosNovos);
        }
      }
    }
    
    motivosPorAba[nomeAba] = motivosAba;
    console.log(`✅ Aba "${nomeAba}": ${motivosAba.length} motivos novos encontrados`);
  }
  
  // Ordenar lista final alfabeticamente (usar valores originais do Map)
  const motivosOrdenados = Array.from(motivosNormalizados.values()).sort((a, b) => a.localeCompare(b));
  
  return {
    motivos: motivosOrdenados,
    motivosPorAba,
    total: motivosOrdenados.length
  };
}

/**
 * Função principal
 */
function main() {
  const tipo = process.argv.includes('--tipo') 
    ? process.argv[process.argv.indexOf('--tipo') + 1]?.toUpperCase()
    : null;
  
  console.log('🚀 Script de Extração de Motivos da Planilha Excel\n');
  console.log(`📁 Arquivo: ${XLSX_PATH}\n`);
  
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ Arquivo não encontrado: ${XLSX_PATH}`);
    process.exit(1);
  }
  
  // Processar tipo específico ou ambos
  const tiposProcessar = tipo && CONFIG[tipo] 
    ? [tipo]
    : ['BACEN', 'N2'];
  
  const resultados = {};
  
  for (const tipoAtual of tiposProcessar) {
    const config = CONFIG[tipoAtual];
    console.log(`\n📋 Processando ${config.nome}...`);
    console.log(`   Abas: ${config.abas.join(', ')}`);
    console.log(`   Coluna: I (índice ${config.colunaMotivo})\n`);
    
    try {
      const resultado = extrairMotivos(XLSX_PATH, config.abas, config.colunaMotivo);
      resultados[tipoAtual] = resultado;
      
      console.log(`\n✅ Total de motivos únicos para ${config.nome}: ${resultado.total}`);
      console.log(`\n📝 Motivos encontrados (${resultado.total}):`);
      resultado.motivos.forEach((motivo, index) => {
        console.log(`   ${index + 1}. ${motivo}`);
      });
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${config.nome}:`, error.message);
      resultados[tipoAtual] = { error: error.message };
    }
  }
  
  // Retornar resultados como JSON para uso em outros scripts
  console.log('\n\n📊 Resumo Final:');
  console.log(JSON.stringify(resultados, null, 2));
  
  return resultados;
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { extrairMotivos, processarMotivo, main };

/**
 * Script de Atualização: Base Procon (XLSX) → MongoDB reclamacoes_procon
 * VERSION: v1.1.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
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
 * v1.1.0: motivoReduzido via utils/motivoReduzidoNormalize.js (renomeações + sentence case pt-BR)
 *
 * Mapeamento de colunas Excel → Schema MongoDB:
 * - Coluna A → codigoProcon
 * - Coluna B → cpf
 * - Coluna C → nome
 * - Coluna D → dataProcon
 * - Coluna E → pixLiberado (TRUE = true, vazio = false)
 * - Coluna F → motivoReduzido (array)
 * - Coluna G → produto
 * - Coluna H → solucaoApresentada
 * - Coluna I → processoAdministrativo
 * - createdAt = data de hoje
 * - updatedAt = data de hoje
 * 
 * Uso:
 *   node backend/scripts/update-procon-from-excel.js [--dry-run]
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const { normalizarMotivosDeCelula } = require(path.join(__dirname, '../utils/motivoReduzidoNormalize'));

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_procon';

// Modo dry-run (apenas validação, sem atualizar)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo XLSX
const XLSX_PATH = path.join(__dirname, '../../../dados procon/PROCON.xlsx');

/**
 * Converter data do Excel ou string para Date
 */
function parseData(data) {
  if (!data) return null;
  
  if (data instanceof Date) {
    return data;
  }
  
  if (typeof data === 'number') {
    // Formato serial do Excel (número de dias desde 1900-01-01)
    if (data > 45000 && data < 50000) {
      const excelEpoch = new Date(1900, 0, 1);
      const days = data - 2; // Excel conta 1900 como ano bissexto incorretamente
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
        return date;
      }
    }
    return null;
  }
  
  const str = String(data).trim();
  if (!str) return null;
  
  // Formato DD/MM/YYYY
  const partes = str.split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);
    
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && ano >= 2020 && ano <= 2030) {
      return new Date(ano, mes, dia);
    }
  }
  
  // Tentar parse direto
  const dateObj = new Date(data);
  if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 2020 && dateObj.getFullYear() <= 2030) {
    return dateObj;
  }
  
  return null;
}

/**
 * Normalizar CPF (apenas números, preservar zeros à esquerda)
 * IMPORTANTE: Preservar zeros à esquerda (CPF é string, não número)
 */
function normalizarCPF(cpf) {
  if (!cpf && cpf !== 0) return '';
  
  // Converter para string (preserva zeros à esquerda se já for string)
  let cpfStr = String(cpf);
  
  // Remover caracteres não numéricos
  const apenasNumeros = cpfStr.replace(/\D/g, '');
  
  // Se tiver menos de 9 dígitos, não é válido
  if (apenasNumeros.length < 9) {
    return '';
  }
  
  // Se tiver menos de 11 dígitos mas 9 ou mais, adicionar zeros à esquerda
  // Isso pode acontecer se o Excel ainda converter para número em alguns casos
  if (apenasNumeros.length >= 9 && apenasNumeros.length < 11) {
    return apenasNumeros.padStart(11, '0');
  }
  
  // Se tiver 11 dígitos ou mais, retornar apenas os 11 primeiros
  return apenasNumeros.substring(0, 11);
}

/**
 * Normalizar nome para primeira maiúscula (title case)
 */
function normalizarNome(nome) {
  if (!nome || typeof nome !== 'string') return '';
  
  const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sob', 'sobre', 'entre', 'ante', 'até', 'após', 'contra', 'desde', 'durante', 'mediante', 'perante', 'salvo', 'segundo', 'conforme', 'consoante', 'exceto', 'menos', 'fora', 'através', 'a', 'o', 'as', 'os'];
  
  const palavras = nome.trim().toLowerCase().split(/\s+/);
  
  const palavrasNormalizadas = palavras.map((palavra, index) => {
    if (index === 0 || !preposicoes.includes(palavra)) {
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }
    return palavra;
  });
  
  return palavrasNormalizadas.join(' ');
}

/**
 * Converter motivoReduzido (coluna F) para array — padrão ouvidoria (motivoReduzidoNormalize)
 */
function converterMotivoReduzido(motivoStr) {
  return normalizarMotivosDeCelula(motivoStr);
}

/**
 * Converter string para boolean (TRUE = true, vazio/FALSE = false)
 */
function converterBoolean(valor, defaultFalse = true) {
  if (!valor || valor === null || valor === undefined) {
    return defaultFalse ? false : true;
  }
  
  if (typeof valor === 'boolean') {
    return valor;
  }
  
  if (typeof valor === 'number') {
    return valor !== 0;
  }
  
  if (typeof valor === 'string') {
    const str = valor.toUpperCase().trim();
    if (str === '' || str === 'FALSE' || str === 'NÃO' || str === 'NAO' || str === 'N' || str === '0') {
      return false;
    }
    if (str === 'TRUE' || str === 'SIM' || str === 'S' || str === '1') {
      return true;
    }
  }
  
  return defaultFalse ? false : true;
}

/**
 * Converter status PIX para boolean
 */
function converterPixLiberado(valor) {
  if (typeof valor === 'boolean') {
    return valor;
  }
  
  if (typeof valor === 'number') {
    return valor === 1 || valor !== 0;
  }
  
  if (!valor || valor === null || valor === undefined) {
    return false;
  }
  
  if (typeof valor === 'string') {
    const str = valor.toUpperCase().trim();
    
    if (str === '') {
      return false;
    }
    
    if (str.includes('LIBERADO') || str.includes('LIBERADA') || 
        str.includes('EXCLUÍDO') || str.includes('EXCLUIDO') || 
        str.includes('EXCLUÍDA') || str.includes('EXCLUIDA') ||
        str.includes('SOLICITADA') || str.includes('SOLICITADO') ||
        str === 'TRUE' || str === 'SIM' || str === 'S' || str === '1') {
      return true;
    }
    
    if (str.includes('NÃO APLICÁVEL') || str.includes('NAO APLICAVEL') || 
        str.includes('N/A') || str === 'FALSE' || str === 'NÃO' || str === 'NAO' ||
        str === 'N' || str === '0') {
      return false;
    }
  }
  
  return false;
}

/**
 * Ler XLSX e converter para array de objetos usando colunas específicas
 */
function lerXLSXPorColunas(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  const workbook = XLSX.readFile(caminhoArquivo);
  
  // Usar primeira aba disponível
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para array de arrays (sem cabeçalho)
  // IMPORTANTE: Ler células diretamente para preservar formato original (incluindo zeros à esquerda em CPFs)
  const dados = [];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; R++) {
    const row = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      
      if (!cell) {
        row.push(null);
      } else {
        // Para coluna B (CPF), usar valor formatado (cell.w) se disponível para preservar zeros à esquerda
        // Caso contrário, usar valor bruto (cell.v)
        if (C === 1 && cell.w) {
          // Coluna B (CPF): usar valor formatado para preservar zeros à esquerda
          row.push(cell.w);
        } else {
          // Outras colunas: usar valor normal
          row.push(cell.v);
        }
      }
    }
    dados.push(row);
  }
  
  if (dados.length === 0) {
    console.log('⚠️  Planilha vazia ou sem dados');
    return [];
  }
  
  // Converter para objetos usando índices de coluna (A=0, B=1, C=2, etc.)
  const registros = [];
  
  // Processar todas as linhas (assumindo que não tem cabeçalho)
  for (let i = 0; i < dados.length; i++) {
    const row = dados[i];
    
    // Verificar se linha está vazia (verificar colunas principais: A, B, C)
    if (!row || row.length === 0 || (!row[0] && !row[1] && !row[2])) {
      continue; // Pular linhas vazias
    }
    
    // Mapear colunas (índices baseados em 0: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8)
    const registro = {
      // Coluna A (índice 0) → codigoProcon
      codigoProcon: row[0] ? String(row[0]).trim() : '',
      
      // Coluna B (índice 1) → cpf (já vem formatado com zeros à esquerda se disponível)
      cpf: normalizarCPF(row[1]),
      
      // Coluna C (índice 2) → nome
      nome: row[2] ? normalizarNome(String(row[2]).trim()) : '',
      
      // Coluna D (índice 3) → dataProcon
      dataProcon: parseData(row[3]),
      
      // Coluna E (índice 4) → pixLiberado (TRUE = true, vazio = false)
      pixLiberado: converterPixLiberado(row[4]),
      
      // Coluna F (índice 5) → motivoReduzido (array)
      motivoReduzido: converterMotivoReduzido(row[5]),
      
      // Coluna G (índice 6) → produto
      produto: row[6] ? String(row[6]).trim() : '',
      
      // Coluna H (índice 7) → solucaoApresentada
      solucaoApresentada: row[7] ? String(row[7]).trim() : '',
      
      // Coluna I (índice 8) → processoAdministrativo
      processoAdministrativo: row[8] ? String(row[8]).trim() : ''
    };
    
    // Adicionar registro se tiver CPF válido (9+ dígitos) OU codigoProcon
    if ((registro.cpf && registro.cpf.length >= 9) || registro.codigoProcon) {
      registros.push(registro);
    }
  }
  
  return registros;
}

/**
 * Processar atualizações
 */
async function processarAtualizacoes() {
  console.log('🚀 Script de Atualização: Base Procon (XLSX) → MongoDB reclamacoes_procon\n');
  console.log(`📁 Arquivo: ${XLSX_PATH}`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (validação apenas)' : 'ATUALIZAÇÃO REAL'}\n`);
  
  // Ler dados da planilha
  console.log('📂 Lendo dados da planilha Excel...');
  const registros = lerXLSXPorColunas(XLSX_PATH);
  console.log(`✅ ${registros.length} registros lidos da planilha\n`);
  
  if (registros.length === 0) {
    console.log('⚠️  Nenhum registro encontrado para processar');
    return;
  }
  
  // Conectar ao MongoDB
  console.log('🔌 Conectando ao MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('🔄 Processando atualizações...\n');
    
    let atualizados = 0;
    let criados = 0;
    let erros = 0;
    
    // Processar cada registro
    for (let i = 0; i < registros.length; i++) {
      const registro = registros[i];
      
      try {
        // Preparar documento para MongoDB
        const documento = {
          codigoProcon: registro.codigoProcon,
          cpf: registro.cpf,
          nome: registro.nome,
          dataProcon: registro.dataProcon,
          pixLiberado: registro.pixLiberado,
          motivoReduzido: registro.motivoReduzido,
          produto: registro.produto,
          solucaoApresentada: registro.solucaoApresentada,
          processoAdministrativo: registro.processoAdministrativo,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Buscar documento existente por codigoProcon (prioridade) ou CPF
        let filtro;
        if (registro.codigoProcon && registro.codigoProcon.trim()) {
          filtro = { codigoProcon: registro.codigoProcon };
        } else if (registro.cpf && registro.cpf.length >= 9) {
          filtro = { cpf: registro.cpf };
        } else {
          // Se não tiver nem codigoProcon nem CPF válidos, pular
          console.warn(`⚠️  Registro ${i + 1} ignorado: sem codigoProcon válido nem CPF válido`);
          continue;
        }
        
        const documentoExistente = await collection.findOne(filtro);
        
        if (documentoExistente) {
          // Atualizar documento existente
          if (!DRY_RUN) {
            await collection.updateOne(
              { _id: documentoExistente._id },
              {
                $set: {
                  codigoProcon: documento.codigoProcon,
                  cpf: documento.cpf,
                  nome: documento.nome,
                  dataProcon: documento.dataProcon,
                  pixLiberado: documento.pixLiberado,
                  motivoReduzido: documento.motivoReduzido,
                  produto: documento.produto,
                  solucaoApresentada: documento.solucaoApresentada,
                  processoAdministrativo: documento.processoAdministrativo,
                  updatedAt: documento.updatedAt
                }
              }
            );
          }
          atualizados++;
        } else {
          // Criar novo documento
          if (!DRY_RUN) {
            await collection.insertOne(documento);
          }
          criados++;
        }
        
        // Progresso
        if ((i + 1) % 100 === 0) {
          console.log(`📊 Processados: ${i + 1}/${registros.length}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar registro ${i + 1} (codigoProcon: ${registro.codigoProcon}, CPF: ${registro.cpf}):`, error.message);
        erros++;
      }
    }
    
    console.log('\n============================================================');
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('============================================================');
    console.log(`${DRY_RUN ? '🔍' : '✅'} Documentos atualizados: ${atualizados}`);
    console.log(`${DRY_RUN ? '🔍' : '➕'} Documentos criados: ${criados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log('\n' + (DRY_RUN ? '🔍 Dry-run concluído (nenhum dado foi alterado)' : '✅ Atualização concluída!'));
    
  } catch (error) {
    console.error('❌ Erro ao processar:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

// Executar
processarAtualizacoes().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

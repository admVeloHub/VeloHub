/**
 * Script de Atualização: Base Reclame Aqui (XLSX) → MongoDB reclamacoes_reclameAqui
 * VERSION: v1.2.3 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 * - motivoReduzido: utils/motivoReduzidoNormalize.js (renomeações + sentence case pt-BR)
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
 * Arquivo: dados procon/ATUALIZAÇÃO RA.xlsx
 * Planilha: primeira aba. Use --skip-header para ignorar a linha 1 (títulos: CPF, ID, Entrada, …).
 *
 * Colunas A–L (nomes na planilha) → campos reclamacoes_reclameAqui (LISTA_SCHEMAS.rb):
 * | Col | Planilha              | Campo MongoDB / observação |
 * |-----|------------------------|----------------------------|
 * | A   | CPF                    | cpf                        |
 * | B   | ID                     | idEntrada                  |
 * | C   | Entrada                | dataReclam                 |
 * | D   | Início tratativa       | createdAt                  |
 * | E   | Final tratativa        | Finalizado.dataResolucao (+ Resolvido true se preenchida) |
 * | F   | Colaboradores          | responsavel                |
 * | G   | Produto                | produto                    |
 * | H   | Motivo reduzido        | motivoReduzido (array)     |
 * | I   | PIX Retirado           | pixLiberado (Lib/Excl/Solicitada etc. → true; N/A/vazio → false) |
 * | J   | Tratativa N1           | acionouCentral             |
 * | K   | Passível de nota +     | passivelNotaMais           |
 * | L   | CPF Repetido           | cpfRepetido                |
 * 
 * Enriquecimento: busca CPF em Bacen/N2Pix para nome, bacen, n2, protocolos (inalterado)
 * - updatedAt = data de hoje
 * 
 * Uso:
 *   node backend/scripts/update-reclameaqui-from-excel.js [--skip-header] [--dry-run]
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const { normalizarMotivosDeCelula } = require(path.join(__dirname, '../utils/motivoReduzidoNormalize'));

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_reclameAqui';

// Modo dry-run (apenas validação, sem atualizar)
const DRY_RUN = process.argv.includes('--dry-run');
/** Pular a primeira linha da planilha (cabeçalho com nomes das colunas) */
const SKIP_HEADER = process.argv.includes('--skip-header');

// Caminho do arquivo XLSX
const XLSX_PATH = path.join(__dirname, '../../../dados procon/ATUALIZAÇÃO RA.xlsx');

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
 * Com raw: false, o Excel retorna CPFs como strings preservando zeros à esquerda
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
 * Converter motivoReduzido (célula) para array — padrão ouvidoria (motivoReduzidoNormalize)
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
 * Converter acionouCentral (não é FALSE e vazio = true)
 */
function converterAcionouCentral(valor) {
  if (!valor || valor === null || valor === undefined || valor === '') {
    return true; // Vazio = true
  }
  
  if (typeof valor === 'boolean') {
    return valor;
  }
  
  if (typeof valor === 'string') {
    const str = valor.toUpperCase().trim();
    if (str === 'FALSE' || str === 'NÃO' || str === 'NAO' || str === 'N' || str === '0') {
      return false;
    }
    // Qualquer outro valor (incluindo vazio) = true
    return true;
  }
  
  return true;
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
 * Converter protocolos (string separada por vírgula/ponto e vírgula)
 */
function converterProtocolos(protocolosStr) {
  if (!protocolosStr || typeof protocolosStr !== 'string') return [];
  
  return protocolosStr
    .split(/[,;]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Ler XLSX e converter para array de objetos usando colunas específicas
 * @param {string} caminhoArquivo
 * @param {boolean} [skipHeader=false] — se true, descarta a primeira linha (cabeçalho)
 */
function lerXLSXPorColunas(caminhoArquivo, skipHeader = false) {
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
        // Para coluna A (CPF), usar valor formatado (cell.w) se disponível para preservar zeros à esquerda
        // Caso contrário, usar valor bruto (cell.v)
        if ((C === 0 || C === 1) && cell.w) {
          // A (CPF) e B (idEntrada): formatado preserva zeros à esquerda em números
          row.push(cell.w);
        } else {
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

  if (skipHeader) {
    if (dados.length <= 1) {
      console.log('⚠️  --skip-header ativo mas só há uma linha na planilha (nada a importar)');
      return [];
    }
    dados.shift();
    console.log('📋 Linha de cabeçalho ignorada (--skip-header)');
  }
  
  // Converter para objetos usando índices de coluna (A=0, B=1, C=2, etc.)
  const registros = [];
  
  for (let i = 0; i < dados.length; i++) {
    const row = dados[i];
    
    // Verificar se linha está vazia (verificar colunas principais: A, B, C)
    if (!row || row.length === 0 || (!row[0] && !row[1] && !row[2])) {
      continue; // Pular linhas vazias
    }
    
    // Mapear colunas A–L: CPF, ID, Entrada, Início tratativa, Final tratativa, Colaboradores, Produto,
    // Motivo reduzido, PIX Retirado, Tratativa N1, Passível de nota +, CPF Repetido (índices A=0 … L=11)
    const registro = {
      // A → cpf
      cpf: normalizarCPF(row[0]),
      // B → idEntrada
      idEntrada: row[1] ? String(row[1]).replace(/\D/g, '').trim() || String(row[1]).trim() : '',
      // C → dataReclam
      dataReclam: parseData(row[2]),
      // D → createdAt
      createdAt: parseData(row[3]),
      // E → Finalizado.dataResolucao
      finalizadoResolvido: row[4] ? true : false,
      finalizadoDataResolucao: row[4] ? parseData(row[4]) : null,
      // F → responsavel
      responsavel: row[5] ? normalizarNome(String(row[5]).trim()) : '',
      // G → produto
      produto: row[6] ? String(row[6]).trim() : '',
      // H → motivoReduzido
      motivoReduzido: converterMotivoReduzido(row[7]),
      // I → pixLiberado
      pixLiberado: converterPixLiberado(row[8]),
      // J → acionouCentral
      acionouCentral: converterAcionouCentral(row[9]),
      // K → passivelNotaMais
      passivelNotaMais: converterBoolean(row[10], false),
      // L → cpfRepetido
      cpfRepetido: row[11] ? String(row[11]).trim() : '',
      
      // Campos que serão preenchidos após busca nas collections Bacen e N2Pix
      nome: '',
      bacen: false,
      protocolosBacen: [],
      protocolosReclameAqui: [],
      n2SegundoNivel: false,
      protocolosN2: []
    };
    
    // Adicionar registro se tiver CPF (mesmo que incompleto) OU idEntrada
    // CPF pode ter menos de 11 dígitos (aceitar 9, 10 ou 11 dígitos)
    // Se não tiver CPF válido, usar idEntrada como identificador alternativo
    if ((registro.cpf && registro.cpf.length >= 9) || registro.idEntrada) {
      registros.push(registro);
    }
  }
  
  return registros;
}

/**
 * Buscar dados relacionados nas collections Bacen e N2Pix
 */
async function buscarDadosRelacionados(db, cpf) {
  const resultado = {
    nome: '',
    bacen: false,
    protocolosBacen: [],
    protocolosReclameAqui: [],
    n2SegundoNivel: false,
    protocolosN2: []
  };
  
  // Só buscar se CPF tiver pelo menos 9 dígitos (CPF válido tem 11, mas aceitamos 9+ para busca)
  if (!cpf || cpf.length < 9) {
    return resultado;
  }
  
  // Buscar no Bacen
  const registroBacen = await db.collection('reclamacoes_bacen').findOne({ cpf: cpf });
  if (registroBacen) {
    if (registroBacen.nome) {
      resultado.nome = normalizarNome(registroBacen.nome);
    }
    resultado.bacen = true;
    
    // Protocolos Bacen
    if (registroBacen.protocolosBacen && Array.isArray(registroBacen.protocolosBacen)) {
      resultado.protocolosBacen = registroBacen.protocolosBacen.filter(p => p && String(p).trim().length > 0);
    }
    
    // Protocolos Reclame Aqui (se houver no Bacen)
    if (registroBacen.protocolosReclameAqui && Array.isArray(registroBacen.protocolosReclameAqui)) {
      resultado.protocolosReclameAqui = registroBacen.protocolosReclameAqui.filter(p => p && String(p).trim().length > 0);
    }
  }
  
  // Buscar no N2Pix
  const registroN2Pix = await db.collection('reclamacoes_n2Pix').findOne({ cpf: cpf });
  if (registroN2Pix) {
    // Se não encontrou nome no Bacen, usar do N2Pix
    if (!resultado.nome && registroN2Pix.nome) {
      resultado.nome = normalizarNome(registroN2Pix.nome);
    }
    resultado.n2SegundoNivel = true;
    
    // Protocolos N2
    if (registroN2Pix.protocolosN2 && Array.isArray(registroN2Pix.protocolosN2)) {
      resultado.protocolosN2 = registroN2Pix.protocolosN2.filter(p => p && String(p).trim().length > 0);
    }
  }
  
  return resultado;
}

/**
 * Processar atualizações
 */
async function processarAtualizacoes() {
  console.log('🚀 Script de Atualização: Base Reclame Aqui (XLSX) → MongoDB reclamacoes_reclameAqui\n');
  console.log(`📁 Arquivo: ${XLSX_PATH}`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (validação apenas)' : 'ATUALIZAÇÃO REAL'}`);
  console.log(`📋 Skip cabeçalho: ${SKIP_HEADER ? 'sim (--skip-header)' : 'não'}\n`);
  
  // Ler dados da planilha
  console.log('📂 Lendo dados da planilha Excel...');
  const registros = lerXLSXPorColunas(XLSX_PATH, SKIP_HEADER);
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
        // Buscar dados relacionados nas collections Bacen e N2Pix
        const dadosRelacionados = await buscarDadosRelacionados(db, registro.cpf);
        
        // Mesclar dados relacionados
        registro.nome = dadosRelacionados.nome || registro.nome;
        registro.bacen = dadosRelacionados.bacen;
        registro.protocolosBacen = dadosRelacionados.protocolosBacen;
        registro.protocolosReclameAqui = dadosRelacionados.protocolosReclameAqui;
        registro.n2SegundoNivel = dadosRelacionados.n2SegundoNivel;
        registro.protocolosN2 = dadosRelacionados.protocolosN2;
        
        // Preparar documento para MongoDB
        const documento = {
          cpf: registro.cpf,
          nome: registro.nome,
          responsavel: registro.responsavel,
          produto: registro.produto,
          cpfRepetido: registro.cpfRepetido,
          idEntrada: registro.idEntrada,
          dataReclam: registro.dataReclam,
          motivoReduzido: registro.motivoReduzido,
          passivelNotaMais: registro.passivelNotaMais,
          pixLiberado: registro.pixLiberado,
          acionouCentral: registro.acionouCentral,
          bacen: registro.bacen,
          protocolosBacen: registro.protocolosBacen,
          protocolosReclameAqui: registro.protocolosReclameAqui,
          n2SegundoNivel: registro.n2SegundoNivel,
          protocolosN2: registro.protocolosN2,
          createdAt: registro.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        // Adicionar Finalizado se houver data de resolução
        if (registro.finalizadoResolvido && registro.finalizadoDataResolucao) {
          documento.Finalizado = {
            Resolvido: true,
            dataResolucao: registro.finalizadoDataResolucao
          };
        }
        
        // Buscar documento existente por idEntrada (prioridade) ou CPF
        // Se tiver idEntrada, usar como chave principal
        let filtro;
        if (registro.idEntrada && registro.idEntrada.trim()) {
          filtro = { idEntrada: registro.idEntrada };
        } else if (registro.cpf && registro.cpf.length >= 9) {
          filtro = { cpf: registro.cpf };
        } else {
          // Se não tiver nem CPF nem idEntrada válidos, pular
          console.warn(`⚠️  Registro ${i + 1} ignorado: sem CPF válido nem idEntrada`);
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
                  nome: documento.nome,
                  responsavel: documento.responsavel,
                  produto: documento.produto,
                  cpfRepetido: documento.cpfRepetido,
                  idEntrada: documento.idEntrada,
                  dataReclam: documento.dataReclam,
                  createdAt: documento.createdAt,
                  motivoReduzido: documento.motivoReduzido,
                  passivelNotaMais: documento.passivelNotaMais,
                  pixLiberado: documento.pixLiberado,
                  acionouCentral: documento.acionouCentral,
                  bacen: documento.bacen,
                  protocolosBacen: documento.protocolosBacen,
                  protocolosReclameAqui: documento.protocolosReclameAqui,
                  n2SegundoNivel: documento.n2SegundoNivel,
                  protocolosN2: documento.protocolosN2,
                  Finalizado: documento.Finalizado,
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
        console.error(`❌ Erro ao processar registro ${i + 1} (CPF: ${registro.cpf}):`, error.message);
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

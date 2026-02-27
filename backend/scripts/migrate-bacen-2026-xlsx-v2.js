/**
 * Script de Migração: Base Bacen 2026 (XLSX) → MongoDB reclamacoes_bacen
 * VERSION: v2.0.0 | DATE: 2026-02-24 | AUTHOR: VeloHub Development Team
 * 
 * Mapeamento direto por colunas do Excel:
 * - Coluna B: dataEntrada (createdAt)
 * - Coluna C: Finalizado.dataResolucao (updatedAt) - se houver valor, Finalizado.Resolvido = true
 * - Coluna C vazia: Finalizado.Resolvido = false (caso em aberto)
 * - Coluna F: nome
 * - Coluna G: cpf
 * 
 * Uso:
 *   node backend/scripts/migrate-bacen-2026-xlsx-v2.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_bacen';

// Modo dry-run (apenas validação, sem inserir)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo XLSX e nome da aba
const XLSX_PATH = path.join(__dirname, '../../../update bacen/Copy of Ação Bacen e Ouvidoria.xlsx');
const ABA_NOME = 'Base Bacen 2026';

/**
 * Converter data do Excel ou string para Date
 */
function parseData(data) {
  if (!data) return null;
  
  if (data instanceof Date) {
    return data;
  }
  
  if (typeof data === 'number') {
    if (data > 45000 && data < 50000) {
      const excelEpoch = new Date(1900, 0, 1);
      const days = data - 2;
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
        return date;
      }
    }
    return null;
  }
  
  const str = String(data).trim();
  if (!str) return null;
  
  const partes = str.split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);
    
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && ano >= 2020 && ano <= 2030) {
      return new Date(ano, mes, dia);
    }
  }
  
  const dateObj = new Date(data);
  if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 2020 && dateObj.getFullYear() <= 2030) {
    return dateObj;
  }
  
  return null;
}

/**
 * Normalizar CPF
 */
function normalizarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  return apenasNumeros.length === 11 ? apenasNumeros : '';
}

/**
 * Converter telefone
 */
function converterTelefones(telefoneStr) {
  if (!telefoneStr || typeof telefoneStr !== 'string') {
    return { principal: '', lista: [] };
  }
  
  const telefones = telefoneStr
    .split(/[,;]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => t.replace(/[^\d+]/g, '').replace(/^\+/, ''))
    .filter(t => t.length >= 10);
  
  return {
    principal: telefones[0] || '',
    lista: telefones
  };
}

/**
 * Converter tentativas de contato
 */
function converterTentativas(tentativa1, tentativa2, tentativa3) {
  const tentativas = [];
  
  const t1 = parseData(tentativa1);
  if (t1) tentativas.push({ data: t1, meio: 'Telefone', resultado: '' });
  
  const t2 = parseData(tentativa2);
  if (t2) tentativas.push({ data: t2, meio: 'Telefone', resultado: '' });
  
  const t3 = parseData(tentativa3);
  if (t3) tentativas.push({ data: t3, meio: 'Telefone', resultado: '' });
  
  return { lista: tentativas };
}

/**
 * Converter string para boolean
 */
function converterBoolean(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor !== 0;
  
  const str = String(valor).toUpperCase().trim();
  return str === 'TRUE' || str === 'SIM' || str === 'S' || str === '1' || str === 'YES' || str === 'Y';
}

/**
 * Converter protocolos
 */
function converterProtocolos(protocolosStr) {
  if (!protocolosStr || typeof protocolosStr !== 'string') return [];
  
  return protocolosStr
    .split(/[,;]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Converter status PIX
 */
function converterPixStatus(statusStr) {
  if (!statusStr || typeof statusStr !== 'string') return 'Pendente';
  
  const str = statusStr.toUpperCase().trim();
  
  if (str.includes('LIBERADO') || str.includes('LIBERADA')) return 'Liberado';
  if (str.includes('EXCLUÍDO') || str.includes('EXCLUIDO') || str.includes('EXCLUÍDA') || str.includes('EXCLUIDA')) return 'Excluído';
  if (str.includes('TRUE')) return 'Liberado';
  if (str.includes('FALSE')) return 'Pendente';
  
  return 'Pendente';
}

/**
 * Ler XLSX e converter para array de objetos usando colunas específicas
 */
function lerXLSXPorColunas(caminhoArquivo, nomeAba) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  const workbook = XLSX.readFile(caminhoArquivo);
  
  let sheetName = null;
  for (const name of workbook.SheetNames) {
    if (name.toLowerCase() === nomeAba.toLowerCase()) {
      sheetName = name;
      break;
    }
  }
  
  if (!sheetName) {
    throw new Error(`Aba "${nomeAba}" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`);
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const dados = [];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Ler cabeçalho para identificar outras colunas
  const cabecalhos = {};
  for (let col = 0; col <= range.e.c; col++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) {
      const header = String(cell.w || cell.v).trim();
      cabecalhos[col] = header;
    }
  }
  
  // Processar linhas de dados (começar da linha 1, pois linha 0 é cabeçalho)
  for (let row = 1; row <= range.e.r; row++) {
    // Ler colunas específicas por índice
    const lerColuna = (indice) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: indice })];
      return cell ? (cell.w || cell.v) : '';
    };
    
    // Colunas principais (B, C, F, G)
    const valorB = lerColuna(1); // Coluna B: Data entrada
    const valorC = lerColuna(2); // Coluna C: Finalizado em
    const valorF = lerColuna(5); // Coluna F: Nome completo
    const valorG = lerColuna(6); // Coluna G: CPF
    
    const dataEntrada = parseData(valorB);
    const dataFinalizado = parseData(valorC);
    const nome = String(valorF || '').trim();
    const cpf = normalizarCPF(valorG);
    
    // Validar que tem pelo menos CPF ou nome
    if (!cpf && !nome) {
      continue;
    }
    
    // Validar CPF
    if (cpf && (cpf.length !== 11 || cpf === '00000000000')) {
      continue;
    }
    
    // Criar registro com todas as colunas mapeadas por índice
    const registro = {
      // Colunas principais
      dataEntrada,
      dataFinalizado,
      nome,
      cpf,
      
      // Outras colunas (mapeadas por índice)
      cpfTratado: normalizarCPF(lerColuna(0)), // A: CPF Tratado
      enviarParaCobranca: lerColuna(3), // D: Enviar para cobrança?
      responsavel: String(lerColuna(4) || '').trim(), // E: Responsável
      origem: String(lerColuna(7) || '').trim(), // H: Origem
      motivoReduzido: String(lerColuna(8) || '').trim(), // I: Motivo reduzido
      motivoDetalhado: String(lerColuna(9) || '').trim(), // J: Motivo Reclamação
      prazoBacen: parseData(lerColuna(10)), // K: Prazo Bacen
      telefone: String(lerColuna(11) || '').trim(), // L: Telefone
      tentativa1: lerColuna(12), // M: 1ª tentativa
      tentativa2: lerColuna(13), // N: 2ª tentativa
      tentativa3: lerColuna(14), // O: 3ª tentativa
      acionouCentral: lerColuna(15), // P: Acionou a central?
      n2Portabilidade: lerColuna(16), // Q: N2 Portabilidade?
      reclameAqui: lerColuna(17), // R: Reclame Aqui
      bacen: lerColuna(18), // S: Bacen?
      procon: lerColuna(19), // T: Procon?
      protocolosCentral: String(lerColuna(20) || '').trim(), // U: Protocolos Central
      pixLiberado: lerColuna(21), // V: PIX liberado ou excluído?
      aceitouLiquidacao: lerColuna(22), // W: Aceitou liquidação Antecipada?
      observacoes: String(lerColuna(23) || '').trim(), // X: Observações
      mes: String(lerColuna(24) || '').trim(), // Y: Mês
      casosCriticos: lerColuna(25), // Z: Casos críticos
      valorNegociado: String(lerColuna(26) || '').trim() // [ : Valor negociado
    };
    
    dados.push(registro);
  }
  
  return dados;
}

/**
 * Converter registro do XLSX para documento MongoDB
 */
function converterRegistro(row) {
  // Usar valores das colunas específicas (B, C, F, G)
  const nome = row.nome || '';
  const cpf = row.cpf || '';
  const dataEntrada = row.dataEntrada || new Date();
  const dataFinalizado = row.dataFinalizado || null;
  
  // Construir objeto Finalizado
  // Se houver valor na coluna C, Finalizado.Resolvido = true
  // Se coluna C estiver vazia, Finalizado.Resolvido = false (caso em aberto)
  const finalizado = dataFinalizado ? {
    Resolvido: true,
    dataResolucao: dataFinalizado
  } : {
    Resolvido: false
  };
  
  return {
    nome: nome,
    cpf: cpf,
    telefones: converterTelefones(row.telefone || ''),
    email: '',
    observacoes: row.observacoes || '',
    responsavel: row.responsavel || '',
    
    // Campos específicos BACEN
    dataEntrada: dataEntrada,
    origem: row.origem || '',
    produto: row.produto || '', // Pode existir em 2026
    anexos: [],
    prazoBacen: row.prazoBacen || null,
    motivoReduzido: row.motivoReduzido || '',
    motivoDetalhado: row.motivoDetalhado || '',
    
    // Campos compartilhados
    tentativasContato: converterTentativas(
      row.tentativa1 || '',
      row.tentativa2 || '',
      row.tentativa3 || ''
    ),
    acionouCentral: converterBoolean(row.acionouCentral || ''),
    protocolosCentral: converterProtocolos(row.protocolosCentral || ''),
    n2SegundoNivel: converterBoolean(row.n2Portabilidade || ''),
    protocolosN2: [],
    reclameAqui: converterBoolean(row.reclameAqui || ''),
    protocolosReclameAqui: [],
    procon: converterBoolean(row.procon || ''),
    protocolosProcon: [],
    pixStatus: converterPixStatus(row.pixLiberado || ''),
    statusContratoQuitado: converterBoolean(row.aceitouLiquidacao || ''),
    statusContratoAberto: !converterBoolean(row.aceitouLiquidacao || ''),
    enviarParaCobranca: converterBoolean(row.enviarParaCobranca || ''),
    Finalizado: finalizado,
    createdAt: dataEntrada,
    updatedAt: dataFinalizado || dataEntrada
  };
}

/**
 * Criar índices na collection
 */
async function criarIndices(collection) {
  try {
    await collection.createIndex({ cpf: 1 });
    await collection.createIndex({ 'telefones.lista': 1 });
    await collection.createIndex({ email: 1 }, { sparse: true });
    await collection.createIndex({ createdAt: -1 });
    console.log('✅ Índices criados com sucesso');
  } catch (error) {
    console.error('⚠️  Erro ao criar índices:', error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando migração Base Bacen 2026 (XLSX) → MongoDB...');
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'MIGRAÇÃO REAL'}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Arquivo: ${XLSX_PATH}`);
  console.log(`   Aba: ${ABA_NOME}`);
  console.log(`\n   Mapeamento:`);
  console.log(`   - Coluna B → dataEntrada (createdAt)`);
  console.log(`   - Coluna C → Finalizado.dataResolucao (updatedAt)`);
  console.log(`   - Coluna C com valor → Finalizado.Resolvido = true`);
  console.log(`   - Coluna C vazia → Finalizado.Resolvido = false (em aberto)`);
  console.log(`   - Coluna F → nome`);
  console.log(`   - Coluna G → cpf\n`);
  
  if (!MONGODB_URI) {
    console.error('❌ MONGO_ENV não configurada');
    process.exit(1);
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Não limpar collection (Bacen 2025 já inseriu dados)
    if (!DRY_RUN) {
      const count = await collection.countDocuments();
      if (count > 0) {
        console.log(`⚠️  Collection já contém ${count} documentos. Não será limpa (Bacen 2025 já inseriu dados).\n`);
      } else {
        console.log('🗑️  Limpando collection...');
        await collection.deleteMany({});
        console.log('✅ Collection limpa\n');
      }
    } else {
      console.log('⚠️  [DRY-RUN] Pulando limpeza da collection\n');
    }
    
    // Ler XLSX
    console.log(`📂 Lendo arquivo XLSX (aba: ${ABA_NOME})...`);
    const dadosXLSX = lerXLSXPorColunas(XLSX_PATH, ABA_NOME);
    console.log(`✅ ${dadosXLSX.length} registros lidos do XLSX\n`);
    
    if (dadosXLSX.length === 0) {
      console.log('⚠️  Nenhum dado para processar');
      return;
    }
    
    // Processar registros
    let processadas = 0;
    let erros = 0;
    let resolvidos = 0;
    let emAberto = 0;
    const documentos = [];
    
    console.log('🔄 Processando registros...\n');
    
    for (const row of dadosXLSX) {
      try {
        processadas++;
        
        const documento = converterRegistro(row);
        
        // Validar campos obrigatórios
        const nome = documento.nome || '';
        const cpf = documento.cpf || '';
        
        // Pular linhas completamente vazias
        if (!nome.trim() && !cpf.trim()) {
          continue;
        }
        
        // Ignorar registros com CPF inválido
        if (cpf && (cpf.length !== 11 || cpf === '00000000000')) {
          continue;
        }
        
        // Validar nome - deve existir
        if (!nome.trim()) {
          console.log(`⚠️  Registro ${processadas} ignorado: falta nome - CPF: ${cpf.substring(0, 3)}***`);
          erros++;
          continue;
        }
        
        // Contar resolvidos vs em aberto
        if (documento.Finalizado.Resolvido) {
          resolvidos++;
        } else {
          emAberto++;
        }
        
        documentos.push(documento);
        
        if (processadas % 100 === 0) {
          process.stdout.write(`   Processados: ${processadas}...\r`);
        }
      } catch (error) {
        erros++;
        console.error(`❌ Erro ao processar registro ${processadas}:`, error.message);
      }
    }
    
    console.log(`\n✅ ${processadas} registros processados`);
    console.log(`   Válidos: ${documentos.length}`);
    console.log(`   Resolvidos: ${resolvidos}`);
    console.log(`   Em aberto: ${emAberto}`);
    console.log(`   Erros: ${erros}\n`);
    
    // Inserir documentos
    if (documentos.length > 0) {
      if (!DRY_RUN) {
        console.log('💾 Inserindo documentos no MongoDB...');
        
        // Inserir em batches de 1000
        const batchSize = 1000;
        for (let i = 0; i < documentos.length; i += batchSize) {
          const batch = documentos.slice(i, i + batchSize);
          await collection.insertMany(batch);
          console.log(`   Inseridos: ${Math.min(i + batchSize, documentos.length)}/${documentos.length}`);
        }
        
        console.log('✅ Documentos inseridos\n');
        
        // Criar índices (se ainda não existirem)
        console.log('📇 Verificando índices...');
        await criarIndices(collection);
        console.log('');
      } else {
        console.log(`⚠️  [DRY-RUN] Inseriria ${documentos.length} documentos`);
        console.log(`\n   Primeiro documento de exemplo:`);
        const exemplo = documentos[0];
        console.log(`   Nome (coluna F): "${exemplo.nome}"`);
        console.log(`   CPF (coluna G): "${exemplo.cpf}"`);
        console.log(`   Data entrada (coluna B): ${exemplo.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`   Data finalizado (coluna C): ${exemplo.updatedAt.toLocaleDateString('pt-BR')}`);
        console.log(`   Finalizado.Resolvido: ${exemplo.Finalizado.Resolvido}`);
        console.log(`   Finalizado.dataResolucao: ${exemplo.Finalizado.dataResolucao ? exemplo.Finalizado.dataResolucao.toLocaleDateString('pt-BR') : 'null'}`);
        console.log('');
      }
    }
    
    // Resumo final
    console.log('='.repeat(70));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(70));
    console.log(`Registros processados: ${processadas}`);
    console.log(`Registros válidos: ${documentos.length}`);
    console.log(`Registros inseridos: ${DRY_RUN ? 0 : documentos.length}`);
    console.log(`Resolvidos: ${resolvidos}`);
    console.log(`Em aberto: ${emAberto}`);
    console.log(`Erros: ${erros}`);
    console.log('='.repeat(70));
    
    if (DRY_RUN) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhum dado foi inserido realmente');
      console.log('   Execute sem --dry-run para realizar a migração real\n');
    } else {
      console.log('\n✅ Migração concluída com sucesso!\n');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexão MongoDB fechada');
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  converterRegistro,
  criarIndices,
  lerXLSXPorColunas
};

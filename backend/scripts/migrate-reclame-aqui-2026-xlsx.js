/**
 * Script de Migração: Planilha RA e Procon 2026 (XLSX) → MongoDB reclamacoes_reclameAqui
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
 * Mapeamento das colunas:
 * - Coluna A: CPF Repetido → cpfRepetido
 * - Coluna B: CPF → cpf
 * - Coluna C: ID Entrada → idEntrada (9 dígitos)
 * - Coluna D: Entrada → IGNORAR
 * - Coluna E: Colaboradores → responsavel (com correção de nomes)
 * - Coluna F: Início tratativa → IGNORAR (sem campo no formulário)
 * - Coluna G: IGNORAR
 * - Coluna H: Passível de nota + → passivelNotaMais (boolean)
 * - Coluna I: PIX Retirado → pixStatus
 * - Coluna J: Motivo reduzido → motivoReduzido
 * - Coluna K: Data Reclam → dataReclam
 * - Coluna L: Data inicial → createdAt
 * - Coluna M: Data final → Finalizado.Resolvido = true e Finalizado.dataResolucao (se presente)
 * - Coluna N: Tratativa N1 → acionouCentral (boolean)
 * - Coluna O: Oportunidade → IGNORAR (removido do schema)
 * - Coluna P: Solicitado Avaliação → solicitadoAvaliacao (boolean)
 * - Coluna Q: Avaliado → avaliado (boolean)
 * 
 * Correção de nomes dos colaboradores:
 * - Nayara → Nayara Nunes Ribeiro
 * - Octavio → Octavio Augusto Ramalho da Silva
 * - Carol → Caroline Santiago
 * 
 * Uso:
 *   node backend/scripts/migrate-reclame-aqui-2026-xlsx.js [--dry-run]
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_reclameAqui';

// Modo dry-run (apenas validação, sem inserir)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo XLSX e nomes das abas
const XLSX_PATH = path.join(__dirname, '../../../dados procon/Copy of Planilha RA e Procon acompanhamento 2026.xlsx');
const ABAS_NOMES = ['Novo Acompanhamento RA', 'Novo acompanhamento RA 2026'];

/**
 * Mapeamento de nomes dos colaboradores
 */
const MAPEAMENTO_COLABORADORES = {
  'Nayara': 'Nayara Nunes Ribeiro',
  'Octavio': 'Octavio Augusto Ramalho da Silva',
  'Carol': 'Caroline Santiago'
};

/**
 * Corrigir nome do colaborador
 */
function corrigirNomeColaborador(nome) {
  if (!nome) return '';
  const nomeTrim = String(nome).trim();
  return MAPEAMENTO_COLABORADORES[nomeTrim] || nomeTrim;
}

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
 * Normalizar ID Entrada (9 dígitos)
 */
function normalizarIdEntrada(id) {
  if (!id) return '';
  const apenasNumeros = String(id).replace(/\D/g, '');
  return apenasNumeros.length === 9 ? apenasNumeros : '';
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
 * Converter status PIX
 */
function converterPixStatus(statusStr) {
  if (!statusStr) return '';
  
  const str = String(statusStr).trim();
  if (!str) return '';
  
  const strUpper = str.toUpperCase();
  
  // Tratar valores booleanos
  if (strUpper === 'TRUE' || strUpper === 'SIM' || strUpper === 'S' || strUpper === '1' || strUpper === 'YES' || strUpper === 'Y') {
    return 'Liberado';
  }
  if (strUpper === 'FALSE' || strUpper === 'NÃO' || strUpper === 'NAO' || strUpper === 'N' || strUpper === '0' || strUpper === 'NO') {
    return 'Não aplicável';
  }
  
  // Tratar valores descritivos
  if (strUpper.includes('LIBERADO') || strUpper.includes('LIBERADA')) return 'Liberado';
  if (strUpper.includes('EXCLUÍDO') || strUpper.includes('EXCLUIDO') || strUpper.includes('EXCLUÍDA') || strUpper.includes('EXCLUIDA')) return 'Excluído';
  if (strUpper.includes('SOLICITADA') || strUpper.includes('SOLICITADO')) return 'Solicitada';
  
  // Se não corresponder a nenhum padrão conhecido, retornar vazio
  return '';
}

/**
 * Converter Tratativa N1 para boolean
 */
function converterTratativaN1(valor) {
  if (!valor) return false;
  const str = String(valor).toUpperCase().trim();
  return str === 'SIM' || str === 'S' || str === 'TRUE' || str === '1' || str === 'YES' || str === 'Y';
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
  
  // Processar linhas de dados (começar da linha 1, pois linha 0 é cabeçalho)
  for (let row = 1; row <= range.e.r; row++) {
    // Ler colunas específicas por índice
    const lerColuna = (indice) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: indice })];
      return cell ? (cell.w || cell.v) : '';
    };
    
    // Mapeamento conforme especificado:
    // A (0): CPF Repetido
    // B (1): CPF
    // C (2): ID Entrada
    // D (3): Entrada → IGNORAR
    // E (4): Colaboradores
    // F (5): Início tratativa → IGNORAR
    // G (6): IGNORAR
    // H (7): Passível de nota +
    // I (8): PIX Retirado
    // J (9): Motivo reduzido
    // K (10): Data Reclam
    // L (11): Data inicial
    // M (12): Data final
    // N (13): Tratativa N1
    // O (14): Oportunidade → IGNORAR
    // P (15): Solicitado Avaliação
    // Q (16): Avaliado
    
    const cpfRepetido = normalizarCPF(lerColuna(0)); // A
    const cpf = normalizarCPF(lerColuna(1)); // B
    const idEntrada = normalizarIdEntrada(lerColuna(2)); // C
    // D: IGNORAR
    const colaborador = String(lerColuna(4) || '').trim(); // E
    // F: IGNORAR
    // G: IGNORAR
    const passivelNotaMais = converterBoolean(lerColuna(7)); // H
    const pixRetirado = String(lerColuna(8) || '').trim(); // I
    const motivoReduzido = String(lerColuna(9) || '').trim(); // J
    const dataReclam = parseData(lerColuna(10)); // K
    const dataInicial = parseData(lerColuna(11)); // L
    const dataFinal = parseData(lerColuna(12)); // M
    const tratativaN1 = converterTratativaN1(lerColuna(13)); // N
    // O: IGNORAR
    const solicitadoAvaliacao = converterBoolean(lerColuna(15)); // P
    const avaliado = converterBoolean(lerColuna(16)); // Q
    
    // Validar campos obrigatórios mínimos
    if (!idEntrada && !cpf) {
      continue; // Pular linha se não tiver ID Entrada nem CPF
    }
    
    // Validar ID Entrada se presente
    if (idEntrada && idEntrada.length !== 9) {
      continue; // Pular se ID Entrada não tiver 9 dígitos
    }
    
    // Validar CPF se presente
    if (cpf && (cpf.length !== 11 || cpf === '00000000000')) {
      continue; // Pular se CPF inválido
    }
    
    // Criar registro
    const registro = {
      cpfRepetido,
      cpf,
      idEntrada,
      colaborador: corrigirNomeColaborador(colaborador),
      passivelNotaMais,
      pixRetirado,
      motivoReduzido,
      dataReclam,
      dataInicial,
      dataFinal,
      tratativaN1,
      solicitadoAvaliacao,
      avaliado
    };
    
    dados.push(registro);
  }
  
  return dados;
}

/**
 * Converter registro do XLSX para documento MongoDB
 */
function converterRegistro(row) {
  const dataInicial = row.dataInicial || row.dataReclam || new Date();
  const dataFinal = row.dataFinal || null;
  
  // Construir objeto Finalizado
  // Se houver valor na coluna M (dataFinal), Finalizado.Resolvido = true
  const finalizado = dataFinal ? {
    Resolvido: true,
    dataResolucao: dataFinal
  } : {
    Resolvido: false
  };
  
  return {
    nome: '', // Nome do cliente não está na planilha
    cpf: row.cpf || '',
    telefones: { lista: [] }, // Telefones não estão na planilha
    email: '',
    observacoes: '',
    responsavel: row.colaborador || '',
    
    // Campos específicos Reclame Aqui
    cpfRepetido: row.cpfRepetido || '',
    idEntrada: row.idEntrada || '',
    dataReclam: row.dataReclam || dataInicial,
    motivoReduzido: row.motivoReduzido || '',
    motivoDetalhado: '',
    passivelNotaMais: row.passivelNotaMais || false,
    pixLiberado: ['Liberado', 'Excluído', 'Solicitada'].includes(converterPixStatus(row.pixRetirado || '')),
    statusContratoQuitado: false,
    statusContratoAberto: false,
    enviarParaCobranca: false,
    anexos: [],
    solicitadoAvaliacao: row.solicitadoAvaliacao || false,
    avaliado: row.avaliado || false,
    
    // Tratativa N1: Canais de atendimento e protocolos acionados
    acionouCentral: row.tratativaN1 || false,
    protocolosCentral: [],
    n2SegundoNivel: false,
    protocolosN2: [],
    reclameAqui: false,
    protocolosReclameAqui: [],
    procon: false,
    protocolosProcon: [],
    
    Finalizado: finalizado,
    createdAt: dataInicial,
    updatedAt: dataFinal || dataInicial
  };
}

/**
 * Criar índices na collection
 */
async function criarIndices(collection) {
  try {
    await collection.createIndex({ cpf: 1 });
    await collection.createIndex({ cpfRepetido: 1 });
    await collection.createIndex({ idEntrada: 1 }); // Não único, pode haver duplicatas
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
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('🚀 Script de Migração: Reclame Aqui 2026 (XLSX) → MongoDB\n');
  console.log(`📁 Arquivo: ${XLSX_PATH}`);
  console.log(`📊 Abas: ${ABAS_NOMES.join(', ')}`);
  console.log(`🗄️  Database: ${DATABASE_NAME}`);
  console.log(`📦 Collection: ${COLLECTION_NAME}`);
  console.log(`🔍 Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'PRODUÇÃO (inserção real)'}\n`);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Limpar collection apenas se não for dry-run
    if (!DRY_RUN) {
      console.log('🗑️  Limpando collection...');
      await collection.deleteMany({});
      console.log('✅ Collection limpa\n');
    } else {
      console.log('⚠️  [DRY-RUN] Pulando limpeza da collection\n');
    }
    
    // Ler XLSX de todas as abas
    let todosDados = [];
    for (const abaNome of ABAS_NOMES) {
      console.log(`📂 Lendo arquivo XLSX (aba: ${abaNome})...`);
      try {
        const dadosXLSX = lerXLSXPorColunas(XLSX_PATH, abaNome);
        console.log(`✅ ${dadosXLSX.length} registros lidos da aba "${abaNome}"\n`);
        todosDados = todosDados.concat(dadosXLSX);
      } catch (error) {
        console.error(`⚠️  Erro ao ler aba "${abaNome}": ${error.message}\n`);
      }
    }
    
    if (todosDados.length === 0) {
      console.log('⚠️  Nenhum dado para processar');
      return;
    }
    
    console.log(`📊 Total de registros lidos: ${todosDados.length}\n`);
    
    // Processar registros
    let processadas = 0;
    let erros = 0;
    let resolvidos = 0;
    let emAberto = 0;
    const documentos = [];
    
    console.log('🔄 Processando registros...\n');
    
    for (const row of todosDados) {
      try {
        const documento = converterRegistro(row);
        
        // Validar documento mínimo
        if (!documento.idEntrada && !documento.cpf) {
          erros++;
          continue;
        }
        
        documentos.push(documento);
        
        if (documento.Finalizado && documento.Finalizado.Resolvido) {
          resolvidos++;
        } else {
          emAberto++;
        }
        
        processadas++;
      } catch (error) {
        console.error(`❌ Erro ao processar registro:`, error.message);
        erros++;
      }
    }
    
    console.log(`✅ ${processadas} registros processados`);
    console.log(`   - Resolvidos: ${resolvidos}`);
    console.log(`   - Em aberto: ${emAberto}`);
    console.log(`   - Erros: ${erros}\n`);
    
    if (documentos.length === 0) {
      console.log('⚠️  Nenhum documento válido para inserir');
      return;
    }
    
    // Inserir documentos
    if (!DRY_RUN) {
      console.log(`💾 Inserindo ${documentos.length} documentos no MongoDB...`);
      
      // Inserir em lotes de 100
      const BATCH_SIZE = 100;
      for (let i = 0; i < documentos.length; i += BATCH_SIZE) {
        const batch = documentos.slice(i, i + BATCH_SIZE);
        await collection.insertMany(batch, { ordered: false });
        console.log(`   ✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} inserido (${Math.min(i + BATCH_SIZE, documentos.length)}/${documentos.length})`);
      }
      
      console.log(`\n✅ ${documentos.length} documentos inseridos com sucesso\n`);
      
      // Criar índices
      console.log('📇 Criando índices...');
      await criarIndices(collection);
      console.log('');
      
      // Estatísticas finais
      const total = await collection.countDocuments();
      const totalResolvidos = await collection.countDocuments({ 'Finalizado.Resolvido': true });
      const totalEmAberto = await collection.countDocuments({ 'Finalizado.Resolvido': { $ne: true } });
      
      console.log('📊 Estatísticas finais:');
      console.log(`   - Total de documentos: ${total}`);
      console.log(`   - Resolvidos: ${totalResolvidos}`);
      console.log(`   - Em aberto: ${totalEmAberto}`);
    } else {
      console.log('⚠️  [DRY-RUN] Documentos não foram inseridos');
      console.log(`\n📋 Primeiro documento de exemplo:`);
      console.log(JSON.stringify(documentos[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Conexão fechada');
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, converterRegistro, lerXLSXPorColunas };

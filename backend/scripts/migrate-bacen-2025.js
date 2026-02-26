/**
 * Script de Migração: Bacen 2025.csv → MongoDB reclamacoes_bacen
 * VERSION: v1.0.0 | DATE: 2026-02-24 | AUTHOR: VeloHub Development Team
 * 
 * Processa Bacen 2025.csv e insere na collection reclamacoes_bacen
 * Todos os registros são marcados como Finalizado.Resolvido = true
 * 
 * Uso:
 *   node backend/scripts/migrate-bacen-2025.js [--dry-run]
 * 
 * Requer variáveis de ambiente:
 *   - MONGO_ENV (MongoDB connection string)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const {
  parseCSVFile,
  parseDataBR,
  normalizarCPF,
  converterTelefones,
  converterTentativas,
  converterBoolean,
  converterProtocolos,
  converterPixStatus,
  buscarCampo
} = require('./utils/csv-parser');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_bacen';

// Modo dry-run (apenas validação, sem inserir)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo CSV
const CSV_PATH = path.join(__dirname, '../../../update bacen/Bacen 2025.csv');

/**
 * Converter registro do CSV para documento MongoDB
 */
function converterRegistro(row) {
  // Buscar campos usando função auxiliar que tenta diferentes variações
  const cpfTratado = buscarCampo(row, ['CPF Tratado', 'CPF Tratado']);
  const cpf = buscarCampo(row, ['CPF']);
  const nomeCompleto = buscarCampo(row, ['Nome completo', 'Nome completo', 'Nome']);
  
  const dataEntrada = parseDataBR(buscarCampo(row, ['Data entrada', 'Data de entrada']) || '') || new Date();
  const finalizadoEm = parseDataBR(buscarCampo(row, ['Finalizado em ', 'Finalizado em']) || '') || null;
  const prazoBacen = parseDataBR(buscarCampo(row, ['Prazo Bacen']) || '') || null;
  
  // Usar CPF Tratado primeiro, depois CPF, depois tentar extrair de qualquer campo
  let cpfLimpo = normalizarCPF(cpfTratado);
  if (!cpfLimpo) {
    cpfLimpo = normalizarCPF(cpf);
  }
  
  // Se ainda não encontrou, tentar buscar em qualquer campo que contenha apenas números
  if (!cpfLimpo) {
    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === 'string') {
        const apenasNumeros = value.replace(/\D/g, '');
        if (apenasNumeros.length === 11) {
          cpfLimpo = apenasNumeros;
          break;
        }
      }
    }
  }
  
  // Construir objeto Finalizado
  const finalizado = {
    Resolvido: true, // Sempre true para 2025
    dataResolucao: finalizadoEm || dataEntrada
  };
  
  // Buscar nome - tentar diferentes variações
  let nome = nomeCompleto.trim();
  if (!nome) {
    // Tentar buscar em qualquer campo que pareça um nome
    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === 'string' && value.trim().length > 5) {
        // Se contém letras e espaços, pode ser um nome
        if (/[a-zA-ZÀ-ÿ]/.test(value) && value.includes(' ')) {
          nome = value.trim();
          break;
        }
      }
    }
  }
  
  return {
    nome: nome,
    cpf: cpfLimpo,
    telefones: converterTelefones(buscarCampo(row, ['Telefone']) || ''),
    email: '',
    observacoes: buscarCampo(row, ['Observações', 'ObservaÃ§Ãµes', 'Observacoes']) || '',
    responsavel: buscarCampo(row, ['Responsável', 'ResponsÃ¡vel', 'Responsavel']) || '',
    
    // Campos específicos BACEN
    dataEntrada: dataEntrada,
    origem: buscarCampo(row, ['Origem']) || '',
    produto: buscarCampo(row, ['Produto']) || '', // Pode não existir em 2025
    anexos: [],
    prazoBacen: prazoBacen,
    motivoReduzido: buscarCampo(row, ['Motivo reduzido']) || '',
    motivoDetalhado: buscarCampo(row, ['Motivo Reclamação', 'Motivo ReclamaÃ§Ã£o', 'Motivo Reclamacao']) || '',
    
    // Campos compartilhados
    tentativasContato: converterTentativas(
      buscarCampo(row, ['1ª tentativa', '1Âª tentativa', '1a tentativa']) || '',
      buscarCampo(row, ['2ª tentativa', '2Âª tentativa', '2a tentativa']) || '',
      buscarCampo(row, ['3ª tentativa', '3Âª tentativa', '3a tentativa']) || ''
    ),
    acionouCentral: converterBoolean(buscarCampo(row, ['Acionou a central?']) || ''),
    protocolosCentral: converterProtocolos(buscarCampo(row, ['Protocolos Central (incluir todos)']) || ''),
    n2SegundoNivel: converterBoolean(buscarCampo(row, ['N2 Portabilidade? ', 'N2 Portabilidade?']) || ''),
    protocolosN2: [],
    reclameAqui: converterBoolean(buscarCampo(row, ['Reclame Aqui']) || ''),
    protocolosReclameAqui: [],
    procon: converterBoolean(buscarCampo(row, ['Procon? ', 'Procon?']) || ''),
    protocolosProcon: [],
    pixStatus: converterPixStatus(buscarCampo(row, ['PIX liberado \nou excluído?', 'PIX liberado ou excluído?', 'PIX liberado']) || ''),
    statusContratoQuitado: converterBoolean(buscarCampo(row, ['Aceitou liquidação Antecipada?', 'Aceitou liquidaÃ§Ã£o Antecipada?']) || ''),
    statusContratoAberto: !converterBoolean(buscarCampo(row, ['Aceitou liquidação Antecipada?', 'Aceitou liquidaÃ§Ã£o Antecipada?']) || ''),
    enviarParaCobranca: converterBoolean(buscarCampo(row, ['Enviar para cobrança?', 'Enviar para cobranÃ§a?', 'Enviar para cobranca?']) || ''),
    Finalizado: finalizado,
    createdAt: dataEntrada,
    updatedAt: finalizadoEm || dataEntrada
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
  console.log('🚀 Iniciando migração Bacen 2025.csv → MongoDB...');
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'MIGRAÇÃO REAL'}`);
  console.log(`   Collection: ${COLLECTION_NAME}\n`);
  
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
    
    // Limpar collection
    if (!DRY_RUN) {
      console.log('🗑️  Limpando collection...');
      await collection.deleteMany({});
      console.log('✅ Collection limpa\n');
    } else {
      console.log('⚠️  [DRY-RUN] Pulando limpeza da collection\n');
    }
    
    // Ler CSV
    console.log('📂 Lendo arquivo CSV...');
    const dadosCSV = parseCSVFile(CSV_PATH);
    console.log(`✅ ${dadosCSV.length} registros lidos do CSV\n`);
    
    if (dadosCSV.length === 0) {
      console.log('⚠️  Nenhum dado para processar');
      return;
    }
    
    // Processar registros
    let processadas = 0;
    let inseridas = 0;
    let erros = 0;
    const documentos = [];
    
    console.log('🔄 Processando registros...\n');
    
    for (const row of dadosCSV) {
      try {
        processadas++;
        
        const documento = converterRegistro(row);
        
        // Validar campos obrigatórios - verificar se há dados válidos
        const nome = documento.nome || '';
        const cpf = documento.cpf || '';
        
        // Pular linhas completamente vazias
        if (!nome.trim() && !cpf.trim()) {
          continue;
        }
        
        // Ignorar registros com CPF inválido ou zerado (00000000000 = linha não utilizada)
        // Mas permitir CPFs que começam com 0 mas não são todos zeros (ex: 01234567890)
        if (!cpf || cpf.length !== 11) {
          continue;
        }
        
        // Verificar se é CPF zerado (todos zeros ou apenas zeros)
        if (cpf === '00000000000' || /^0+$/.test(cpf)) {
          // Linha não utilizada - pular silenciosamente
          continue;
        }
        
        // Validar nome - deve existir
        if (!nome.trim()) {
          // Se tem CPF válido mas não tem nome, tentar buscar novamente
          // Pode ser problema de encoding ou parsing
          const nomeAlternativo = buscarCampo(row, ['Nome completo', 'Nome completo', 'Nome']);
          if (nomeAlternativo && nomeAlternativo.trim()) {
            documento.nome = nomeAlternativo.trim();
          } else {
            // Se ainda não encontrou, é um erro real
            console.log(`⚠️  Registro ${processadas} ignorado: falta nome - CPF: ${cpf.substring(0, 3)}***`);
            erros++;
            continue;
          }
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
        
        // Criar índices
        console.log('📇 Criando índices...');
        await criarIndices(collection);
        console.log('');
      } else {
        console.log(`⚠️  [DRY-RUN] Inseriria ${documentos.length} documentos`);
        console.log(`   Primeiro documento de exemplo:`);
        console.log(JSON.stringify(documentos[0], null, 2));
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
  criarIndices
};

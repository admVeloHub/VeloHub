/**
 * Script de Migração: Ouvidoria 2026.csv → MongoDB reclamacoes_n2Pix
 * VERSION: v1.0.0 | DATE: 2026-02-24 | AUTHOR: VeloHub Development Team
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
 * Processa Ouvidoria 2026.csv e insere na collection reclamacoes_n2Pix
 * Lógica de finalização:
 *   - Se updatedAt anterior a 15/02/2026: Finalizado.Resolvido = true
 *   - Se updatedAt posterior ou igual a 15/02/2026: Finalizado.Resolvido = false
 * 
 * Uso:
 *   node backend/scripts/migrate-ouvidoria-2026.js [--dry-run]
 * 
 * Requer variáveis de ambiente:
 *   - MONGO_ENV (MongoDB connection string)
 */

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
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_n2Pix';

// Modo dry-run (apenas validação, sem inserir)
const DRY_RUN = process.argv.includes('--dry-run');

// Data limite para finalização (15/02/2026)
const DATA_LIMITE_FINALIZACAO = new Date(2026, 1, 15); // Mês é 0-indexed (fevereiro = 1)

// Caminho do arquivo CSV
const CSV_PATH = path.join(__dirname, '../../../update bacen/Ouvidoria 2026.csv');

/**
 * Converter registro do CSV para documento MongoDB
 */
function converterRegistro(row) {
  // Tentar diferentes variações do nome do campo de data
  const chaves = Object.keys(row);
  const dataEntradaAtendimento = parseDataBR(
    buscarCampo(row, ['Data de entrada\n Atendimento', 'Data de entrada Atendimento', 'Data de entrada']) ||
    row[chaves.find(k => k.includes('Data de entrada'))] ||
    row[chaves[0]] || // Primeira coluna
    ''
  ) || new Date();
  
  // A segunda coluna pode ser a data de entrada N2 ou um número (ignorar se for número)
  // No CSV de 2026, a segunda coluna é um número (ex: 100078204), não uma data
  // Buscar especificamente pelo campo "Data Entrada N2" ou usar a terceira coluna se existir
  let dataEntradaN2 = null;
  
  // Tentar buscar pelo nome do campo primeiro
  const campoDataN2 = buscarCampo(row, ['Data Entrada N2', 'Data Entrada N2']);
  if (campoDataN2) {
    dataEntradaN2 = parseDataBR(campoDataN2);
  }
  
  // Se não encontrou, tentar a terceira coluna (índice 2) que geralmente é a data N2
  if (!dataEntradaN2 && chaves.length > 2) {
    const terceiraColuna = row[chaves[2]] || '';
    // Verificar se é uma data válida (contém / e tem formato DD/MM/YYYY)
    if (terceiraColuna && /^\d{2}\/\d{2}\/\d{4}/.test(terceiraColuna.trim())) {
      dataEntradaN2 = parseDataBR(terceiraColuna);
    }
  }
  
  // Se ainda não encontrou, usar a primeira data
  if (!dataEntradaN2) {
    dataEntradaN2 = dataEntradaAtendimento;
  }
  
  const finalizadoEm = parseDataBR(buscarCampo(row, ['Finalizado em ', 'Finalizado em']) || '') || null;
  
  // Buscar CPF - tentar diferentes variações
  let cpfLimpo = normalizarCPF(buscarCampo(row, ['CPF']) || '');
  if (!cpfLimpo) {
    // Tentar buscar em qualquer campo que contenha apenas números
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
  
  // Lógica de finalização baseada na data
  let finalizado = null;
  if (finalizadoEm) {
    if (finalizadoEm < DATA_LIMITE_FINALIZACAO) {
      // Anterior a 15/02/2026: marcado como resolvido
      finalizado = {
        Resolvido: true,
        dataResolucao: finalizadoEm
      };
    } else {
      // Posterior ou igual a 15/02/2026: não resolvido
      finalizado = {
        Resolvido: false
      };
    }
  } else {
    // Sem data de finalização: não resolvido
    finalizado = {
      Resolvido: false
    };
  }
  
  // Buscar nome - tentar diferentes variações
  let nome = buscarCampo(row, ['Nome completo', 'Nome']) || '';
  if (!nome.trim()) {
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
    
    // Campos específicos OUVIDORIA/N2
    dataEntradaAtendimento: dataEntradaAtendimento,
    dataEntradaN2: dataEntradaN2,
    motivoReduzido: buscarCampo(row, ['Motivo reduzido']) || '',
    origem: buscarCampo(row, ['Origem']) || '',
    produto: '',
    prazoOuvidoria: null,
    motivoDetalhado: buscarCampo(row, ['Motivo Reclamação', 'Motivo ReclamaÃ§Ã£o', 'Motivo Reclamacao']) || '',
    anexos: [],
    
    // Campos compartilhados
    tentativasContato: converterTentativas(
      buscarCampo(row, ['1ª tentativa', '1Âª tentativa', '1a tentativa', '1 tentativa']) || '',
      buscarCampo(row, ['2ª tentativa', '2Âª tentativa', '2a tentativa', '2 tentativa']) || '',
      buscarCampo(row, ['3ª tentativa (BACEN)', '3 tentativa (BACEN)', '3ª tentativa', '3Âª tentativa', '3a tentativa']) || ''
    ),
    acionouCentral: converterBoolean(
      buscarCampo(row, [
        'Acionou a central? \nMesmo motivo \nBACEN',
        'Acionou a central? Mesmo motivo BACEN',
        'Acionou a central?'
      ]) || ''
    ),
    protocolosCentral: converterProtocolos(buscarCampo(row, ['Protocolos Central (incluir todos)', 'Protocolos Central']) || ''),
    n2SegundoNivel: converterBoolean(buscarCampo(row, ['N2 Portabilidade? ', 'N2 Portabilidade?']) || ''),
    protocolosN2: [],
    reclameAqui: converterBoolean(buscarCampo(row, ['Reclame Aqui']) || ''),
    protocolosReclameAqui: [],
    procon: converterBoolean(buscarCampo(row, ['Procon? ', 'Procon?']) || ''),
    protocolosProcon: [],
    pixStatus: converterPixStatus(buscarCampo(row, ['PIX liberado?', 'PIX liberado']) || ''),
    statusContratoQuitado: converterBoolean(buscarCampo(row, ['Aceitou liquidação Antecipada?', 'Aceitou liquidaÃ§Ã£o Antecipada?', 'Aceitou liquidacao Antecipada?']) || ''),
    statusContratoAberto: !converterBoolean(buscarCampo(row, ['Aceitou liquidação Antecipada?', 'Aceitou liquidaÃ§Ã£o Antecipada?', 'Aceitou liquidacao Antecipada?']) || ''),
    enviarParaCobranca: converterBoolean(buscarCampo(row, ['Enviar para cobrança?', 'Enviar para cobranÃ§a?', 'Enviar para cobranca?']) || ''),
    Finalizado: finalizado,
    createdAt: dataEntradaAtendimento,
    updatedAt: finalizadoEm || dataEntradaAtendimento
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
  console.log('🚀 Iniciando migração Ouvidoria 2026.csv → MongoDB...');
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'MIGRAÇÃO REAL'}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Data limite finalização: ${DATA_LIMITE_FINALIZACAO.toLocaleDateString('pt-BR')}\n`);
  
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
    let resolvidos = 0;
    let naoResolvidos = 0;
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
          const nomeAlternativo = buscarCampo(row, ['Nome completo', 'Nome']);
          if (nomeAlternativo && nomeAlternativo.trim()) {
            documento.nome = nomeAlternativo.trim();
          } else {
            // Se ainda não encontrou, é um erro real
            console.log(`⚠️  Registro ${processadas} ignorado: falta nome - CPF: ${cpf.substring(0, 3)}***`);
            erros++;
            continue;
          }
        }
        
        // Contar resolvidos vs não resolvidos
        if (documento.Finalizado && documento.Finalizado.Resolvido) {
          resolvidos++;
        } else {
          naoResolvidos++;
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
    console.log(`   Não resolvidos: ${naoResolvidos}`);
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
    console.log(`Resolvidos (antes de 15/02/26): ${resolvidos}`);
    console.log(`Não resolvidos (após 15/02/26): ${naoResolvidos}`);
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

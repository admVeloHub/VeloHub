/**
 * Script de Sincronização: CSV → MongoDB (Apenas Novos Casos)
 * VERSION: v1.0.1 | DATE: 2026-02-26 | AUTHOR: VeloHub Development Team
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
 * Sincroniza dados dos arquivos CSV atualizados para MongoDB
 * Compara com casos já existentes no MongoDB e insere apenas os novos
 * 
 * Uso:
 *   node backend/scripts/sync-csv-to-mongodb.js [--dry-run]
 * 
 * Requer variáveis de ambiente:
 *   - MONGO_ENV (MongoDB connection string)
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

// Modo dry-run (apenas validação, sem inserir)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminhos dos arquivos CSV (relativo à raiz do projeto)
const CSV_BACEN = path.join(__dirname, '../../../update bacen/Ação Bacen e Ouvidoria.xlsx - Base Bacen 2026.csv');
const CSV_OUVIDORIA = path.join(__dirname, '../../../update bacen/Ação Bacen e Ouvidoria.xlsx - Base Ouvidoria 2026.csv');

/**
 * Converter data do formato brasileiro (DD/MM/YYYY) para Date
 */
function parseDataBR(dataStr) {
  if (!dataStr || dataStr.trim() === '') return null;
  const partes = dataStr.split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
    const ano = parseInt(partes[2], 10);
    return new Date(ano, mes, dia);
  }
  return null;
}

/**
 * Normalizar telefone para formato esperado
 */
function normalizarTelefone(telefone) {
  if (!telefone || typeof telefone !== 'string') return '';
  const limpo = telefone.replace(/[^\d+]/g, '');
  if (limpo.startsWith('+')) return limpo;
  if (limpo.length === 11) {
    return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
  } else if (limpo.length === 10) {
    return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
  }
  return limpo;
}

/**
 * Converter telefone string para array de telefones
 */
function converterTelefones(telefone) {
  if (!telefone || telefone.trim() === '') return { lista: [] };
  const normalizado = normalizarTelefone(telefone);
  return { lista: normalizado ? [normalizado] : [] };
}

/**
 * Converter tentativas de contato do CSV
 */
function converterTentativas(tentativa1, tentativa2, tentativa3) {
  const lista = [];
  
  if (tentativa1 && tentativa1.trim() !== '') {
    const data1 = parseDataBR(tentativa1);
    lista.push({
      data: data1 || new Date(),
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  if (tentativa2 && tentativa2.trim() !== '') {
    const data2 = parseDataBR(tentativa2);
    lista.push({
      data: data2 || new Date(),
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  if (tentativa3 && tentativa3.trim() !== '') {
    const data3 = parseDataBR(tentativa3);
    lista.push({
      data: data3 || new Date(),
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  return { lista };
}

/**
 * Converter pixStatus do CSV
 */
function converterPixStatus(pixLiberadoStr) {
  if (!pixLiberadoStr) return 'Não aplicável';
  const pixLiberado = pixLiberadoStr.toString().toUpperCase().trim();
  if (pixLiberado === 'TRUE' || pixLiberado === 'SIM' || pixLiberado === '1') return 'Liberado';
  if (pixLiberado === 'FALSE' || pixLiberado === 'NÃO' || pixLiberado === '0') return 'Excluído';
  return 'Não aplicável';
}

/**
 * Converter boolean do CSV
 */
function converterBoolean(valor) {
  if (!valor) return false;
  const str = valor.toString().toUpperCase().trim();
  return str === 'TRUE' || str === 'SIM' || str === '1' || str === 'VERDADEIRO';
}

/**
 * Converter protocolos do CSV (string separada por vírgula)
 */
function converterProtocolos(protocolosStr) {
  if (!protocolosStr || protocolosStr.trim() === '') return [];
  return protocolosStr.split(',').map(p => p.trim()).filter(p => p !== '');
}

/**
 * Converter reclamação BACEN do CSV
 */
function converterReclamacaoBacen(row) {
  const dataEntrada = parseDataBR(row['Data entrada']) || new Date();
  const finalizadoEm = parseDataBR(row['Finalizado em ']) || null;
  const prazoBacen = parseDataBR(row['Prazo Bacen']) || null;
  
  return {
    nome: (row['Nome completo'] || '').trim(),
    cpf: (row['CPF Tratado'] || row['CPF'] || '').replace(/\D/g, ''),
    telefones: converterTelefones(row['Telefone'] || ''),
    email: '',
    observacoes: (row['Observações'] || '').trim(),
    status: finalizadoEm ? 'resolvido' : 'em-andamento',
    responsavel: (row['Responsável'] || '').trim(),
    userEmail: '',
    
    // Campos específicos BACEN
    dataEntrada: dataEntrada,
    origem: (row['Origem'] || '').trim(),
    produto: (row['Produto'] || '').trim(),
    anexos: [],
    prazoBacen: prazoBacen,
    motivoReduzido: (row['Motivo reduzido'] || '').trim(),
    motivoDetalhado: (row['Motivo Reclamação'] || '').trim(),
    
    // Campos compartilhados
    tentativasContato: converterTentativas(
      row['1ª tentativa'] || '',
      row['2ª tentativa'] || '',
      row['3ª tentativa'] || ''
    ),
    acionouCentral: converterBoolean(row['Acionou a central?']),
    protocolosCentral: converterProtocolos(row['Protocolos Central (incluir todos)'] || ''),
    n2SegundoNivel: converterBoolean(row['N2 Portabilidade? ']),
    protocolosN2: [],
    reclameAqui: converterBoolean(row['Reclame Aqui']),
    protocolosReclameAqui: [],
    procon: converterBoolean(row['Procon? ']),
    protocolosProcon: [],
    protocolosSemAcionamento: '',
    pixLiberado: ['Liberado', 'Excluído', 'Solicitada'].includes(converterPixStatus(row['PIX liberado \nou excluído?'])),
    statusContratoQuitado: converterBoolean(row['Aceitou liquidação Antecipada?']),
    statusContratoAberto: !converterBoolean(row['Aceitou liquidação Antecipada?']),
    casosCriticos: converterBoolean(row['Casos críticos']),
    finalizadoEm: finalizadoEm,
    idSecao: '',
    deletada: false,
    deletedAt: null,
    createdAt: dataEntrada,
    updatedAt: finalizadoEm || dataEntrada
  };
}

/**
 * Converter reclamação OUVIDORIA do CSV
 */
function converterReclamacaoOuvidoria(row) {
  // Tentar diferentes variações do nome do campo de data
  const chaves = Object.keys(row);
  const dataEntradaAtendimento = parseDataBR(
    row['Data de entrada\n Atendimento'] || 
    row['Data de entrada Atendimento'] ||
    row['Data de entrada'] ||
    row[chaves.find(k => k.includes('Data de entrada'))] ||
    row[chaves[0]] || // Primeira coluna
    ''
  ) || new Date();
  
  // A segunda coluna pode ser a data de entrada N2 ou um número
  // Tentar parsear como data primeiro
  const segundaColuna = row[chaves[1]] || '';
  let dataEntradaN2 = parseDataBR(segundaColuna);
  
  // Se não for uma data válida, usar a primeira data
  if (!dataEntradaN2) {
    dataEntradaN2 = dataEntradaAtendimento;
  }
  
  const finalizadoEm = parseDataBR(row['Finalizado em '] || row['Finalizado em'] || '') || null;
  
  // Buscar nome e CPF - podem estar em diferentes colunas
  const nome = (row['Nome completo'] || row['Nome'] || '').trim();
  const cpf = (row['CPF'] || '').replace(/\D/g, '');
  
  return {
    nome: nome,
    cpf: cpf,
    telefones: converterTelefones(row['Telefone'] || ''),
    email: '',
    observacoes: (row['Observações'] || row['Observacoes'] || '').trim(),
    status: finalizadoEm ? 'resolvido' : 'em-andamento',
    responsavel: (row['Responsável'] || row['Responsavel'] || '').trim(),
    userEmail: '',
    
    // Campos específicos OUVIDORIA/N2
    dataEntradaAtendimento: dataEntradaAtendimento,
    dataEntradaN2: dataEntradaN2,
    mes: (row['Mês'] || row['Mes'] || '').trim(),
    motivoReduzido: (row['Motivo reduzido'] || row['Motivo reduzido'] || '').trim(),
    
    // Campos compartilhados
    tentativasContato: converterTentativas(
      row['1ª tentativa'] || row['1 tentativa'] || '',
      row['2ª tentativa'] || row['2 tentativa'] || '',
      row['3ª tentativa (BACEN)'] || row['3 tentativa (BACEN)'] || row['3ª tentativa'] || ''
    ),
    acionouCentral: converterBoolean(
      row['Acionou a central? \nMesmo motivo \nBACEN'] || 
      row['Acionou a central? Mesmo motivo BACEN'] ||
      row['Acionou a central?'] ||
      ''
    ),
    protocolosCentral: converterProtocolos(row['Protocolos Central (incluir todos)'] || row['Protocolos Central'] || ''),
    n2SegundoNivel: converterBoolean(row['N2 Portabilidade? '] || row['N2 Portabilidade?'] || ''),
    protocolosN2: [],
    reclameAqui: converterBoolean(row['Reclame Aqui'] || ''),
    protocolosReclameAqui: [],
    procon: converterBoolean(row['Procon? '] || row['Procon?'] || ''),
    protocolosProcon: [],
    protocolosSemAcionamento: '',
    pixLiberado: ['Liberado', 'Excluído', 'Solicitada'].includes(converterPixStatus(row['PIX liberado?'] || row['PIX liberado'] || '')),
    statusContratoQuitado: converterBoolean(row['Aceitou liquidação Antecipada?'] || row['Aceitou liquidacao Antecipada?'] || ''),
    statusContratoAberto: !converterBoolean(row['Aceitou liquidação Antecipada?'] || row['Aceitou liquidacao Antecipada?'] || ''),
    casosCriticos: converterBoolean(row['Casos críticos'] || row['Casos criticos'] || ''),
    finalizadoEm: finalizadoEm,
    idSecao: '',
    deletada: false,
    deletedAt: null,
    createdAt: dataEntradaAtendimento,
    updatedAt: finalizadoEm || dataEntradaAtendimento
  };
}

/**
 * Parser CSV simples que lida com campos entre aspas
 */
function parseCSVLine(line) {
  const valores = [];
  let valorAtual = '';
  let dentroAspas = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const proxChar = line[i + 1];
    
    if (char === '"') {
      if (dentroAspas && proxChar === '"') {
        // Aspas duplas dentro de campo = aspas literal
        valorAtual += '"';
        i++; // Pular próxima aspas
      } else {
        // Toggle dentroAspas
        dentroAspas = !dentroAspas;
      }
    } else if (char === ',' && !dentroAspas) {
      // Vírgula fora de aspas = separador de campo
      valores.push(valorAtual.trim());
      valorAtual = '';
    } else {
      valorAtual += char;
    }
  }
  
  // Adicionar último valor
  valores.push(valorAtual.trim());
  
  return valores;
}

/**
 * Ler arquivo CSV e converter para array de objetos
 * Lida com campos que contêm quebras de linha dentro de aspas
 */
function lerCSV(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    return [];
  }
  
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
  
  // Processar CSV considerando aspas e quebras de linha
  const linhas = [];
  let linhaAtual = '';
  let dentroAspas = false;
  
  for (let i = 0; i < conteudo.length; i++) {
    const char = conteudo[i];
    const proxChar = conteudo[i + 1];
    
    if (char === '"') {
      if (dentroAspas && proxChar === '"') {
        // Aspas duplas dentro de campo = aspas literal
        linhaAtual += '"';
        i++; // Pular próxima aspas
      } else {
        // Toggle dentroAspas
        dentroAspas = !dentroAspas;
        linhaAtual += char;
      }
    } else if ((char === '\n' || char === '\r') && !dentroAspas) {
      // Quebra de linha fora de aspas = fim de linha
      if (linhaAtual.trim() !== '') {
        linhas.push(linhaAtual);
      }
      linhaAtual = '';
      // Pular \r\n
      if (char === '\r' && proxChar === '\n') {
        i++;
      }
    } else {
      linhaAtual += char;
    }
  }
  
  // Adicionar última linha se houver
  if (linhaAtual.trim() !== '') {
    linhas.push(linhaAtual);
  }
  
  if (linhas.length < 2) {
    console.log(`⚠️  Arquivo vazio ou sem dados: ${caminhoArquivo}`);
    return [];
  }
  
  // Primeira linha são os cabeçalhos
  const cabecalhos = parseCSVLine(linhas[0]).map(h => h.replace(/^"|"$/g, '').trim().replace(/\n/g, ' '));
  
  // Processar linhas de dados
  const dados = [];
  for (let i = 1; i < linhas.length; i++) {
    const valores = parseCSVLine(linhas[i]);
    const objeto = {};
    
    cabecalhos.forEach((cabecalho, index) => {
      let valor = valores[index] || '';
      // Remover aspas externas e normalizar quebras de linha
      valor = valor.replace(/^"|"$/g, '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
      objeto[cabecalho] = valor;
    });
    
    dados.push(objeto);
  }
  
  return dados;
}

/**
 * Verificar se caso já existe no MongoDB
 */
async function verificarDuplicata(collection, documentoConvertido) {
  const cpfLimpo = documentoConvertido.cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) {
    return { existe: false, motivo: 'cpf_invalido' };
  }
  
  // Estratégia 1: Verificar por CPF + nome + data de entrada (±3 dias)
  const dataEntrada = documentoConvertido.dataEntrada || documentoConvertido.dataEntradaAtendimento || documentoConvertido.createdAt;
  if (dataEntrada) {
    const existe = await collection.findOne({
      cpf: cpfLimpo,
      nome: documentoConvertido.nome,
      $or: [
        { dataEntrada: { $gte: new Date(dataEntrada.getTime() - 259200000), $lte: new Date(dataEntrada.getTime() + 259200000) } },
        { dataEntradaAtendimento: { $gte: new Date(dataEntrada.getTime() - 259200000), $lte: new Date(dataEntrada.getTime() + 259200000) } },
        { createdAt: { $gte: new Date(dataEntrada.getTime() - 259200000), $lte: new Date(dataEntrada.getTime() + 259200000) } }
      ]
    });
    
    if (existe) {
      return { existe: true, motivo: 'cpf+nome+data' };
    }
  }
  
  // Estratégia 2: Verificar por CPF + motivo reduzido + data (±5 dias)
  if (documentoConvertido.motivoReduzido) {
    const dataEntrada = documentoConvertido.dataEntrada || documentoConvertido.dataEntradaAtendimento || documentoConvertido.createdAt;
    if (dataEntrada) {
      const existe = await collection.findOne({
        cpf: cpfLimpo,
        motivoReduzido: documentoConvertido.motivoReduzido,
        $or: [
          { dataEntrada: { $gte: new Date(dataEntrada.getTime() - 432000000), $lte: new Date(dataEntrada.getTime() + 432000000) } },
          { dataEntradaAtendimento: { $gte: new Date(dataEntrada.getTime() - 432000000), $lte: new Date(dataEntrada.getTime() + 432000000) } },
          { createdAt: { $gte: new Date(dataEntrada.getTime() - 432000000), $lte: new Date(dataEntrada.getTime() + 432000000) } }
        ]
      });
      
      if (existe) {
        return { existe: true, motivo: 'cpf+motivo+data' };
      }
    }
  }
  
  return { existe: false };
}

/**
 * Processar e sincronizar reclamações do CSV
 */
async function sincronizarCSV(client, tipo, caminhoCSV, converter) {
  console.log(`\n📂 Sincronizando ${tipo.toUpperCase()}...`);
  
  // Ler CSV
  const dadosCSV = lerCSV(caminhoCSV);
  
  if (dadosCSV.length === 0) {
    console.log(`   ⏭️  Nenhum dado para processar`);
    return { processadas: 0, inseridas: 0, duplicatas: 0, erros: 0 };
  }
  
  console.log(`   ✅ ${dadosCSV.length} registros lidos do CSV`);
  
  const db = client.db(DATABASE_NAME);
  const collectionName = tipo === 'BACEN' ? 'reclamacoes_bacen' : 'reclamacoes_n2Pix';
  const collection = db.collection(collectionName);
  
  // Carregar todos os CPFs existentes para comparação rápida
  console.log(`   📥 Carregando dados existentes do MongoDB...`);
  const existentes = await collection.find({}).toArray();
  console.log(`   ✅ ${existentes.length} registros existentes no MongoDB`);
  
  // Criar índice rápido por CPF + nome + data
  const indiceExistentes = new Map();
  existentes.forEach(doc => {
    const cpf = doc.cpf || '';
    const nome = (doc.nome || '').toLowerCase().trim();
    const data = doc.dataEntrada || doc.dataEntradaAtendimento || doc.createdAt;
    if (data) {
      const chave = `${cpf}_${nome}_${data.toISOString().split('T')[0]}`;
      indiceExistentes.set(chave, true);
    }
  });
  
  let processadas = 0;
  let inseridas = 0;
  let duplicatas = 0;
  let erros = 0;
  
  for (const row of dadosCSV) {
    try {
      processadas++;
      
      const documentoConvertido = converter(row);
      
      // Validar campos obrigatórios
      if (!documentoConvertido.nome || !documentoConvertido.cpf) {
        console.log(`   ⚠️  Registro ${processadas} ignorado: falta nome ou CPF`);
        erros++;
        continue;
      }
      
      // Validar CPF (deve ter 11 dígitos)
      const cpfLimpo = documentoConvertido.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        console.log(`   ⚠️  Registro ${processadas} ignorado: CPF inválido (${cpfLimpo.length} dígitos)`);
        erros++;
        continue;
      }
      
      // Atualizar CPF para formato limpo
      documentoConvertido.cpf = cpfLimpo;
      
      // Verificar duplicata usando índice rápido
      const dataEntrada = documentoConvertido.dataEntrada || documentoConvertido.dataEntradaAtendimento || documentoConvertido.createdAt;
      const nomeLower = documentoConvertido.nome.toLowerCase().trim();
      const chave = `${cpfLimpo}_${nomeLower}_${dataEntrada.toISOString().split('T')[0]}`;
      
      if (indiceExistentes.has(chave)) {
        if (processadas % 100 === 0) {
          process.stdout.write(`   Verificados: ${processadas}...\r`);
        }
        duplicatas++;
        continue;
      }
      
      // Verificação adicional mais detalhada
      const duplicata = await verificarDuplicata(collection, documentoConvertido);
      
      if (duplicata.existe) {
        duplicatas++;
        continue;
      }
      
      // Inserir novo caso
      if (!DRY_RUN) {
        await collection.insertOne(documentoConvertido);
        inseridas++;
        
        // Adicionar ao índice para evitar duplicatas no mesmo batch
        indiceExistentes.set(chave, true);
        
        if (inseridas % 10 === 0) {
          console.log(`   ✓ ${inseridas} novos casos inseridos...`);
        }
      } else {
        inseridas++;
        console.log(`   [DRY-RUN] Inseriria: ${documentoConvertido.nome} (CPF: ${cpfLimpo.substring(0, 3)}***)`);
      }
    } catch (error) {
      erros++;
      console.error(`   ❌ Erro ao processar registro ${processadas}:`, error.message);
    }
  }
  
  console.log(`\n✅ ${tipo.toUpperCase()}: ${processadas} processadas | ${inseridas} novas | ${duplicatas} duplicatas | ${erros} erros`);
  return { processadas, inseridas, duplicatas, erros };
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando sincronização CSV → MongoDB (Apenas Novos Casos)...');
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'SINCRONIZAÇÃO REAL'}`);
  console.log('');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGO_ENV não configurada');
    process.exit(1);
  }
  
  // Verificar se arquivos existem
  if (!fs.existsSync(CSV_BACEN)) {
    console.error(`❌ Arquivo CSV BACEN não encontrado: ${CSV_BACEN}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(CSV_OUVIDORIA)) {
    console.error(`❌ Arquivo CSV OUVIDORIA não encontrado: ${CSV_OUVIDORIA}`);
    process.exit(1);
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const resultados = {
      bacen: { processadas: 0, inseridas: 0, duplicatas: 0, erros: 0 },
      ouvidoria: { processadas: 0, inseridas: 0, duplicatas: 0, erros: 0 }
    };
    
    // Sincronizar BACEN
    resultados.bacen = await sincronizarCSV(client, 'BACEN', CSV_BACEN, converterReclamacaoBacen);
    
    // Sincronizar OUVIDORIA
    resultados.ouvidoria = await sincronizarCSV(client, 'OUVIDORIA', CSV_OUVIDORIA, converterReclamacaoOuvidoria);
    
    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA SINCRONIZAÇÃO');
    console.log('='.repeat(70));
    console.log(`BACEN:      ${resultados.bacen.processadas} processadas | ${resultados.bacen.inseridas} novas | ${resultados.bacen.duplicatas} duplicatas | ${resultados.bacen.erros} erros`);
    console.log(`OUVIDORIA:  ${resultados.ouvidoria.processadas} processadas | ${resultados.ouvidoria.inseridas} novas | ${resultados.ouvidoria.duplicatas} duplicatas | ${resultados.ouvidoria.erros} erros`);
    console.log('='.repeat(70));
    
    const totalProcessadas = resultados.bacen.processadas + resultados.ouvidoria.processadas;
    const totalInseridas = resultados.bacen.inseridas + resultados.ouvidoria.inseridas;
    const totalDuplicatas = resultados.bacen.duplicatas + resultados.ouvidoria.duplicatas;
    const totalErros = resultados.bacen.erros + resultados.ouvidoria.erros;
    
    console.log(`TOTAL:      ${totalProcessadas} processadas | ${totalInseridas} novas | ${totalDuplicatas} duplicatas | ${totalErros} erros`);
    console.log('='.repeat(70));
    
    if (DRY_RUN) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhum dado foi inserido realmente');
      console.log('   Execute sem --dry-run para realizar a sincronização real\n');
    } else {
      console.log('\n✅ Sincronização concluída com sucesso!\n');
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
  converterReclamacaoBacen,
  converterReclamacaoOuvidoria,
  lerCSV,
  sincronizarCSV
};

/**
 * Script de Teste - Cálculo de Prazo Médio
 * VERSION: v1.0.0 | DATE: 2026-02-26 | AUTHOR: VeloHub Development Team
 * 
 * Este script testa o cálculo de Prazo Médio usando dados reais do MongoDB
 * Replica a mesma lógica do dashboard.js para identificar problemas no cálculo
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

// Collections a serem testadas
const COLLECTIONS = [
  'reclamacoes_bacen',
  'reclamacoes_n2Pix',
  'reclamacoes_reclameAqui',
  'reclamacoes_procon',
  'reclamacoes_judicial'
];

/**
 * Formatar número com 1 casa decimal
 */
function formatarNumero(num) {
  return parseFloat(num.toFixed(1));
}

/**
 * Calcular diferença em dias entre duas datas
 */
function calcularDias(inicio, fim) {
  const diffMs = fim.getTime() - inicio.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Analisar uma collection específica
 */
async function analisarCollection(db, collectionName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 ANÁLISE: ${collectionName}`);
  console.log(`${'='.repeat(80)}\n`);

  const collection = db.collection(collectionName);
  
  // Buscar todos os registros
  const todos = await collection.find({}).toArray();
  const totalRegistros = todos.length;
  
  console.log(`📋 Total de registros na collection: ${totalRegistros}`);

  // Contar resolvidos
  const resolvidos = todos.filter(r => r.Finalizado?.Resolvido === true);
  const totalResolvidos = resolvidos.length;
  
  console.log(`✅ Registros com Finalizado.Resolvido === true: ${totalResolvidos}`);

  // Contar com ambas as datas
  const comAmbasDatas = resolvidos.filter(r => {
    return r.createdAt && r.Finalizado?.dataResolucao;
  });
  const totalComAmbasDatas = comAmbasDatas.length;
  
  console.log(`📅 Registros com ambas as datas (createdAt e dataResolucao): ${totalComAmbasDatas}`);

  // Validar que dataResolucao >= createdAt
  const comDatasValidas = comAmbasDatas.filter(r => {
    const inicio = new Date(r.createdAt);
    const fim = new Date(r.Finalizado.dataResolucao);
    return fim >= inicio;
  });
  const totalComDatasValidas = comDatasValidas.length;
  
  console.log(`✓ Registros com dataResolucao >= createdAt: ${totalComDatasValidas}`);

  // Calcular diferenças em dias para cada registro válido
  const detalhesRegistros = comDatasValidas.map((r, index) => {
    const inicio = new Date(r.createdAt);
    const fim = new Date(r.Finalizado.dataResolucao);
    const dias = calcularDias(inicio, fim);
    
    return {
      index: index + 1,
      _id: r._id.toString().substring(0, 8) + '...',
      createdAt: inicio.toISOString().split('T')[0],
      dataResolucao: fim.toISOString().split('T')[0],
      dias: dias,
      valido: dias >= 0 && dias <= 365
    };
  });

  // Filtrar apenas registros válidos (0 <= dias <= 365)
  const registrosValidos = detalhesRegistros.filter(r => r.valido);
  const registrosInvalidos = detalhesRegistros.filter(r => !r.valido);
  
  console.log(`\n📊 Registros válidos (0 <= dias <= 365): ${registrosValidos.length}`);
  console.log(`⚠️  Registros inválidos (dias < 0 ou > 365): ${registrosInvalidos.length}`);

  // Mostrar alguns exemplos de registros válidos
  if (registrosValidos.length > 0) {
    console.log(`\n📝 Exemplos de registros válidos (primeiros 5):`);
    registrosValidos.slice(0, 5).forEach(r => {
      console.log(`   ${r.index}. ID: ${r._id} | ${r.createdAt} → ${r.dataResolucao} = ${formatarNumero(r.dias)} dias`);
    });
  }

  // Mostrar registros inválidos se houver
  if (registrosInvalidos.length > 0) {
    console.log(`\n⚠️  Registros inválidos encontrados:`);
    registrosInvalidos.forEach(r => {
      const motivo = r.dias < 0 ? 'dataResolucao < createdAt' : 'dias > 365';
      console.log(`   ${r.index}. ID: ${r._id} | ${r.createdAt} → ${r.dataResolucao} = ${formatarNumero(r.dias)} dias (${motivo})`);
    });
  }

  // Calcular soma total de dias (apenas válidos)
  const somaDias = registrosValidos.reduce((acc, r) => acc + r.dias, 0);
  const quantidadeValida = registrosValidos.length;
  
  console.log(`\n📈 Cálculo da média:`);
  console.log(`   Soma total de dias: ${somaDias.toFixed(2)}`);
  console.log(`   Quantidade válida: ${quantidadeValida}`);
  
  let mediaPrazo = 0;
  if (quantidadeValida > 0) {
    const mediaExata = somaDias / quantidadeValida;
    mediaPrazo = formatarNumero(mediaExata);
    
    console.log(`   Média exata: ${mediaExata.toFixed(6)}`);
    console.log(`   Média formatada (1 casa decimal): ${mediaPrazo}`);
  } else {
    console.log(`   ⚠️  Não é possível calcular média (quantidade válida = 0)`);
  }

  return {
    collectionName,
    totalRegistros,
    totalResolvidos,
    totalComAmbasDatas,
    totalComDatasValidas,
    quantidadeValida,
    somaDias,
    mediaPrazo,
    detalhesRegistros: detalhesRegistros.slice(0, 10) // Retornar apenas primeiros 10 para resumo
  };
}

/**
 * Função principal
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TESTE DE CÁLCULO DE PRAZO MÉDIO');
  console.log('='.repeat(80));
  console.log(`\n📌 Database: ${DATABASE_NAME}`);
  console.log(`📌 Collections: ${COLLECTIONS.join(', ')}\n`);

  if (!MONGODB_URI) {
    console.error('❌ Erro: MONGO_ENV não configurado');
    console.error('   Certifique-se de ter um arquivo .env com MONGO_ENV definido');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
  });

  try {
    console.log('🔌 Conectando ao MongoDB...');
    await client.connect();
    console.log('✅ Conectado ao MongoDB!\n');

    const db = client.db(DATABASE_NAME);

    // Analisar cada collection
    const resultados = [];
    for (const collectionName of COLLECTIONS) {
      try {
        const resultado = await analisarCollection(db, collectionName);
        resultados.push(resultado);
      } catch (error) {
        console.error(`❌ Erro ao analisar ${collectionName}:`, error.message);
        resultados.push({
          collectionName,
          erro: error.message
        });
      }
    }

    // Resumo consolidado
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RESUMO CONSOLIDADO');
    console.log(`${'='.repeat(80)}\n`);

    const totalGeral = resultados.reduce((sum, r) => sum + (r.totalRegistros || 0), 0);
    const totalResolvidosGeral = resultados.reduce((sum, r) => sum + (r.totalResolvidos || 0), 0);
    const totalComAmbasDatasGeral = resultados.reduce((sum, r) => sum + (r.totalComAmbasDatas || 0), 0);
    const totalComDatasValidasGeral = resultados.reduce((sum, r) => sum + (r.totalComDatasValidas || 0), 0);
    const quantidadeValidaGeral = resultados.reduce((sum, r) => sum + (r.quantidadeValida || 0), 0);
    const somaDiasGeral = resultados.reduce((sum, r) => sum + (r.somaDias || 0), 0);

    console.log(`📋 Total geral de registros: ${totalGeral}`);
    console.log(`✅ Total resolvidos: ${totalResolvidosGeral}`);
    console.log(`📅 Total com ambas as datas: ${totalComAmbasDatasGeral}`);
    console.log(`✓ Total com datas válidas: ${totalComDatasValidasGeral}`);
    console.log(`📊 Quantidade válida para cálculo: ${quantidadeValidaGeral}`);
    console.log(`📈 Soma total de dias: ${somaDiasGeral.toFixed(2)}`);

    // Calcular média geral (mesma lógica do dashboard.js)
    let mediaPrazoGeral = 0;
    if (quantidadeValidaGeral > 0) {
      const mediaExataGeral = somaDiasGeral / quantidadeValidaGeral;
      mediaPrazoGeral = formatarNumero(mediaExataGeral);
      
      console.log(`\n🎯 MÉDIA GERAL (mesma lógica do dashboard.js):`);
      console.log(`   Média exata: ${mediaExataGeral.toFixed(6)}`);
      console.log(`   Média formatada (1 casa decimal): ${mediaPrazoGeral}`);
    } else {
      console.log(`\n⚠️  Não é possível calcular média geral (quantidade válida = 0)`);
    }

    // Tabela resumo por collection
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 RESUMO POR COLLECTION');
    console.log(`${'='.repeat(80)}\n`);
    console.log('Collection'.padEnd(30) + 'Total'.padEnd(10) + 'Resolvidos'.padEnd(12) + 'Com Datas'.padEnd(12) + 'Válidos'.padEnd(10) + 'Média');
    console.log('-'.repeat(80));
    
    resultados.forEach(r => {
      if (r.erro) {
        console.log(`${r.collectionName.padEnd(30)} ERRO: ${r.erro}`);
      } else {
        const media = r.mediaPrazo > 0 ? `${r.mediaPrazo} dias` : 'N/A';
        console.log(
          r.collectionName.padEnd(30) +
          String(r.totalRegistros).padEnd(10) +
          String(r.totalResolvidos).padEnd(12) +
          String(r.totalComAmbasDatas).padEnd(12) +
          String(r.quantidadeValida).padEnd(10) +
          media
        );
      }
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ TESTE CONCLUÍDO');
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexão MongoDB fechada');
  }
}

// Executar
main().catch(console.error);

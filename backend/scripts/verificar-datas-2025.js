/**
 * Script de Verificação de Datas de Casos Criados em 2025
 * VERSION: v1.1.0 | DATE: 2026-02-26 | AUTHOR: VeloHub Development Team
 * 
 * Este script busca casos criados em 2025 nas collections reclamacoes_bacen e reclamacoes_n2Pix,
 * mostra informações sobre cada caso, agrupa por mês de criação e estatísticas de datas mais comuns.
 */

const { MongoClient } = require('mongodb');

// String de conexão MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';

if (!MONGODB_URI) {
  console.error('❌ Erro: MONGO_ENV não configurada');
  console.error('   Configure a variável de ambiente MONGO_ENV antes de executar o script');
  process.exit(1);
}

/**
 * Conecta ao MongoDB
 */
const connectToMongo = async () => {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    return client;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    throw error;
  }
};

/**
 * Calcula diferença em dias entre duas datas
 */
const calcularDiferencaDias = (dataInicio, dataFim) => {
  if (!dataInicio || !dataFim) return null;
  
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return null;
  
  const diffMs = fim.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDias;
};

/**
 * Formata data para exibição
 */
const formatarData = (data) => {
  if (!data) return 'N/A';
  
  const d = new Date(data);
  if (isNaN(d.getTime())) return 'Data inválida';
  
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtém o mês/ano de uma data no formato "MM/YYYY"
 */
const obterMesAno = (data) => {
  if (!data) return null;
  
  const d = new Date(data);
  if (isNaN(d.getTime())) return null;
  
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  
  return `${mes}/${ano}`;
};

/**
 * Obtém o nome do mês em português
 */
const obterNomeMes = (mes) => {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes - 1] || 'Desconhecido';
};

/**
 * Analisa casos criados em 2025 de uma collection
 */
const analisarCollection = async (db, collectionName) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ANALISANDO COLLECTION: ${collectionName}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const collection = db.collection(collectionName);
    
    // Definir intervalo de 2025 (01/01/2025 00:00:00 até 31/12/2025 23:59:59)
    const inicio2025 = new Date('2025-01-01T00:00:00.000Z');
    const fim2025 = new Date('2025-12-31T23:59:59.999Z');
    
    // Buscar casos criados em 2025
    const filtro = {
      createdAt: {
        $gte: inicio2025,
        $lte: fim2025
      }
    };
    
    const casos = await collection.find(filtro).sort({ createdAt: 1 }).toArray();
    
    console.log(`📊 Total de casos criados em 2025: ${casos.length}\n`);
    
    if (casos.length === 0) {
      console.log('⚠️  Nenhum caso encontrado para 2025\n');
      return {
        collectionName,
        total: 0,
        comDataResolucao: 0,
        semDataResolucao: 0,
        resolvidos: 0,
        casosPorMes: {},
        frequenciaDatasResolucao: {},
        casos: []
      };
    }
    
    // Estatísticas
    let comDataResolucao = 0;
    let semDataResolucao = 0;
    let resolvidos = 0;
    const frequenciaDatasResolucao = new Map(); // Map para contar frequência de datas
    const casosPorMes = new Map(); // Agrupar casos por mês de criação
    
    // Processar cada caso
    console.log('📝 DETALHES DOS CASOS:\n');
    casos.forEach((caso, index) => {
      const id = caso._id.toString().substring(0, 8); // Primeiros 8 caracteres
      const createdAt = caso.createdAt;
      const dataResolucao = caso.Finalizado?.dataResolucao || null;
      const resolvido = caso.Finalizado?.Resolvido || false;
      
      // Calcular diferença em dias
      const diferencaDias = calcularDiferencaDias(createdAt, dataResolucao);
      
      // Obter mês/ano de criação
      const mesAno = obterMesAno(createdAt);
      
      // Atualizar estatísticas
      if (dataResolucao) {
        comDataResolucao++;
        // Contar frequência de datas de resolução (apenas data, sem hora)
        const dataResolucaoFormatada = new Date(dataResolucao).toISOString().split('T')[0];
        frequenciaDatasResolucao.set(
          dataResolucaoFormatada,
          (frequenciaDatasResolucao.get(dataResolucaoFormatada) || 0) + 1
        );
      } else {
        semDataResolucao++;
      }
      
      if (resolvido) {
        resolvidos++;
      }
      
      // Agrupar por mês
      if (mesAno) {
        if (!casosPorMes.has(mesAno)) {
          casosPorMes.set(mesAno, []);
        }
        casosPorMes.get(mesAno).push({
          id,
          createdAt,
          dataResolucao,
          resolvido,
          diferencaDias
        });
      }
      
      // Exibir informações do caso
      console.log(`${index + 1}. ID: ${id}...`);
      console.log(`   📅 Data de criação: ${formatarData(createdAt)}`);
      console.log(`   ✅ Data de resolução: ${dataResolucao ? formatarData(dataResolucao) : 'N/A'}`);
      console.log(`   ⏱️  Diferença em dias: ${diferencaDias !== null ? diferencaDias + ' dias' : 'N/A'}`);
      console.log(`   🎯 Resolvido: ${resolvido ? 'Sim' : 'Não'}`);
      console.log('');
    });
    
    // Estatísticas agrupadas
    console.log(`${'='.repeat(80)}`);
    console.log(`📊 ESTATÍSTICAS - ${collectionName}`);
    console.log(`${'='.repeat(80)}\n`);
    console.log(`Total de casos criados em 2025: ${casos.length}`);
    console.log(`Casos com data de resolução: ${comDataResolucao} (${casos.length > 0 ? ((comDataResolucao / casos.length) * 100).toFixed(1) : 0}%)`);
    console.log(`Casos sem data de resolução: ${semDataResolucao} (${casos.length > 0 ? ((semDataResolucao / casos.length) * 100).toFixed(1) : 0}%)`);
    console.log(`Casos resolvidos: ${resolvidos} (${casos.length > 0 ? ((resolvidos / casos.length) * 100).toFixed(1) : 0}%)`);
    
    // Agrupamento por mês de criação
    if (casosPorMes.size > 0) {
      console.log(`\n📅 CASOS AGRUPADOS POR MÊS DE CRIAÇÃO:`);
      console.log(`${'-'.repeat(80)}`);
      
      // Ordenar meses cronologicamente
      const mesesOrdenados = Array.from(casosPorMes.keys()).sort((a, b) => {
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        if (anoA !== anoB) return anoA - anoB;
        return mesA - mesB;
      });
      
      mesesOrdenados.forEach(mesAno => {
        const casosDoMes = casosPorMes.get(mesAno);
        const [mes, ano] = mesAno.split('/');
        const nomeMes = obterNomeMes(parseInt(mes));
        const comData = casosDoMes.filter(c => c.dataResolucao).length;
        const semData = casosDoMes.filter(c => !c.dataResolucao).length;
        const resolvidosMes = casosDoMes.filter(c => c.resolvido).length;
        
        console.log(`\n   ${nomeMes}/${ano}:`);
        console.log(`      Total: ${casosDoMes.length} casos`);
        console.log(`      Com data de resolução: ${comData}`);
        console.log(`      Sem data de resolução: ${semData}`);
        console.log(`      Resolvidos: ${resolvidosMes}`);
      });
    }
    
    // Datas mais comuns de resolução
    if (frequenciaDatasResolucao.size > 0) {
      console.log(`\n📅 DATAS MAIS COMUNS DE RESOLUÇÃO:`);
      console.log(`${'-'.repeat(80)}`);
      
      // Converter Map para array e ordenar por frequência (decrescente)
      const datasOrdenadas = Array.from(frequenciaDatasResolucao.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 datas mais comuns
      
      datasOrdenadas.forEach(([data, frequencia], idx) => {
        const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
        console.log(`   ${idx + 1}. ${dataFormatada}: ${frequencia} caso(s)`);
      });
      
      if (frequenciaDatasResolucao.size > 10) {
        console.log(`   ... e mais ${frequenciaDatasResolucao.size - 10} datas diferentes`);
      }
    }
    
    return {
      collectionName,
      total: casos.length,
      comDataResolucao,
      semDataResolucao,
      resolvidos,
      casosPorMes: Object.fromEntries(casosPorMes),
      frequenciaDatasResolucao: Object.fromEntries(frequenciaDatasResolucao),
      casos: casos.map(caso => ({
        id: caso._id.toString().substring(0, 8),
        createdAt: caso.createdAt,
        dataResolucao: caso.Finalizado?.dataResolucao || null,
        resolvido: caso.Finalizado?.Resolvido || false,
        diferencaDias: calcularDiferencaDias(caso.createdAt, caso.Finalizado?.dataResolucao)
      }))
    };
    
  } catch (error) {
    console.error(`❌ Erro ao analisar ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Função principal
 */
const verificarDatas2025 = async () => {
  console.log('🚀 INICIANDO VERIFICAÇÃO DE DATAS DE CASOS CRIADOS EM 2025');
  console.log('='.repeat(80));
  
  let client;
  
  try {
    // Conectar ao MongoDB
    client = await connectToMongo();
    const db = client.db('hub_ouvidoria');
    
    // Analisar cada collection
    const resultadoBacen = await analisarCollection(db, 'reclamacoes_bacen');
    const resultadoN2Pix = await analisarCollection(db, 'reclamacoes_n2Pix');
    
    // Resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RESUMO FINAL');
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`Collection: ${resultadoBacen.collectionName}`);
    console.log(`  Total de casos criados em 2025: ${resultadoBacen.total}`);
    console.log(`  Casos com data de resolução: ${resultadoBacen.comDataResolucao}`);
    console.log(`  Casos sem data de resolução: ${resultadoBacen.semDataResolucao}`);
    console.log(`  Casos resolvidos: ${resultadoBacen.resolvidos}`);
    
    console.log(`\nCollection: ${resultadoN2Pix.collectionName}`);
    console.log(`  Total de casos criados em 2025: ${resultadoN2Pix.total}`);
    console.log(`  Casos com data de resolução: ${resultadoN2Pix.comDataResolucao}`);
    console.log(`  Casos sem data de resolução: ${resultadoN2Pix.semDataResolucao}`);
    console.log(`  Casos resolvidos: ${resultadoN2Pix.resolvidos}`);
    
    const totalGeral = resultadoBacen.total + resultadoN2Pix.total;
    const totalComDataResolucao = resultadoBacen.comDataResolucao + resultadoN2Pix.comDataResolucao;
    const totalSemDataResolucao = resultadoBacen.semDataResolucao + resultadoN2Pix.semDataResolucao;
    const totalResolvidos = resultadoBacen.resolvidos + resultadoN2Pix.resolvidos;
    
    console.log(`\n📈 TOTAL GERAL:`);
    console.log(`  Total de casos criados em 2025: ${totalGeral}`);
    console.log(`  Casos com data de resolução: ${totalComDataResolucao} (${totalGeral > 0 ? ((totalComDataResolucao / totalGeral) * 100).toFixed(1) : 0}%)`);
    console.log(`  Casos sem data de resolução: ${totalSemDataResolucao} (${totalGeral > 0 ? ((totalSemDataResolucao / totalGeral) * 100).toFixed(1) : 0}%)`);
    console.log(`  Casos resolvidos: ${totalResolvidos} (${totalGeral > 0 ? ((totalResolvidos / totalGeral) * 100).toFixed(1) : 0}%)`);
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Conexão MongoDB fechada');
    }
  }
};

// Executar se script for chamado diretamente
if (require.main === module) {
  verificarDatas2025()
    .then(() => {
      console.log('\n🎉 Verificação concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na verificação:', error.message);
      process.exit(1);
    });
}

module.exports = {
  verificarDatas2025,
  analisarCollection
};

/**
 * Script de Teste - Motivos BACEN
 * VERSION: v1.0.0 | DATE: 2026-02-27 | AUTHOR: VeloHub Development Team
 * 
 * Este script testa a agregação de motivosPorMes usando dados reais do MongoDB
 * para o período de Jan/2026 a Fev/2026, ajudando a identificar se o problema
 * está no backend (retornando dados errados) ou no frontend (usando dados errados)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

/**
 * Formatar data para exibição
 */
function formatarData(data) {
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
}

/**
 * Função principal
 */
async function testMotivosBacen() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TESTE DE MOTIVOS BACEN - Jan/2026 a Fev/2026');
  console.log('='.repeat(80));
  console.log(`\n📌 Database: ${DATABASE_NAME}`);
  console.log(`📌 Collection: reclamacoes_bacen`);
  console.log(`📌 Período: 2026-01-01 a 2026-02-29\n`);

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
    const bacenCollection = db.collection('reclamacoes_bacen');

    // Definir período: Jan/2026 a Fev/2026
    const dataInicioDate = new Date('2026-01-01T00:00:00.000Z');
    const dataFimDate = new Date('2026-02-29T23:59:59.999Z');

    console.log(`📅 Período definido:`);
    console.log(`   Início: ${formatarData(dataInicioDate)}`);
    console.log(`   Fim: ${formatarData(dataFimDate)}\n`);

    // 1. Buscar todos os registros do período
    console.log(`${'='.repeat(80)}`);
    console.log('📊 1. BUSCANDO DADOS REAIS DO PERÍODO');
    console.log(`${'='.repeat(80)}\n`);

    const todosRegistros = await bacenCollection.find({
      createdAt: { $gte: dataInicioDate, $lte: dataFimDate }
    }).toArray();

    console.log(`📋 Total de registros no período: ${todosRegistros.length}\n`);

    if (todosRegistros.length === 0) {
      console.log('⚠️  Nenhum registro encontrado para o período especificado\n');
      await client.close();
      return;
    }

    // 2. Analisar motivoReduzido
    console.log(`${'='.repeat(80)}`);
    console.log('📊 2. ANÁLISE DE motivoReduzido');
    console.log(`${'='.repeat(80)}\n`);

    const comMotivoReduzido = todosRegistros.filter(r => 
      r.motivoReduzido && r.motivoReduzido.trim() !== ''
    );
    const semMotivoReduzido = todosRegistros.length - comMotivoReduzido.length;

    console.log(`✅ Registros com motivoReduzido preenchido: ${comMotivoReduzido.length} (${((comMotivoReduzido.length / todosRegistros.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Registros sem motivoReduzido: ${semMotivoReduzido} (${((semMotivoReduzido / todosRegistros.length) * 100).toFixed(1)}%)\n`);

    // Valores únicos de motivoReduzido
    const motivosUnicos = [...new Set(
      comMotivoReduzido
        .map(r => r.motivoReduzido)
        .filter(m => m && m.trim() !== '')
    )].sort();

    console.log(`📝 Valores únicos de motivoReduzido encontrados (${motivosUnicos.length}):`);
    motivosUnicos.forEach((motivo, index) => {
      const count = comMotivoReduzido.filter(r => r.motivoReduzido === motivo).length;
      console.log(`   ${index + 1}. "${motivo}" (${count} registro${count !== 1 ? 's' : ''})`);
    });
    console.log('');

    // 3. Executar agregação motivosPorMes (mesma do backend)
    console.log(`${'='.repeat(80)}`);
    console.log('📊 3. EXECUTANDO AGREGAÇÃO motivosPorMes (mesma do backend)');
    console.log(`${'='.repeat(80)}\n`);

    const motivosPorMesBacen = await bacenCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: dataInicioDate, $lte: dataFimDate },
          motivoReduzido: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: {
            mes: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            motivo: '$motivoReduzido'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.mes': 1, '_id.motivo': 1 }
      }
    ]).toArray();

    console.log(`✅ Agregação executada com sucesso`);
    console.log(`📊 Total de grupos retornados: ${motivosPorMesBacen.length}\n`);

    // 4. Exibir estrutura dos dados retornados
    console.log(`${'='.repeat(80)}`);
    console.log('📊 4. ESTRUTURA DOS DADOS RETORNADOS PELA AGREGAÇÃO');
    console.log(`${'='.repeat(80)}\n`);

    if (motivosPorMesBacen.length > 0) {
      console.log('📋 Exemplo de estrutura (primeiro registro):');
      console.log(JSON.stringify(motivosPorMesBacen[0], null, 2));
      console.log('');

      // Agrupar por mês para melhor visualização
      const porMes = {};
      motivosPorMesBacen.forEach(item => {
        const mes = item._id.mes;
        if (!porMes[mes]) {
          porMes[mes] = [];
        }
        porMes[mes].push({
          motivo: item._id.motivo,
          count: item.count
        });
      });

      console.log('📅 Dados agrupados por mês:');
      Object.keys(porMes).sort().forEach(mes => {
        console.log(`\n   ${mes}:`);
        porMes[mes].forEach(item => {
          console.log(`      - "${item.motivo}": ${item.count} registro${item.count !== 1 ? 's' : ''}`);
        });
      });
      console.log('');
    } else {
      console.log('⚠️  Nenhum resultado retornado pela agregação\n');
    }

    // 5. Comparação com origem (Natureza)
    console.log(`${'='.repeat(80)}`);
    console.log('📊 5. COMPARAÇÃO COM origem (Natureza)');
    console.log(`${'='.repeat(80)}\n`);

    // Valores únicos de origem
    const origensUnicas = [...new Set(
      todosRegistros
        .map(r => r.origem)
        .filter(o => o && o.trim() !== '')
    )].sort();

    console.log(`📝 Valores únicos de origem encontrados (${origensUnicas.length}):`);
    origensUnicas.forEach((origem, index) => {
      const count = todosRegistros.filter(r => r.origem === origem).length;
      console.log(`   ${index + 1}. "${origem}" (${count} registro${count !== 1 ? 's' : ''})`);
    });
    console.log('');

    // Verificar se há confusão entre motivoReduzido e origem
    console.log('🔍 Verificando possível confusão entre motivoReduzido e origem:');
    const motivosQueParecemOrigem = motivosUnicos.filter(motivo => 
      origensUnicas.some(origem => 
        motivo.toLowerCase().includes(origem.toLowerCase()) ||
        origem.toLowerCase().includes(motivo.toLowerCase())
      )
    );

    if (motivosQueParecemOrigem.length > 0) {
      console.log(`   ⚠️  ATENÇÃO: Encontrados ${motivosQueParecemOrigem.length} motivo(s) que podem estar confundidos com origem:`);
      motivosQueParecemOrigem.forEach(motivo => {
        const origemSimilar = origensUnicas.find(o => 
          motivo.toLowerCase().includes(o.toLowerCase()) ||
          o.toLowerCase().includes(motivo.toLowerCase())
        );
        console.log(`      - "${motivo}" (similar a origem: "${origemSimilar}")`);
      });
    } else {
      console.log('   ✅ Nenhuma confusão aparente entre motivoReduzido e origem');
    }
    console.log('');

    // Análise cruzada: motivoReduzido vs origem
    console.log('📊 Análise cruzada (motivoReduzido x origem):');
    const analiseCruzada = {};
    
    comMotivoReduzido.forEach(registro => {
      const motivo = registro.motivoReduzido;
      const origem = registro.origem || 'N/A';
      
      if (!analiseCruzada[motivo]) {
        analiseCruzada[motivo] = {};
      }
      if (!analiseCruzada[motivo][origem]) {
        analiseCruzada[motivo][origem] = 0;
      }
      analiseCruzada[motivo][origem]++;
    });

    Object.keys(analiseCruzada).sort().forEach(motivo => {
      console.log(`\n   "${motivo}":`);
      Object.keys(analiseCruzada[motivo]).sort().forEach(origem => {
        const count = analiseCruzada[motivo][origem];
        console.log(`      - Origem "${origem}": ${count} registro${count !== 1 ? 's' : ''}`);
      });
    });
    console.log('');

    // 6. Resumo final
    console.log(`${'='.repeat(80)}`);
    console.log('📊 6. RESUMO FINAL');
    console.log(`${'='.repeat(80)}\n`);

    console.log(`📋 Total de registros no período: ${todosRegistros.length}`);
    console.log(`✅ Registros com motivoReduzido: ${comMotivoReduzido.length}`);
    console.log(`📝 Valores únicos de motivoReduzido: ${motivosUnicos.length}`);
    console.log(`📊 Grupos retornados pela agregação: ${motivosPorMesBacen.length}`);
    console.log(`📝 Valores únicos de origem: ${origensUnicas.length}`);

    // Verificar se a agregação está retornando dados corretos
    const totalNaAgregacao = motivosPorMesBacen.reduce((sum, item) => sum + item.count, 0);
    console.log(`\n🔍 Validação:`);
    console.log(`   Total de registros na agregação: ${totalNaAgregacao}`);
    console.log(`   Total de registros com motivoReduzido: ${comMotivoReduzido.length}`);
    
    if (totalNaAgregacao === comMotivoReduzido.length) {
      console.log(`   ✅ A agregação está retornando todos os registros corretamente`);
    } else {
      console.log(`   ⚠️  Diferença encontrada: ${Math.abs(totalNaAgregacao - comMotivoReduzido.length)} registro(s)`);
      console.log(`      Isso pode indicar um problema na agregação ou nos filtros`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ TESTE CONCLUÍDO');
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexão MongoDB fechada');
  }
}

// Executar
if (require.main === module) {
  testMotivosBacen()
    .then(() => {
      console.log('🎉 Teste concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro no teste:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testMotivosBacen
};

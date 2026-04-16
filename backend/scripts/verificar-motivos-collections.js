/**
 * Script de Verificação: Estrutura de motivoReduzido nas collections
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
 * Verifica como motivoReduzido está armazenado nas collections BACEN e N2Pix
 * para entender se há strings concatenadas ou arrays
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

async function main() {
  let client;
  
  try {
    console.log('🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    
    // Verificar BACEN
    console.log('='.repeat(60));
    console.log('📊 VERIFICANDO COLLECTION: reclamacoes_bacen');
    console.log('='.repeat(60));
    
    const bacenCollection = db.collection('reclamacoes_bacen');
    const bacenSamples = await bacenCollection.find({
      motivoReduzido: { $exists: true, $ne: null, $ne: '' }
    }).limit(20).toArray();
    
    console.log(`\nTotal de amostras verificadas: ${bacenSamples.length}\n`);
    
    const tiposBacen = {
      string: 0,
      array: 0,
      concatenados: []
    };
    
    bacenSamples.forEach((doc, index) => {
      const motivo = doc.motivoReduzido;
      const tipo = typeof motivo;
      const isArray = Array.isArray(motivo);
      
      if (isArray) {
        tiposBacen.array++;
      } else if (tipo === 'string') {
        tiposBacen.string++;
        // Verificar se parece concatenado (sem espaços entre palavras que deveriam ter)
        if (motivo && motivo.length > 20 && !motivo.includes('/') && !motivo.includes(',') && !motivo.includes(' ')) {
          tiposBacen.concatenados.push({ cpf: doc.cpf, motivo });
        }
      }
      
      if (index < 5) {
        console.log(`  ${index + 1}. CPF: ${doc.cpf}`);
        console.log(`     Tipo: ${isArray ? 'Array' : tipo}`);
        console.log(`     Valor: ${JSON.stringify(motivo)}`);
        console.log('');
      }
    });
    
    console.log('\n📈 Estatísticas BACEN:');
    console.log(`   String: ${tiposBacen.string}`);
    console.log(`   Array: ${tiposBacen.array}`);
    console.log(`   Possíveis concatenados: ${tiposBacen.concatenados.length}`);
    if (tiposBacen.concatenados.length > 0) {
      console.log('\n   Exemplos de possíveis concatenados:');
      tiposBacen.concatenados.slice(0, 5).forEach(item => {
        console.log(`     CPF ${item.cpf}: "${item.motivo}"`);
      });
    }
    
    // Verificar N2Pix
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICANDO COLLECTION: reclamacoes_n2Pix');
    console.log('='.repeat(60));
    
    const n2Collection = db.collection('reclamacoes_n2Pix');
    const n2Samples = await n2Collection.find({
      motivoReduzido: { $exists: true, $ne: null }
    }).limit(20).toArray();
    
    console.log(`\nTotal de amostras verificadas: ${n2Samples.length}\n`);
    
    const tiposN2 = {
      string: 0,
      array: 0,
      concatenados: [],
      arraysComConcatenados: []
    };
    
    n2Samples.forEach((doc, index) => {
      const motivo = doc.motivoReduzido;
      const tipo = typeof motivo;
      const isArray = Array.isArray(motivo);
      
      if (isArray) {
        tiposN2.array++;
        // Verificar se algum item do array parece concatenado
        const concatenadosNoArray = motivo.filter(m => {
          if (typeof m !== 'string') return false;
          return m.length > 20 && !m.includes('/') && !m.includes(',') && !m.includes(' ') && 
                 (m.toLowerCase().includes('chavepix') || m.toLowerCase().includes('pix'));
        });
        if (concatenadosNoArray.length > 0) {
          tiposN2.arraysComConcatenados.push({ cpf: doc.cpf, motivos: motivo, concatenados: concatenadosNoArray });
        }
      } else if (tipo === 'string') {
        tiposN2.string++;
        // Verificar se parece concatenado
        if (motivo && motivo.length > 20 && !motivo.includes('/') && !motivo.includes(',') && !motivo.includes(' ')) {
          tiposN2.concatenados.push({ cpf: doc.cpf, motivo });
        }
      }
      
      if (index < 5) {
        console.log(`  ${index + 1}. CPF: ${doc.cpf}`);
        console.log(`     Tipo: ${isArray ? 'Array' : tipo}`);
        console.log(`     Valor: ${JSON.stringify(motivo)}`);
        console.log('');
      }
    });
    
    console.log('\n📈 Estatísticas N2Pix:');
    console.log(`   String: ${tiposN2.string}`);
    console.log(`   Array: ${tiposN2.array}`);
    console.log(`   Strings concatenadas: ${tiposN2.concatenados.length}`);
    console.log(`   Arrays com itens concatenados: ${tiposN2.arraysComConcatenados.length}`);
    
    if (tiposN2.concatenados.length > 0) {
      console.log('\n   Exemplos de strings concatenadas:');
      tiposN2.concatenados.slice(0, 5).forEach(item => {
        console.log(`     CPF ${item.cpf}: "${item.motivo}"`);
      });
    }
    
    if (tiposN2.arraysComConcatenados.length > 0) {
      console.log('\n   Exemplos de arrays com itens concatenados:');
      tiposN2.arraysComConcatenados.slice(0, 5).forEach(item => {
        console.log(`     CPF ${item.cpf}:`);
        console.log(`       Array completo: ${JSON.stringify(item.motivos)}`);
        console.log(`       Itens concatenados: ${JSON.stringify(item.concatenados)}`);
      });
    }
    
    // Buscar exemplos específicos de motivos concatenados
    console.log('\n' + '='.repeat(60));
    console.log('🔍 BUSCANDO EXEMPLOS ESPECÍFICOS DE CONCATENAÇÃO');
    console.log('='.repeat(60));
    
    // Buscar motivos que contêm padrões específicos vistos no relatório
    const padroesConcatenados = [
      'Chave PixAbatimento Juros',
      'Chave PixEncerramento de Conta',
      'Chave PixNão Recebeu Restituição',
      'Chave PixEmpréstimo',
      'Contestação de ValoresChave Pix',
      'FraudeExclusão de Conta',
      'Chave PixExclusão de Conta',
      'Chave PixContestação de Valores'
    ];
    
    console.log('\n🔍 Buscando padrões específicos no N2Pix...\n');
    
    for (const padrao of padroesConcatenados) {
      // Buscar como string
      const comoString = await n2Collection.find({
        motivoReduzido: padrao
      }).limit(3).toArray();
      
      // Buscar em arrays
      const emArray = await n2Collection.find({
        motivoReduzido: { $in: [padrao] }
      }).limit(3).toArray();
      
      if (comoString.length > 0 || emArray.length > 0) {
        console.log(`  ✅ Encontrado: "${padrao}"`);
        console.log(`     Como string: ${comoString.length} registros`);
        console.log(`     Em array: ${emArray.length} registros`);
        if (comoString.length > 0) {
          console.log(`     Exemplo CPF: ${comoString[0].cpf}`);
        }
        console.log('');
      }
    }
    
    // Buscar arrays que contêm múltiplos motivos
    console.log('\n🔍 Buscando arrays com múltiplos motivos no N2Pix...\n');
    const todosN2 = await n2Collection.find({
      motivoReduzido: { $type: 'array' }
    }).limit(100).toArray();
    
    const arraysMultiplos = todosN2.filter(doc => 
      Array.isArray(doc.motivoReduzido) && doc.motivoReduzido.length > 1
    );
    
    console.log(`Encontrados ${arraysMultiplos.length} registros com arrays de múltiplos motivos:\n`);
    arraysMultiplos.slice(0, 5).forEach((doc, index) => {
      console.log(`  ${index + 1}. CPF: ${doc.cpf}`);
      console.log(`     Motivos: ${JSON.stringify(doc.motivoReduzido)}`);
      console.log(`     Quantidade: ${doc.motivoReduzido.length}`);
      console.log('');
    });
    
    // Verificar se há strings que parecem concatenadas (sem espaços entre palavras conhecidas)
    console.log('\n🔍 Buscando strings que podem estar concatenadas...\n');
    const possiveisConcatenados = await n2Collection.find({
      $or: [
        { motivoReduzido: { $regex: /ChavePix/i } },
        { motivoReduzido: { $regex: /AbatimentoJuros/i } },
        { motivoReduzido: { $regex: /EncerramentodeConta/i } },
        { motivoReduzido: { $regex: /ContestaçãodeValores/i } }
      ]
    }).limit(10).toArray();
    
    console.log(`Encontrados ${possiveisConcatenados.length} registros com possíveis concatenações:\n`);
    possiveisConcatenados.slice(0, 5).forEach((doc, index) => {
      console.log(`  ${index + 1}. CPF: ${doc.cpf}`);
      console.log(`     Tipo: ${Array.isArray(doc.motivoReduzido) ? 'Array' : typeof doc.motivoReduzido}`);
      console.log(`     Valor: ${JSON.stringify(doc.motivoReduzido)}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão com MongoDB fechada.');
    }
  }
}

main().catch(console.error);

/**
 * Script de Verificação: Buscar motivos específicos que aparecem concatenados no relatório
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 */

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
    const n2Collection = db.collection('reclamacoes_n2Pix');
    
    // Buscar registros que têm arrays com os motivos que aparecem concatenados
    console.log('🔍 Buscando registros com múltiplos motivos...\n');
    
    // Buscar arrays que contêm "Chave Pix" e outro motivo
    const registrosComChavePix = await n2Collection.find({
      motivoReduzido: { 
        $type: 'array',
        $elemMatch: { $regex: /Chave Pix/i }
      }
    }).limit(50).toArray();
    
    console.log(`Encontrados ${registrosComChavePix.length} registros com "Chave Pix" no array\n`);
    
    // Filtrar apenas os que têm mais de um motivo
    const comMultiplosMotivos = registrosComChavePix.filter(doc => 
      Array.isArray(doc.motivoReduzido) && doc.motivoReduzido.length > 1
    );
    
    console.log(`Desses, ${comMultiplosMotivos.length} têm múltiplos motivos:\n`);
    
    comMultiplosMotivos.slice(0, 10).forEach((doc, index) => {
      console.log(`${index + 1}. CPF: ${doc.cpf}`);
      console.log(`   Motivos: ${JSON.stringify(doc.motivoReduzido)}`);
      console.log(`   Como string (simulação): "${doc.motivoReduzido.join('')}"`);
      console.log(`   Como string (com espaço): "${doc.motivoReduzido.join(' ')}"`);
      console.log('');
    });
    
    // Verificar se há algum registro onde motivoReduzido é uma string concatenada
    console.log('\n🔍 Verificando se há strings concatenadas diretamente...\n');
    
    const todosN2 = await n2Collection.find({
      motivoReduzido: { $exists: true, $ne: null }
    }).limit(1000).toArray();
    
    const stringsConcatenadas = todosN2.filter(doc => {
      if (typeof doc.motivoReduzido !== 'string') return false;
      const motivo = doc.motivoReduzido;
      // Verificar se contém padrões que sugerem concatenação
      return (
        motivo.includes('Chave Pix') && motivo.length > 10 && !motivo.includes('/') && !motivo.includes(',')
      ) || (
        motivo.toLowerCase().includes('chavepix') || 
        motivo.toLowerCase().includes('abatimentojuros') ||
        motivo.toLowerCase().includes('encerramentodeconta')
      );
    });
    
    console.log(`Encontrados ${stringsConcatenadas.length} registros com strings que podem estar concatenadas:\n`);
    stringsConcatenadas.slice(0, 10).forEach((doc, index) => {
      console.log(`${index + 1}. CPF: ${doc.cpf}`);
      console.log(`   Motivo: "${doc.motivoReduzido}"`);
      console.log(`   Tamanho: ${doc.motivoReduzido.length} caracteres`);
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

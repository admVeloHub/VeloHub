/**
 * Script para limpar/esvaziar a collection reclamacoes_reclameAqui
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_reclameAqui';

async function limparCollection() {
  console.log('🚀 Script de Limpeza: reclamacoes_reclameAqui\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Contar documentos antes
    const totalAntes = await collection.countDocuments();
    console.log(`📊 Total de documentos antes: ${totalAntes}\n`);
    
    if (totalAntes === 0) {
      console.log('ℹ️  Collection já está vazia');
      return;
    }
    
    // Confirmar ação
    console.log('⚠️  ATENÇÃO: Esta operação irá DELETAR TODOS os documentos da collection!');
    console.log('🔄 Deletando documentos...\n');
    
    // Deletar todos os documentos
    const resultado = await collection.deleteMany({});
    
    console.log('============================================================');
    console.log('📊 RESUMO DA LIMPEZA');
    console.log('============================================================');
    console.log(`✅ Documentos deletados: ${resultado.deletedCount}`);
    console.log(`📊 Total de documentos agora: ${await collection.countDocuments()}`);
    console.log('\n✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar collection:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

// Executar
limparCollection().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

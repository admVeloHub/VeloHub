/**
 * Script para limpar collections antes da migração
 * VERSION: v1.0.0 | DATE: 2026-02-24
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

async function main() {
  console.log('🗑️  Limpando collections...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    
    // Limpar reclamacoes_bacen
    const collectionBacen = db.collection('reclamacoes_bacen');
    const countBacen = await collectionBacen.countDocuments();
    await collectionBacen.deleteMany({});
    console.log(`✅ Collection 'reclamacoes_bacen' limpa (${countBacen} documentos removidos)`);
    
    // Limpar reclamacoes_n2Pix
    const collectionOuvidoria = db.collection('reclamacoes_n2Pix');
    const countOuvidoria = await collectionOuvidoria.countDocuments();
    await collectionOuvidoria.deleteMany({});
    console.log(`✅ Collection 'reclamacoes_n2Pix' limpa (${countOuvidoria} documentos removidos)`);
    
    console.log('\n✅ Todas as collections foram limpas com sucesso!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

/**
 * Script de Verificação: Verificar se Chave Pix foi normalizado no MongoDB
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
    
    // Verificar N2Pix
    console.log('📊 Verificando reclamacoes_n2Pix...\n');
    const n2Variacoes = await db.collection('reclamacoes_n2Pix').find({
      motivoReduzido: { $regex: /chave.*pix/i }
    }).limit(20).toArray();
    
    console.log(`Encontrados ${n2Variacoes.length} documentos com variações de Chave Pix:\n`);
    const variacoesN2 = {};
    n2Variacoes.forEach(doc => {
      const motivo = Array.isArray(doc.motivoReduzido) ? doc.motivoReduzido.join(', ') : doc.motivoReduzido;
      variacoesN2[motivo] = (variacoesN2[motivo] || 0) + 1;
    });
    
    Object.entries(variacoesN2).forEach(([motivo, count]) => {
      console.log(`  "${motivo}": ${count} ocorrências`);
    });
    
    // Verificar BACEN
    console.log('\n📊 Verificando reclamacoes_bacen...\n');
    const bacenVariacoes = await db.collection('reclamacoes_bacen').find({
      motivoReduzido: { $regex: /chave.*pix/i }
    }).limit(20).toArray();
    
    console.log(`Encontrados ${bacenVariacoes.length} documentos com variações de Chave Pix:\n`);
    const variacoesBacen = {};
    bacenVariacoes.forEach(doc => {
      const motivo = doc.motivoReduzido;
      variacoesBacen[motivo] = (variacoesBacen[motivo] || 0) + 1;
    });
    
    Object.entries(variacoesBacen).forEach(([motivo, count]) => {
      console.log(`  "${motivo}": ${count} ocorrências`);
    });
    
    // Verificar outras collections
    console.log('\n📊 Verificando outras collections...\n');
    const outrasCollections = ['reclamacoes_reclameAqui', 'reclamacoes_procon', 'reclamacoes_judicial'];
    
    for (const collectionName of outrasCollections) {
      const variacoes = await db.collection(collectionName).find({
        motivoReduzido: { $regex: /chave.*pix/i }
      }).limit(10).toArray();
      
      if (variacoes.length > 0) {
        console.log(`${collectionName}: ${variacoes.length} documentos encontrados`);
        const variacoesMap = {};
        variacoes.forEach(doc => {
          const motivo = Array.isArray(doc.motivoReduzido) ? doc.motivoReduzido.join(', ') : doc.motivoReduzido;
          variacoesMap[motivo] = (variacoesMap[motivo] || 0) + 1;
        });
        Object.entries(variacoesMap).forEach(([motivo, count]) => {
          console.log(`  "${motivo}": ${count} ocorrências`);
        });
      }
    }
    
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

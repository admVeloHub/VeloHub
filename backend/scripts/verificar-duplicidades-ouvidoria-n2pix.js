/**
 * Script de Verificação: Duplicidades reclamacoes_ouvidoria vs reclamacoes_n2Pix
 * VERSION: v1.0.0 | DATE: 2026-03-06
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
 * Verifica:
 * 1. Duplicidades intrínsecas (dentro de cada collection)
 * 2. Duplicidades cruzadas (mesmo registro em ambas as collections)
 *
 * Critério de duplicidade: cpf + nome + data (dataEntradaN2 ou dataEntrada ou createdAt)
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';

function dataStr(doc) {
  const d = doc.dataEntradaN2 || doc.dataEntrada || doc.createdAt;
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}

function chave(doc) {
  const cpf = (doc.cpf || '').toString().replace(/\D/g, '');
  const nome = (doc.nome || '').toString().trim().toLowerCase();
  const data = dataStr(doc) || '';
  return `${cpf}|${nome}|${data}`;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  const collections = await db.listCollections().toArray();
  const existeOuvidoria = collections.some((c) => c.name === 'reclamacoes_ouvidoria');

  const colOuvidoria = db.collection('reclamacoes_ouvidoria');
  const colN2Pix = db.collection('reclamacoes_n2Pix');

  const docsOuvidoria = existeOuvidoria ? await colOuvidoria.find({}).toArray() : [];
  const docsN2Pix = await colN2Pix.find({}).toArray();

  console.log('\n=== VERIFICAÇÃO DE DUPLICIDADES ===\n');
  console.log(`reclamacoes_ouvidoria: ${docsOuvidoria.length} documentos`);
  console.log(`reclamacoes_n2Pix: ${docsN2Pix.length} documentos`);
  console.log('');

  // 1. Duplicidades intrínsecas - reclamacoes_ouvidoria
  const duplicatasOuvidoria = [];
  const chavesOuvidoria = new Map();
  docsOuvidoria.forEach((d) => {
    const k = chave(d);
    if (!k || k === '||') return;
    if (chavesOuvidoria.has(k)) {
      duplicatasOuvidoria.push({ chave: k, ids: [chavesOuvidoria.get(k), d._id.toString()], doc: d });
    } else {
      chavesOuvidoria.set(k, d._id.toString());
    }
  });

  // Agrupar duplicatas intrínsecas _ouvidoria por chave
  const duplicatasOuvidoriaAgrupadas = new Map();
  docsOuvidoria.forEach((d) => {
    const k = chave(d);
    if (!k || k === '||') return;
    if (!duplicatasOuvidoriaAgrupadas.has(k)) {
      duplicatasOuvidoriaAgrupadas.set(k, []);
    }
    duplicatasOuvidoriaAgrupadas.get(k).push(d);
  });
  const duplicatasOuvidoriaFinais = [...duplicatasOuvidoriaAgrupadas.entries()].filter(([, arr]) => arr.length > 1);

  // 2. Duplicidades intrínsecas - reclamacoes_n2Pix
  const duplicatasN2PixAgrupadas = new Map();
  docsN2Pix.forEach((d) => {
    const k = chave(d);
    if (!k || k === '||') return;
    if (!duplicatasN2PixAgrupadas.has(k)) {
      duplicatasN2PixAgrupadas.set(k, []);
    }
    duplicatasN2PixAgrupadas.get(k).push(d);
  });
  const duplicatasN2PixFinais = [...duplicatasN2PixAgrupadas.entries()].filter(([, arr]) => arr.length > 1);

  // 3. Duplicidades cruzadas (mesmo registro em ambas - por chave)
  const chavesN2PixSet = new Set(chavesOuvidoria.keys());
  const cruzadas = [];
  chavesOuvidoria.forEach((idOuv, k) => {
    if (duplicatasN2PixAgrupadas.has(k)) {
      const docsN2 = duplicatasN2PixAgrupadas.get(k);
      cruzadas.push({
        chave: k,
        idOuvidoria: idOuv,
        idsN2Pix: docsN2.map((d) => d._id.toString()),
      });
    }
  });

  // Corrigir: chavesOuvidoria é Map com valor único (primeiro id), mas precisamos verificar cruzamento
  const chavesOuvSet = new Set(chavesOuvidoria.keys());
  const cruzadasPorChave = [...chavesOuvSet].filter((k) => duplicatasN2PixAgrupadas.has(k));

  // 4. Duplicidades cruzadas por _id (migração preservou _id)
  const idsOuvidoria = new Set(docsOuvidoria.map((d) => d._id.toString()));
  const cruzadasPorId = docsN2Pix.filter((d) => idsOuvidoria.has(d._id.toString()));

  // Relatório
  console.log('--- 1. DUPLICIDADES INTRÍNSECAS (reclamacoes_ouvidoria) ---');
  if (duplicatasOuvidoriaFinais.length === 0) {
    console.log('   Nenhuma duplicata encontrada.');
  } else {
    console.log(`   Encontradas ${duplicatasOuvidoriaFinais.length} chaves duplicadas:`);
    duplicatasOuvidoriaFinais.slice(0, 10).forEach(([k, arr], i) => {
      console.log(`   ${i + 1}. Chave: ${k}`);
      console.log(`      IDs: ${arr.map((d) => d._id.toString()).join(', ')}`);
      console.log(`      Qtd: ${arr.length} registros`);
    });
    if (duplicatasOuvidoriaFinais.length > 10) {
      console.log(`   ... e mais ${duplicatasOuvidoriaFinais.length - 10} chaves duplicadas.`);
    }
  }
  console.log('');

  console.log('--- 2. DUPLICIDADES INTRÍNSECAS (reclamacoes_n2Pix) ---');
  if (duplicatasN2PixFinais.length === 0) {
    console.log('   Nenhuma duplicata encontrada.');
  } else {
    console.log(`   Encontradas ${duplicatasN2PixFinais.length} chaves duplicadas:`);
    duplicatasN2PixFinais.slice(0, 10).forEach(([k, arr], i) => {
      console.log(`   ${i + 1}. Chave: ${k}`);
      console.log(`      IDs: ${arr.map((d) => d._id.toString()).join(', ')}`);
      console.log(`      Qtd: ${arr.length} registros`);
    });
    if (duplicatasN2PixFinais.length > 10) {
      console.log(`   ... e mais ${duplicatasN2PixFinais.length - 10} chaves duplicadas.`);
    }
  }
  console.log('');

  console.log('--- 3. DUPLICIDADES CRUZADAS (por chave cpf|nome|data) ---');
  if (cruzadasPorChave.length === 0) {
    console.log('   Nenhuma duplicata cruzada por chave.');
  } else {
    console.log(`   Encontradas ${cruzadasPorChave.length} chaves presentes em ambas as collections:`);
    cruzadasPorChave.slice(0, 10).forEach((k, i) => {
      const idOuv = chavesOuvidoria.get(k);
      const docsN2 = duplicatasN2PixAgrupadas.get(k);
      console.log(`   ${i + 1}. Chave: ${k}`);
      console.log(`      _ouvidoria: ${idOuv}`);
      console.log(`      _n2Pix: ${docsN2.map((d) => d._id.toString()).join(', ')}`);
    });
    if (cruzadasPorChave.length > 10) {
      console.log(`   ... e mais ${cruzadasPorChave.length - 10}.`);
    }
  }
  console.log('');

  console.log('--- 4. DUPLICIDADES CRUZADAS (por _id idêntico - migração) ---');
  console.log(`   Documentos em _n2Pix com mesmo _id que _ouvidoria: ${cruzadasPorId.length}`);
  if (cruzadasPorId.length > 0 && cruzadasPorId.length <= 5) {
    cruzadasPorId.forEach((d, i) => {
      console.log(`   ${i + 1}. _id: ${d._id} | nome: ${d.nome || '-'} | cpf: ${d.cpf ? d.cpf.substring(0, 3) + '***' : '-'}`);
    });
  } else if (cruzadasPorId.length > 5) {
    cruzadasPorId.slice(0, 5).forEach((d, i) => {
      console.log(`   ${i + 1}. _id: ${d._id} | nome: ${d.nome || '-'}`);
    });
    console.log(`   ... e mais ${cruzadasPorId.length - 5}.`);
  }
  console.log('');

  // Resumo
  console.log('=== RESUMO ===');
  console.log(`   Duplicatas intrínsecas _ouvidoria: ${duplicatasOuvidoriaFinais.length} chaves`);
  console.log(`   Duplicatas intrínsecas _n2Pix: ${duplicatasN2PixFinais.length} chaves`);
  console.log(`   Duplicatas cruzadas (por chave): ${cruzadasPorChave.length}`);
  console.log(`   Duplicatas cruzadas (por _id): ${cruzadasPorId.length}`);
  console.log('');

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

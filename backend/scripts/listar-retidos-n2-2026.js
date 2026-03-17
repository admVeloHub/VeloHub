/**
 * Listar CPFs dos casos Retidos - N2 Pix, a partir de 01/01/2026
 * Salva em arquivo: retidos-n2-2026.txt
 * 
 * Critério Retidos:
 * - motivoReduzido contém "Liberação Chave Pix"
 * - Finalizado.Resolvido === true
 * - pixLiberado === false
 * - dataEntradaN2 >= 2026-01-01
 * 
 * Uso:
 *   node backend/scripts/listar-retidos-n2-2026.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';
const DATA_INICIO = new Date('2026-01-01T00:00:00.000Z');
const OUTPUT_FILE = path.join(__dirname, 'retidos-n2-2026.txt');

function normalizarMotivoParaComparacao(motivoReduzido) {
  if (!motivoReduzido) return '';
  if (Array.isArray(motivoReduzido)) {
    return motivoReduzido.join(' ').toLowerCase();
  }
  if (typeof motivoReduzido === 'string') {
    return motivoReduzido.toLowerCase();
  }
  return '';
}

function isMotivoLiberacaoChavePix(motivoReduzido) {
  const norm = normalizarMotivoParaComparacao(motivoReduzido);
  return norm.includes('liberação chave pix') || norm.includes('liberacao chave pix');
}

function isRetido(doc) {
  return (
    isMotivoLiberacaoChavePix(doc.motivoReduzido) &&
    doc.Finalizado?.Resolvido === true &&
    doc.pixLiberado === false
  );
}

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection('reclamacoes_n2Pix');

  const docs = await collection.find({
    dataEntradaN2: { $gte: DATA_INICIO }
  }).toArray();

  const retidos = docs.filter(isRetido);
  const cpfs = [...new Set(retidos.map(r => r.cpf).filter(Boolean))];
  cpfs.sort();

  const conteudo = [
    'CPFs - Casos Retidos (N2 Pix, a partir de 01/01/2026)',
    'Critério: Liberação Chave Pix + Finalizado + pixLiberado=false',
    `Total: ${cpfs.length} CPF(s)`,
    '',
    ...cpfs
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, conteudo, 'utf8');

  console.log(`✅ Lista salva em: ${OUTPUT_FILE}`);
  console.log(`📊 Total: ${cpfs.length} CPF(s)`);

  await client.close();
})();

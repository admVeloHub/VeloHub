/**
 * Listar CPFs dos casos Retidos - N2 Pix, a partir de 01/01/2026
 * Salva em arquivo: retidos-n2-2026.txt
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
 * Critério Retidos:
 * - motivoReduzido contém "Liberação Chave Pix"
 * - Finalizado.Resolvido === true
 * - pixLiberado === false
 * - dataEntradaN2 >= 2026-01-01
 * 
 * Uso:
 *   node backend/scripts/listar-retidos-n2-2026.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
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

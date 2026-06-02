/**
 * Seed hub_corporate — Políticas, LGPD pública, Termos v2.1
 * VERSION: v1.1.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Uso: node backend/scripts/seed-hub-corporate.cjs
 */

'use strict';

const path = require('path');
const { MongoClient } = require('mongodb');

const backendDir = path.join(__dirname, '..');
const { loadFonteEnv } = require(path.join(backendDir, 'utils/loadFonteEnv'));
loadFonteEnv(backendDir);

if (
  process.env.NODE_ENV !== 'production' &&
  process.env.MONGO_ENV &&
  String(process.env.MONGO_ENV).startsWith('mongodb+srv://')
) {
  try {
    const dns = require('dns');
    const current = dns.getServers().filter(Boolean);
    if (!current.includes('8.8.8.8')) {
      dns.setServers(['8.8.8.8', '1.1.1.1', ...current]);
    }
  } catch {
    /* ignore */
  }
}

const {
  getCorpoEticaCondutaCollection,
  getCorpoLgpdCollection,
  getCorpoTermoUsuarioCollection,
} = require(path.join(backendDir, 'config/hubCorporateDb'));
const { parsePoliticasNormasDocx, parseLgpdPublicaDocx } = require(path.join(
  backendDir,
  'utils/parseDocxSections'
));

const VERSAO = '2.1';
const REPO_VELOHUB_ROOT = path.join(backendDir, '..', '..');
const ETICA_DOCX = path.join(REPO_VELOHUB_ROOT, 'Codigo_de_Etica_e_Conduta_Velotax_vf 2.1.docx');
const LGPD_DOCX = path.join(backendDir, '..', 'LGPD001.docx');

const TERMO_CORPO = [
  {
    titulo: '1. Definição e Objetivo',
    corpo:
      'O VeloHub é a plataforma corporativa central do Velotax. Seu objetivo principal é garantir o acesso rápido e centralizado a ferramentas operacionais, informações estratégicas relevantes ao trabalho, canais de comunicação interna e facilidades para o dia a dia na empresa.',
  },
  {
    titulo: '2. Finalidade de Uso',
    corpo:
      'A plataforma deve ser utilizada exclusivamente no ambiente de trabalho e com o único objetivo de facilitar e viabilizar as atividades profissionais do colaborador. É vedada a utilização do sistema para fins pessoais ou alheios aos interesses corporativos.',
  },
  {
    titulo: '3. Credenciais e Segurança',
    corpo:
      'As credenciais de acesso (login e senha) são pessoais e intransferíveis. É expressamente proibido compartilhar as credenciais com qualquer outra pessoa, inclusive colegas de trabalho. É enfaticamente vedado o compartilhamento de acesso ou de informações da plataforma com terceiros externos à empresa. A violação desta diretriz compromete a segurança do Velotax e estará sujeita às medidas disciplinares e legais cabíveis.',
  },
  {
    titulo: '4. Compromisso do Usuário',
    corpo:
      'Ao utilizar o VeloHub, o usuário declara estar ciente dos objetivos e aplicações da plataforma descritos nestes termos. O usuário compromete-se a realizar o uso responsável dos acessos fornecidos, preservando a confidencialidade das informações e seguindo as normas internas de segurança.',
  },
  {
    titulo: '5. Monitoramento',
    corpo:
      'O Velotax reserva-se o direito de monitorar e auditar os acessos e atividades realizados na plataforma para garantir a segurança dos dados e o cumprimento destes termos.',
  },
];

async function upsertByVersao(col, versao, doc) {
  const existing = await col.findOne({ versao });
  const now = new Date();
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: { ...doc, updatedAt: now } });
    return { action: 'updated', id: existing._id };
  }
  const result = await col.insertOne({ ...doc, versao, createdAt: now, updatedAt: now });
  return { action: 'inserted', id: result.insertedId };
}

async function main() {
  const uri = process.env.MONGO_ENV;
  if (!uri) {
    console.error('MONGO_ENV não configurada');
    process.exit(1);
  }

  console.log('📄 Políticas — parse:', ETICA_DOCX);
  const corpoPoliticas = parsePoliticasNormasDocx(ETICA_DOCX);
  console.log(`   ${corpoPoliticas.length} seções`);

  console.log('📄 LGPD pública — parse:', LGPD_DOCX);
  let publica = [];
  try {
    publica = parseLgpdPublicaDocx(LGPD_DOCX);
    console.log(`   ${publica.length} seções`);
  } catch (err) {
    console.warn('   Aviso LGPD parse:', err.message);
  }

  const client = new MongoClient(uri);
  await client.connect();
  console.log('✅ MongoDB conectado');

  try {
    const eticaCol = getCorpoEticaCondutaCollection(client);
    const r1 = await upsertByVersao(eticaCol, VERSAO, { corpo: corpoPoliticas });
    console.log(`✅ corpo_etica&conduta — ${r1.action} _id=${r1.id}`);

    const lgpdCol = getCorpoLgpdCollection(client);
    const r2 = await upsertByVersao(lgpdCol, VERSAO, { publica, corporativo: [] });
    console.log(`✅ corpo_lgpd — ${r2.action} _id=${r2.id} (publica: ${publica.length}, corporativo: 0)`);

    const termoCol = getCorpoTermoUsuarioCollection(client);
    const r3 = await upsertByVersao(termoCol, VERSAO, { corpo: TERMO_CORPO });
    console.log(`✅ corpo_termoUsuario — ${r3.action} _id=${r3.id}`);
  } finally {
    await client.close();
  }

  console.log('🎉 Seed hub_corporate concluído');
}

main().catch((err) => {
  console.error('❌ Seed falhou:', err);
  process.exit(1);
});

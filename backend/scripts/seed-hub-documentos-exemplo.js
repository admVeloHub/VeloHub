/**
 * Cria console_conteudo.hub_documentos e insere 6 documentos de exemplo
 * VERSION: v1.0.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
 *
 * Schema: LISTA_SCHEMAS.rb — hub_documentos (titulo, body, categoria, createdAt, updatedAt)
 * Uso: node backend/scripts/seed-hub-documentos-exemplo.js
 * Dry-run: node backend/scripts/seed-hub-documentos-exemplo.js --dry-run
 */

'use strict';

const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('./loadMongoUri');

const DB = 'console_conteudo';
const COLLECTION = 'hub_documentos';

/** @type {Array<{ titulo: string, body: string, categoria: string, createdAt: Date }>} */
const DOCUMENTS = [
  {
    titulo: 'VOCÊ SABIA? — Direitos de saúde no trabalho',
    categoria: 'Saúde',
    body: `SEUS DIREITOS DE SAÚDE NO TRABALHO

Lei nº 15.377/2026 – Novo art. 169-A da CLT

SEUS DIREITOS:

► Até 3 DIAS por ano para exames preventivos SEM DESCONTO NO SALÁRIO
► Exames de HPV, câncer de mama, colo do útero e próstata
► A empresa deve informar sobre campanhas de vacinação
► Acesso garantido a serviços de diagnóstico

COMO SOLICITAR:

1. Agende seu exame preventivo
2. Comunique o RH com antecedência
3. Apresente o comprovante ao retornar

Cuide da sua saúde!`,
    createdAt: new Date('2026-05-28T10:00:00.000Z'),
  },
  {
    titulo: 'Orientações de uso — copa e áreas comuns',
    categoria: 'Facilities',
    body: `Com o aumento de colaboradores no escritório, reforçamos:

• Eletrodomésticos do 4º andar (geladeiras e microondas) podem ser utilizados e complementam os do escritório.
• Utensílios da copa interna (pratos, copos, talheres) são de uso exclusivo nesse ambiente — não retirar para a copa do condomínio.
• Horários de limpeza dos banheiros:
  - Masculino: lavagem 7:30h; revisões a cada 1h a partir das 8:30h
  - Feminino: lavagem 11:30h; revisões a cada 1h a partir das 8:00h

Contamos com a colaboração de todos.`,
    createdAt: new Date('2026-05-25T14:30:00.000Z'),
  },
  {
    titulo: 'Campanha de vacinação e prevenção',
    categoria: 'Saúde',
    body: `Campanhas de Vacinação e Cuidados com a Saúde

A empresa apoia campanhas oficiais de vacinação conforme orientações do Ministério da Saúde.

Vacinação: fique atento às campanhas na rede pública — vacinas seguras e gratuitas.

HPV: vacinação é a melhor prevenção; consulte uma unidade de saúde.

Prevenção de cânceres (mama, colo do útero, próstata): diagnóstico precoce aumenta as chances de cura. Faça exames conforme orientação médica.

Serviços de vacinação e exames estão disponíveis no SUS.`,
    createdAt: new Date('2026-05-24T10:00:00.000Z'),
  },
  {
    titulo: 'Solicitação de ausência e atestados',
    categoria: 'RH',
    body: `Para registrar ausências por saúde ou outros motivos previstos em política interna:

1. Comunique seu gestor imediato o mais cedo possível.
2. Envie o atestado ou documento comprobatório ao RH pelo canal oficial.
3. Registre a ausência nos sistemas indicados pela área (ex.: Pontomais), quando aplicável.

Dúvidas sobre prazos e documentação: contate o RH.`,
    createdAt: new Date('2026-05-22T09:00:00.000Z'),
  },
  {
    titulo: 'Boas práticas de segurança da informação',
    categoria: 'TI',
    body: `Proteja dados da empresa e dos clientes:

• Não compartilhe senhas nem credenciais de acesso.
• Use autenticação em duas etapas quando disponível.
• Desconfie de e-mails e links suspeitos — reporte ao time de TI antes de clicar.
• Bloqueie a estação ao se ausentar.
• Armazene arquivos sensíveis apenas em repositórios autorizados.

Incidentes ou suspeitas: abra chamado na categoria Segurança / TI.`,
    createdAt: new Date('2026-05-20T11:00:00.000Z'),
  },
  {
    titulo: 'Código de conduta — resumo',
    categoria: 'Compliance',
    body: `Todos os colaboradores devem:

• Tratar colegas, clientes e parceiros com respeito e ética.
• Não tolerar assédio, discriminação ou conflito de interesses não declarado.
• Proteger informações confidenciais da Velotax e dos clientes.
• Reportar violações pelo canal de denúncias ou à liderança / Compliance.

O código completo está disponível na intranet e no VeloHub (Conhecimento).`,
    createdAt: new Date('2026-05-18T08:00:00.000Z'),
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB);
    const col = db.collection(COLLECTION);

    const existingNames = await db.listCollections({ name: COLLECTION }).toArray();
    if (existingNames.length === 0) {
      await db.createCollection(COLLECTION);
      console.log(`📁 Collection ${DB}.${COLLECTION} criada.`);
    }

    const toInsert = [];
    for (const doc of DOCUMENTS) {
      const exists = await col.findOne({ titulo: doc.titulo, categoria: doc.categoria });
      if (exists) {
        console.log(`⏭️  Já existe: [${doc.categoria}] ${doc.titulo} — _id ${exists._id}`);
        continue;
      }
      toInsert.push({
        titulo: doc.titulo,
        body: doc.body,
        categoria: doc.categoria,
        createdAt: doc.createdAt,
        updatedAt: doc.createdAt,
      });
    }

    if (toInsert.length === 0) {
      const total = await col.countDocuments({});
      console.log(`Nenhum documento novo. Total na collection: ${total}.`);
      return;
    }

    if (dryRun) {
      console.log(`[dry-run] Inseriria ${toInsert.length} documento(s):`);
      toInsert.forEach((d) => console.log(`  - [${d.categoria}] ${d.titulo}`));
      return;
    }

    const result = await col.insertMany(toInsert);
    const total = await col.countDocuments({});
    console.log(`✅ Inseridos ${result.insertedCount} documento(s) em ${DB}.${COLLECTION} (total: ${total}):`);
    Object.entries(result.insertedIds).forEach(([idx, id]) => {
      const d = toInsert[Number(idx)];
      console.log(`  - [${d.categoria}] ${d.titulo}: ${id}`);
    });
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('[seed-hub-documentos-exemplo]', err.message);
  process.exit(1);
});

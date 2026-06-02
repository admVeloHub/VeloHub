/**
 * Insere documentos do rascunho FONTE DA VERDADE/rascunho para textos.txt em console_conteudo.hub_avisos
 * VERSION: v1.0.1 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
 *
 * Uso: node backend/scripts/seed-hub-destaques-rascunho.js
 * Dry-run: node backend/scripts/seed-hub-destaques-rascunho.js --dry-run
 */

'use strict';

const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('./loadMongoUri');

const DB = 'console_conteudo';
const COLLECTION = 'hub_avisos';

/** @type {Array<{ titulo: string, conteudo: string, media: unknown[], createdAt: Date }>} */
const DOCUMENTS = [
  {
    titulo: 'INFORMATIVO SAÚDE - Lei nº 15.377/2026 – Novo art. 169-A da CLT',
    conteudo: `Campanhas de Vacinação e Cuidados com a Saúde

Cuidar da saúde é essencial! Por isso, informamos que a empresa está apoiando as campanhas oficiais de vacinação e ações de prevenção de doenças, conforme orientações do Ministério da Saúde.

 

Vacinação

Fique atento às campanhas de vacinação disponíveis na rede pública de saúde. As vacinas ajudam a prevenir diversas doenças e são seguras e gratuitas.

 

HPV (Papilomavírus Humano)

O HPV é um vírus comum que pode causar doenças, incluindo câncer.
A vacinação é a melhor forma de prevenção e está disponível para públicos específicos. Procure uma unidade de saúde para mais informações.

 

Câncer de mama

Mais comum em mulheres

O diagnóstico precoce aumenta muito as chances de cura

Faça exames regulares conforme orientação médica

 

Câncer do colo do útero

Pode ser prevenido com vacina contra o HPV e exames periódicos (Papanicolau)

Procure atendimento regularmente

 

Câncer de próstata

Mais comum em homens, principalmente acima dos 50 anos

O diagnóstico precoce faz diferença

Consulte um profissional de saúde regularmente

 

Acesso a exames e atendimento

Os serviços de vacinação, exames e orientações estão disponíveis nas unidades do SUS (Sistema Único de Saúde). Procure o posto de saúde mais próximo para saber mais.

 

Cuide da sua saúde!`,
    media: [],
    createdAt: new Date('2026-05-24T10:00:00.000Z'),
  },
  {
    titulo: 'Prezados(as) Colaboradores(as),',
    conteudo: `Com o atual aumento de colaboradores na empresa, seguem algumas orientações:

Os elestrodomésticos (geladeiras e microondas) do 4o. andar (área comum), podem ser utilizados e complementam os existentes no nosso escritório;

Reforçamos que os utensílios da copa do escritório como pratos, copos, talheres e demais itens são de uso exclusivo nesse ambiente interno. Não é permitido retirá-los para utilização em outras áreas, como a copa de uso comum do condomínio. Essa orientação tem como objetivo assegurar a organização do espaço, a disponibilidade dos itens a todos os colaboradores e a manutenção da limpeza e conservação dos materiais; 

Horários de limpezas dos banheiros:

Masculino: lavagem 7:30h e revisões a cada 1 hora, a partir das 8:30h

Feminino : lavagem 11:30h e revisões a cada 1 hora, a partir das 8:00h

Contamos com a colaboração e o comprometimento de todos para o cumprimento destas diretrizes, contribuindo assim para um ambiente de trabalho mais funcional, limpo e harmonioso. Agradecemos pela compreensão e apoio de sempre. 

Atenciosamente,
FACILITIES `,
    media: [],
    createdAt: new Date('2026-05-25T14:30:00.000Z'),
  },
  {
    titulo: 'INFORMATIVO SAÚDE - Lei nº 15.377/2026 – Novo art. 169-A da CLT',
    conteudo: `Campanhas de Vacinação e Cuidados com a Saúde

Cuidar da saúde é essencial! Por isso, informamos que a empresa está apoiando as campanhas oficiais de vacinação e ações de prevenção de doenças, conforme orientações do Ministério da Saúde.

 

Vacinação

Fique atento às campanhas de vacinação disponíveis na rede pública de saúde. As vacinas ajudam a prevenir diversas doenças e são seguras e gratuitas.

 

HPV (Papilomavírus Humano)

O HPV é um vírus comum que pode causar doenças, incluindo câncer.
A vacinação é a melhor forma de prevenção e está disponível para públicos específicos. Procure uma unidade de saúde para mais informações.

 

Câncer de mama

Mais comum em mulheres

O diagnóstico precoce aumenta muito as chances de cura

Faça exames regulares conforme orientação médica`,
    media: [],
    createdAt: new Date('2026-05-26T09:15:00.000Z'),
  },
  {
    titulo: 'Campanha de Saude',
    conteudo: `Câncer do colo do útero

Pode ser prevenido com vacina contra o HPV e exames periódicos (Papanicolau)

Procure atendimento regularmente

 

Câncer de próstata

Mais comum em homens, principalmente acima dos 50 anos

O diagnóstico precoce faz diferença

Consulte um profissional de saúde regularmente

 

Acesso a exames e atendimento

Os serviços de vacinação, exames e orientações estão disponíveis nas unidades do SUS (Sistema Único de Saúde). Procure o posto de saúde mais próximo para saber mais.

 

Cuide da sua saúde!`,
    media: [],
    createdAt: new Date('2026-05-27T16:45:00.000Z'),
  },
  {
    titulo: 'VOCÊ SABIA?',
    conteudo: `SEUS DIREITOS DE SAÚDE NO TRABALHO

Lei nº 15.377/2026 – Novo art. 169-A da CLT


 SEUS DIREITOS:

►  Até 3 DIAS por ano para exames preventivos SEM DESCONTO NO SALÁRIO

►  Exames de HPV, câncer de mama, colo do útero e próstata

►  A empresa deve informar sobre campanhas de vacinação

►  Acesso garantido a serviços de diagnóstico


COMO SOLICITAR:

1.  Agende seu exame preventivo

2.  Comunique o RH com antecedência

3.  Apresente o comprovante ao retornar


 

Cuide da sua saúde!`,
    media: [],
    createdAt: new Date('2026-05-28T10:00:00.000Z'),
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const col = client.db(DB).collection(COLLECTION);

    const toInsert = [];
    for (const doc of DOCUMENTS) {
      const exists = await col.findOne({
        titulo: doc.titulo,
        createdAt: doc.createdAt,
      });
      if (exists) {
        console.log(`⏭️  Já existe: "${doc.titulo}" (${doc.createdAt.toISOString()}) — _id ${exists._id}`);
        continue;
      }
      toInsert.push({
        ...doc,
        thread: [],
        updatedAt: doc.createdAt,
      });
    }

    if (toInsert.length === 0) {
      console.log('Nenhum documento novo para inserir.');
      return;
    }

    if (dryRun) {
      console.log(`[dry-run] Inseriria ${toInsert.length} documento(s):`);
      toInsert.forEach((d) => console.log(`  - ${d.titulo} (${d.createdAt.toISOString()})`));
      return;
    }

    const result = await col.insertMany(toInsert);
    console.log(`✅ Inseridos ${result.insertedCount} documento(s) em ${DB}.${COLLECTION}:`);
    Object.entries(result.insertedIds).forEach(([idx, id]) => {
      console.log(`  - ${toInsert[Number(idx)].titulo}: ${id}`);
    });
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('[seed-hub-destaques-rascunho]', err.message);
  process.exit(1);
});

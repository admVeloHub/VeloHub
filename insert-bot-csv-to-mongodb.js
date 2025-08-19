const { MongoClient } = require('mongodb');
const fs = require('fs');
const csv = require('csv-parser');

// String de conexão do MongoDB
const uri = "mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@clustercentral.quqgq6x.mongodb.net/console_conteudo?retryWrites=true&w=majority&appName=ClusterCentral";

async function insertBotDataFromCSV() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
        
        const db = client.db('console_conteudo');
        const faqCollection = db.collection('Bot_perguntas');
        
        // Array para armazenar os dados processados
        const faqData = [];
        
        // Ler o CSV
        fs.createReadStream('CENTRAL INTERNA - INPUT - Bot_perguntas.csv')
            .pipe(csv())
            .on('data', (row) => {
                // Processar cada linha do CSV
                const topic = row.topico || 'Sem tópico';
                const context = row.contexto || '';
                const keywords = row.Palavras_chave || '';
                const imageUrls = row['URLs de Imagens'] || '';
                
                // Criar documento para Bot_perguntas
                faqData.push({
                    topic: topic,
                    context: context,
                    keywords: keywords,
                    question: topic, // Usar o tópico como pergunta
                    imageUrls: imageUrls,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            })
            .on('end', async () => {
                console.log('📋 CSV do Bot processado. Inserindo dados...');
                console.log(`📊 Total de FAQs processados: ${faqData.length}`);
                
                try {
                    // Limpar collection existente antes de inserir
                    console.log('\n🧹 Limpando collection Bot_perguntas...');
                    await faqCollection.deleteMany({});
                    console.log('✅ Collection Bot_perguntas limpa');
                    
                    // Inserir novos dados
                    if (faqData.length > 0) {
                        const result = await faqCollection.insertMany(faqData);
                        console.log(`✅ ${result.insertedCount} FAQs inseridos na collection Bot_perguntas`);
                    }
                    
                    console.log('\n📊 RESUMO FINAL:');
                    console.log(`- FAQs inseridos: ${faqData.length}`);
                    console.log('\n🎉 Dados do bot inseridos com sucesso!');
                    
                    // Mostrar alguns exemplos dos dados inseridos
                    console.log('\n📝 Exemplos dos dados inseridos:');
                    faqData.slice(0, 3).forEach((item, index) => {
                        console.log(`${index + 1}. Tópico: ${item.topic}`);
                        console.log(`   Contexto: ${item.context.substring(0, 100)}...`);
                        console.log(`   Keywords: ${item.keywords}`);
                        console.log('');
                    });
                    
                } catch (error) {
                    console.error('❌ Erro ao inserir dados:', error);
                } finally {
                    await client.close();
                }
            });
            
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        await client.close();
    }
}

// Executar o script
insertBotDataFromCSV();


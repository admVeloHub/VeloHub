const { MongoClient } = require('mongodb');
const fs = require('fs');
const csv = require('csv-parser');

// String de conexão do MongoDB
const uri = "mongodb+srv://REDACTED";

async function insertDataFromCSV() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
        
        const db = client.db('console_conteudo');
        
        // Arrays para armazenar os dados processados
        const articles = [];
        const velonews = [];
        const faq = [];
        
        // Ler o CSV
        fs.createReadStream('CENTRAL INTERNA - INPUT - Artigos.csv')
            .pipe(csv())
            .on('data', (row) => {
                // Processar cada linha do CSV
                const keywords = row.id ? row.id.split(',').map(k => k.trim()) : [];
                const category = row.categoria_titulo || 'Sem categoria';
                const title = row.artigo_titulo || 'Sem título';
                const content = row.artigo_conteudo || '';
                const categoryId = row.categoria_id || '';
                
                // Determinar para qual collection vai baseado na categoria
                if (category === 'Ferramentas do Agente') {
                    // Vai para Velonews
                    velonews.push({
                        title: title,
                        content: content,
                        is_critical: "N",
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                } else if (category === 'Manual de Voz e Estilo') {
                    // Vai para FAQ (Bot_perguntas)
                    faq.push({
                        topic: title,
                        context: content,
                        keywords: keywords.join(', '),
                        question: title,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                } else {
                    // Vai para Artigos
                    articles.push({
                        title: title,
                        content: content,
                        category: category,
                        category_id: categoryId,
                        keywords: keywords,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            })
            .on('end', async () => {
                console.log('📋 CSV processado. Inserindo dados...');
                
                try {
                    // Inserir Artigos
                    if (articles.length > 0) {
                        const artigosCollection = db.collection('Artigos');
                        const resultArtigos = await artigosCollection.insertMany(articles);
                        console.log(`✅ ${resultArtigos.insertedCount} artigos inseridos`);
                    }
                    
                    // Inserir Velonews
                    if (velonews.length > 0) {
                        const velonewsCollection = db.collection('Velonews');
                        const resultVelonews = await velonewsCollection.insertMany(velonews);
                        console.log(`✅ ${resultVelonews.insertedCount} velonews inseridos`);
                    }
                    
                    // Inserir FAQ
                    if (faq.length > 0) {
                        const faqCollection = db.collection('Bot_perguntas');
                        const resultFaq = await faqCollection.insertMany(faq);
                        console.log(`✅ ${resultFaq.insertedCount} FAQs inseridos`);
                    }
                    
                    console.log('\n📊 RESUMO:');
                    console.log(`- Artigos: ${articles.length}`);
                    console.log(`- Velonews: ${velonews.length}`);
                    console.log(`- FAQ: ${faq.length}`);
                    console.log('\n🎉 Dados inseridos com sucesso!');
                    
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
insertDataFromCSV();


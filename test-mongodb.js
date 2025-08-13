const { MongoClient } = require('mongodb');

// String de conexão do MongoDB
const uri = "mongodb+srv://REDACTED";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await client.connect();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Listar bancos de dados
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('\n📊 Bancos de dados disponíveis:');
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name}`);
    });
    
    // Testar acesso ao banco velohub
    const db = client.db('velohub');
    console.log('\n🔍 Testando acesso ao banco "velohub"...');
    
    // Listar coleções
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Coleções no banco velohub:');
    if (collections.length === 0) {
      console.log('  - Nenhuma coleção encontrada (banco vazio)');
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    // Criar dados de exemplo se não existirem
    const veloNewsCollection = db.collection('velo_news');
    const newsCount = await veloNewsCollection.countDocuments();
    
    if (newsCount === 0) {
      console.log('\n📝 Criando dados de exemplo...');
      
      const sampleNews = [
        {
          _id: 1,
          title: 'Nova Integração com Sistema de Gestão',
          content: 'Expandimos nossas capacidades! Agora o VeloHub se integra perfeitamente com os principais sistemas de gestão do mercado.',
          created_at: new Date(),
          is_critical: false
        },
        {
          _id: 2,
          title: 'Atualização de Segurança Crítica',
          content: 'Implementamos novas camadas de segurança para proteger seus dados.',
          created_at: new Date(),
          is_critical: true
        },
        {
          _id: 3,
          title: 'VeloAcademy Lança Novo Curso',
          content: 'Aprenda a dominar a automação de processos com nosso novo curso exclusivo.',
          created_at: new Date(),
          is_critical: false
        }
      ];
      
      await veloNewsCollection.insertMany(sampleNews);
      console.log(`✅ ${sampleNews.length} notícias criadas com sucesso!`);
    } else {
      console.log(`\n📊 Encontradas ${newsCount} notícias existentes`);
    }
    
    // Testar busca de dados
    const news = await veloNewsCollection.find({}).toArray();
    console.log('\n📰 Últimas notícias:');
    news.forEach(item => {
      console.log(`  - ${item.title} ${item.is_critical ? '(CRÍTICA)' : ''}`);
    });
    
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar o teste
testConnection();

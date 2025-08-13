import { connectToDatabase } from "../lib/mongodb";

(async () => {
  try {
    console.log("🔍 Testando conexão com o MongoDB...");
    const connection = await connectToDatabase();
    console.log("✅ Conexão estabelecida com sucesso!");
    console.log("📊 Banco de dados:", connection.db.databaseName);
    
    // Testar listar coleções
    const collections = await connection.db.listCollections().toArray();
    console.log("📁 Coleções disponíveis:", collections.map(c => c.name));
    
  } catch (err) {
    console.error("❌ Falha ao conectar no MongoDB:", err);
  } finally {
    process.exit(0);
  }
})();

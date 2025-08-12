import { connectToDatabase } from "../lib/mongodb";
import mongoose from "mongoose";

(async () => {
  try {
    console.log("🔍 Testando conexão com o MongoDB...");
    await connectToDatabase();
    console.log("✅ Conexão estabelecida com sucesso!");
  } catch (err) {
    console.error("❌ Falha ao conectar no MongoDB:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();

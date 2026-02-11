/**
 * VeloHub - MongoDB Connection Helper
 * VERSION: v1.0.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
 * 
 * Helper para conexão com MongoDB
 * Usa a mesma configuração do backend
 */

let client = null;
let clientPromise = null;

/**
 * Conecta ao MongoDB
 * @returns {Promise<Object>} MongoDB client
 */
export async function connectToMongo() {
  if (client && client.topology && client.topology.isConnected()) {
    return client;
  }

  // Dynamic import para evitar problemas em build time
  const { MongoClient } = await import('mongodb');
  const uri = process.env.MONGO_ENV || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGO_ENV ou MONGODB_URI não configurado');
  }

  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  client = await clientPromise;
  return client;
}

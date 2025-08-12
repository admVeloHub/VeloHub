import { MongoClient } from 'mongodb'

// Remover o throw new Error que quebra o build
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/velohub'
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In global scope, this is needed because the development server
  // restarts, and each restart creates a new global scope.
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export { clientPromise }

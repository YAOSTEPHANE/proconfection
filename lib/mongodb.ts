import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "proconfection";

if (!uri) {
  throw new Error("MONGODB_URI est manquant. Configure .env.local.");
}

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const clientPromise = global.mongoClientPromise ?? client.connect();

if (!global.mongoClientPromise) {
  global.mongoClientPromise = clientPromise;
}

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

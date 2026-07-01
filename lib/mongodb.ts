import { MongoClient, ServerApiVersion } from "mongodb";
import { formatMongoError } from "./mongodb-errors";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "proconfection";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export function resetMongoClient(): void {
  global.mongoClientPromise = undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri?.trim()) {
    throw new Error("MONGODB_URI est manquant. Configurez la variable sur votre hébergeur.");
  }

  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    global.mongoClientPromise = client.connect().catch((error) => {
      resetMongoClient();
      throw error;
    });
  }

  return global.mongoClientPromise;
}

export async function getDb() {
  try {
    const connectedClient = await getClientPromise();
    return connectedClient.db(dbName);
  } catch (error) {
    resetMongoClient();
    throw new Error(formatMongoError(error));
  }
}

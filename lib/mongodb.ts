import { MongoClient } from 'mongodb';

// ใช้ client เดียวทั้ง process (dev: เก็บไว้ใน global กัน hot reload เปิด connection ใหม่เรื่อยๆ)
const g = globalThis as unknown as { _mongoClient?: Promise<MongoClient> };

export async function getDb() {
  if (!g._mongoClient) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not set');
    g._mongoClient = new MongoClient(uri).connect().catch((err) => {
      g._mongoClient = undefined; // ต่อไม่ติด → รอบหน้าลองใหม่
      throw err;
    });
  }
  return (await g._mongoClient).db(process.env.MONGO_DB);
}

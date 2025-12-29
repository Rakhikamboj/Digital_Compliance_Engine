import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv";
dotenv.config();
const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("❌ MONGO_URI is not defined in environment variables")
}

let client
let db

export async function connectToDatabase() {
  if (db) {
    return { db }
  }

  try {
    client = new MongoClient(uri)
    await client.connect()

    db = client.db()
    console.log("✅ MongoDB connected")

    return { db }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error)
    throw error
  }
}


export { ObjectId }

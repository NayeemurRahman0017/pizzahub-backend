import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let db;
let connectionPromise;

async function createConnection() {
  if (!client) {
    client = new MongoClient(env.mongoUri);
  }

  await client.connect();

  db = client.db(env.dbName);

  await Promise.all([
    db.collection("menuItems").createIndex({ vendorId: 1, status: 1 }),
    db.collection("menuItems").createIndex({
      status: 1,
      category: 1,
      location: 1,
    }),
    db.collection("orders").createIndex({
      customerId: 1,
      createdAt: -1,
    }),
    db.collection("orders").createIndex({
      vendorId: 1,
      status: 1,
      createdAt: -1,
    }),
    db.collection("orders").createIndex({
      itemId: 1,
      deliveryDate: 1,
    }),
    db.collection("transactions").createIndex(
      { stripeSessionId: 1 },
      { unique: true }
    ),
    db.collection("transactions").createIndex({
      vendorId: 1,
      createdAt: -1,
    }),
  ]);

  console.log(`MongoDB connected (${env.dbName})`);

  return db;
}

export async function connectDB() {
  if (db) return db;

  if (!connectionPromise) {
    connectionPromise = createConnection().catch(async (error) => {
      connectionPromise = null;
      db = undefined;

      await client?.close().catch(() => {});
      client = undefined;

      throw error;
    });
  }

  return connectionPromise;
}

export const collections = {
  users: () => {
    if (!db) throw new Error("Database is not connected");
    return db.collection("users");
  },

  menuItems: () => {
    if (!db) throw new Error("Database is not connected");
    return db.collection("menuItems");
  },

  orders: () => {
    if (!db) throw new Error("Database is not connected");
    return db.collection("orders");
  },

  transactions: () => {
    if (!db) throw new Error("Database is not connected");
    return db.collection("transactions");
  },
};

export async function closeDB() {
  if (client) {
    await client.close();
  }

  client = undefined;
  db = undefined;
  connectionPromise = null;
}
import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let db;

export async function connectDB() {
  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db(env.dbName);

  await Promise.all([
    db.collection("menuItems").createIndex({ vendorId: 1, status: 1 }),
    db.collection("menuItems").createIndex({ status: 1, category: 1, location: 1 }),
    db.collection("orders").createIndex({ customerId: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ vendorId: 1, status: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ itemId: 1, deliveryDate: 1 }),
    // Makes webhook retries idempotent: one transaction per Stripe session
    db.collection("transactions").createIndex({ stripeSessionId: 1 }, { unique: true }),
    db.collection("transactions").createIndex({ vendorId: 1, createdAt: -1 }),
  ]);
  console.log(`MongoDB connected (${env.dbName})`);
}

export const collections = {
  users: () => db.collection("users"), // managed by Better Auth
  menuItems: () => db.collection("menuItems"),
  orders: () => db.collection("orders"),
  transactions: () => db.collection("transactions"),
};

export async function closeDB() {
  await client?.close();
}
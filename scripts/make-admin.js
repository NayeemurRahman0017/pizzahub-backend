import "dotenv/config";
import { MongoClient } from "mongodb";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run make-admin -- user@example.com");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const result = await client
  .db(process.env.MONGODB_DB || "pizzahub")
  .collection("users")
  .updateOne({ email: email.toLowerCase() }, { $set: { role: "admin" } });

console.log(result.matchedCount ? `${email} is now an admin.` : "No user found with that email. Register it first.");
await client.close();
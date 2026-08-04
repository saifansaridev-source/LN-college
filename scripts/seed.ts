require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "ln_college_voting";

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const candidates = [
    { name: "Mohammad Hamza", order: 1 },
    { name: "Kasim Shaikh", order: 2 },
    { name: "Ankush Pandey", order: 3 },
    { name: "Bhushan Chapetkar", order: 4 },
  ];

  for (const c of candidates) {
    await db.collection("candidates").updateOne(
      { name: c.name },
      { $setOnInsert: { ...c, voteCount: 0 } },
      { upsert: true }
    );
  }

  console.log("Seeded:", candidates.map((c) => c.name).join(", "));
  await client.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
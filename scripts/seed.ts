import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0 && !process.env[key.trim()]) {
          process.env[key.trim()] = values.join("=").trim();
        }
      }
    });
  }
}

loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ln_college_voting";
const MONGODB_DB = process.env.MONGODB_DB || "ln_college_voting";

export const INITIAL_CANDIDATES = [
  { order: 1, name: "Ankush Pandey", image: "/candidates/ankush-pandey.jpg", voteCount: 0 },
  { order: 2, name: "Mohammad Hamza", image: "/candidates/mohammad-hamza.jpg", voteCount: 0 },
  { order: 3, name: "Bhushan Chapetkar", image: "/candidates/bhushan-chapetkar.jpg", voteCount: 0 },
  { order: 4, name: "Kasim Shaikh", image: "/candidates/kasim-shaikh.jpg", voteCount: 0 },
];

async function seed() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected successfully!");

    const db = client.db(MONGODB_DB);
    const candidatesCollection = db.collection("candidates");

    await candidatesCollection.createIndex({ order: 1 });

    console.log("Seeding candidates with images...");

    for (const candidate of INITIAL_CANDIDATES) {
      const existing = await candidatesCollection.findOne({ name: candidate.name });
      if (!existing) {
        await candidatesCollection.insertOne({
          name: candidate.name,
          order: candidate.order,
          image: candidate.image,
          voteCount: 0,
          createdAt: new Date(),
        });
        console.log(`[+] Added Candidate #${candidate.order}: ${candidate.name}`);
      } else {
        // Update image path if missing
        await candidatesCollection.updateOne(
          { _id: existing._id },
          { $set: { image: candidate.image } }
        );
        console.log(`[=] Updated candidate image: ${candidate.name}`);
      }
    }

    console.log("\nDatabase Seeding Complete!");
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();

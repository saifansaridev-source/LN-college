import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const FALLBACK_CANDIDATES = [
  { id: "1", name: "Ankush Pandey", order: 1, image: "/candidates/ankush-pandey.jpg", voteCount: 0 },
  { id: "2", name: "Mohammad Hamza", order: 2, image: "/candidates/mohammad-hamza.jpg", voteCount: 0 },
  { id: "3", name: "Bhushan Chapetkar", order: 3, image: "/candidates/bhushan-chapetkar.jpg", voteCount: 0 },
  { id: "4", name: "Kasim Shaikh", order: 4, image: "/candidates/kasim-shaikh.jpg", voteCount: 0 },
];

const LOCAL_DATA_FILE = path.resolve(process.cwd(), "data", "candidates.json");

function getLocalFallbackData() {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const data = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    // Ignore error
  }
  return FALLBACK_CANDIDATES;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const candidatesCollection = db.collection("candidates");

    let candidates = await candidatesCollection
      .find({})
      .sort({ order: 1 })
      .toArray();

    // Auto-seed if database collection is empty
    if (!candidates || candidates.length === 0) {
      console.log("Database empty. Auto-seeding initial 4 candidates...");
      const seedItems = FALLBACK_CANDIDATES.map((c) => ({
        name: c.name,
        order: c.order,
        image: c.image,
        voteCount: 0,
        createdAt: new Date(),
      }));

      await candidatesCollection.insertMany(seedItems);

      candidates = await candidatesCollection
        .find({})
        .sort({ order: 1 })
        .toArray();
    }

    const formatted = candidates.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      order: c.order,
      image: c.image || `/candidates/${c.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
      voteCount: c.voteCount || 0,
    }));

    return NextResponse.json({ candidates: formatted });
  } catch (error) {
    console.warn("MongoDB connection notice: returning resilient candidate data fallback", error);
    const localData = getLocalFallbackData();
    return NextResponse.json({ candidates: localData });
  }
}

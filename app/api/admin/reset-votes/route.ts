import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CANDIDATES_FILE = path.resolve(DATA_DIR, "candidates.json");
const VOTES_FILE = path.resolve(DATA_DIR, "votes.json");

function resetLocalBackup() {
  try {
    let candidates = [
      { id: "1", name: "Ankush Pandey", order: 1, image: "/candidates/ankush-pandey.jpg", voteCount: 0 },
      { id: "2", name: "Mohammad Hamza", order: 2, image: "/candidates/mohammad-hamza.jpg", voteCount: 0 },
      { id: "3", name: "Bhushan Chapetkar", order: 3, image: "/candidates/bhushan-chapetkar.jpg", voteCount: 0 },
      { id: "4", name: "Kasim Shaikh", order: 4, image: "/candidates/kasim-shaikh.jpg", voteCount: 0 },
    ];

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));
    fs.writeFileSync(VOTES_FILE, JSON.stringify([], null, 2));
  } catch (e) {
    console.error("Local backup reset error:", e);
  }
}

export async function POST() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    let mongoReset = false;

    try {
      const db = await getDatabase();
      const candidatesCollection = db.collection("candidates");
      const votesCollection = db.collection("votes");

      // Reset voteCount to 0 for all candidates in MongoDB
      await candidatesCollection.updateMany({}, { $set: { voteCount: 0 } });

      // Clear all logged votes in MongoDB
      await votesCollection.deleteMany({});

      mongoReset = true;
    } catch (dbErr) {
      console.warn("MongoDB warning during vote reset:", dbErr);
    }

    // Reset local backup cache
    resetLocalBackup();

    return NextResponse.json({
      success: true,
      message: "All election votes have been deleted/reset successfully",
      mongoReset,
    });
  } catch (error) {
    console.error("Error resetting votes:", error);
    return NextResponse.json(
      { error: "Failed to reset votes" },
      { status: 500 }
    );
  }
}

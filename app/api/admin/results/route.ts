import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CANDIDATES_FILE = path.resolve(DATA_DIR, "candidates.json");

function getLocalBackupResults() {
  let candidates = [
    { id: "1", name: "Ankush Pandey", order: 1, image: "/candidates/ankush-pandey.jpg", voteCount: 0 },
    { id: "2", name: "Mohammad Hamza", order: 2, image: "/candidates/mohammad-hamza.jpg", voteCount: 0 },
    { id: "3", name: "Bhushan Chapetkar", order: 3, image: "/candidates/bhushan-chapetkar.jpg", voteCount: 0 },
    { id: "4", name: "Kasim Shaikh", order: 4, image: "/candidates/kasim-shaikh.jpg", voteCount: 0 },
  ];

  if (fs.existsSync(CANDIDATES_FILE)) {
    try {
      candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8"));
    } catch (e) {
      // Ignore error
    }
  }

  const totalVotes = candidates.reduce((acc, c) => acc + (c.voteCount || 0), 0);
  const formattedCandidates = candidates
    .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
    .map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
      image: c.image,
      voteCount: c.voteCount || 0,
      percentage: totalVotes > 0 ? (((c.voteCount || 0) / totalVotes) * 100).toFixed(1) : "0.0",
    }));

  const maxVotes = Math.max(...formattedCandidates.map((c) => c.voteCount), 0);
  const leaders = formattedCandidates.filter((c) => c.voteCount === maxVotes && maxVotes > 0);

  return {
    candidates: formattedCandidates,
    totalVotes,
    leaders: leaders.map((l) => l.id),
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    try {
      const db = await getDatabase();
      const candidatesCollection = db.collection("candidates");
      const votesCollection = db.collection("votes");

      let candidates = await candidatesCollection
        .find({})
        .sort({ voteCount: -1, order: 1 })
        .toArray();

      if (!candidates || candidates.length === 0) {
        return NextResponse.json(getLocalBackupResults());
      }

      const totalVotes = await votesCollection.countDocuments();

      const formattedCandidates = candidates.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        order: c.order,
        image: c.image || `/candidates/${c.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
        voteCount: c.voteCount || 0,
        percentage: totalVotes > 0 ? (((c.voteCount || 0) / totalVotes) * 100).toFixed(1) : "0.0",
      }));

      const maxVotes = Math.max(...formattedCandidates.map((c) => c.voteCount), 0);
      const leaders = formattedCandidates.filter((c) => c.voteCount === maxVotes && maxVotes > 0);

      return NextResponse.json({
        candidates: formattedCandidates,
        totalVotes,
        leaders: leaders.map((l) => l.id),
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("MongoDB connection warning in results endpoint:", dbErr);
      return NextResponse.json(getLocalBackupResults());
    }
  } catch (error) {
    console.error("Error fetching admin results:", error);
    return NextResponse.json(
      { error: "Failed to fetch election results" },
      { status: 500 }
    );
  }
}

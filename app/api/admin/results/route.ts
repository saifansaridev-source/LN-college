import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const db = await getDb();
    const candidatesCollection = db.collection("candidates");
    const votesCollection = db.collection("votes");

    const candidates = await candidatesCollection
      .find({})
      .sort({ voteCount: -1, order: 1 })
      .toArray();

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
  } catch (error) {
    console.error("Error fetching admin results:", error);
    return NextResponse.json(
      { error: "Failed to fetch election results" },
      { status: 503 }
    );
  }
}

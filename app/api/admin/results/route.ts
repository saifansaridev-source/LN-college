import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  try {
    const db = await getDb();
    const candidates = await db
      .collection("candidates")
      .find({})
      .sort({ voteCount: -1 })
      .toArray();

    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

    const formatted = candidates.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      order: c.order,
      voteCount: c.voteCount || 0,
      percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : "0.0",
    }));

    const maxVotes = Math.max(...formatted.map((c) => c.voteCount), 0);
    const leaders = totalVotes > 0
      ? formatted.filter((c) => c.voteCount === maxVotes).map((c) => c.id)
      : [];

    return NextResponse.json({
      candidates: formatted,
      totalVotes,
      leaders,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Admin results error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
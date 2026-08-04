import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  try {
    const db = await getDb();
    const candidates = await db.collection("candidates").find({}).sort({ voteCount: -1 }).toArray();
    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
    return NextResponse.json({ candidates, totalVotes, winner: candidates[0] || null });
  } catch (err) {
    console.error("Admin results error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
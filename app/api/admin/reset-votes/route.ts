import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import clientPromise from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  try {
    const client = await clientPromise;
    const db = await getDb();
    const votes = db.collection("votes");
    const candidates = db.collection("candidates");

    let clearedVotes = 0;
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const deleteResult = await votes.deleteMany({}, { session });
        clearedVotes = deleteResult.deletedCount || 0;
        await candidates.updateMany({}, { $set: { voteCount: 0 } }, { session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, clearedVotes });
  } catch (err) {
    console.error("Reset votes error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import clientPromise from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const db = await getDb();
    const client = await clientPromise;

    const candidatesCollection = db.collection("candidates");
    const votesCollection = db.collection("votes");

    // Count votes before deleting so we can report how many were cleared
    const clearedVotes = await votesCollection.countDocuments();

    // Use a MongoDB transaction so the two operations are atomic —
    // if either fails, neither change persists.
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await votesCollection.deleteMany({}, { session });
        await candidatesCollection.updateMany(
          {},
          { $set: { voteCount: 0 } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      success: true,
      clearedVotes,
      message: `All election votes have been reset. ${clearedVotes} vote record(s) cleared.`,
    });
  } catch (error) {
    console.error("Error resetting votes:", error);
    return NextResponse.json(
      { error: "Failed to reset votes" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json();
    if (!candidateId) {
      return NextResponse.json({ error: "Please select a candidate." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = await getDb();
    const candidates = db.collection("candidates");
    const votes = db.collection("votes");

    const candidate = await candidates.findOne({ _id: new ObjectId(candidateId) });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await votes.insertOne({ candidateId: candidate._id, timestamp: new Date() }, { session });
        await candidates.updateOne({ _id: candidate._id }, { $inc: { voteCount: 1 } }, { session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
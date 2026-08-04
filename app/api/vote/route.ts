import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const candidatesCollection = db.collection("candidates");
    const votesCollection = db.collection("votes");

    let queryFilter: any = { _id: candidateId };
    if (ObjectId.isValid(candidateId)) {
      queryFilter = { $or: [{ _id: candidateId }, { _id: new ObjectId(candidateId) }] };
    }

    const candidate = await candidatesCollection.findOne(queryFilter);

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const validCandidateId = candidate._id;
    const client = await clientPromise;

    try {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          await candidatesCollection.updateOne(
            { _id: validCandidateId },
            { $inc: { voteCount: 1 } },
            { session }
          );
          await votesCollection.insertOne(
            {
              candidateId: validCandidateId,
              candidateName: candidate.name,
              timestamp: new Date(),
            },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
    } catch (tErr) {
      // Fallback for standalone MongoDB (no replica set = no transactions)
      await candidatesCollection.updateOne(
        { _id: validCandidateId },
        { $inc: { voteCount: 1 } }
      );
      await votesCollection.insertOne({
        candidateId: validCandidateId,
        candidateName: candidate.name,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

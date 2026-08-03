import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CANDIDATES_FILE = path.resolve(DATA_DIR, "candidates.json");
const VOTES_FILE = path.resolve(DATA_DIR, "votes.json");

function updateLocalBackup(candidateId: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let candidates = [
      { id: "1", name: "Ankush Pandey", order: 1, image: "/candidates/ankush-pandey.jpg", voteCount: 0 },
      { id: "2", name: "Mohammad Hamza", order: 2, image: "/candidates/mohammad-hamza.jpg", voteCount: 0 },
      { id: "3", name: "Bhushan Chapetkar", order: 3, image: "/candidates/bhushan-chapetkar.jpg", voteCount: 0 },
      { id: "4", name: "Kasim Shaikh", order: 4, image: "/candidates/kasim-shaikh.jpg", voteCount: 0 },
    ];

    if (fs.existsSync(CANDIDATES_FILE)) {
      candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8"));
    }

    const candidate = candidates.find((c) => c.id === candidateId || c.name === candidateId);
    if (candidate) {
      candidate.voteCount = (candidate.voteCount || 0) + 1;
      fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));
    }

    let votes: any[] = [];
    if (fs.existsSync(VOTES_FILE)) {
      votes = JSON.parse(fs.readFileSync(VOTES_FILE, "utf-8"));
    }
    votes.push({
      candidateId,
      timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
  } catch (e) {
    console.error("Local backup write error:", e);
  }
}

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

    let mongoSaved = false;

    try {
      const db = await getDatabase();
      const candidatesCollection = db.collection("candidates");
      const votesCollection = db.collection("votes");

      let queryFilter: any = { _id: candidateId };
      if (ObjectId.isValid(candidateId)) {
        queryFilter = { $or: [{ _id: candidateId }, { _id: new ObjectId(candidateId) }] };
      }

      const candidate = await candidatesCollection.findOne(queryFilter);

      if (candidate) {
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
            mongoSaved = true;
          } finally {
            await session.endSession();
          }
        } catch (tErr) {
          // Direct operation fallback for standalone Mongo
          await candidatesCollection.updateOne(
            { _id: validCandidateId },
            { $inc: { voteCount: 1 } }
          );
          await votesCollection.insertOne({
            candidateId: validCandidateId,
            candidateName: candidate.name,
            timestamp: new Date(),
          });
          mongoSaved = true;
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB connection warning during vote:", dbErr);
    }

    // Always update local backup as well
    updateLocalBackup(candidateId);

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully in database",
      mongoSaved,
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

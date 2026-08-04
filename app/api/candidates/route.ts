import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const candidates = await db
      .collection("candidates")
      .find({})
      .sort({ order: 1 })
      .toArray();

    const formatted = candidates.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      order: c.order,
      voteCount: c.voteCount,
      image: `/candidates/${c.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
    }));

    return NextResponse.json({ candidates: formatted });
  } catch (err) {
    console.error("Fetch candidates error:", err);
    return NextResponse.json({ error: "Could not load candidates." }, { status: 500 });
  }
}
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
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("Fetch candidates error:", err);
    return NextResponse.json({ error: "Could not load candidates." }, { status: 500 });
  }
}
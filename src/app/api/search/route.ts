import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const results = await globalSearch(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("API Error in search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

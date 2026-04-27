import { NextResponse } from "next/server";
import { searchJoinableBusinesses } from "../../../../../lib/pro-data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchJoinableBusinesses(query);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not search businesses." },
      { status: 400 }
    );
  }
}
